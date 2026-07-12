import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Play } from "lucide-react";
import { useProducts } from "@/hooks/use-products";

/** Frame (seconds) shown as the still when autoplay is blocked (e.g. iOS Low Power Mode). */
const HERO_POSTER_TIME = 1.2;

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tryPlay = () => {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          // Autoplay refused — park on a chosen frame and offer manual play
          video.currentTime = HERO_POSTER_TIME;
          setBlocked(true);
        });
      }
    };
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("canplay", tryPlay, { once: true });
    return () => video.removeEventListener("canplay", tryPlay);
  }, []);

  const handleManualPlay = () => {
    videoRef.current?.play().then(() => setBlocked(false)).catch(() => {});
  };

  return (
    <>
      <video
        ref={videoRef}
        src="/hero-video.mp4"
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center"
      />
      {blocked && (
        <button
          onClick={handleManualPlay}
          aria-label="Play film"
          className="absolute inset-0 z-20 flex items-center justify-center group/play cursor-pointer"
        >
          <span className="w-20 h-20 rounded-full border border-foreground/40 bg-background/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover/play:border-primary group-hover/play:bg-background/50">
            <Play size={22} className="text-foreground ml-1 transition-colors duration-300 group-hover/play:text-primary" fill="currentColor" />
          </span>
        </button>
      )}
    </>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.14 } },
};

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex items-center gap-4 ${center ? "justify-center" : ""}`}>
      <div className="h-px w-10 bg-primary/70" />
      <span className="text-primary text-[10px] uppercase tracking-[0.35em] font-mono">{children}</span>
      {center && <div className="h-px w-10 bg-primary/70" />}
    </div>
  );
}

function ProductCard({ product, large = false }: { product: ReturnType<typeof useProducts>["products"][0]; large?: boolean }) {
  const discount = product.discountPercent ?? 0;
  const salePrice = discount > 0 ? Math.round(product.price * (1 - discount / 100)) : null;
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group cursor-pointer">
        <div className={`lux-frame relative overflow-hidden bg-card ${large ? "aspect-[4/5]" : "aspect-[4/5]"}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full bg-card" />
          )}
        </div>
        <div className={`${large ? "pt-6" : "pt-5"} flex items-baseline justify-between gap-6`}>
          <div className="min-w-0">
            <h3 className={`font-serif text-foreground leading-snug transition-colors duration-300 group-hover:text-primary ${large ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
              {product.name}
            </h3>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mt-1.5">
              {product.family} · {product.gender}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {salePrice !== null ? (
              <span className="font-mono text-sm">
                <span className="text-muted-foreground line-through mr-2 text-xs">${product.price}</span>
                <span className="text-primary">${salePrice}</span>
              </span>
            ) : (
              <span className="font-mono text-sm text-foreground">${product.price}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { products } = useProducts();
  const featured = products.filter(p => p.featured && p.inStock);
  const pool = featured.length >= 3 ? featured : products.filter(p => p.inStock);
  const displayProducts = pool.slice(0, 3);

  return (
    <div className="w-full overflow-x-hidden">
      <Helmet>
        <title>Élite da Parfum | Authentic Premium Fragrances</title>
        <meta name="description" content="Discover curated authentic luxury and niche fragrances. Fast US shipping. Shop Tom Ford, Creed, Chanel, and more." />
      </Helmet>

      {/* ── HERO ── */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0">
          <HeroVideo />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 pb-20 sm:pb-24 lg:pb-28">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mb-8"
          >
            <Eyebrow>Élite da Parfum — Hattiesburg, MS</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
            className="font-serif font-normal text-foreground text-[clamp(3rem,9.5vw,8.5rem)] leading-[0.98] tracking-[-0.02em] max-w-[14ch]"
          >
            The art of <em className="text-primary italic">quiet</em> luxury.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8"
          >
            <p className="text-muted-foreground text-sm sm:text-[15px] leading-[1.9] font-light max-w-[380px]">
              Authentic fragrance from the great houses and the quiet ateliers,
              hand-selected and delivered across the United States.
            </p>
            <Link href="/shop">
              <span className="lux-underline group inline-flex items-center gap-3 text-foreground uppercase tracking-[0.3em] text-[11px] cursor-pointer whitespace-nowrap" data-testid="link-hero-shop">
                Enter the Collection
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1.5 text-primary" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="bg-popover py-24 sm:py-32 lg:py-40 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="mb-10">
            <Eyebrow center>No. 01 — Our Conviction</Eyebrow>
          </motion.div>
          <motion.p variants={fadeUp} className="font-serif text-2xl sm:text-3xl lg:text-[42px] text-foreground leading-[1.35]">
            We do not compose scents. We <em className="text-primary italic">find</em> them —
            in the archives of the great houses, among the shelves of ateliers
            most will never visit — and bring them home to you. Every bottle authentic.
            Every bottle chosen.
          </motion.p>
        </motion.div>
      </section>

      {/* ── FEATURED — asymmetric editorial grid ── */}
      {displayProducts.length > 0 && (
        <section className="bg-background py-24 sm:py-32 lg:py-40 px-6 sm:px-10 lg:px-16">
          <div className="max-w-[1500px] mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="mb-14 sm:mb-20"
            >
              <motion.div variants={fadeUp} className="mb-7">
                <Eyebrow>No. 02 — In Residence</Eyebrow>
              </motion.div>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <motion.h2 variants={fadeUp} className="font-serif text-4xl sm:text-5xl lg:text-7xl text-foreground leading-[1.05] tracking-[-0.01em]">
                  The current<br /><em className="text-primary italic">selection</em>.
                </motion.h2>
                <motion.div variants={fadeUp}>
                  <Link href="/shop">
                    <span className="lux-underline inline-flex items-center gap-3 text-muted-foreground hover:text-foreground uppercase tracking-[0.3em] text-[10px] cursor-pointer transition-colors" data-testid="link-view-all">
                      View Everything <ArrowRight size={12} className="text-primary" />
                    </span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-16 lg:gap-y-0">
              {displayProducts[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.9 }}
                  className="lg:col-span-7"
                >
                  <ProductCard product={displayProducts[0]} large />
                </motion.div>
              )}
              <div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-16 lg:justify-center">
                {displayProducts.slice(1, 3).map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.15 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── MAISON — pure typography ── */}
      <section className="bg-card border-y border-border py-24 sm:py-32 lg:py-40 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1500px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-10">
              <Eyebrow>No. 03 — The Maison</Eyebrow>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-12">
              <motion.h2
                variants={fadeUp}
                className="lg:col-span-7 font-serif text-4xl sm:text-5xl lg:text-[68px] text-foreground leading-[1.08] tracking-[-0.01em]"
              >
                A boutique built on a single <em className="text-primary italic">standard</em> — nothing on the shelf we would not wear ourselves.
              </motion.h2>

              <div className="lg:col-span-4 lg:col-start-9 lg:pt-4">
                <motion.p variants={fadeUp} className="text-muted-foreground text-sm sm:text-[15px] leading-[1.95] font-light mb-5">
                  Every fragrance in this house is genuine — sourced from authorized
                  distributors, verified before it reaches the shelf. Tom Ford, Chanel,
                  Creed, and the niche names collectors ask for by heart.
                </motion.p>
                <motion.p variants={fadeUp} className="text-muted-foreground text-sm sm:text-[15px] leading-[1.95] font-light mb-10">
                  Visit us in Hattiesburg to try before you buy, or order from anywhere
                  in the United States — insured, discreet, and never an imitation.
                </motion.p>
                <motion.div variants={fadeUp}>
                  <Link href="/contact">
                    <span className="lux-underline inline-flex items-center gap-3 text-foreground uppercase tracking-[0.3em] text-[10px] cursor-pointer">
                      Visit the Boutique <ArrowRight size={12} className="text-primary" />
                    </span>
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Meta ledger */}
            <motion.div
              variants={fadeUp}
              className="mt-16 sm:mt-20 pt-8 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-8"
            >
              {[
                { k: "Establishment", v: "Hattiesburg, MS" },
                { k: "Provenance", v: "Authorized distributors" },
                { k: "Shipping", v: "United States, insured" },
                { k: "Counsel", v: "In person & WhatsApp" },
              ].map(item => (
                <div key={item.k}>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-mono mb-2.5">{item.k}</p>
                  <p className="font-serif text-foreground text-base sm:text-lg">{item.v}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── THE PROMISE — numbered manifesto ── */}
      <section className="bg-background py-24 sm:py-32 lg:py-40 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-16 sm:mb-20"
          >
            <motion.div variants={fadeUp} className="mb-7">
              <Eyebrow>No. 04 — The Promise</Eyebrow>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1.05]">
              What we <em className="text-primary italic">stand</em> behind.
            </motion.h2>
          </motion.div>

          <div>
            {[
              {
                n: "01",
                title: "Authenticity, absolute",
                body: "Sourced only from authorized distributors and verified in-house. We have never sold an imitation, and we never will.",
              },
              {
                n: "02",
                title: "Curation over catalogue",
                body: "A small, deliberate selection — chosen bottle by bottle, not imported by the pallet. If it is on our shelf, it earned the place.",
              },
              {
                n: "03",
                title: "Counsel, in person or in hand",
                body: "Try before you buy at the boutique in Hattiesburg, or write to us — we will guide you to the scent, not the sale.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: i * 0.12 }}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[120px_1fr_1.2fr] gap-x-8 sm:gap-x-12 gap-y-3 py-10 sm:py-12 border-t border-border last:border-b group"
              >
                <span className="font-mono text-primary text-xs tracking-[0.3em] pt-2">{item.n}</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-foreground leading-snug transition-colors duration-300 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="col-span-2 sm:col-span-1 text-muted-foreground text-sm leading-[1.9] font-light sm:pt-2 max-w-[440px]">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOUSES — hairline plaque lattice ── */}
      <section className="bg-popover border-y border-border py-24 sm:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-14 sm:mb-16"
          >
            <motion.div variants={fadeUp} className="mb-7">
              <Eyebrow>No. 05 — The Houses</Eyebrow>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-[1.1]">
              Names worth <em className="text-primary italic">carrying</em>.
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1 }}
            className="border border-border bg-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px"
          >
            {["Tom Ford", "Chanel", "Creed", "Dior", "Hermès", "Valentino", "Prada", "Armani", "Rasasi", "Lattafa", "Afnan"].map(house => (
              <div
                key={house}
                className="bg-popover flex items-center justify-center py-10 sm:py-12 px-4 group cursor-default"
              >
                <span className="font-serif text-lg sm:text-xl text-muted-foreground transition-colors duration-500 group-hover:text-primary text-center">
                  {house}
                </span>
              </div>
            ))}
            <Link href="/shop">
              <div className="bg-popover h-full flex items-center justify-center py-10 sm:py-12 px-4 group cursor-pointer">
                <span className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.3em] font-mono text-primary">
                  & Others <ArrowRight size={11} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="bg-background py-28 sm:py-36 lg:py-44 px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-10">
            <Eyebrow center>Élite da Parfum</Eyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-serif text-4xl sm:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-12">
            Scent is memory.<br />
            <em className="text-primary italic">Make it yours.</em>
          </motion.h2>
          <motion.div variants={fadeUp}>
            <Link href="/shop">
              <span className="inline-flex items-center gap-4 border border-primary text-primary px-12 sm:px-16 py-5 uppercase tracking-[0.3em] text-[11px] hover:bg-primary hover:text-primary-foreground transition-colors duration-400 cursor-pointer" data-testid="link-home-contact">
                Shop the Collection <ArrowRight size={13} />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
