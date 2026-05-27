import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";

import { Nav } from "@/app/_components/Nav";
import {
  addFeatureAction,
  addTierAction,
  renameProductAction,
  setFeatureTierModeAction,
  upsertAddonPricingAction,
} from "@/app/catalog/actions";
import { db } from "@/db";
import {
  addonPricing,
  featureTierAvailability,
  features,
  products,
  tiers,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ProductCatalogPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });
  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-6 py-10">
          <p className="text-sm text-zinc-700">Product not found.</p>
          <Link href="/catalog" className="mt-2 inline-block text-sm hover:underline">
            Back to catalog
          </Link>
        </main>
      </div>
    );
  }

  const productTiers = await db.select().from(tiers).where(eq(tiers.productId, productId));
  const productFeatures = await db.select().from(features).where(eq(features.productId, productId));

  const tierIds = productTiers.map((t) => t.id);
  const featureIds = productFeatures.map((f) => f.id);

  const availabilityRows =
    tierIds.length === 0 || featureIds.length === 0
      ? []
      : await db
          .select()
          .from(featureTierAvailability)
          .where(and(inArray(featureTierAvailability.tierId, tierIds), inArray(featureTierAvailability.featureId, featureIds)));

  const pricingRows =
    tierIds.length === 0 || featureIds.length === 0
      ? []
      : await db
          .select()
          .from(addonPricing)
          .where(and(inArray(addonPricing.tierId, tierIds), inArray(addonPricing.featureId, featureIds)));

  const availabilityMap = new Map<string, (typeof availabilityRows)[number]>();
  for (const row of availabilityRows) availabilityMap.set(`${row.featureId}:${row.tierId}`, row);

  const pricingMap = new Map<string, (typeof pricingRows)[number]>();
  for (const row of pricingRows) pricingMap.set(`${row.featureId}:${row.tierId}`, row);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/catalog" className="text-sm text-zinc-700 hover:underline">
              ← Back
            </Link>
            <h1 className="mt-2 text-xl font-semibold">{product.name}</h1>
          </div>
        </div>

        <section className="mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-sm font-semibold">Product details</h2>
          <form action={renameProductAction.bind(null, productId)} className="mt-3 flex gap-3">
            <input
              name="name"
              defaultValue={product.name}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              Save
            </button>
          </form>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold">Tiers</h2>
            {productTiers.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No tiers yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {productTiers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-zinc-600">${t.basePricePerSeatPerMonthUsd} per seat / month</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form action={addTierAction.bind(null, productId)} className="mt-4 grid grid-cols-3 gap-2">
              <input
                name="name"
                className="col-span-1 rounded-md border px-3 py-2 text-sm"
                placeholder="Growth"
                required
              />
              <input
                name="basePricePerSeatPerMonthUsd"
                className="col-span-1 rounded-md border px-3 py-2 text-sm"
                placeholder="50"
                inputMode="decimal"
                required
              />
              <button className="col-span-1 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                Add tier
              </button>
            </form>
            <p className="mt-2 text-xs text-zinc-500">
              Base price is in USD, per seat, per month.
            </p>
          </section>

          <section className="rounded-lg border bg-white p-6">
            <h2 className="text-sm font-semibold">Features</h2>
            {productFeatures.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No features yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {productFeatures.map((f) => (
                  <li key={f.id} className="rounded border px-3 py-2">
                    <div className="font-medium">{f.name}</div>
                  </li>
                ))}
              </ul>
            )}

            <form action={addFeatureAction.bind(null, productId)} className="mt-4 flex gap-2">
              <input
                name="name"
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                placeholder="Single Sign-On (SSO)"
                required
              />
              <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                Add feature
              </button>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Feature matrix</h2>
              <p className="mt-1 text-xs text-zinc-600">
                For each feature and tier, choose Included / Add-on / Unavailable. Add-ons also need a pricing model.
              </p>
            </div>
          </div>

          {productTiers.length === 0 || productFeatures.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600">
              Add at least one tier and one feature to configure the matrix.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b px-3 py-2 text-left">Feature</th>
                    {productTiers.map((t) => (
                      <th key={t.id} className="border-b px-3 py-2 text-left">
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productFeatures.map((f) => (
                    <tr key={f.id} className="align-top">
                      <td className="border-b px-3 py-3 font-medium">{f.name}</td>
                      {productTiers.map((t) => {
                        const key = `${f.id}:${t.id}`;
                        const modeRow = availabilityMap.get(key);
                        const mode = modeRow?.mode ?? "unavailable";
                        const pricing = pricingMap.get(key);
                        return (
                          <td key={t.id} className="border-b px-3 py-3">
                            <form
                              action={setFeatureTierModeAction.bind(null, productId, f.id, t.id)}
                              className="flex items-center gap-2"
                            >
                              <select
                                name="mode"
                                defaultValue={mode}
                                className="rounded-md border px-2 py-1 text-sm"
                              >
                                <option value="included">Included</option>
                                <option value="addon">Add-on</option>
                                <option value="unavailable">Unavailable</option>
                              </select>
                              <button className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-zinc-50">
                                Save
                              </button>
                            </form>

                            {mode === "addon" ? (
                              <form
                                action={upsertAddonPricingAction.bind(null, productId, f.id, t.id)}
                                className="mt-2 space-y-2 rounded-md border bg-zinc-50 p-2"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="col-span-2 text-xs font-medium text-zinc-700">
                                    Pricing model
                                  </label>
                                  <select
                                    name="model"
                                    defaultValue={pricing?.model ?? "fixed_per_month"}
                                    className="col-span-2 rounded-md border px-2 py-1 text-sm"
                                  >
                                    <option value="fixed_per_month">Fixed monthly</option>
                                    <option value="per_seat_per_month">Per-seat</option>
                                    <option value="percent_of_product">% of product</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-xs text-zinc-700">Fixed $/mo</label>
                                  <input
                                    name="fixedPricePerMonthUsd"
                                    defaultValue={pricing?.fixedPricePerMonthUsd ?? ""}
                                    className="rounded-md border px-2 py-1 text-sm"
                                    inputMode="decimal"
                                    placeholder="200"
                                  />
                                  <label className="text-xs text-zinc-700">Per-seat $/mo</label>
                                  <input
                                    name="perSeatPricePerMonthUsd"
                                    defaultValue={pricing?.perSeatPricePerMonthUsd ?? ""}
                                    className="rounded-md border px-2 py-1 text-sm"
                                    inputMode="decimal"
                                    placeholder="50"
                                  />
                                  <label className="text-xs text-zinc-700">% of product</label>
                                  <input
                                    name="percentOfProduct"
                                    defaultValue={pricing?.percentOfProduct ?? ""}
                                    className="rounded-md border px-2 py-1 text-sm"
                                    inputMode="decimal"
                                    placeholder="0.10"
                                  />
                                </div>

                                <button className="w-full rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
                                  Save pricing
                                </button>
                              </form>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

