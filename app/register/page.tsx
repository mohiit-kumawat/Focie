"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, MailCheck, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});

    // 1. Client-side Zod validation
    const validation = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const formattedErrors: {
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as "email" | "password" | "confirmPassword";
        if (field && !formattedErrors[field]) {
          formattedErrors[field] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    // 2. Supabase Sign Up
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        router.push("/onboarding");
        router.refresh();
      } else if (data?.user) {
        setConfirmationSent(true);
        setLoading(false);
      }
    } catch {
      setAuthError("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthCard
        title="Check your inbox! 💌"
        subtitle="Almost there! We just sent a verification email."
      >
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-[#1A3826] text-[#91E6C1]">
            <MailCheck className="w-10 h-10" />
          </div>

          <p className="text-sm text-[#4A3E4D] dark:text-[#F8F1FF] leading-relaxed">
            We sent a confirmation link to <span className="font-bold text-[#FF729F]">{email}</span>. Please click the link to verify your account and join Focie!
          </p>

          <p className="text-xs text-[#7D6E7E] dark:text-[#B9AEC9]">
            Can&apos;t find it? Make sure to check your spam or promotions tab.
          </p>

          <div className="pt-2">
            <Link href="/login">
              <Button variant="secondary" size="md" className="w-full rounded-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Join Focie"
      subtitle="Study with cozy friends and build your focus streak."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
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

        {/* Confirm Password Field */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B8E] dark:text-[#8E819E] pointer-events-none" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFF5F8]/80 dark:bg-[#1D1729] border text-[#4A3E4D] dark:text-[#F8F1FF] placeholder-[#A496A6] dark:placeholder-[#7D6E7E] text-xs sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1D1729] focus:border-[#FF729F] focus:ring-1 focus:ring-[#FF729F]/60 transition-all ${
                fieldErrors.confirmPassword
                  ? "border-[#FF729F] ring-1 ring-[#FF729F]"
                  : "border-[#E9DFD8] dark:border-[#40354F]"
              }`}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-[#FF729F] mt-1 font-medium pl-1">
              {fieldErrors.confirmPassword}
            </p>
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Switch to Login */}
        <div className="text-center pt-2 text-xs text-[#7D6E7E] dark:text-[#B9AEC9]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#FF729F] hover:underline transition-all"
          >
            Sign in instead
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
