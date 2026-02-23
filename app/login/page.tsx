"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Shield, Server, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#111] p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand font-bold text-white">
              HP
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              HostPanel Pro
            </span>
          </div>
          <p className="text-sm text-[#555]">by Breach Rabbit</p>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Modern Hosting
            <br />
            Control Panel
          </h2>
          <p className="text-[#999] max-w-md leading-relaxed">
            Manage your servers, sites, databases, and SSL certificates from a
            single dashboard. Built on OpenLiteSpeed + Nginx.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-brand" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">OLS</span>
                <span className="text-xs text-[#555]">Web Server</span>
              </div>
            </div>
            <div className="h-8 w-px bg-[#222]" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">SSL</span>
                <span className="text-xs text-[#555]">Auto-Renew</span>
              </div>
            </div>
            <div className="h-8 w-px bg-[#222]" />
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-wordpress" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">WP</span>
                <span className="text-xs text-[#555]">Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-[#0a0a0a] p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold text-white text-sm">
              HP
            </div>
            <span className="text-xl font-bold text-white">HostPanel Pro</span>
          </div>

          <div className="rounded-lg border border-[#222] bg-[#141414] p-8 shadow-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-sm text-[#555]">
                Enter your credentials to access the panel
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#999]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand transition-colors"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#999]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-4 py-3 pr-11 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-brand px-6 py-3.5 text-sm font-medium text-white hover:bg-brandlight disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In to Panel"
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#333]">
            Breach Rabbit HostPanel Pro v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
