"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
}

function validate(fields: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.first_name.trim()) errors.first_name = "Required";
  if (!fields.last_name.trim()) errors.last_name = "Required";
  if (!fields.email.trim()) {
    errors.email = "Required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!fields.password) {
    errors.password = "Required";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ first_name: "", last_name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center px-6 py-32">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-white font-bold text-2xl tracking-tight">
            AXION<span className="text-violet-500">PAD</span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-sm text-zinc-500">Join AXIONPAD to manage your orders and reviews.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Arthur"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 transition-colors ${fieldErrors.first_name ? "border-red-500/50" : "border-white/10"}`}
                />
                {fieldErrors.first_name && (
                  <p className="text-xs text-red-400 mt-1.5">{fieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Dupont"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-zinc-600 transition-colors ${fieldErrors.last_name ? "border-red-500/50" : "border-white/10"}`}
                />
                {fieldErrors.last_name && (
                  <p className="text-xs text-red-400 mt-1.5">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>

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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
