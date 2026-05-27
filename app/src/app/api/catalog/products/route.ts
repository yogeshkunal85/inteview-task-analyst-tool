import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

export async function GET() {
  const rows = await db.select({ id: products.id, name: products.name }).from(products);
  return NextResponse.json({ products: rows });
}

