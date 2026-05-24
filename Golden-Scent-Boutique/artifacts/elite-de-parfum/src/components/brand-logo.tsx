interface BrandLogoProps {
  className?: string;
  color?: string;
}

export function BrandLogo({ className = "h-14" }: BrandLogoProps) {
  return (
    <img
      src="/images/logo.png"
      alt="Elite Da Parfum"
      className={`${className} w-auto object-contain`}
      style={{ maxWidth: "none" }}
    />
  );
}
