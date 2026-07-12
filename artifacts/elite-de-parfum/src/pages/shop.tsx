import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Loader2, RefreshCw, SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useProducts } from "@/hooks/use-products";
import { useCart } from "@/context/cart";

const scentFamilies = ["All", "Oriental", "Floral", "Woody", "Fresh", "Citrus", "Aquatic", "Gourmand", "Aromatic"];
const genders = ["All", "Unisex", "Men", "Women"];

export default function Shop() {
  const { products, loading, error, refetch } = useProducts();
  const [familyFilter, setFamilyFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Featured");
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem } = useCart();

  const filteredProducts = products.filter(product => {
    if (familyFilter !== "All" && !product.family.includes(familyFilter)) return false;
    if (genderFilter !== "All" && product.gender !== genderFilter) return false;
    if (searchQuery.trim() && !product.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) return false;
    return true;
  }).sort((a, b) => {
    if (sortOrder === "Price: Low → High") return a.price - b.price;
    if (sortOrder === "Price: High → Low") return b.price - a.price;
    return 0;
  });

  const handleQuickAdd = (e: React.MouseEvent, product: ReturnType<typeof useProducts>["products"][0]) => {
    e.preventDefault();
    e.stopPropagation();
    let variants = [];
    try { variants = JSON.parse(product.sizes ?? "[]"); } catch { /* ignore */ }
    const defaultV = variants.find((v: any) => v.inStock) || variants[0] || { name: "Default", price: product.price, inStock: true };
    
    if (!defaultV.inStock) return;

    const discount = product.discountPercent ?? 0;
    const finalPrice = discount > 0 ? Math.round(defaultV.price * (1 - discount / 100)) : defaultV.price;

    addItem({ productId: product.id, name: product.name, size: defaultV.name, price: finalPrice, image: product.imageUrl });
    setRecentlyAdded(product.id);
    setTimeout(() => setRecentlyAdded(null), 2000);
  };

  const hasActiveFilters = familyFilter !== "All" || genderFilter !== "All";

  return (
    <div className="w-full min-h-screen bg-background">
      <Helmet>
        <title>Shop Our Collection | Élite da Parfum</title>
        <meta name="description" content="Explore our curated collection of authentic niche and designer fragrances. Find your perfect scent." />
      </Helmet>

      {/* ── Page Header ── */}
      <div className="pt-36 sm:pt-44 pb-14 sm:pb-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1500px] mx-auto">
          <div className="flex items-center gap-4 mb-7">
            <div className="h-px w-10 bg-primary/70" />
            <span className="text-primary text-[10px] uppercase tracking-[0.35em] font-mono">The Collection — Hattiesburg, MS</span>
          </div>
          <h1 className="font-serif text-[clamp(2.75rem,7vw,6.5rem)] text-foreground leading-[1.02] tracking-[-0.015em]">
            Every bottle,<br /><em className="text-primary italic">chosen</em>.
          </h1>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-10 lg:px-16 pb-24">

        {/* ── Search Bar ── */}
        <div className="relative mb-6 mt-2">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search fragrances…"
            className="w-full bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono pl-10 pr-10 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Mobile Filter + Sort Bar ── */}
        <div className="flex items-center gap-3 mb-6 py-3 border-y border-border lg:hidden">
          <button
            onClick={() => { setFiltersOpen(!filtersOpen); setSortOpen(false); }}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono px-4 py-2.5 border transition-colors flex-1 justify-center ${filtersOpen ? "border-primary text-primary bg-primary/10" : "border-border text-foreground"}`}
          >
            <SlidersHorizontal size={13} />
            Filters {hasActiveFilters && <span className="w-1.5 h-1.5 bg-primary rounded-full ml-0.5" />}
          </button>
          <div className="w-px h-6 bg-border" />
          <button
            onClick={() => { setSortOpen(!sortOpen); setFiltersOpen(false); }}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono px-4 py-2.5 border transition-colors flex-1 justify-center ${sortOpen ? "border-primary text-primary bg-primary/10" : "border-border text-foreground"}`}
          >
            Sort
            <ChevronDown size={12} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* ── Mobile Filters Panel ── */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden mb-5 border border-border bg-card p-5 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-mono text-foreground">Filter By</span>
                <button onClick={() => setFiltersOpen(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Scent Family</p>
                <div className="flex flex-wrap gap-2">
                  {scentFamilies.map(family => (
                    <button key={family} onClick={() => setFamilyFilter(family)}
                      className={`text-[10px] uppercase tracking-wider px-3 py-2 border transition-all font-mono ${familyFilter === family ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                      {family}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Gender</p>
                <div className="flex flex-wrap gap-2">
                  {genders.map(gender => (
                    <button key={gender} onClick={() => setGenderFilter(gender)}
                      className={`text-[10px] uppercase tracking-wider px-3 py-2 border transition-all font-mono ${genderFilter === gender ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                      {gender}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <button onClick={() => { setFamilyFilter("All"); setGenderFilter("All"); }}
                  className="text-[10px] uppercase tracking-widest text-primary font-mono border-b border-primary pb-0.5">
                  Clear All Filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Sort Panel ── */}
        <AnimatePresence>
          {sortOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden mb-5 border border-border bg-card p-5 space-y-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs uppercase tracking-widest font-mono text-foreground">Sort By</span>
                <button onClick={() => setSortOpen(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
              {["Featured", "Price: Low → High", "Price: High → Low"].map(sort => (
                <button key={sort} onClick={() => { setSortOrder(sort); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-mono border transition-colors ${sortOrder === sort ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-foreground"}`}>
                  {sort}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Desktop Filters Bar ── */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-8 py-4 border-y border-border">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono whitespace-nowrap">Family</span>
              <div className="flex flex-wrap gap-4">
                {scentFamilies.map(family => (
                  <button key={family} onClick={() => setFamilyFilter(family)}
                    className={`text-[11px] uppercase tracking-wider transition-all font-mono pb-0.5 ${familyFilter === family ? "text-primary border-b border-primary" : "text-muted-foreground hover:text-foreground"}`}
                    data-testid={`btn-filter-family-${family.toLowerCase()}`}>
                    {family}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono whitespace-nowrap">Gender</span>
              <div className="flex gap-4">
                {genders.map(gender => (
                  <button key={gender} onClick={() => setGenderFilter(gender)}
                    className={`text-[11px] uppercase tracking-wider transition-all font-mono pb-0.5 ${genderFilter === gender ? "text-primary border-b border-primary" : "text-muted-foreground hover:text-foreground"}`}
                    data-testid={`btn-filter-gender-${gender.toLowerCase()}`}>
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Sort</span>
            {["Featured", "Price: Low → High", "Price: High → Low"].map(sort => (
              <button key={sort} onClick={() => setSortOrder(sort)}
                className={`text-[11px] uppercase tracking-wider whitespace-nowrap transition-all font-mono pb-0.5 ${sortOrder === sort ? "text-primary border-b border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {sort.replace("Price: ", "")}
              </button>
            ))}
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
              {filteredProducts.length} {filteredProducts.length === 1 ? "fragrance" : "fragrances"} available
            </span>
            {hasActiveFilters && (
              <button onClick={() => { setFamilyFilter("All"); setGenderFilter("All"); }}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-primary font-mono hover:underline">
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={28} className="text-primary animate-spin" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Loading collection…</span>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-muted-foreground mb-6 font-serif italic">{error}</p>
            <button onClick={refetch} className="flex items-center gap-2 text-primary mx-auto hover:underline text-sm font-mono uppercase tracking-widest">
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-32 text-center">
            {products.length === 0 ? (
              <div>
                <ShoppingBag size={48} className="text-border mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-serif text-foreground mb-3">Collection Coming Soon</h2>
                <p className="text-muted-foreground font-serif italic mb-8 max-w-sm mx-auto text-sm sm:text-base">
                  Our curated selection is being prepared. Visit us in-store in Hattiesburg, MS, or reach out via WhatsApp.
                </p>
                <Link href="/contact">
                  <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 uppercase tracking-widest text-xs font-mono cursor-pointer hover:bg-primary/90 transition-colors">
                    Contact Us
                  </span>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xl sm:text-2xl font-serif text-muted-foreground mb-4">No fragrances match your selection.</p>
                <button onClick={() => { setFamilyFilter("All"); setGenderFilter("All"); }}
                  className="mt-2 text-primary border-b border-primary pb-1 uppercase tracking-widest text-xs font-mono">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12 sm:gap-x-10 sm:gap-y-16 lg:gap-x-12 lg:gap-y-20">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const justAdded = recentlyAdded === product.id;
                return (
                  <motion.div layout key={product.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }} className="group" data-testid={`card-product-${product.id}`}>
                    <Link href={`/product/${product.id}`}>
                      <div className="cursor-pointer h-full flex flex-col">
                        <div className="lux-frame relative aspect-[3/4] overflow-hidden mb-3 sm:mb-4 bg-card border border-border/60">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-card">
                              <ShoppingBag size={40} className="text-border" />
                            </div>
                          )}
                          {/* Quick add — tap on mobile, hover on desktop */}
                          <div className="absolute bottom-0 left-0 right-0 sm:translate-y-full sm:group-hover:translate-y-0 sm:transition-transform sm:duration-300 z-20">
                            <button onClick={(e) => handleQuickAdd(e, product)}
                              className={`w-full py-3 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] sm:text-[10px] font-semibold transition-all duration-300 font-mono ${justAdded ? "bg-primary text-primary-foreground" : "bg-background/95 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground"}`}
                              data-testid={`btn-quick-add-${product.id}`}>
                              {justAdded ? <Check size={11} /> : <ShoppingBag size={11} />}
                              {justAdded ? "Added" : (() => {
                                let variants: any[] = [];
                                try { variants = JSON.parse(product.sizes ?? "[]"); } catch { /* ignore */ }
                                const defaultV = variants.find(v => v.inStock) || variants[0];
                                if (!defaultV || !defaultV.inStock) return "Out of Stock";
                                return `Add — ${defaultV.name}`;
                              })()}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 pt-1">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-serif text-foreground group-hover:text-primary transition-colors duration-300 leading-snug line-clamp-2">{product.name}</h3>
                            <span className="text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-mono block mt-1">{product.family} · {product.gender}</span>
                          </div>
                          <div className="shrink-0 text-right">
                            {(product.discountPercent ?? 0) > 0 ? (
                              <span className="font-mono text-xs sm:text-sm">
                                <span className="text-muted-foreground line-through mr-1.5 text-[10px]">${product.price}</span>
                                <span className="text-primary">${Math.round(product.price * (1 - (product.discountPercent ?? 0) / 100))}</span>
                              </span>
                            ) : (
                              <span className="text-foreground font-mono text-xs sm:text-sm">${product.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
