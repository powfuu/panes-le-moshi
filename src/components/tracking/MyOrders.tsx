"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDeliveryDate, formatEuros } from "@/lib/format";
import { getSavedOrders, trackingPath, type SavedOrder } from "@/lib/my-orders";
import { STATUS_META } from "@/lib/status";
import { getSupabase } from "@/lib/supabase";
import type { PublicOrder } from "@/lib/types";

type Row = SavedOrder & { order?: PublicOrder | null };

/** Pedidos hechos desde este dispositivo, con su estado actual. */
export function MyOrders() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const saved = getSavedOrders();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage
    setRows(saved);
    if (!saved.length) return;
    Promise.all(
      saved.map(async (s) => {
        const { data } = await getSupabase().rpc("get_order", { p_code: s.code, p_token: s.token });
        return { ...s, order: (data as PublicOrder) ?? null };
      }),
    ).then((list) => setRows(list.filter((r) => r.order)));
  }, []);

  if (!rows || rows.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold italic lg:mt-2">En este dispositivo</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((r, i) => {
          const o = r.order;
          const meta = o ? STATUS_META[o.status] : null;
          const Icon = meta?.icon;
          return (
            <motion.li key={r.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link
                href={trackingPath(r.code, r.token)}
                className="group flex items-center gap-4 rounded-[24px] bg-white/80 p-4 ring-1 ring-cocoa/8 transition hover:ring-pine/40"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                    o?.status === "cancelado" ? "bg-cocoa/10 text-cocoa/50" : o?.status === "entregado" ? "bg-pine text-masa" : "bg-poinsettia text-masa"
                  }`}
                >
                  {Icon ? <Icon className="h-5 w-5" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold italic">{r.code}</span>
                  {o ? (
                    <span className="block truncate text-sm text-cocoa-soft">
                      {meta?.label}, {formatDeliveryDate(o.delivery_date).toLowerCase()}, {formatEuros(o.total_cents)}
                    </span>
                  ) : (
                    <span className="skeleton mt-1 block h-4 w-40 rounded-full" />
                  )}
                </span>
                <ChevronRight className="h-5 w-5 text-cocoa/40 transition group-hover:translate-x-1" />
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
