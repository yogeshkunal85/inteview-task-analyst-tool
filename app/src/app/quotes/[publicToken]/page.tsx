import Link from "next/link";
import { eq } from "drizzle-orm";

import { Nav } from "@/app/_components/Nav";
import { db } from "@/db";
import { quotes, tiers, products } from "@/db/schema";
import { formatUsd } from "@/lib/money";
import type { QuotePricingOutput } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function QuoteViewPage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const { publicToken } = await params;

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.publicToken, publicToken),
  });

  if (!quote) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-6 py-10">
          <p className="text-sm text-zinc-700">Quote not found.</p>
          <Link href="/" className="mt-2 inline-block text-sm hover:underline">
            Back home
          </Link>
        </main>
      </div>
    );
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, quote.productId) });
  const tier = await db.query.tiers.findFirst({ where: eq(tiers.id, quote.tierId) });

  const breakdown = quote.breakdown as QuotePricingOutput;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-xl font-semibold">{quote.name}</h1>
            <div className="mt-2 space-y-1 text-sm text-zinc-700">
              <div>
                <span className="font-medium">Customer:</span> {quote.customerLabel}
              </div>
              <div>
                <span className="font-medium">Product:</span> {product?.name ?? quote.productId}
              </div>
              <div>
                <span className="font-medium">Tier:</span> {tier?.name ?? quote.tierId}
              </div>
              <div>
                <span className="font-medium">Seats:</span> {quote.productSeats}
              </div>
              <div>
                <span className="font-medium">Term:</span> {quote.term}
              </div>
            </div>
          </div>
          <Link
            href="/quotes/new"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Create another quote
          </Link>
        </div>

        <section className="mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-sm font-semibold">Cost breakdown</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b px-3 py-2 text-left">Line item</th>
                  <th className="border-b px-3 py-2 text-left">How it was calculated</th>
                  <th className="border-b px-3 py-2 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.lineItems.map((li) => (
                  <tr key={li.key} className="align-top">
                    <td className="border-b px-3 py-2 font-medium">{li.label}</td>
                    <td className="border-b px-3 py-2">
                      <div>{li.formula}</div>
                      {li.notes ? <div className="mt-1 text-xs text-zinc-600">{li.notes}</div> : null}
                    </td>
                    <td className="border-b px-3 py-2 text-right font-medium">
                      {formatUsd(li.amountUsd)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="px-3 py-3 font-semibold">TOTAL</td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3 text-right text-base font-semibold">
                    {formatUsd(breakdown.totalUsd)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

