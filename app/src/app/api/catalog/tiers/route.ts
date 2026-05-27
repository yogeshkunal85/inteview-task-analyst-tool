import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tiers } from "@/db/schema";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const rows = await db
    .select({
      id: tiers.id,
      name: tiers.name,
      basePricePerSeatPerMonthUsd: tiers.basePricePerSeatPerMonthUsd,
    })
    .from(tiers)
    .where(eq(tiers.productId, productId));

  return NextResponse.json({ tiers: rows });
}

