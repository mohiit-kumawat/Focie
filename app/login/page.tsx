"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});

    // 1. Client-side Zod validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const formattedErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as "email" | "password";
        if (field && !formattedErrors[field]) {
          formattedErrors[field] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    // 2. Supabase Authentication
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back!"
      subtitle="Fumi missed you! Ready to start studying?"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Auth Error Banner */}
        {authError && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFEBF0] dark:bg-[#381E2B] border border-[#FFCAD6] dark:border-[#6A3249] text-[#D83A66] dark:text-[#FFAAB9] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF729F]" />
            <span>{authError}</span>
          </div>
        )}

        {/* Email Field with Icon */}
        <div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B8E] dark:text-[#8E819E] pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mohiit.kumawat@gmail.com"
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFF5F8]/80 dark:bg-[#1D1729] border text-[#4A3E4D] dark:text-[#F8F1FF] placeholder-[#A496A6] dark:placeholder-[#7D6E7E] text-xs sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1D1729] focus:border-[#FF729F] focus:ring-1 focus:ring-[#FF729F]/60 transition-all ${
                fieldErrors.email
                  ? "border-[#FF729F] ring-1 ring-[#FF729F]"
                  : "border-[#E9DFD8] dark:border-[#40354F]"
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-[#FF729F] mt-1 font-medium pl-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Field with Icon and Toggle */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B8E] dark:text-[#8E819E] pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#FFF5F8]/80 dark:bg-[#1D1729] border text-[#4A3E4D] dark:text-[#F8F1FF] placeholder-[#A496A6] dark:placeholder-[#7D6E7E] text-xs sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1D1729] focus:border-[#FF729F] focus:ring-1 focus:ring-[#FF729F]/60 transition-all ${
                fieldErrors.password
                  ? "border-[#FF729F] ring-1 ring-[#FF729F]"
                  : "border-[#E9DFD8] dark:border-[#40354F]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7B8E] dark:text-[#8E819E] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] transition-colors p-1 cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-[#FF729F] mt-1 font-medium pl-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FF729F] to-[#F25577] hover:from-[#FF5D8F] hover:to-[#E04468] text-white font-bold text-sm shadow-md shadow-[#FF729F]/20 hover:shadow-lg hover:shadow-[#FF729F]/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Switch to Register */}
        <div className="text-center pt-2 text-xs text-[#7D6E7E] dark:text-[#B9AEC9]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#FF729F] hover:underline transition-all"
          >
            Sign up instead
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
