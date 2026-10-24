import { getServerSupabase } from "./supabase";
import type { Product, Zone } from "./types";

export type Catalog = { products: Product[]; zones: Zone[] };

/** Carta y zonas. Las páginas que la usan se regeneran cada minuto (`revalidate = 60`). */
export async function getCatalog(): Promise<Catalog> {
  const supabase = getServerSupabase();
  const [products, zones] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name, description, price_cents, weight_label, badge, variant, max_per_order")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("delivery_zones")
      .select("slug, name, delivery_fee_cents, min_order_cents")
      .eq("active", true)
      .order("sort_order"),
  ]);

  return {
    products: (products.data ?? []) as Product[],
    zones: (zones.data ?? []) as Zone[],
  };
}
