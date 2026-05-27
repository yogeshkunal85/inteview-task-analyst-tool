import { Nav } from "@/app/_components/Nav";
import { QuoteBuilder } from "@/app/quotes/new/quote-builder";
import { db } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const allProducts = await db.select({ id: products.id, name: products.name }).from(products);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-xl font-semibold">New quote</h1>
        <p className="mt-1 text-sm text-zinc-700">
          Build a quote, preview the math, then save a shareable read-only URL.
        </p>
        <div className="mt-6">
          <QuoteBuilder products={allProducts} />
        </div>
      </main>
    </div>
  );
}
