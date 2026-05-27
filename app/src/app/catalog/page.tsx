import Link from "next/link";
import { Nav } from "@/app/_components/Nav";
import { db } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function CatalogHomePage() {
  const allProducts = await db.select().from(products).orderBy(products.createdAt);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Catalog</h1>
          <Link
            href="/catalog/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New product
          </Link>
        </div>

        <div className="mt-6 rounded-lg border bg-white">
          {allProducts.length === 0 ? (
            <div className="p-6 text-sm text-zinc-600">No products yet.</div>
          ) : (
            <ul className="divide-y">
              {allProducts.map((p) => (
                <li key={p.id} className="p-4">
                  <Link href={`/catalog/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

