import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, X, Loader2, Check, Plus, Star, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { apiUrl } from "@/lib/api";

const FAMILIES = ["Oriental", "Floral", "Woody", "Fresh", "Citrus", "Aquatic", "Gourmand", "Aromatic"];
const GENDERS = ["Unisex", "Men", "Women"];
const STANDARD_SIZES = ["30ml", "50ml", "100ml"];

interface ImageItem {
  id: string;
  preview: string;
  file?: File;
}

interface ProductFormData {
  name: string;
  family: string;
  gender: string;
  price: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  description: string;
  featured: string;
  inStock: string;
  discountPercent: string;
}

const EMPTY: ProductFormData = {
  name: "", family: "Oriental", gender: "Unisex", price: "",
  notesTop: "", notesHeart: "", notesBase: "", description: "",
  featured: "false", inStock: "true", discountPercent: "0",
};

export default function ProductForm() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const isEdit = Boolean(id);
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["30ml", "50ml", "100ml"]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [imageList, setImageList] = useState<ImageItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    setFetching(true);
    fetch(apiUrl(`/api/products/${id}`), { credentials: "include" })
      .then(r => r.json())
      .then((data: { product: { name: string; family: string; gender: string; price: number; notesTop: string; notesHeart: string; notesBase: string; description: string; imageUrl: string; images: string; featured: string; inStock: boolean; sizes: string; discountPercent: number } }) => {
        const p = data.product;
        setForm({
          name: p.name ?? "",
          family: p.family ?? "Oriental",
          gender: p.gender ?? "Unisex",
          price: String(p.price ?? ""),
          notesTop: p.notesTop ?? "",
          notesHeart: p.notesHeart ?? "",
          notesBase: p.notesBase ?? "",
          description: p.description ?? "",
          featured: p.featured ?? "false",
          inStock: p.inStock === false ? "false" : "true",
          discountPercent: String(p.discountPercent ?? 0),
        });
        // Load images: prefer images JSON array, fall back to imageUrl
        let imgs: string[] = [];
        try { imgs = JSON.parse(p.images ?? "[]"); } catch { /* ignore */ }
        if (imgs.length === 0 && p.imageUrl) imgs = [p.imageUrl];
        setImageList(imgs.map(url => ({ id: crypto.randomUUID(), preview: url })));

        const parsedSizes = (p.sizes ?? "30ml,50ml,100ml").split(",").map((s: string) => s.trim()).filter(Boolean);
        setSelectedSizes(parsedSizes);
      })
      .catch(() => setError("Failed to load product"))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (key: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed || selectedSizes.includes(trimmed)) return;
    setSelectedSizes(prev => [...prev, trimmed]);
    setCustomSizeInput("");
  };

  const removeSize = (size: string) => setSelectedSizes(prev => prev.filter(s => s !== size));

  const addFilesAsImages = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 10 - imageList.length);
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageList(prev => [...prev, { id: crypto.randomUUID(), preview: ev.target?.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  }, [imageList.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFilesAsImages(e.target.files);
    e.target.value = "";
  };

  const addUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImageList(prev => [...prev, { id: crypto.randomUUID(), preview: trimmed }]);
    setUrlInput("");
  };

  const removeImage = (itemId: string) => setImageList(prev => prev.filter(img => img.id !== itemId));

  const moveImage = (itemId: string, dir: -1 | 1) => {
    setImageList(prev => {
      const idx = prev.findIndex(img => img.id === itemId);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) addFilesAsImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) { setError("Valid price is required"); return; }
    if (selectedSizes.length === 0) { setError("At least one size must be selected"); return; }
    const discount = parseInt(form.discountPercent, 10);
    if (isNaN(discount) || discount < 0 || discount > 99) { setError("Discount must be 0–99%"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.set("sizes", selectedSizes.join(","));

      // Separate existing URLs from new file uploads
      const existingUrls: string[] = [];
      const newFiles: { file: File; idx: number }[] = [];
      imageList.forEach((img, idx) => {
        if (img.file) newFiles.push({ file: img.file, idx });
        else existingUrls.push(img.preview);
      });

      fd.append("existingImages", JSON.stringify(existingUrls));
      newFiles.forEach(({ file }) => fd.append("newImages", file));

      const url = isEdit ? apiUrl(`/api/products/${id}`) : apiUrl("/api/products");
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd, credentials: "include" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setSaved(true);
      setTimeout(() => setLocation("/admin/products"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  const basePrice = Number(form.price) || 0;
  const discount = Math.max(0, Math.min(99, parseInt(form.discountPercent, 10) || 0));
  const salePrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setLocation("/admin/products")} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-back">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-serif text-foreground">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? "Update product details" : "Add a premium fragrance to your store"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Availability ── */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-sm uppercase tracking-widest font-mono text-foreground mb-4">Availability</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-medium">In Stock</p>
              <p className="text-muted-foreground text-xs mt-0.5">When disabled, this product is hidden from customers</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, inStock: f.inStock === "true" ? "false" : "true" }))}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.inStock === "true" ? "bg-primary" : "bg-border"}`}
              data-testid="toggle-in-stock"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${form.inStock === "true" ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          {form.inStock === "false" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              This product will be hidden from the public store
            </div>
          )}
        </div>

        {/* ── Images ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Product Images</h2>
            <p className="text-xs text-muted-foreground mt-1">Up to 10 images. The first image is shown on shop cards. Drag files in or use the buttons below.</p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer rounded-sm p-6 flex flex-col items-center justify-center gap-2 text-center"
            data-testid="image-drop-zone"
          >
            <Upload size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag &amp; drop images here, or <span className="text-primary underline">browse files</span></p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">JPEG · PNG · WebP · Max 5MB each</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" data-testid="input-image-files" />

          {/* Image thumbnails */}
          <AnimatePresence>
            {imageList.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {imageList.map((img, idx) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-3 bg-background border border-border p-2"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 shrink-0 overflow-hidden bg-card border border-border/50">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-mono text-primary mb-0.5">
                          <Star size={8} fill="currentColor" /> Primary
                        </span>
                      )}
                      <p className="text-xs text-foreground font-mono truncate">
                        {img.file ? img.file.name : img.preview.startsWith("data:") ? "Uploaded image" : img.preview.replace(/^https?:\/\//, "").slice(0, 50)}
                      </p>
                      {img.file && (
                        <p className="text-[10px] text-muted-foreground font-mono">{(img.file.size / 1024).toFixed(0)} KB</p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => moveImage(img.id, -1)} disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors">
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveImage(img.id, 1)} disabled={idx === imageList.length - 1}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors">
                        <ChevronDown size={14} />
                      </button>
                      <button type="button" onClick={() => removeImage(img.id)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors" data-testid={`btn-remove-image-${idx}`}>
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {imageList.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <ImageIcon size={13} /> No images yet — add some above
            </div>
          )}

          {/* URL input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrlImage(); } }}
              placeholder="Or paste an image URL…"
              className="flex-1 bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
              data-testid="input-image-url"
            />
            <button type="button" onClick={addUrlImage}
              className="border border-border px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-mono shrink-0">
              <Plus size={13} /> Add URL
            </button>
          </div>
        </div>

        {/* ── Basic Info ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Product Information</h2>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Product Name *</label>
            <input type="text" value={form.name} onChange={set("name")} required
              className="w-full bg-transparent border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
              placeholder="e.g. Tom Ford Oud Wood" data-testid="input-product-name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Scent Family *</label>
              <select value={form.family} onChange={set("family")}
                className="w-full bg-card border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground" data-testid="select-family">
                {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Gender *</label>
              <select value={form.gender} onChange={set("gender")}
                className="w-full bg-card border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground" data-testid="select-gender">
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Base Price (USD) *</label>
              <input type="number" value={form.price} onChange={set("price")} required min="1"
                className="w-full bg-transparent border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
                placeholder="150" data-testid="input-price" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3}
              className="w-full bg-transparent border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 resize-none"
              placeholder="Describe the fragrance, occasion, longevity, etc." data-testid="textarea-description" />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="featured" checked={form.featured === "true"}
              onChange={e => setForm(f => ({ ...f, featured: e.target.checked ? "true" : "false" }))}
              className="w-4 h-4 accent-primary" data-testid="checkbox-featured" />
            <label htmlFor="featured" className="text-sm text-foreground cursor-pointer">Feature this product on the homepage</label>
          </div>
        </div>

        {/* ── Sizes ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Available Sizes</h2>
            <p className="text-xs text-muted-foreground mt-1">Select which sizes are available. Prices auto-scale from base price.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {STANDARD_SIZES.map(size => {
              const multipliers: Record<string, number> = { "30ml": 0.7, "50ml": 1, "100ml": 1.6 };
              const mult = multipliers[size] ?? 1;
              const displayPrice = basePrice ? `$${Math.round(basePrice * mult * (1 - discount / 100))}` : "";
              const isSelected = selectedSizes.includes(size);
              return (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  className={`flex flex-col items-center px-5 py-3 border transition-all font-mono text-sm ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground"}`}
                  data-testid={`btn-size-toggle-${size}`}>
                  {size}
                  {displayPrice && <span className="text-[10px] mt-0.5 opacity-70">{displayPrice}</span>}
                </button>
              );
            })}
          </div>

          {selectedSizes.filter(s => !STANDARD_SIZES.includes(s)).map(size => (
            <div key={size} className="flex items-center gap-2">
              <span className="border border-primary bg-primary/10 text-primary px-4 py-2 font-mono text-sm">{size}</span>
              <button type="button" onClick={() => removeSize(size)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input type="text" value={customSizeInput} onChange={e => setCustomSizeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
              placeholder="Custom size (e.g. 75ml, 200ml, Travel)"
              className="flex-1 bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40" />
            <button type="button" onClick={addCustomSize}
              className="border border-border px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-mono">
              <Plus size={13} /> Add
            </button>
          </div>

          {selectedSizes.length === 0 && (
            <p className="text-xs text-destructive font-mono">At least one size must be selected</p>
          )}
        </div>

        {/* ── Pricing & Discount ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Pricing & Discount</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Discount % (0 = no discount)</label>
              <div className="relative">
                <input type="number" value={form.discountPercent} onChange={set("discountPercent")} min="0" max="99"
                  className="w-full bg-transparent border border-border px-3 py-3 pr-8 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
                  placeholder="0" data-testid="input-discount" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">%</span>
              </div>
            </div>

            {discount > 0 && basePrice > 0 && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Preview (50ml base)</label>
                <div className="border border-border px-4 py-3 flex items-center gap-3">
                  <span className="text-muted-foreground line-through font-mono text-sm">${basePrice}</span>
                  <span className="text-primary font-mono text-lg">${salePrice}</span>
                  <span className="bg-primary text-primary-foreground text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider">{discount}% OFF</span>
                </div>
              </div>
            )}
          </div>

          {discount > 0 && (
            <p className="text-xs text-primary font-mono">Sale price applies to all sizes. Customers will see the original price crossed out.</p>
          )}
        </div>

        {/* ── Olfactory Notes ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <h2 className="text-sm uppercase tracking-widests font-mono text-foreground">Olfactory Notes</h2>
          <p className="text-xs text-muted-foreground -mt-2">Separate multiple notes with commas</p>
          {[
            { key: "notesTop" as const, label: "Top Notes", placeholder: "Bergamot, Saffron, Pink Pepper" },
            { key: "notesHeart" as const, label: "Heart Notes", placeholder: "Rose, Oud, Jasmine" },
            { key: "notesBase" as const, label: "Base Notes", placeholder: "Sandalwood, Musk, Amber" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{label}</label>
              <input type="text" value={form[key]} onChange={set(key)}
                className="w-full bg-transparent border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
                placeholder={placeholder} data-testid={`input-${key}`} />
            </div>
          ))}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </motion.div>
        )}

        <div className="flex gap-4">
          <button type="button" onClick={() => setLocation("/admin/products")}
            className="flex-1 border border-border text-foreground py-4 uppercase tracking-widest text-sm hover:border-foreground transition-colors" data-testid="btn-cancel">
            Cancel
          </button>
          <button type="submit" disabled={loading || saved}
            className="flex-1 bg-primary text-primary-foreground py-4 uppercase tracking-widest text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            data-testid="btn-save-product">
            {saved ? <><Check size={16} /> Saved!</> : loading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : `${isEdit ? "Update" : "Create"} Product`}
          </button>
        </div>
      </form>
    </div>
  );
}
