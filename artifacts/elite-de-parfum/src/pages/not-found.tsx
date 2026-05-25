import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-background text-center px-6">
      <Helmet>
        <title>Page Not Found | Élite da Parfum</title>
      </Helmet>
      <h1 className="text-4xl sm:text-5xl font-serif text-foreground mb-4">404</h1>
      <p className="text-xl font-serif text-muted-foreground mb-8 italic">This page could not be found.</p>
      <Link href="/">
        <span className="text-primary border-b border-primary pb-1 uppercase tracking-widest text-xs cursor-pointer font-mono">
          Return Home
        </span>
      </Link>
    </div>
  );
}
