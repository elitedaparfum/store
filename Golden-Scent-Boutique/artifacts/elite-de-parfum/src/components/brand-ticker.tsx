import { motion } from "framer-motion";

const brands = [
  "Tom Ford",
  "Chanel",
  "Dior",
  "Versace",
  "YSL",
  "Armani",
  "Creed",
  "Dolce & Gabbana",
  "Afnan",
  "Lattafa",
  "Armaf",
  "Rasasi",
  "Azzaro",
  "Valentino",
  "Prada",
  "Hermès",
  "Gucci",
  "Burberry",
];

const Separator = () => (
  <span className="text-primary/50 text-xs mx-1 font-mono select-none">✦</span>
);

function TickerRow({ reverse = false }: { reverse?: boolean }) {
  const doubled = [...brands, ...brands, ...brands];

  return (
    <div className="relative overflow-hidden w-full">
      <motion.div
        className="flex items-center gap-0 w-max"
        animate={{ x: reverse ? ["-33.333%", "0%"] : ["0%", "-33.333%"] }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {doubled.map((brand, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="text-foreground/60 hover:text-primary transition-colors duration-300 uppercase tracking-[0.18em] text-[10px] sm:text-[11px] font-mono cursor-default px-3 sm:px-4 whitespace-nowrap">
              {brand}
            </span>
            <Separator />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function BrandTicker() {
  return (
    <div className="w-full bg-card border-y border-border py-3 overflow-hidden select-none">
      <TickerRow />
    </div>
  );
}
