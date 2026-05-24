import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useProducts } from "@/hooks/use-products";
import { Package, Plus, TrendingUp, Users, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { products } = useProducts();

  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const families = [...new Set(products.map(p => p.family))];

  const stats = [
    { label: "Total Products", value: products.length, icon: Package, color: "text-primary" },
    { label: "Scent Families", value: families.length, icon: TrendingUp, color: "text-primary" },
    { label: "Avg. Price", value: products.length ? `$${Math.round(totalValue / products.length)}` : "$0", icon: TrendingUp, color: "text-primary" },
    { label: "Admin Account", value: user?.email?.split("@")[0] ?? "–", icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user?.email}</p>
      </div>

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
              <stat.icon size={16} className={stat.color} />
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
                  <span className="font-mono text-sm text-foreground shrink-0">${product.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="text-lg font-serif text-foreground mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/products/new">
              <div className="flex items-center gap-4 p-4 border border-border hover:border-primary transition-colors cursor-pointer group" data-testid="link-quick-add-product">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Add New Product</p>
                  <p className="text-xs text-muted-foreground">Upload a new fragrance to your store</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground ml-auto" />
              </div>
            </Link>
            <Link href="/admin/products">
              <div className="flex items-center gap-4 p-4 border border-border hover:border-primary transition-colors cursor-pointer group" data-testid="link-manage-products">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Package size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Manage Products</p>
                  <p className="text-xs text-muted-foreground">Edit, delete or update your collection</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground ml-auto" />
              </div>
            </Link>
            <Link href="/">
              <div className="flex items-center gap-4 p-4 border border-border hover:border-primary transition-colors cursor-pointer group" data-testid="link-view-store">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ArrowRight size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">View Storefront</p>
                  <p className="text-xs text-muted-foreground">See your store as customers see it</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground ml-auto" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
