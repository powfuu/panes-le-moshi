"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { formatEuros } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PanIllustration } from "./art/PanIllustration";

export function QtyStepper({ product, size = "md" }: { product: Product; size?: "sm" | "md" }) {
  const { lines, add } = useCart();
  const qty = lines[product.id] ?? 0;
  const btn = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className="inline-flex items-center rounded-full bg-pine p-1 text-masa">
      <button
        type="button"
        onClick={() => add(product.id, -1)}
        aria-label={`Quitar un ${product.name}`}
        className={`${btn} grid place-items-center rounded-full transition hover:bg-pine-soft active:scale-90`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="relative w-8 overflow-hidden text-center font-display text-lg font-semibold tabular-nums" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={qty}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="block"
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        onClick={() => add(product.id, 1)}
        disabled={qty >= product.max_per_order}
        aria-label={`Añadir otro ${product.name}`}
        className={`${btn} grid place-items-center rounded-full transition hover:bg-pine-soft active:scale-90 disabled:opacity-40`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductGrid() {
  const { products } = useCatalog();
  if (products.length === 0) {
    return (
      <p className="rounded-2xl bg-white/70 p-8 text-center text-cocoa-soft">
        Estamos actualizando la carta. Vuelve en unos minutos.
      </p>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { lines, add, ready } = useCart();
  const qty = lines[product.id] ?? 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-[28px] bg-white/70 p-4 ring-1 ring-cocoa/8 transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgb(43_22_16/0.45)]"
    >
      <div className="relative overflow-hidden rounded-[22px] bg-masa-deep">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(70% 60% at 50% 70%, #fff7e6, transparent)" }}
        />
        <PanIllustration
          variant={product.variant}
          className="relative aspect-[44/26] w-full transition-transform duration-700 ease-out group-hover:-rotate-2 group-hover:scale-[1.06]"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-poinsettia px-3 py-1 text-xs font-semibold text-masa shadow">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
        <h3 className="font-display text-[1.45rem] font-semibold italic leading-tight">{product.name}</h3>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-cocoa-soft">{product.description}</p>
        {product.weight_label && <p className="mt-2 text-sm text-papelon">{product.weight_label}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="font-display text-2xl font-semibold tabular-nums">{formatEuros(product.price_cents)}</p>
          {ready && qty > 0 ? (
            <QtyStepper product={product} />
          ) : (
            <button
              type="button"
              onClick={() => add(product.id, 1)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-poinsettia px-5 font-semibold text-masa transition hover:bg-poinsettia-deep active:scale-95"
            >
              <Plus className="h-4 w-4" /> Añadir
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
