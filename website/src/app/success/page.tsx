import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-4xl mx-auto mb-8">
          ✓
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Thank you!</h1>
        <p className="text-zinc-400 text-lg mb-10">Your Axion Pad is on the way.</p>

        <Link
          href="/shop"
          className="inline-block px-8 py-3 rounded-full border border-white/20 text-zinc-300 hover:text-white hover:border-violet-500 transition-all text-sm font-medium"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
