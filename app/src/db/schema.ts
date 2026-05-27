import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const featureTierModeEnum = pgEnum("feature_tier_mode", [
  "included",
  "addon",
  "unavailable",
]);

export const addonPricingModelEnum = pgEnum("addon_pricing_model", [
  "fixed_per_month",
  "per_seat_per_month",
  "percent_of_product",
]);

export const quoteTermEnum = pgEnum("quote_term", ["monthly", "annual", "two_year"]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tiers = pgTable("tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  basePricePerSeatPerMonthUsd: numeric("base_price_per_seat_per_month_usd", {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureTierAvailability = pgTable(
  "feature_tier_availability",
  {
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    tierId: uuid("tier_id")
      .notNull()
      .references(() => tiers.id, { onDelete: "cascade" }),
    mode: featureTierModeEnum("mode").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.featureId, t.tierId] }),
  }),
);

export const addonPricing = pgTable(
  "addon_pricing",
  {
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    tierId: uuid("tier_id")
      .notNull()
      .references(() => tiers.id, { onDelete: "cascade" }),
    model: addonPricingModelEnum("model").notNull(),
    fixedPricePerMonthUsd: numeric("fixed_price_per_month_usd", {
      precision: 12,
      scale: 2,
    }),
    perSeatPricePerMonthUsd: numeric("per_seat_price_per_month_usd", {
      precision: 12,
      scale: 2,
    }),
    percentOfProduct: numeric("percent_of_product", { precision: 6, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.featureId, t.tierId] }),
  }),
);

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicToken: text("public_token").notNull().unique(),

  name: text("name").notNull(),
  customerLabel: text("customer_label").notNull(),

  productId: uuid("product_id").notNull(),
  tierId: uuid("tier_id").notNull(),

  productSeats: integer("product_seats").notNull(),
  term: quoteTermEnum("term").notNull(),

  quoteDiscountPercent: numeric("quote_discount_percent", { precision: 6, scale: 4 }),

  // Snapshot so share URLs remain stable even if the catalog changes.
  breakdown: jsonb("breakdown").notNull(),
  totalUsd: numeric("total_usd", { precision: 12, scale: 2 }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quoteAddons = pgTable("quote_addons", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => features.id),
  model: addonPricingModelEnum("model").notNull(),
  seatCount: integer("seat_count"),
  fixedPricePerMonthUsd: numeric("fixed_price_per_month_usd", { precision: 12, scale: 2 }),
  perSeatPricePerMonthUsd: numeric("per_seat_price_per_month_usd", { precision: 12, scale: 2 }),
  percentOfProduct: numeric("percent_of_product", { precision: 6, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuoteBreakdown = {
  lineItems: Array<{
    key: string;
    label: string;
    formula: string;
    notes?: string;
    amountUsd: number;
  }>;
  subtotalUsd: number;
  quoteDiscountPercent?: number;
  quoteDiscountUsd?: number;
  totalUsd: number;
};


