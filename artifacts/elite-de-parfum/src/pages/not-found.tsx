import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-background text-center px-6">
      <Helmet>
        <title>Page Not Found | Élite da Parfum</title>
      </Helmet>
      <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono mb-4">Error 404</span>
      <h1 className="text-5xl sm:text-6xl font-serif text-foreground mb-5">Lost in the Notes.</h1>
      <p className="text-base sm:text-lg font-serif italic text-muted-foreground mb-8 max-w-sm">
        The page you're looking for has drifted away, like a top note.
      </p>
      <Link href="/">
        <span className="inline-block bg-primary text-primary-foreground px-8 py-4 uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer font-mono">
          Return Home
        </span>
      </Link>
    </div>
  );
}
