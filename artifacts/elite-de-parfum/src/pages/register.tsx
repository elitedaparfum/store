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

export default function Register() {
  const { register, setUser } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      if (!res.ok) throw new Error(data.error || "Google sign up failed");
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
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      setLocation("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <h1 className="text-3xl font-serif text-foreground mb-2">Create Account</h1>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Join the Elite Da Parfum family</p>
        </div>

        <div className="bg-card border border-border p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Google Sign Up */}
          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  googleLoginMutation.mutate(credentialResponse.credential);
                }
              }}
              onError={() => setError("Google Sign Up failed")}
              theme={theme === "dark" ? "filled_black" : "outline"}
              text="signup_with"
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
                  data-testid="input-register-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border border-border pl-10 pr-10 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 text-sm"
                  placeholder="Min. 6 characters"
                  data-testid="input-register-password"
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

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full bg-transparent border border-border pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 text-sm"
                  placeholder="Repeat password"
                  data-testid="input-register-confirm"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center font-mono"
                data-testid="text-register-error"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoginMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-4 uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              data-testid="btn-register-submit"
            >
              {loading || googleLoginMutation.isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-border pt-6">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-primary hover:underline cursor-pointer font-mono text-xs uppercase tracking-widest" data-testid="link-to-login">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
