import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { and, inArray } from "drizzle-orm";

import { addonPricing, featureTierAvailability, features, products, quoteAddons, quotes, tiers } from "@/db/schema";
import { priceQuote } from "@/lib/pricing";

type SaveQuoteRequest = {
  name: string;
  customerLabel: string;
  productId: string;
  tierId: string;
  productSeats: number;
  term: "monthly" | "annual" | "two_year";
  quoteDiscountPercent?: number;
  addons: Array<
    | { featureId: string; model: "fixed_per_month" }
    | { featureId: string; model: "per_seat_per_month"; seatCount: number }
    | { featureId: string; model: "percent_of_product" }
  >;
};

export async function POST(req: Request) {
  const body = (await req.json()) as SaveQuoteRequest;
  if (!body?.name || !body?.customerLabel) {
    return NextResponse.json({ error: "name and customerLabel are required" }, { status: 400 });
  }

  const tier = await db.query.tiers.findFirst({
    where: eq(tiers.id, body.tierId),
  });
  if (!tier) return NextResponse.json({ error: "tier not found" }, { status: 404 });

  const product = await db.query.products.findFirst({
    where: eq(products.id, body.productId),
  });
  if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

  // Load add-on pricing for selected add-ons and validate they're actually available as add-ons.
  const selectedAddonFeatureIds = body.addons.map((a) => a.featureId);

  const addonsPricing =
    selectedAddonFeatureIds.length === 0
      ? []
      : await db
          .select({
            featureId: features.id,
            featureName: features.name,
            model: addonPricing.model,
            fixedPricePerMonthUsd: addonPricing.fixedPricePerMonthUsd,
            perSeatPricePerMonthUsd: addonPricing.perSeatPricePerMonthUsd,
            percentOfProduct: addonPricing.percentOfProduct,
          })
          .from(featureTierAvailability)
          .innerJoin(features, eq(features.id, featureTierAvailability.featureId))
          .innerJoin(
            addonPricing,
            and(eq(addonPricing.featureId, features.id), eq(addonPricing.tierId, featureTierAvailability.tierId)),
          )
          .where(
            and(
              eq(featureTierAvailability.tierId, body.tierId),
              eq(featureTierAvailability.mode, "addon"),
              inArray(features.id, selectedAddonFeatureIds),
            ),
          );

  const addonByFeatureId = new Map(addonsPricing.map((a) => [a.featureId, a]));

  const pricingAddons = body.addons.map((sel) => {
    const pricing = addonByFeatureId.get(sel.featureId);
    if (!pricing) throw new Error(`Add-on not found for featureId=${sel.featureId}`);

    if (pricing.model === "fixed_per_month") {
      return {
        key: sel.featureId,
        label: pricing.featureName,
        model: "fixed_per_month" as const,
        fixedPricePerMonthUsd: Number(pricing.fixedPricePerMonthUsd),
      };
    }

    if (pricing.model === "per_seat_per_month") {
      const seatCount =
        sel.model === "per_seat_per_month" ? sel.seatCount : 0;
      return {
        key: sel.featureId,
        label: pricing.featureName,
        model: "per_seat_per_month" as const,
        seatCount,
        perSeatPricePerMonthUsd: Number(pricing.perSeatPricePerMonthUsd),
      };
    }

    return {
      key: sel.featureId,
      label: pricing.featureName,
      model: "percent_of_product" as const,
      percentOfProduct: Number(pricing.percentOfProduct),
    };
  });

  const breakdown = priceQuote({
    customerLabel: body.customerLabel,
    quoteName: body.name,
    productLabel: product.name,
    tierLabel: tier.name,
    productSeats: body.productSeats,
    basePricePerSeatPerMonthUsd: Number(tier.basePricePerSeatPerMonthUsd),
    term: body.term,
    addons: pricingAddons,
    quoteDiscountPercent: body.quoteDiscountPercent,
  });

  const publicToken = crypto.randomUUID();

  const [createdQuote] = await db
    .insert(quotes)
    .values({
      publicToken,
      name: body.name,
      customerLabel: body.customerLabel,
      productId: body.productId,
      tierId: body.tierId,
      productSeats: body.productSeats,
      term: body.term,
      quoteDiscountPercent: body.quoteDiscountPercent != null ? String(body.quoteDiscountPercent) : null,
      breakdown,
      totalUsd: String(breakdown.totalUsd),
    })
    .returning({ id: quotes.id, publicToken: quotes.publicToken });

  if (body.addons.length > 0) {
    await db.insert(quoteAddons).values(
      body.addons.map((sel) => {
        const pricing = addonByFeatureId.get(sel.featureId)!;
        return {
          quoteId: createdQuote.id,
          featureId: sel.featureId,
          model: pricing.model,
          seatCount: sel.model === "per_seat_per_month" ? sel.seatCount : null,
          fixedPricePerMonthUsd: pricing.fixedPricePerMonthUsd,
          perSeatPricePerMonthUsd: pricing.perSeatPricePerMonthUsd,
          percentOfProduct: pricing.percentOfProduct,
        };
      }),
    );
  }

  return NextResponse.json({ publicToken: createdQuote.publicToken });
}

