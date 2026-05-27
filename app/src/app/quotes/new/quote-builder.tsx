"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatUsd } from "@/lib/money";
import { AddonSelection, QuoteTerm, priceQuote } from "@/lib/pricing";

type ProductOption = { id: string; name: string };
type TierOption = { id: string; name: string; basePricePerSeatPerMonthUsd: string };

type AddonOption = {
  featureId: string;
  featureName: string;
  model: "fixed_per_month" | "per_seat_per_month" | "percent_of_product";
  fixedPricePerMonthUsd: string | null;
  perSeatPricePerMonthUsd: string | null;
  percentOfProduct: string | null;
};

export function QuoteBuilder({ products }: { products: ProductOption[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [productId, setProductId] = useState<string>(products[0]?.id ?? "");
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [tierId, setTierId] = useState<string>("");
  const [productSeats, setProductSeats] = useState<number>(25);
  const [term, setTerm] = useState<QuoteTerm>("annual");
  const [quoteDiscountPercent, setQuoteDiscountPercent] = useState<number>(0);

  const [availableAddons, setAvailableAddons] = useState<AddonOption[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [addonSeatCounts, setAddonSeatCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadTiers() {
      if (!productId) return;
      const res = await fetch(`/api/catalog/tiers?productId=${encodeURIComponent(productId)}`);
      const json = (await res.json()) as { tiers: TierOption[] };
      setTiers(json.tiers);
      setTierId(json.tiers[0]?.id ?? "");
    }
    void loadTiers();
  }, [productId]);

  useEffect(() => {
    async function loadAddons() {
      if (!tierId) {
        setAvailableAddons([]);
        setSelectedAddonIds(new Set());
        return;
      }
      const res = await fetch(`/api/catalog/addons?tierId=${encodeURIComponent(tierId)}`);
      const json = (await res.json()) as { addons: AddonOption[] };
      setAvailableAddons(json.addons);
      setSelectedAddonIds(new Set());
    }
    void loadAddons();
  }, [tierId]);

  const selectedTier = tiers.find((t) => t.id === tierId);
  const selectedProduct = products.find((p) => p.id === productId);

  const pricingAddons: AddonSelection[] = useMemo(() => {
    const result: AddonSelection[] = [];
    for (const opt of availableAddons) {
      if (!selectedAddonIds.has(opt.featureId)) continue;

      if (opt.model === "fixed_per_month") {
        result.push({
          key: opt.featureId,
          label: opt.featureName,
          model: "fixed_per_month",
          fixedPricePerMonthUsd: Number(opt.fixedPricePerMonthUsd ?? 0),
        });
      } else if (opt.model === "per_seat_per_month") {
        result.push({
          key: opt.featureId,
          label: opt.featureName,
          model: "per_seat_per_month",
          perSeatPricePerMonthUsd: Number(opt.perSeatPricePerMonthUsd ?? 0),
          seatCount: addonSeatCounts[opt.featureId] ?? 1,
        });
      } else {
        result.push({
          key: opt.featureId,
          label: opt.featureName,
          model: "percent_of_product",
          percentOfProduct: Number(opt.percentOfProduct ?? 0),
        });
      }
    }
    return result;
  }, [availableAddons, selectedAddonIds, addonSeatCounts]);

  const breakdown = useMemo(() => {
    if (!selectedTier || !selectedProduct) return null;
    if (!name || !customerLabel) return null;
    try {
      return priceQuote({
        customerLabel,
        quoteName: name,
        productLabel: selectedProduct.name,
        tierLabel: selectedTier.name,
        productSeats,
        basePricePerSeatPerMonthUsd: Number(selectedTier.basePricePerSeatPerMonthUsd),
        term,
        addons: pricingAddons,
        quoteDiscountPercent: quoteDiscountPercent > 0 ? quoteDiscountPercent : undefined,
      });
    } catch {
      return null;
    }
  }, [
    selectedTier,
    selectedProduct,
    name,
    customerLabel,
    productSeats,
    term,
    pricingAddons,
    quoteDiscountPercent,
  ]);

  async function saveQuote() {
    if (!breakdown || !selectedTier || !selectedProduct) return;

    const addonsPayload = Array.from(selectedAddonIds).map((featureId) => {
      const opt = availableAddons.find((a) => a.featureId === featureId)!;
      if (opt.model === "per_seat_per_month") {
        return { featureId, model: opt.model, seatCount: addonSeatCounts[featureId] ?? 1 };
      }
      return { featureId, model: opt.model };
    });

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        customerLabel,
        productId,
        tierId,
        productSeats,
        term,
        quoteDiscountPercent: quoteDiscountPercent > 0 ? quoteDiscountPercent : undefined,
        addons: addonsPayload,
      }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      alert(json.error ?? "Failed to save quote");
      return;
    }

    const json = (await res.json()) as { publicToken: string };
    router.push(`/quotes/${json.publicToken}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-sm font-semibold">Quote inputs</h2>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium">Quote name</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp - Q3 2026 proposal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Customer</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={customerLabel}
              onChange={(e) => setCustomerLabel(e.target.value)}
              placeholder="Acme Corporation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Product</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Tier</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={tierId}
                onChange={(e) => setTierId(e.target.value)}
                disabled={tiers.length === 0}
              >
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Seats</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                type="number"
                min={1}
                value={productSeats}
                onChange={(e) => setProductSeats(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Term</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={term}
                onChange={(e) => setTerm(e.target.value as QuoteTerm)}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (15% discount on product)</option>
                <option value="two_year">Two-year (25% discount on product)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Optional quote discount (%)</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              type="number"
              min={0}
              max={99}
              value={Math.round(quoteDiscountPercent * 100)}
              onChange={(e) => setQuoteDiscountPercent(Number(e.target.value) / 100)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-sm font-semibold">Add-ons</h2>
        {tierId === "" ? (
          <p className="mt-3 text-sm text-zinc-600">Select a tier to see add-ons.</p>
        ) : availableAddons.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No add-ons configured for this tier.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {availableAddons.map((a) => {
              const checked = selectedAddonIds.has(a.featureId);
              return (
                <div key={a.featureId} className="rounded-md border p-3">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selectedAddonIds);
                        if (e.target.checked) next.add(a.featureId);
                        else next.delete(a.featureId);
                        setSelectedAddonIds(next);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{a.featureName}</div>
                      <div className="text-xs text-zinc-600">
                        {a.model === "fixed_per_month"
                          ? `Fixed: $${a.fixedPricePerMonthUsd}/mo`
                          : a.model === "per_seat_per_month"
                            ? `Per-seat: $${a.perSeatPricePerMonthUsd}/seat/mo`
                            : `% of product: ${Number(a.percentOfProduct ?? 0) * 100}%`}
                      </div>
                    </div>
                  </label>

                  {checked && a.model === "per_seat_per_month" ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="text-xs text-zinc-700">Seats for this add-on</label>
                      <input
                        type="number"
                        min={1}
                        className="rounded-md border px-2 py-1 text-sm"
                        value={addonSeatCounts[a.featureId] ?? 1}
                        onChange={(e) =>
                          setAddonSeatCounts((prev) => ({
                            ...prev,
                            [a.featureId]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="lg:col-span-2 rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Quote preview</h2>
          <button
            type="button"
            onClick={() => void saveQuote()}
            disabled={!breakdown}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            Save quote
          </button>
        </div>

        {!breakdown ? (
          <p className="mt-3 text-sm text-zinc-600">
            Fill in quote name and customer, then select a product and tier to preview.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b px-3 py-2 text-left">Line item</th>
                  <th className="border-b px-3 py-2 text-left">How it was calculated</th>
                  <th className="border-b px-3 py-2 text-right">Amount</th>
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
        )}
      </section>
    </div>
  );
}

