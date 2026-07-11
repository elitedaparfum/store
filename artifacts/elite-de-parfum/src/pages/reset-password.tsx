import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { z } from "zod";

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Basic search params extraction
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const resetPasswordMutation = useMutation({
    mutationFn: async (vars: { token: string; newPassword: string }) => {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(vars),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setErrorMsg("");
      setTimeout(() => setLocation("/login"), 3000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Missing reset token. Please check your email link.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      z.string().min(6).parse(password);
      resetPasswordMutation.mutate({ token, newPassword: password });
    } catch {
      setErrorMsg("Password must be at least 6 characters");
    }
  };

  if (!token && !success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">Invalid or missing reset token.</p>
          <Link href="/forgot-password">
            <span className="text-primary hover:underline cursor-pointer font-mono text-xs uppercase tracking-widest">
              Request new link
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/">
          <div className="text-4xl font-serif text-primary cursor-pointer">
            Ep
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif mb-3 tracking-wide">New Password</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-mono">
            SECURE YOUR ACCOUNT
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {success ? (
            <div className="text-center py-6">
              <p className="text-green-500 mb-6">
                Password reset successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors pl-10"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors pl-10"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="text-destructive text-sm text-center font-mono">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-3 text-xs font-mono uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {resetPasswordMutation.isPending ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
