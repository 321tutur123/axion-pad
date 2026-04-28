"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(fields: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.email.trim()) {
    errors.email = "Required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!fields.password) errors.password = "Required";
  return errors;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setNotice("Account created — sign in below.");
    }
  }, [searchParams]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }
      router.push("/account");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 py-32">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-white font-bold text-2xl tracking-tight">
            AXION<span className="text-violet-500">PAD</span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to your AXIONPAD account.</p>
          </div>

          {notice && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 transition-colors ${fieldErrors.email ? "border-red-500/50" : "border-white/10"}`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1.5">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 transition-colors ${fieldErrors.password ? "border-red-500/50" : "border-white/10"}`}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-400 mt-1.5">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

// useSearchParams requires a Suspense boundary in the App Router
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
