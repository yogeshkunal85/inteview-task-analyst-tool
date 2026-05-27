import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { addonPricing, featureTierAvailability, features } from "@/db/schema";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tierId = url.searchParams.get("tierId");
  if (!tierId) return NextResponse.json({ error: "tierId is required" }, { status: 400 });

  const rows = await db
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
    .where(and(eq(featureTierAvailability.tierId, tierId), eq(featureTierAvailability.mode, "addon")));

  return NextResponse.json({ addons: rows });
}

