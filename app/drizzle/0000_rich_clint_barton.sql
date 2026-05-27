CREATE TYPE "public"."addon_pricing_model" AS ENUM('fixed_per_month', 'per_seat_per_month', 'percent_of_product');--> statement-breakpoint
CREATE TYPE "public"."feature_tier_mode" AS ENUM('included', 'addon', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."quote_term" AS ENUM('monthly', 'annual', 'two_year');--> statement-breakpoint
CREATE TABLE "addon_pricing" (
	"feature_id" uuid NOT NULL,
	"tier_id" uuid NOT NULL,
	"model" "addon_pricing_model" NOT NULL,
	"fixed_price_per_month_usd" numeric(12, 2),
	"per_seat_price_per_month_usd" numeric(12, 2),
	"percent_of_product" numeric(6, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addon_pricing_feature_id_tier_id_pk" PRIMARY KEY("feature_id","tier_id")
);
--> statement-breakpoint
CREATE TABLE "feature_tier_availability" (
	"feature_id" uuid NOT NULL,
	"tier_id" uuid NOT NULL,
	"mode" "feature_tier_mode" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_tier_availability_feature_id_tier_id_pk" PRIMARY KEY("feature_id","tier_id")
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"model" "addon_pricing_model" NOT NULL,
	"seat_count" integer,
	"fixed_price_per_month_usd" numeric(12, 2),
	"per_seat_price_per_month_usd" numeric(12, 2),
	"percent_of_product" numeric(6, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_token" text NOT NULL,
	"name" text NOT NULL,
	"customer_label" text NOT NULL,
	"product_id" uuid NOT NULL,
	"tier_id" uuid NOT NULL,
	"product_seats" integer NOT NULL,
	"term" "quote_term" NOT NULL,
	"quote_discount_percent" numeric(6, 4),
	"breakdown" jsonb NOT NULL,
	"total_usd" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"base_price_per_seat_per_month_usd" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addon_pricing" ADD CONSTRAINT "addon_pricing_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_pricing" ADD CONSTRAINT "addon_pricing_tier_id_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_tier_availability" ADD CONSTRAINT "feature_tier_availability_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_tier_availability" ADD CONSTRAINT "feature_tier_availability_tier_id_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_addons" ADD CONSTRAINT "quote_addons_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_addons" ADD CONSTRAINT "quote_addons_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiers" ADD CONSTRAINT "tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;