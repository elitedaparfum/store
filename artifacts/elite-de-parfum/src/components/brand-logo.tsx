interface BrandLogoProps {
  className?: string;
  color?: string;
  /** Show the "Élite da Parfum" wordmark next to the monogram. */
  showText?: boolean;
  /** Tailwind text-size class for the wordmark. */
  textClassName?: string;
}

export function BrandLogo({
  className = "h-9",
  showText = false,
  textClassName = "text-xl md:text-2xl",
}: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <img
        src="/images/logo-ep.png"
        alt="Élite da Parfum"
        className={`${className} w-auto object-contain block dark:brightness-100 brightness-[0.95]`}
        style={{ maxWidth: "none" }}
      />
      {showText && (
        <span
          className={`font-serif tracking-[0.05em] text-foreground leading-none ${textClassName}`}
        >
          Élite da Parfum
        </span>
      )}
    </span>
  );
}
