import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { z } from "zod";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: async (e: string) => {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request reset");
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setErrorMsg("");
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      z.string().email().parse(email);
      forgotPasswordMutation.mutate(email);
    } catch {
      setErrorMsg("Please enter a valid email address");
    }
  };

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
          <h1 className="text-3xl font-serif mb-3 tracking-wide">Reset Password</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-mono">
            WE WILL SEND YOU A RESET LINK
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {success ? (
            <div className="text-center py-6">
              <p className="text-green-500 mb-6">
                If an account with that email exists, we have sent a password reset link to your inbox.
              </p>
              <Link href="/login">
                <span className="text-primary hover:underline cursor-pointer font-mono text-xs uppercase tracking-widest">
                  Back to Login
                </span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors pl-10"
                    placeholder="contact@elitedaparfum.com"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
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
                disabled={forgotPasswordMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-3 text-xs font-mono uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-border pt-6">
            <Link href="/login">
              <span className="text-primary hover:underline cursor-pointer font-mono text-xs uppercase tracking-widest">
                Back to Login
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
