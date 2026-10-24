"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { STATUS_META } from "@/lib/status";
import type { OrderStatus } from "@/lib/types";
import { Snowflake } from "../art/Decor";

/** Icono grande del estado actual con una animación propia para cada paso. */
export function StatusVisual({ status }: { status: OrderStatus }) {
  const reduce = useReducedMotion();
  const Icon = STATUS_META[status].icon;
  const loop = reduce ? 0 : Infinity;

  return (
    <div className="relative grid h-32 w-32 shrink-0 place-items-center sm:h-36 sm:w-36">
      {status === "procesando" && (
        <motion.span
          className="absolute inset-0 rounded-full border-[3px] border-dashed border-gold/70"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: loop, ease: "linear" }}
        />
      )}
      {status === "en_preparacion" &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute top-0 h-8 w-1.5 rounded-full bg-masa/50"
            style={{ left: `${36 + i * 14}%` }}
            animate={{ y: [10, -18], opacity: [0, 0.9, 0], scaleY: [0.6, 1.2] }}
            transition={{ duration: 1.8, repeat: loop, delay: i * 0.45, ease: "easeOut" }}
          />
        ))}
      {status === "listo" &&
        [0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute text-gold"
            style={{ top: `${[4, 10, 70, 76][i]}%`, left: `${[12, 78, 6, 82][i]}%` }}
            animate={{ scale: [0, 1, 0], rotate: [0, 90] }}
            transition={{ duration: 2, repeat: loop, delay: i * 0.5 }}
          >
            <Snowflake className="h-5 w-5" />
          </motion.span>
        ))}
      {status === "en_reparto" && (
        <span className="absolute inset-x-0 bottom-5 h-0.5 overflow-hidden rounded-full bg-masa/15">
          <motion.span
            className="block h-full w-1/3 rounded-full bg-gold"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.4, repeat: loop, ease: "linear" }}
          />
        </span>
      )}
      {status === "entregado" && (
        <motion.span
          className="absolute inset-0 rounded-full bg-gold/30"
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: loop }}
        />
      )}

      <AnimatePresence mode="popLayout">
        <motion.span
          key={status}
          initial={{ scale: 0.3, rotate: -40, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className={`relative grid h-24 w-24 place-items-center rounded-full sm:h-28 sm:w-28 ${
            status === "cancelado" ? "bg-masa/15 text-masa/80" : "bg-masa text-pine"
          }`}
        >
          <motion.span
            animate={
              status === "en_reparto" && !reduce
                ? { x: [-3, 3, -3], y: [0, -2, 0] }
                : status === "listo" && !reduce
                  ? { rotate: [-6, 6, -6] }
                  : undefined
            }
            transition={{ duration: status === "en_reparto" ? 0.5 : 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="h-11 w-11 sm:h-12 sm:w-12" strokeWidth={1.6} />
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
