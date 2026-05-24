import { useState } from "react";
import { Link } from "wouter";
import { apiUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts, type ApiProduct } from "@/hooks/use-products";
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function AdminProducts() {
  const { products, loading, refetch } = useProducts();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.family.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (product: ApiProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    setDeleteError("");
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error);
      }
      await refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStock = async (product: ApiProduct) => {
    try {
      const formData = new FormData();
      formData.append("inStock", product.inStock ? "false" : "true");
      const res = await fetch(apiUrl(`/api/products/${product.id}`), { method: "PUT", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Failed to update");
      await refetch();
    } catch {
      setDeleteError("Failed to update stock status");
    }
  };

  const inStockCount = products.filter(p => p.inStock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Products</h1>
          <p className="text-muted-foreground text-sm">
            {products.length} total · <span className="text-primary">{inStockCount} in stock</span> · {products.length - inStockCount} hidden
          </p>
        </div>
        <Link href="/admin/products/new">
          <button className="bg-primary text-primary-foreground px-5 py-3 flex items-center gap-2 hover:bg-primary/90 transition-colors uppercase tracking-widest text-xs font-semibold" data-testid="btn-add-product">
            <Plus size={14} />
            Add Product
          </button>
        </Link>
      </div>

      {deleteError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={14} />
          {deleteError}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or family..."
          className="w-full bg-card border border-border pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50 text-sm"
          data-testid="input-search-products"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-card border border-border">
          <Package size={40} className="text-border mx-auto mb-4" />
          <p className="font-serif text-lg text-foreground mb-2">
            {search ? "No products match your search" : "No products yet"}
          </p>
          {!search && (
            <Link href="/admin/products/new">
              <span className="inline-block mt-4 text-primary hover:underline cursor-pointer text-sm">Add your first product</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-border bg-background">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-12">Image</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Product</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-16 text-center">Status</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-20 text-right">Price</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-14 text-center">Family</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono w-20 text-right">Actions</span>
          </div>
          <AnimatePresence initial={false}>
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-4 border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                data-testid={`row-product-${product.id}`}
              >
                <div className="w-12 h-12 bg-background overflow-hidden shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={16} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.gender}</p>
                </div>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => handleToggleStock(product)}
                    title={product.inStock ? "Click to hide from store" : "Click to make visible"}
                    className={`text-[9px] uppercase tracking-widest px-2 py-1 font-mono border transition-colors ${product.inStock ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
                  >
                    {product.inStock ? "In Stock" : "Hidden"}
                  </button>
                </div>
                <span className="font-mono text-foreground text-sm w-20 text-right">${product.price}</span>
                <span className="text-xs text-muted-foreground w-14 text-center uppercase tracking-wider">{product.family}</span>
                <div className="flex items-center gap-1 w-20 justify-end">
                  <button
                    onClick={() => handleToggleStock(product)}
                    title={product.inStock ? "Hide from store" : "Show in store"}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {product.inStock ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" data-testid={`btn-edit-${product.id}`}>
                      <Pencil size={13} />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(product)}
                    disabled={deletingId === product.id}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    data-testid={`btn-delete-${product.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
