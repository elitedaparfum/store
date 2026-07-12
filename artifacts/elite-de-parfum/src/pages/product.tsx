import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiWhatsapp } from "react-icons/si";
import { ShoppingBag, Check, Loader2, ArrowLeft, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useCart } from "@/context/cart";
import { Link } from "wouter";
import { type ApiProduct, useProducts } from "@/hooks/use-products";
import { apiUrl } from "@/lib/api";

interface Variant {
  name: string;
  price: number;
  inStock: boolean;
}

function parseVariants(product: ApiProduct): Variant[] {
  try {
    const arr = JSON.parse(product.sizes ?? "[]");
    if (Array.isArray(arr) && arr.length > 0) return arr as Variant[];
  } catch { /* ignore */ }
  return [];
}

function parseImages(product: ApiProduct): string[] {
  try {
    const arr = JSON.parse(product.images ?? "[]");
    if (Array.isArray(arr) && arr.length > 0) return arr as string[];
  } catch { /* ignore */ }
  return product.imageUrl ? [product.imageUrl] : [];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();
  const { products } = useProducts();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(apiUrl(`/api/products/${id}`), { credentials: "include" })
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          const p = (data as { product: ApiProduct }).product;
          setProduct(p);
          setActiveImg(0);
          
          const variants = parseVariants(p);
          if (variants.length > 0) {
            // Default to first in-stock variant, or first variant if none in stock
            const defaultV = variants.find(v => v.inStock) || variants[0];
            setSelectedSize(defaultV.name);
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <Loader2 size={28} className="text-primary animate-spin" />
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Loading…</span>
    </div>
  );

  if (notFound || !product) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-6">
      <Helmet><title>Product Not Found | Élite da Parfum</title></Helmet>
      <h1 className="text-4xl font-serif text-foreground mb-4">Not Found</h1>
      <p className="text-muted-foreground mb-8 font-serif italic">This fragrance does not exist in our collection.</p>
      <Link href="/shop"><span className="text-primary border-b border-primary pb-1 uppercase tracking-widest text-xs cursor-pointer font-mono">Browse Collection</span></Link>
    </div>
  );

  const images = parseImages(product);
  const variants = parseVariants(product);
  const selectedVariant = variants.find(v => v.name === selectedSize) || variants[0];
  
  const discount = product.discountPercent ?? 0;
  const originalPrice = selectedVariant?.price ?? product.price;
  const currentPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;
  const hasDiscount = discount > 0;
  const isVariantInStock = selectedVariant?.inStock ?? false;

  const whatsappMessage = encodeURIComponent(`Hello, I'm interested in purchasing *${product.name}* (${selectedSize}) — $${currentPrice} × ${qty} = $${currentPrice * qty}. Please advise on availability.`);
  const whatsappUrl = `https://wa.me/17866824792?text=${whatsappMessage}`;

  const handleAddToCart = () => {
    if (!isVariantInStock) return;
    for (let i = 0; i < qty; i++) {
      addItem({ productId: product.id, name: product.name, size: selectedSize, price: currentPrice, image: images[0] ?? "" });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = products.filter(p => p.id !== product.id && p.family === product.family).slice(0, 3);

  return (
    <div className="w-full min-h-screen bg-background">
      <Helmet>
        <title>{product.name} | Élite da Parfum</title>
        <meta name="description" content={product.description?.substring(0, 160) || `Buy ${product.name} at Élite da Parfum.`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-36 pb-16 sm:pb-20">
        <Link href="/shop">
          <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-[11px] mb-8 sm:mb-10 cursor-pointer w-fit uppercase tracking-widest font-mono">
            <ArrowLeft size={13} /> Back to Collection
          </span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:gap-20">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full lg:w-1/2 flex flex-col gap-3">
            <div className="relative aspect-[3/4] overflow-hidden bg-card border border-border max-h-[60vh] sm:max-h-none">
              <AnimatePresence mode="wait">
                <motion.div key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                  {images[activeImg] ? (
                    <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card"><ShoppingBag size={64} className="text-border" /></div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute top-4 left-4 flex gap-2 z-10">
                <span className="bg-background/85 backdrop-blur-sm text-foreground text-[9px] uppercase tracking-[0.2em] px-2.5 py-1.5 font-mono border border-border/50">{product.family}</span>
                {hasDiscount && (
                  <span className="bg-primary text-primary-foreground text-[9px] uppercase tracking-[0.2em] px-2.5 py-1.5 font-mono font-semibold">{discount}% OFF</span>
                )}
              </div>

              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"><ChevronLeft size={16} /></button>
                  <button onClick={() => setActiveImg(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"><ChevronRight size={16} /></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={`rounded-full transition-all ${i === activeImg ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border-2 transition-all ${i === activeImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-90"}`}>
                    <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover object-center" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="w-full lg:w-1/2 flex flex-col justify-center">
            <div className="mb-5 sm:mb-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="h-px w-8 bg-primary" />
                <span className="text-primary text-[10px] uppercase tracking-[0.25em] font-mono">{product.family} · {product.gender}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif text-foreground mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl sm:text-3xl text-primary font-mono">${currentPrice}</p>
                {hasDiscount && (
                  <span className="text-muted-foreground line-through font-mono text-lg">${originalPrice}</span>
                )}
                {selectedSize && (
                  <span className="text-muted-foreground text-sm font-mono">· {selectedSize}</span>
                )}
              </div>
              {!isVariantInStock && (
                <div className="mt-2 text-destructive font-mono text-sm">Currently out of stock</div>
              )}
            </div>

            {product.description && (
              <div className="border-l-2 border-primary/30 pl-4 sm:pl-5 mb-6 sm:mb-8">
                <p className="text-muted-foreground font-serif italic leading-relaxed text-sm sm:text-base">{product.description}</p>
              </div>
            )}

            {(product.notesTop || product.notesHeart || product.notesBase) && (
              <div className="mb-6 sm:mb-8 bg-card border border-border p-4 sm:p-5 space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-3 sm:mb-4">Olfactory Pyramid</h3>
                {product.notesTop && (
                  <div className="flex gap-4 items-start">
                    <span className="text-[9px] uppercase tracking-widest text-primary font-mono w-12 sm:w-14 shrink-0 mt-0.5">Top</span>
                    <span className="text-foreground font-serif text-sm leading-relaxed">{product.notesTop}</span>
                  </div>
                )}
                {product.notesHeart && (
                  <div className="flex gap-4 items-start">
                    <span className="text-[9px] uppercase tracking-widest text-primary font-mono w-12 sm:w-14 shrink-0 mt-0.5">Heart</span>
                    <span className="text-foreground font-serif text-sm leading-relaxed">{product.notesHeart}</span>
                  </div>
                )}
                {product.notesBase && (
                  <div className="flex gap-4 items-start">
                    <span className="text-[9px] uppercase tracking-widest text-primary font-mono w-12 sm:w-14 shrink-0 mt-0.5">Base</span>
                    <span className="text-foreground font-serif text-sm leading-relaxed">{product.notesBase}</span>
                  </div>
                )}
              </div>
            )}

            {/* Size Selector */}
            {variants.length > 0 && (
              <div className="mb-5 sm:mb-6">
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-3">Size</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {variants.map(v => {
                    const origP = v.price;
                    const saleP = discount > 0 ? Math.round(origP * (1 - discount / 100)) : origP;
                    return (
                      <button
                        key={v.name}
                        onClick={() => { setSelectedSize(v.name); setAdded(false); }}
                        className={`flex-1 min-w-[72px] py-3 sm:py-3.5 border text-sm font-mono transition-all duration-200 ${selectedSize === v.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"} ${!v.inStock ? "opacity-50" : ""}`}
                      >
                        {v.name}
                        {hasDiscount ? (
                          <span className="block text-[10px] mt-0.5">
                            <span className="line-through opacity-50">${origP}</span>
                            <span className="text-primary ml-1">${saleP}</span>
                          </span>
                        ) : (
                          <span className="block text-[10px] mt-0.5 opacity-60">${origP}</span>
                        )}
                        {!v.inStock && <span className="block text-[8px] uppercase tracking-widest mt-1 text-destructive">Out of Stock</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="mb-7 sm:mb-8">
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-3">Quantity</h3>
              <div className={`flex items-center border border-border w-fit ${!isVariantInStock ? "opacity-50 pointer-events-none" : ""}`}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-foreground hover:text-primary hover:bg-muted transition-colors">
                  <Minus size={14} />
                </button>
                <span className="px-5 py-3 text-foreground font-mono text-sm border-x border-border min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-4 py-3 text-foreground hover:text-primary hover:bg-muted transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!isVariantInStock}
                className={`w-full py-4 flex items-center justify-center gap-3 transition-all duration-300 uppercase tracking-[0.15em] text-[11px] font-semibold font-mono border ${!isVariantInStock ? "bg-muted text-muted-foreground cursor-not-allowed border-border" : added ? "bg-primary/10 border-primary text-primary" : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground border-transparent"}`}
              >
                {added ? <Check size={15} /> : <ShoppingBag size={15} />}
                {!isVariantInStock ? "Out of Stock" : added ? `Added ${qty > 1 ? `(×${qty})` : ""} to Cart` : `Add to Cart${qty > 1 ? ` ×${qty}` : ""}`}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-4 flex items-center justify-center gap-3 hover:bg-[#1ebe5e] transition-colors uppercase tracking-[0.15em] text-[11px] font-semibold font-mono"
              >
                <SiWhatsapp size={17} />
                Order via WhatsApp
              </a>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-mono">
              Secure payment link provided upon confirmation
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Related Fragrances ── */}
      {related.length > 0 && (
        <section className="bg-card border-t border-border py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
              <div className="h-px w-8 bg-primary" />
              <h2 className="text-xl sm:text-2xl font-serif text-foreground">You May Also <em className="text-primary italic">Like</em></h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8">
              {related.map(rel => {
                const relImages = (() => { try { const a = JSON.parse(rel.images ?? "[]"); return Array.isArray(a) && a.length > 0 ? a : [rel.imageUrl]; } catch { return [rel.imageUrl]; } })();
                const relDiscount = rel.discountPercent ?? 0;
                const relSalePrice = relDiscount > 0 ? Math.round(rel.price * (1 - relDiscount / 100)) : null;
                return (
                  <Link key={rel.id} href={`/product/${rel.id}`}>
                    <div className="group cursor-pointer">
                      <div className="lux-frame relative aspect-[3/4] overflow-hidden bg-background border border-border/60 mb-3 sm:mb-4">
                        {relImages[0] ? (
                          <img src={relImages[0]} alt={rel.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-background" />
                        )}
                        {relDiscount > 0 && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-primary text-primary-foreground text-[9px] font-mono px-2 py-1 uppercase">{relDiscount}% OFF</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-serif text-foreground group-hover:text-primary transition-colors text-sm sm:text-base leading-snug line-clamp-2">{rel.name}</h3>
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{rel.gender}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[9px] uppercase text-muted-foreground font-mono">From</span>
                          {relSalePrice !== null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-primary font-mono text-xs sm:text-sm">${relSalePrice}</span>
                              <span className="text-muted-foreground line-through font-mono text-[10px]">${rel.price}</span>
                            </div>
                          ) : (
                            <span className="text-primary font-mono text-xs sm:text-sm">${rel.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
