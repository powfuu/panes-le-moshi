"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type CartLines = Record<string, number>; // productId -> cantidad

type CartContextValue = {
  lines: CartLines;
  count: number;
  ready: boolean;
  setQty: (productId: string, qty: number) => void;
  add: (productId: string, delta?: number) => void;
  clear: () => void;
  /** Último producto añadido, para animaciones del carrito. */
  pulse: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "moshi:cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLines>({});
  const [ready, setReady] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratar desde localStorage
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }, []);

  const add = useCallback((productId: string, delta = 1) => {
    setLines((prev) => {
      const qty = (prev[productId] ?? 0) + delta;
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
    if (delta > 0) setPulse((p) => p + 1);
  }, []);

  const clear = useCallback(() => setLines({}), []);

  const count = useMemo(() => Object.values(lines).reduce((a, b) => a + b, 0), [lines]);

  const value = useMemo(
    () => ({ lines, count, ready, setQty, add, clear, pulse }),
    [lines, count, ready, setQty, add, clear, pulse],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
