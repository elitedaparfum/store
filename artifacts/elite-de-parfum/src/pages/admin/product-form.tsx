import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, X, Loader2, Check, Plus, Star, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { apiUrl } from "@/lib/api";

const FAMILIES = ["Oriental", "Floral", "Woody", "Fresh", "Citrus", "Aquatic", "Gourmand", "Aromatic"];
const GENDERS = ["Unisex", "Men", "Women"];

interface ImageItem {
  id: string;
  preview: string;
  file?: File;
}

interface VariantItem {
  id: string;
  name: string;
  price: string;
  inStock: boolean;
}

interface ProductFormData {
  name: string;
  family: string;
  gender: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  description: string;
  featured: string;
  discountPercent: string;
}

const EMPTY: ProductFormData = {
  name: "", family: "Oriental", gender: "Unisex",
  notesTop: "", notesHeart: "", notesBase: "", description: "",
  featured: "false", discountPercent: "0",
};

export default function ProductForm() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const isEdit = Boolean(id);
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [variants, setVariants] = useState<VariantItem[]>([]);
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
      .then((data: { product: any }) => {
        const p = data.product;
        setForm({
          name: p.name ?? "",
          family: p.family ?? "Oriental",
          gender: p.gender ?? "Unisex",
          notesTop: p.notesTop ?? "",
          notesHeart: p.notesHeart ?? "",
          notesBase: p.notesBase ?? "",
          description: p.description ?? "",
          featured: p.featured ? "true" : "false",
          discountPercent: String(p.discountPercent ?? 0),
        });
        
        let imgs: string[] = [];
        try { imgs = JSON.parse(p.images ?? "[]"); } catch { /* ignore */ }
        if (imgs.length === 0 && p.imageUrl) imgs = [p.imageUrl];
        setImageList(imgs.map(url => ({ id: crypto.randomUUID(), preview: url })));

        let parsedVariants: any[] = [];
        try { parsedVariants = JSON.parse(p.sizes ?? "[]"); } catch { /* ignore */ }
        setVariants(parsedVariants.map(v => ({
          id: crypto.randomUUID(),
          name: v.name || "",
          price: String(v.price || ""),
          inStock: v.inStock !== false
        })));
      })
      .catch(() => setError("Failed to load product"))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (key: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const addVariant = () => {
    setVariants(prev => [...prev, { id: crypto.randomUUID(), name: "", price: "", inStock: true }]);
  };

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantItem, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

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
    
    if (variants.length === 0) { setError("At least one size/variant must be added"); return; }
    for (const v of variants) {
      if (!v.name.trim()) { setError("All variants must have a name (e.g. 50ml)"); return; }
      if (!v.price || isNaN(Number(v.price)) || Number(v.price) <= 0) { setError("All variants must have a valid price"); return; }
    }

    const discount = parseInt(form.discountPercent, 10);
    if (isNaN(discount) || discount < 0 || discount > 99) { setError("Discount must be 0–99%"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      
      const payloadVariants = variants.map(v => ({
        name: v.name.trim(),
        price: Number(v.price),
        inStock: v.inStock
      }));
      fd.set("sizes", JSON.stringify(payloadVariants));

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

  const discount = Math.max(0, Math.min(99, parseInt(form.discountPercent, 10) || 0));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setLocation("/admin/products")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-serif text-foreground">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? "Update product details" : "Add a premium fragrance to your store"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Images ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Product Images</h2>
            <p className="text-xs text-muted-foreground mt-1">Up to 10 images. The first image is shown on shop cards. Drag files in or use the buttons below.</p>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer rounded-sm p-6 flex flex-col items-center justify-center gap-2 text-center"
          >
            <Upload size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag &amp; drop images here, or <span className="text-primary underline">browse files</span></p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">JPEG · PNG · WebP · Max 5MB each</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

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
                    <div className="w-14 h-14 shrink-0 overflow-hidden bg-card border border-border/50">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-mono text-primary mb-0.5">
                          <Star size={8} fill="currentColor" /> Primary
                        </span>
                      )}
                      <p className="text-xs text-foreground font-mono truncate">
                        {img.file ? img.file.name : img.preview.startsWith("data:") ? "Uploaded image" : img.preview.replace(/^https?:\/\//, "").slice(0, 50)}
                      </p>
                    </div>
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
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
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

          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrlImage(); } }}
              placeholder="Or paste an image URL…"
              className="flex-1 bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
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
              placeholder="e.g. Tom Ford Oud Wood" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Scent Family *</label>
              <select value={form.family} onChange={set("family")}
                className="w-full bg-card border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground">
                {FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Gender *</label>
              <select value={form.gender} onChange={set("gender")}
                className="w-full bg-card border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground">
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3}
              className="w-full bg-transparent border border-border px-3 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 resize-none"
              placeholder="Describe the fragrance, occasion, longevity, etc." />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="featured" checked={form.featured === "true"}
              onChange={e => setForm(f => ({ ...f, featured: e.target.checked ? "true" : "false" }))}
              className="w-4 h-4 accent-primary" />
            <label htmlFor="featured" className="text-sm text-foreground cursor-pointer">Feature this product on the homepage</label>
          </div>
        </div>

        {/* ── Variants (Sizes & Prices) ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Sizes &amp; Pricing</h2>
              <p className="text-xs text-muted-foreground mt-1">Add manual sizes (variants), set explicit prices, and manage stock.</p>
            </div>
            <button type="button" onClick={addVariant}
              className="border border-border px-4 py-2 text-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-mono shrink-0">
              <Plus size={13} /> Add Size
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="text-sm text-destructive font-mono border border-destructive/20 bg-destructive/5 p-4">
              At least one size must be added.
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-background border border-border p-3">
                  <div className="w-full sm:w-1/3">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1 block">Size Name</label>
                    <input type="text" value={variant.name} onChange={e => updateVariant(variant.id, "name", e.target.value)}
                      placeholder="e.g. 50ml"
                      className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                  </div>
                  <div className="w-full sm:w-1/4">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1 block">Price ($)</label>
                    <input type="number" value={variant.price} onChange={e => updateVariant(variant.id, "price", e.target.value)} min="1"
                      placeholder="e.g. 150"
                      className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                  </div>
                  <div className="w-full sm:w-1/4 pt-1 sm:pt-4 flex items-center gap-2">
                    <input type="checkbox" checked={variant.inStock} onChange={e => updateVariant(variant.id, "inStock", e.target.checked)}
                      className="w-4 h-4 accent-primary cursor-pointer" id={`stock-${variant.id}`} />
                    <label htmlFor={`stock-${variant.id}`} className="text-sm cursor-pointer select-none">In Stock</label>
                  </div>
                  <div className="w-full sm:w-auto pt-1 sm:pt-4 flex justify-end">
                    <button type="button" onClick={() => removeVariant(variant.id)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Discount ── */}
        <div className="bg-card border border-border p-6 space-y-5">
          <h2 className="text-sm uppercase tracking-widest font-mono text-foreground">Global Discount</h2>
          <div className="space-y-2 w-full sm:w-1/2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Discount % (0 = no discount)</label>
            <div className="relative">
              <input type="number" value={form.discountPercent} onChange={set("discountPercent")} min="0" max="99"
                className="w-full bg-transparent border border-border px-3 py-3 pr-8 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
                placeholder="0" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">%</span>
            </div>
          </div>
          {discount > 0 && (
            <p className="text-xs text-primary font-mono">This percentage discount will automatically apply to all sizes above.</p>
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
                placeholder={placeholder} />
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
            className="flex-1 border border-border text-foreground py-4 uppercase tracking-widest text-sm hover:border-foreground transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading || saved}
            className="flex-1 bg-primary text-primary-foreground py-4 uppercase tracking-widest text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {saved ? <><Check size={16} /> Saved!</> : loading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : `${isEdit ? "Update" : "Create"} Product`}
          </button>
        </div>
      </form>
    </div>
  );
}
