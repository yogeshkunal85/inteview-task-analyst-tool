"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  addonPricing,
  featureTierAvailability,
  features,
  products,
  tiers,
} from "@/db/schema";

function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Missing ${key}`);
  return value.trim();
}

export async function createProductAction(formData: FormData) {
  const name = requireString(formData, "name");
  const [created] = await db.insert(products).values({ name }).returning({ id: products.id });
  redirect(`/catalog/${created.id}`);
}

export async function renameProductAction(productId: string, formData: FormData) {
  const name = requireString(formData, "name");
  await db.update(products).set({ name, updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath(`/catalog/${productId}`);
}

export async function addTierAction(productId: string, formData: FormData) {
  const name = requireString(formData, "name");
  const basePrice = requireString(formData, "basePricePerSeatPerMonthUsd");

  await db.insert(tiers).values({
    productId,
    name,
    basePricePerSeatPerMonthUsd: basePrice,
  });

  revalidatePath(`/catalog/${productId}`);
}

export async function addFeatureAction(productId: string, formData: FormData) {
  const name = requireString(formData, "name");

  await db.insert(features).values({
    productId,
    name,
  });

  revalidatePath(`/catalog/${productId}`);
}

export async function setFeatureTierModeAction(
  productId: string,
  featureId: string,
  tierId: string,
  formData: FormData,
) {
  const mode = requireString(formData, "mode") as "included" | "addon" | "unavailable";

  await db
    .insert(featureTierAvailability)
    .values({
      featureId,
      tierId,
      mode,
    })
    .onConflictDoUpdate({
      target: [featureTierAvailability.featureId, featureTierAvailability.tierId],
      set: { mode, updatedAt: new Date() },
    });

  if (mode !== "addon") {
    await db
      .delete(addonPricing)
      .where(and(eq(addonPricing.featureId, featureId), eq(addonPricing.tierId, tierId)));
  }

  revalidatePath(`/catalog/${productId}`);
}

export async function upsertAddonPricingAction(
  productId: string,
  featureId: string,
  tierId: string,
  formData: FormData,
) {
  const model = requireString(formData, "model") as
    | "fixed_per_month"
    | "per_seat_per_month"
    | "percent_of_product";

  const fixedPricePerMonthUsd = formData.get("fixedPricePerMonthUsd");
  const perSeatPricePerMonthUsd = formData.get("perSeatPricePerMonthUsd");
  const percentOfProduct = formData.get("percentOfProduct");

  await db
    .insert(addonPricing)
    .values({
      featureId,
      tierId,
      model,
      fixedPricePerMonthUsd: typeof fixedPricePerMonthUsd === "string" ? fixedPricePerMonthUsd : null,
      perSeatPricePerMonthUsd:
        typeof perSeatPricePerMonthUsd === "string" ? perSeatPricePerMonthUsd : null,
      percentOfProduct: typeof percentOfProduct === "string" ? percentOfProduct : null,
    })
    .onConflictDoUpdate({
      target: [addonPricing.featureId, addonPricing.tierId],
      set: {
        model,
        fixedPricePerMonthUsd: typeof fixedPricePerMonthUsd === "string" ? fixedPricePerMonthUsd : null,
        perSeatPricePerMonthUsd:
          typeof perSeatPricePerMonthUsd === "string" ? perSeatPricePerMonthUsd : null,
        percentOfProduct: typeof percentOfProduct === "string" ? percentOfProduct : null,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/catalog/${productId}`);
}

