import { Link, useLocation } from "wouter";
import { useTheme } from "./theme-provider";
import { Moon, Sun, Menu, X, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { BrandLogo } from "./brand-logo";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/cart";
import { useAuth } from "@/context/auth";
import { SiInstagram, SiFacebook, SiWhatsapp } from "react-icons/si";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Collections" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-background/90 backdrop-blur-md border-b border-border py-3 shadow-md" : "bg-transparent border-b border-transparent py-5"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button className="md:hidden text-foreground p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span className={`text-[11px] uppercase tracking-[0.2em] transition-colors cursor-pointer font-mono ${location === link.href ? "text-primary" : "text-foreground/70 hover:text-primary"}`} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <Link href="/">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer">
              <BrandLogo
                className={`transition-all duration-500 ${isScrolled ? "h-9 md:h-11" : "h-11 md:h-13"}`}
              />
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-foreground/70 hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <Link href={user.isAdmin ? "/admin" : "/login"}>
                <button className="hidden md:flex items-center gap-1.5 text-foreground/70 hover:text-primary transition-colors p-2 rounded-full hover:bg-muted" data-testid="btn-user-menu">
                  {user.isAdmin ? <LayoutDashboard size={17} /> : <User size={17} />}
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="hidden md:flex items-center text-[10px] uppercase tracking-[0.18em] text-foreground/60 hover:text-primary transition-colors px-3 py-1.5 border border-transparent hover:border-primary/40 font-mono" data-testid="btn-login-nav">
                  Sign In
                </button>
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative text-foreground/70 hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
              data-testid="button-open-cart"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center leading-none"
                  data-testid="cart-count-badge"
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col md:hidden"
          >
            <div className="relative flex items-center justify-center px-6 py-5 border-b border-border">
              <BrandLogo className="h-10" />
              <button onClick={() => setMobileMenuOpen(false)} className="absolute right-5 text-foreground p-1" aria-label="Close menu"><X size={22} /></button>
            </div>
            <nav className="flex flex-col gap-1 p-6 flex-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span className="block py-4 text-2xl font-serif text-foreground hover:text-primary transition-colors cursor-pointer border-b border-border/40" data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
              <div className="pt-6 flex flex-col gap-3">
                {user ? (
                  user.isAdmin && (
                    <Link href="/admin">
                      <span className="text-primary text-xs uppercase tracking-widest cursor-pointer font-mono">Admin Portal</span>
                    </Link>
                  )
                ) : (
                  <>
                    <Link href="/login"><span className="text-foreground/70 text-xs uppercase tracking-widest cursor-pointer font-mono">Sign In</span></Link>
                    <Link href="/register"><span className="text-foreground/70 text-xs uppercase tracking-widest cursor-pointer font-mono">Create Account</span></Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">{children}</main>

      <footer className="bg-card text-card-foreground border-t border-border">
        <div className="container mx-auto px-6 py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center md:items-start space-y-5">
            <BrandLogo className="h-14" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Hattiesburg's luxury fragrance boutique. Premium authentic scents — Tom Ford, Chanel, D&G &amp; more. US shipping only.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-foreground font-mono mb-2">Collections</h4>
            {["Oud Collection", "Floral Collection", "Woody Collection", "Fresh Collection"].map(c => (
              <Link key={c} href="/shop">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm">{c}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] text-foreground font-mono mb-2">Contact</h4>
            <a href="tel:+17866824792" className="text-muted-foreground hover:text-primary transition-colors text-sm">+1 (786) 682-4792</a>
            <a href="mailto:contact@elitedaparfum.com" className="text-muted-foreground hover:text-primary transition-colors text-sm">contact@elitedaparfum.com</a>
            <span className="text-muted-foreground text-sm">Hattiesburg, Mississippi</span>
            <span className="text-muted-foreground text-sm">US Domestic Shipping Only</span>
            <div className="flex items-center gap-4 pt-1">
              <a href="https://www.instagram.com/elitedaparfum1" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <SiInstagram size={17} />
              </a>
              <a href="https://www.facebook.com/people/Elite-Da-Parfum/61589275449563/" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                <SiFacebook size={17} />
              </a>
              <a href="https://wa.me/17866824792" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors" aria-label="WhatsApp">
                <SiWhatsapp size={17} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground font-mono">
            <span>&copy; {new Date().getFullYear()} Elite Da Parfum. All rights reserved.</span>
            <span className="text-primary/50 tracking-widest">A SYMPHONY OF SENSES</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
