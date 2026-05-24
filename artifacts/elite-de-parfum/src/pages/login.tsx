import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { BrandLogo } from "@/components/brand-logo";
import { useTheme } from "@/components/theme-provider";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export default function Login() {
  const { login, setUser } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const googleLoginMutation = useMutation({
    mutationFn: async (credential: string) => {
      const res = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login failed");
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        setLocation("/");
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/">
            <div className="flex justify-center mb-6 cursor-pointer">
              <BrandLogo
                className="h-14"
                color={theme === "dark" ? "hsl(45 60% 55%)" : "hsl(20 14% 15%)"}
              />
            </div>
          </Link>
          <h1 className="text-3xl font-serif text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest text-[10px]">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Google Sign In */}
          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  googleLoginMutation.mutate(credentialResponse.credential);
                }
              }}
              onError={() => setError("Google Sign In failed")}
              theme={theme === "dark" ? "filled_black" : "outline"}
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-mono tracking-widest text-[10px]">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border border-border pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 text-sm"
                  placeholder="your@email.com"
                  data-testid="input-login-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Password</label>
                <Link href="/forgot-password">
                  <span className="text-[10px] uppercase tracking-widest text-primary hover:underline cursor-pointer font-mono">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border border-border pl-10 pr-10 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 text-sm"
                  placeholder="••••••••"
                  data-testid="input-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center font-mono"
                data-testid="text-login-error"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoginMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-4 uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono relative overflow-hidden group"
              data-testid="btn-login-submit"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading || googleLoginMutation.isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 space-y-3">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register">
                <span className="text-primary hover:underline cursor-pointer font-mono text-xs uppercase tracking-widest" data-testid="link-to-register">
                  Create one
                </span>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
