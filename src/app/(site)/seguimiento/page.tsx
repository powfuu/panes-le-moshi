"use client";

import { motion } from "framer-motion";
import { MyOrders } from "@/components/tracking/MyOrders";
import { LookupForm } from "@/components/tracking/LookupForm";

const ease = [0.22, 1, 0.36, 1] as const;

export default function TrackingLookupPage() {
  return (
    <div className="paper min-h-[70vh] py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <h1 className="font-display text-[clamp(2.4rem,7vw,3.6rem)] font-semibold italic leading-none">Seguir mi pedido</h1>
          <p className="mb-8 mt-3 max-w-sm text-lg text-cocoa-soft">
            Escribe tu número de ticket y el teléfono que usaste. No hace falta registrarse.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="rounded-[28px] bg-white/80 p-5 ring-1 ring-cocoa/8 sm:p-7"
          >
            <LookupForm />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
        >
          <MyOrders />
        </motion.div>
      </div>
    </div>
  );
}
