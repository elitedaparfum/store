import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useProducts } from "@/hooks/use-products";
import { apiFetch } from "@/lib/api";
import { Package, Plus, TrendingUp, Ticket, BadgePercent, ArrowRight } from "lucide-react";
import { codeStatus, type DiscountCode } from "./discounts";
import { saleStatus, type Sale } from "./sales";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { products } = useProducts();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    apiFetch("/api/discounts").then(d => setCodes(d.codes ?? [])).catch(() => {});
    apiFetch("/api/sales").then(d => setSales(d.sales ?? [])).catch(() => {});
  }, []);

  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const liveCodes = codes.filter(c => codeStatus(c) === "live");
  const liveSales = sales.filter(s => saleStatus(s) === "live");
  const totalRedemptions = codes.reduce((s, c) => s + c.usedCount, 0);

  const stats = [
    { label: "Total Products", value: products.length, icon: Package },
    { label: "Avg. Price", value: products.length ? `$${Math.round(totalValue / products.length)}` : "$0", icon: TrendingUp },
    { label: "Live Codes", value: `${liveCodes.length}${totalRedemptions ? ` · ${totalRedemptions} used` : ""}`, icon: Ticket },
    { label: "Live Sales", value: liveSales.length, icon: BadgePercent },
  ];

  const quickActions = [
    {
      href: "/admin/products/new", icon: Plus, testid: "link-quick-add-product",
      title: "Add New Product", sub: "Upload a new fragrance to your store",
    },
    {
      href: "/admin/discounts", icon: Ticket, testid: "link-quick-discounts",
      title: "Discount Codes", sub: "Create promo codes for your customers",
    },
    {
      href: "/admin/sales", icon: BadgePercent, testid: "link-quick-sales",
      title: "Sales Campaigns", sub: "Run storewide or targeted sales",
    },
    {
      href: "/", icon: ArrowRight, testid: "link-view-store",
      title: "View Storefront", sub: "See your store as customers see it",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user?.email}</p>
      </div>

      {liveSales.length > 0 && (
        <div className="border border-primary/30 bg-primary/5 px-5 py-4 flex items-center gap-4">
          <BadgePercent size={18} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              {liveSales.map(s => `${s.name} (−${s.percent}%)`).join(" · ")}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mt-0.5">Running now</p>
          </div>
          <Link href="/admin/sales">
            <span className="text-xs uppercase tracking-widest text-primary hover:underline cursor-pointer shrink-0">Manage</span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{stat.label}</span>
              <stat.icon size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-serif text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif text-foreground">Recent Products</h2>
            <Link href="/admin/products">
              <span className="text-xs uppercase tracking-widest text-primary hover:underline cursor-pointer flex items-center gap-1">
                View all <ArrowRight size={12} />
              </span>
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="py-12 text-center">
              <Package size={32} className="text-border mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No products yet</p>
              <Link href="/admin/products/new">
                <span className="inline-block mt-4 text-primary text-sm hover:underline cursor-pointer">Add your first product</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className="w-10 h-10 bg-background overflow-hidden shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-foreground text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.family} • {product.gender}</p>
                  </div>
                  {(product.discountPercent ?? 0) > 0 && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 font-mono border text-primary border-primary/30 bg-primary/10 shrink-0">
                      −{product.discountPercent}%
                    </span>
                  )}
                  <span className="font-mono text-sm text-foreground shrink-0">${product.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="text-lg font-serif text-foreground mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map(action => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-4 p-4 border border-border hover:border-primary transition-colors cursor-pointer group" data-testid={action.testid}>
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
