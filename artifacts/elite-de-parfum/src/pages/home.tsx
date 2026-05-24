import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Shield, MapPin, Truck } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { BrandTicker } from "@/components/brand-ticker";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function Home() {
  const { products } = useProducts();
  const featured = products.filter(p => p.featured && p.inStock).slice(0, 3);
  const displayProducts = featured.length >= 3 ? featured : products.filter(p => p.inStock).slice(0, 3);

  return (
    <div className="w-full overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.45)" }}
          />
          {/* Gradient: strong on left for text, lighter on right to let bottle show */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        </div>

        {/* Content — left-aligned on desktop, top-centered on mobile */}
        <div className="relative z-10 h-full flex items-start lg:items-center">
          <div className="px-6 sm:px-10 lg:px-20 xl:px-32 max-w-2xl w-full pt-28 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex items-center gap-3 mb-5 sm:mb-7"
            >
              <div className="h-px w-8 sm:w-12 bg-primary/70" />
              <span className="text-primary text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.35em] font-mono">Elite Da Parfum · Hattiesburg, MS</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[clamp(2.4rem,3.8vw,3.8rem)] font-serif text-white leading-[1.1] mb-4 sm:mb-6 tracking-tight"
            >
              The Essence of<br />
              <span className="text-primary italic">Opulence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-white/65 text-sm sm:text-base font-serif italic mb-8 sm:mb-10 max-w-xs sm:max-w-sm"
            >
              Tom Ford, Chanel, D&amp;G &amp; more — delivered across the US
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href="/shop">
                <span className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 uppercase tracking-[0.15em] text-[11px] font-semibold hover:bg-primary/90 transition-all duration-300 cursor-pointer whitespace-nowrap w-full sm:w-auto" data-testid="link-hero-shop">
                  Shop the Collection
                  <ArrowRight size={13} />
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-flex items-center justify-center gap-3 border border-white/40 text-white px-8 py-4 uppercase tracking-[0.15em] text-[11px] hover:border-primary hover:text-primary transition-all duration-300 cursor-pointer backdrop-blur-sm whitespace-nowrap w-full sm:w-auto">
                  Contact Us
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-px h-10 sm:h-12 bg-gradient-to-b from-transparent to-primary/60 animate-pulse" />
        </div>
      </section>

      {/* ── FLOATING BRAND TICKER ── */}
      <BrandTicker />

      {/* ── ABOUT ── */}
      <section className="py-20 sm:py-28 md:py-36 px-6 bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-primary" />
              <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono">About Us</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-foreground mb-6 leading-tight">
              Hattiesburg's<br />Luxury Fragrance Boutique
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-base sm:text-lg leading-relaxed font-serif italic mb-5">
              Based in Hattiesburg, MS, we curate the world's most sought-after luxury fragrances — 100% authentic, hand-selected from the premier houses of perfumery.
            </motion.p>
            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed mb-8 text-sm sm:text-base">
              From Tom Ford's Oud Wood to Chanel's iconic Coco Noir, every bottle we carry is genuine. We do not create custom scents — we source the best the world has to offer.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/shop">
                <span className="inline-flex items-center gap-2 text-foreground border-b border-primary pb-1 uppercase tracking-widest text-xs hover:text-primary transition-colors cursor-pointer">
                  Browse Current Stock <ArrowRight size={12} />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden bg-card">
              <img src="/images/oud-royale.png" alt="Elite Da Parfum boutique" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 w-24 h-24 lg:w-32 lg:h-32 bg-primary/10 border border-primary/20 hidden sm:block" />
            <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 w-16 h-16 lg:w-20 lg:h-20 bg-card border border-border hidden sm:block" />
            <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-sm border border-border p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">Located in</p>
              <p className="text-base sm:text-lg font-serif text-foreground">Hattiesburg, MS</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BRANDS STRIP ── */}
      <section className="py-12 sm:py-14 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono mb-6 sm:mb-8">Brands We Carry</p>
          <div className="flex overflow-x-auto gap-8 md:gap-12 lg:gap-16 pb-2 sm:pb-0 sm:flex-wrap sm:justify-center no-scrollbar">
            {["Tom Ford", "Chanel", "Dior", "Versace", "YSL", "Armani", "Creed", "Dolce & Gabbana", "Afnan", "Lattafa", "Armaf", "Rasasi", "Azzaro", "Valentino", "Prada", "Hermès"].map((brand, i) => (
              <motion.span
                key={brand}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="text-muted-foreground/60 font-serif text-base sm:text-lg hover:text-primary transition-colors cursor-default whitespace-nowrap shrink-0"
              >
                {brand}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COLLECTION ── */}
      {displayProducts.length > 0 && (
        <section className="py-20 sm:py-28 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 sm:mb-16 gap-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
                  <div className="h-px w-10 bg-primary" />
                  <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono">Now Available</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-serif text-foreground">
                  Current Stock
                </motion.h2>
              </motion.div>
              <Link href="/shop">
                <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer text-xs uppercase tracking-widest border-b border-transparent hover:border-primary pb-1" data-testid="link-view-all">
                  View All <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              {displayProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.15 }}
                  className="group"
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="cursor-pointer">
                      <div className="relative aspect-[3/4] overflow-hidden mb-4 bg-card">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-card to-background" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-background/80 backdrop-blur-sm text-foreground text-[9px] uppercase tracking-widest px-2 py-1 font-mono">{product.family}</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
                          <span className="inline-flex items-center gap-2 text-white text-xs uppercase tracking-widest">
                            View Details <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-1 px-0.5">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-serif text-foreground group-hover:text-primary transition-colors mb-0.5 leading-snug line-clamp-2">{product.name}</h3>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{product.gender}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 mt-0.5">
                          <span className="text-[8px] sm:text-[9px] uppercase text-muted-foreground font-mono">From</span>
                          <span className="text-primary font-mono text-xs sm:text-sm leading-tight">${product.price}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LUXURY BANNER ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/scent-guide-bg.jpeg" alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.35) saturate(0.7)" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-xl">
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-primary" />
              <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono">Personal Service</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-5 leading-tight">
              Not Sure Which<br />Scent is Right for You?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/60 leading-relaxed mb-8 font-serif italic text-sm sm:text-base">
              Message us on WhatsApp and our team will personally guide you to the perfect fragrance based on your taste and occasion.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/contact">
                <span className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-7 sm:px-8 py-4 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                  Get Recommendations <ArrowRight size={13} />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20 sm:py-28 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12 sm:mb-16">
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-primary" />
              <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono">How We Operate</span>
              <div className="h-px w-10 bg-primary" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-serif text-foreground">Our Promise</motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Shield,
                title: "100% Authentic",
                body: "Every fragrance we sell is genuine — sourced directly from authorized distributors. No fakes, no replicas.",
              },
              {
                icon: Truck,
                title: "US Shipping Only",
                body: "We ship domestically across all 50 US states. Fast, insured, and discreet packaging on every order.",
              },
              {
                icon: MapPin,
                title: "Hattiesburg, MS",
                body: "Visit us in person for a hands-on experience. Try before you buy at our boutique in Hattiesburg, Mississippi.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className="text-center p-7 sm:p-8 border border-border hover:border-primary/40 transition-colors group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                  <item.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-serif text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 sm:py-32 px-6 bg-background text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <span className="text-[clamp(8rem,40vw,20rem)] font-serif text-foreground">E</span>
        </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto relative z-10">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono">Hattiesburg, MS</span>
            <div className="h-px w-10 bg-primary" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-6xl font-serif text-foreground mb-5 leading-tight">
            Scent is Memory.<br /><span className="text-primary italic">Make it Yours.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mb-10 leading-relaxed font-serif italic text-sm sm:text-base">
            Premium fragrances from the world's finest houses. Available in-store and shipped across the US.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/shop">
              <span className="inline-flex items-center gap-3 bg-foreground text-background px-10 sm:px-12 py-4 sm:py-5 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-400 cursor-pointer" data-testid="link-home-contact">
                Shop the Collection <ArrowRight size={14} />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
