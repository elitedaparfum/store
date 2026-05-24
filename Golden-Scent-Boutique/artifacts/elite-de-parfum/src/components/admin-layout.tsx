import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { useTheme } from "./theme-provider";
import { BrandLogo } from "./brand-logo";
import { LayoutDashboard, Package, Sun, Moon, LogOut, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const logoColor = theme === "dark" ? "hsl(45 60% 55%)" : "hsl(20 14% 20%)";

  const Sidebar = () => (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <Link href="/">
          <BrandLogo className="h-11" color={logoColor} />
        </Link>
        <div className="mt-3 px-0.5">
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = item.exact ? location === item.href : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${active ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-background border-l-2 border-transparent"}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={15} />
                <span className="text-sm font-mono tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link href="/">
          <div className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer border-l-2 border-transparent">
            <Home size={15} />
            <span className="text-sm font-mono">View Store</span>
          </div>
        </Link>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-background transition-colors w-full text-left border-l-2 border-transparent"
          data-testid="btn-admin-theme-toggle"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          <span className="text-sm font-mono">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full text-left border-l-2 border-transparent"
          data-testid="btn-logout"
        >
          <LogOut size={15} />
          <span className="text-sm font-mono">Sign Out</span>
        </button>
        <div className="px-3 pt-3 mt-1 border-t border-border">
          <p className="text-[10px] text-muted-foreground truncate font-mono">{user?.email}</p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <BrandLogo className="h-8" color={logoColor} />
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Admin</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 flex">
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 p-6 lg:p-10 pt-20 lg:pt-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
