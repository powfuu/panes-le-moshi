"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Banknote, Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";
import { Snowflake } from "./art/Decor";

const LINKS = [
  { href: "/#panes", label: "Nuestros panes" },
  { href: "/#historia", label: "Nuestra historia" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#zonas", label: "Zonas de entrega" },
  { href: "/seguimiento", label: "Seguir mi pedido" },
];

export function CartButton({ className = "" }: { className?: string }) {
  const { count, pulse, ready } = useCart();
  return (
    <Link
      href="/pedir"
      className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-poinsettia px-4 py-2.5 text-sm font-semibold text-masa shadow-[0_6px_20px_-6px_rgb(199_37_47/0.7)] transition hover:bg-poinsettia-deep active:scale-95 sm:px-5 ${className}`}
    >
      <motion.span key={`icon-${pulse}`} animate={pulse ? { rotate: [0, -18, 14, -8, 0] } : undefined} transition={{ duration: 0.6 }}>
        <ShoppingBag className="h-[18px] w-[18px]" />
      </motion.span>
      <span>Hacer pedido</span>
      <AnimatePresence>
        {ready && count > 0 && (
          <motion.span
            key={`badge-${count}`}
            initial={{ scale: 0.4, y: -6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
            className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-xs font-bold text-cocoa ring-2 ring-masa"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="relative z-40 bg-poinsettia text-masa">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-[0.8rem] font-medium sm:text-sm">
          <Banknote className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Pago <strong className="font-bold">únicamente en efectivo</strong> al recibir tu pedido
            <span className="hidden sm:inline"> en A Coruña, Arteixo y Carballo</span>
          </span>
        </p>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled ? "bg-masa/85 shadow-[0_8px_30px_-12px_rgb(43_22_16/0.25)] backdrop-blur-lg" : "bg-masa"
        }`}
      >
        <nav className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-all duration-500 sm:px-6 ${scrolled ? "py-2" : "py-3.5"}`}>
          <Logo />
          <ul className="hidden items-center gap-7 xl:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group relative whitespace-nowrap py-2 text-[0.95rem] text-cocoa/80 transition hover:text-cocoa">
                  {l.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-poinsettia transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <CartButton />
            </div>
            <Link
              href="/pedir"
              aria-label="Hacer pedido"
              className="relative grid h-11 w-11 place-items-center rounded-full bg-poinsettia text-masa sm:hidden"
            >
              <MobileCartBadge />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center rounded-full border border-cocoa/15 text-cocoa xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-pine text-masa xl:hidden"
            initial={{ clipPath: "circle(0% at 92% 6%)" }}
            animate={{ clipPath: "circle(150% at 92% 6%)" }}
            exit={{ clipPath: "circle(0% at 92% 6%)" }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div className="flex items-center justify-between px-4 py-3.5">
              <Logo light />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="grid h-11 w-11 place-items-center rounded-full border border-masa/25"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex flex-1 flex-col justify-center gap-2 px-7">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
                >
                  <Link href={l.href} onClick={() => setOpen(false)} className="block py-2 font-display text-[2rem] italic leading-tight">
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="px-6 pb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/pedir"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-poinsettia py-4 text-lg font-semibold"
              >
                <ShoppingBag className="h-5 w-5" /> Hacer pedido
              </Link>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-masa/70">
                <Banknote className="h-4 w-4" /> Pago únicamente en efectivo
              </p>
            </motion.div>
            <Snowflake className="pointer-events-none absolute -right-10 bottom-24 h-56 w-56 text-masa/5" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileCartBadge() {
  const { count, ready, pulse } = useCart();
  return (
    <>
      <motion.span key={`icon-${pulse}`} animate={pulse ? { rotate: [0, -18, 14, -8, 0] } : undefined} transition={{ duration: 0.6 }}>
        <ShoppingBag className="h-5 w-5" />
      </motion.span>
      {ready && count > 0 && (
        <motion.span
          key={`badge-${count}`}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 18 }}
          className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-cocoa ring-2 ring-masa"
        >
          {count}
        </motion.span>
      )}
    </>
  );
}
