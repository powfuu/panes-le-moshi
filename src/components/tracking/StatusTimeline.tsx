"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { STATUS_FLOW, STATUS_META, statusIndex } from "@/lib/status";
import type { PublicOrder } from "@/lib/types";

export function StatusTimeline({ order }: { order: PublicOrder }) {
  const current = statusIndex(order.status);
  const cancelled = order.status === "cancelado";
  const progress = cancelled ? 0 : current / (STATUS_FLOW.length - 1);
  const when = (s: string) => [...order.history].reverse().find((h) => h.status === s)?.changed_at;

  return (
    <div className="relative">
      {/* Barra de progreso (escritorio) */}
      <div className="absolute left-[10%] right-[10%] top-[22px] hidden h-1.5 rounded-full bg-cocoa/10 sm:block">
        <motion.div
          className="candy h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {/* Barra de progreso (móvil, vertical) */}
      <div className="absolute bottom-6 left-[21px] top-6 w-1.5 rounded-full bg-cocoa/10 sm:hidden">
        <motion.div
          className="candy w-full rounded-full"
          initial={{ height: 0 }}
          animate={{ height: `${progress * 100}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="relative grid gap-5 sm:grid-cols-5 sm:gap-2">
        {STATUS_FLOW.map((s, i) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const done = !cancelled && i < current;
          const active = !cancelled && i === current;
          const at = when(s);
          return (
            <li key={s} className="flex items-center gap-4 sm:flex-col sm:gap-2 sm:text-center">
              <span className="relative">
                {active && order.status !== "entregado" && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-poinsettia"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
                <motion.span
                  initial={false}
                  animate={{ scale: active ? 1.08 : 1 }}
                  className={`relative grid h-12 w-12 place-items-center rounded-full ring-4 ring-masa transition-colors duration-500 ${
                    active ? "bg-poinsettia text-masa" : done ? "bg-pine text-masa" : "bg-masa-deep text-cocoa/35"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
                </motion.span>
              </span>
              <div className="min-w-0">
                <p className={`text-[0.95rem] font-semibold leading-tight ${active ? "text-poinsettia" : done ? "text-cocoa" : "text-cocoa/40"}`}>
                  {meta.label}
                </p>
                {at && (done || active) && <p className="mt-0.5 text-xs text-cocoa/55">{formatDateTime(at)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
