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
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border py-3 shadow-md" : "bg-gradient-to-b from-background/70 to-transparent backdrop-blur-[2px] border-b border-transparent py-5"}`}>
        <div className="mx-auto px-6 sm:px-10 lg:px-14 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left — nav / mobile hamburger */}
          <div className="flex items-center min-w-0">
            <button className="md:hidden text-foreground p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <nav className="hidden md:flex items-center gap-7 overflow-hidden">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span className={`text-[11px] uppercase tracking-[0.2em] transition-colors cursor-pointer whitespace-nowrap ${location === link.href ? "text-primary" : "text-muted-foreground hover:text-primary"}`} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Center — logo + wordmark */}
          <Link href="/">
            <div className="justify-self-center cursor-pointer">
              <BrandLogo
                showText
                className={`transition-all duration-500 ${isScrolled ? "h-7 md:h-8" : "h-8 md:h-9"}`}
                textClassName="text-base sm:text-lg md:text-xl"
              />
            </div>
          </Link>

          {/* Right — account, theme, bag */}
          <div className="flex items-center gap-4 sm:gap-5 justify-self-end">
            {user ? (
              <Link href={user.isAdmin ? "/admin" : "/login"}>
                <button className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" data-testid="btn-user-menu" aria-label="Account">
                  {user.isAdmin ? <LayoutDashboard size={16} /> : <User size={16} />}
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="hidden sm:flex items-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors font-mono" data-testid="btn-login-nav">
                  Sign In
                </button>
              </Link>
            )}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={openCart}
              className="relative flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-[11px] uppercase tracking-[0.1em] font-mono"
              data-testid="button-open-cart"
            >
              <span className="hidden sm:inline">Bag</span>
              <ShoppingBag size={16} className="sm:hidden" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-primary text-primary-foreground text-[9px] font-mono min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none"
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
              <BrandLogo showText className="h-8" textClassName="text-lg" />
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
            <BrandLogo showText className="h-10" textClassName="text-2xl" />
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
