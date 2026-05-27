import { describe, expect, it } from "vitest";
import { getTermInfo, priceQuote } from "@/lib/pricing";

describe("getTermInfo", () => {
  it("returns correct months and discounts", () => {
    expect(getTermInfo("monthly")).toEqual({ months: 1, productSeatDiscountPercent: 0 });
    expect(getTermInfo("annual")).toEqual({ months: 12, productSeatDiscountPercent: 0.15 });
    expect(getTermInfo("two_year")).toEqual({ months: 24, productSeatDiscountPercent: 0.25 });
  });
});

describe("priceQuote", () => {
  it("matches the sample-quote math for product + fixed addon + per-seat addon", () => {
    const out = priceQuote({
      customerLabel: "Acme Corporation",
      quoteName: "Acme Corp - Q3 2026 Proposal",
      productLabel: "Analytics Suite",
      tierLabel: "Growth",
      productSeats: 25,
      basePricePerSeatPerMonthUsd: 50,
      term: "annual",
      addons: [
        {
          key: "sso",
          label: "Single Sign-On (SSO)",
          model: "fixed_per_month",
          fixedPricePerMonthUsd: 200,
        },
        {
          key: "api",
          label: "API access",
          model: "per_seat_per_month",
          seatCount: 5,
          perSeatPricePerMonthUsd: 50,
          notes:
            "Per-seat add-on. Note that the customer chose only 5 seats of API access even though the product has 25 seats - these are independent.",
        },
      ],
    });

    expect(out.lineItems.map((li) => ({ key: li.key, amountUsd: li.amountUsd }))).toEqual([
      { key: "product", amountUsd: 12750 },
      { key: "sso", amountUsd: 2400 },
      { key: "api", amountUsd: 3000 },
    ]);

    expect(out.subtotalUsd).toBe(18150);
    expect(out.totalUsd).toBe(18150);
  });

  it("supports percent-of-product add-ons and quote-level discount", () => {
    const out = priceQuote({
      customerLabel: "Example",
      quoteName: "Example",
      productLabel: "Product",
      tierLabel: "Tier",
      productSeats: 10,
      basePricePerSeatPerMonthUsd: 100,
      term: "monthly",
      addons: [
        {
          key: "pct",
          label: "Premium Support",
          model: "percent_of_product",
          percentOfProduct: 0.1,
        },
      ],
      quoteDiscountPercent: 0.2,
    });

    // product: 10 * 100 * 1 = 1000
    // pct addon: 10% of 1000 = 100
    // subtotal: 1100
    // quote discount: 20% of 1100 = 220
    // total: 880
    expect(out.subtotalUsd).toBe(1100);
    expect(out.quoteDiscountUsd).toBe(220);
    expect(out.totalUsd).toBe(880);
  });
});

