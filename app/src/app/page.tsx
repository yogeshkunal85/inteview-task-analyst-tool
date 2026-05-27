import Link from "next/link";
import { Nav } from "@/app/_components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Monetizely quoting tool</h1>
        <p className="mt-2 max-w-2xl text-zinc-700">
          Set up a product catalog (tiers, features, and add-ons), then build and share read-only
          quotes with a transparent line-item cost breakdown.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/catalog"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to catalog
          </Link>
          <Link
            href="/quotes/new"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Create a quote
          </Link>
        </div>
      </main>
    </div>
  );
}
