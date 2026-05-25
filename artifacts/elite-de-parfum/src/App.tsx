import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import { AdminLayout } from "@/components/admin-layout";
import { CartProvider } from "@/context/cart";
import { CartDrawer } from "@/components/cart-drawer";
import { AuthProvider, useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/product";
import Contact from "@/pages/contact";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AdminDashboard from "@/pages/admin/index";
import AdminProducts from "@/pages/admin/products";
import ProductForm from "@/pages/admin/product-form";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 size={32} className="text-primary animate-spin" /></div>;
  if (!user || !user.isAdmin) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 size={32} className="text-primary animate-spin" /></div>;
  if (user) return <Redirect to="/" />;
  return <>{children}</>;
}

function PublicRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AdminRoutes() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
          <Route path="/admin/products/new" component={ProductForm} />
          <Route path="/admin/products/:id/edit" component={ProductForm} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin" component={AdminDashboard} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <AuthGuard><Login /></AuthGuard>
      </Route>
      <Route path="/register">
        <AuthGuard><Register /></AuthGuard>
      </Route>
      <Route path="/forgot-password">
        <AuthGuard><ForgotPassword /></AuthGuard>
      </Route>
      <Route path="/reset-password">
        <AuthGuard><ResetPassword /></AuthGuard>
      </Route>
      <Route path="/admin/products/new">
        <AdminRoutes />
      </Route>
      <Route path="/admin/products/:id/edit">
        <AdminRoutes />
      </Route>
      <Route path="/admin/products">
        <AdminRoutes />
      </Route>
      <Route path="/admin">
        <AdminRoutes />
      </Route>
      <Route>
        <PublicRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider defaultTheme="dark" storageKey="elite-theme">
        <AuthProvider>
          <CartProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <AppRoutes />
                  <CartDrawer />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </QueryClientProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
