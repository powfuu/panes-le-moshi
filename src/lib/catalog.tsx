"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Catalog } from "./data";
import { getSupabase } from "./supabase";
import type { Product, Zone } from "./types";

const CatalogContext = createContext<Catalog>({ products: [], zones: [] });

/**
 * La carta llega incluida en la página (compilada) y se refresca desde Supabase al abrirla,
 * así un cambio de precio se ve al momento sin volver a publicar la web.
 */
export function CatalogProvider({ initial, children }: { initial: Catalog; children: React.ReactNode }) {
  const [catalog, setCatalog] = useState(initial);

  useEffect(() => {
    const sb = getSupabase();
    Promise.all([
      sb
        .from("products")
        .select("id, slug, name, description, price_cents, weight_label, badge, variant, max_per_order")
        .eq("active", true)
        .order("sort_order"),
      sb.from("delivery_zones").select("slug, name, delivery_fee_cents, min_order_cents").eq("active", true).order("sort_order"),
    ]).then(([p, z]) => {
      if (p.error || z.error || !p.data || !z.data) return;
      setCatalog({ products: p.data as Product[], zones: z.data as Zone[] });
    });
  }, []);

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
