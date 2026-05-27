import { roundToCents } from "@/lib/money";

export type QuoteTerm = "monthly" | "annual" | "two_year";

export type AddonPricingModel = "fixed_per_month" | "per_seat_per_month" | "percent_of_product";

export type AddonSelection =
  | {
      key: string;
      label: string;
      model: "fixed_per_month";
      fixedPricePerMonthUsd: number;
      notes?: string;
    }
  | {
      key: string;
      label: string;
      model: "per_seat_per_month";
      perSeatPricePerMonthUsd: number;
      seatCount: number;
      notes?: string;
    }
  | {
      key: string;
      label: string;
      model: "percent_of_product";
      percentOfProduct: number; // 0.10 means 10%
      notes?: string;
    };

export type LineItem = {
  key: string;
  label: string;
  formula: string;
  notes?: string;
  amountUsd: number;
};

export type QuotePricingInput = {
  customerLabel: string;
  quoteName: string;
  productLabel: string;
  tierLabel: string;
  productSeats: number;
  basePricePerSeatPerMonthUsd: number;
  term: QuoteTerm;
  addons: AddonSelection[];
  quoteDiscountPercent?: number; // 0.2 means 20%
};

export type QuotePricingOutput = {
  lineItems: LineItem[];
  subtotalUsd: number;
  quoteDiscountPercent?: number;
  quoteDiscountUsd?: number;
  totalUsd: number;
};

export function getTermInfo(term: QuoteTerm): { months: number; productSeatDiscountPercent: number } {
  switch (term) {
    case "monthly":
      return { months: 1, productSeatDiscountPercent: 0 };
    case "annual":
      return { months: 12, productSeatDiscountPercent: 0.15 };
    case "two_year":
      return { months: 24, productSeatDiscountPercent: 0.25 };
  }
}

export function priceQuote(input: QuotePricingInput): QuotePricingOutput {
  if (input.productSeats <= 0) throw new Error("productSeats must be positive");
  if (input.basePricePerSeatPerMonthUsd < 0) throw new Error("basePricePerSeatPerMonthUsd must be non-negative");
  if (input.quoteDiscountPercent != null && (input.quoteDiscountPercent < 0 || input.quoteDiscountPercent >= 1)) {
    throw new Error("quoteDiscountPercent must be in [0, 1)");
  }

  const { months, productSeatDiscountPercent } = getTermInfo(input.term);

  const lineItems: LineItem[] = [];

  const productAmount =
    input.productSeats *
    input.basePricePerSeatPerMonthUsd *
    months *
    (1 - productSeatDiscountPercent);

  lineItems.push({
    key: "product",
    label: `${input.productLabel} - ${input.tierLabel} tier`,
    formula: `${input.productSeats} seats × $${roundToCents(input.basePricePerSeatPerMonthUsd)} per seat per month × ${months} months × (1 - ${Math.round(
      productSeatDiscountPercent * 100,
    )}% term discount)`,
    notes: "Base product cost",
    amountUsd: roundToCents(productAmount),
  });

  const roundedProductAmount = roundToCents(productAmount);

  for (const addon of input.addons) {
    if (addon.model === "fixed_per_month") {
      const amount = addon.fixedPricePerMonthUsd * months;
      lineItems.push({
        key: addon.key,
        label: `Add-on: ${addon.label}`,
        formula: `$${roundToCents(addon.fixedPricePerMonthUsd)} per month × ${months} months`,
        notes: addon.notes ?? "Fixed monthly add-on price",
        amountUsd: roundToCents(amount),
      });
    } else if (addon.model === "per_seat_per_month") {
      if (addon.seatCount <= 0) throw new Error(`addon seatCount must be positive (${addon.key})`);
      const amount = addon.seatCount * addon.perSeatPricePerMonthUsd * months;
      lineItems.push({
        key: addon.key,
        label: `Add-on: ${addon.label}`,
        formula: `${addon.seatCount} seats × $${roundToCents(addon.perSeatPricePerMonthUsd)} per seat per month × ${months} months`,
        notes: addon.notes ?? "Per-seat add-on.",
        amountUsd: roundToCents(amount),
      });
    } else if (addon.model === "percent_of_product") {
      if (addon.percentOfProduct < 0) throw new Error(`addon percentOfProduct must be non-negative (${addon.key})`);
      const amount = roundedProductAmount * addon.percentOfProduct;
      lineItems.push({
        key: addon.key,
        label: `Add-on: ${addon.label}`,
        formula: `${Math.round(addon.percentOfProduct * 10000) / 100}% × product amount ($${roundToCents(
          roundedProductAmount,
        )})`,
        notes: addon.notes ?? "Percent-of-product add-on price.",
        amountUsd: roundToCents(amount),
      });
    }
  }

  const subtotalUsd = roundToCents(lineItems.reduce((sum, li) => sum + li.amountUsd, 0));

  if (input.quoteDiscountPercent == null || input.quoteDiscountPercent === 0) {
    return {
      lineItems,
      subtotalUsd,
      totalUsd: subtotalUsd,
    };
  }

  const quoteDiscountUsd = roundToCents(subtotalUsd * input.quoteDiscountPercent);
  const totalUsd = roundToCents(subtotalUsd - quoteDiscountUsd);

  return {
    lineItems,
    subtotalUsd,
    quoteDiscountPercent: input.quoteDiscountPercent,
    quoteDiscountUsd,
    totalUsd,
  };
}

