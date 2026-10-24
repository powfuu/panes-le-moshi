"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  BellRing,
  CalendarDays,
  ChevronLeft,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDeliveryDate, formatEuros, slotShort, timeAgo } from "@/lib/format";
import { STATUS_FLOW, STATUS_META, statusIndex } from "@/lib/status";
import { errorMessage, getSupabase } from "@/lib/supabase";
import type { AdminOrder, OrderStatus } from "@/lib/types";
import { Logo } from "../Logo";

type Filter = "activos" | OrderStatus | "todos";

const PIN_STORAGE = "moshi:admin-pin";

type AdminResult = { ok: true; orders: AdminOrder[] } | { ok: false; reason: "invalid" | "locked" };

const REASON_TEXT = {
  invalid: "Clave incorrecta.",
  locked: "Demasiados intentos. Espera 15 minutos y vuelve a probar.",
};

function storedPin() {
  try {
    return localStorage.getItem(PIN_STORAGE);
  } catch {
    return null;
  }
}

export function AdminApp() {
  const [pin, setPin] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/set-state-in-effect -- la clave recordada solo existe en el navegador
  useEffect(() => setPin(storedPin()), []);

  if (pin === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-pine">
        <Loader2 className="h-8 w-8 animate-spin text-masa" />
      </div>
    );
  }
  if (!pin) {
    return (
      <PinScreen
        error={error}
        onUnlock={(p, remember) => {
          if (remember) {
            try {
              localStorage.setItem(PIN_STORAGE, p);
            } catch {}
          }
          setError("");
          setPin(p);
        }}
      />
    );
  }
  return (
    <Dashboard
      adminPin={pin}
      onDenied={(reason) => {
        try {
          localStorage.removeItem(PIN_STORAGE);
        } catch {}
        setError(REASON_TEXT[reason]);
        setPin(null);
      }}
      onExit={() => {
        try {
          localStorage.removeItem(PIN_STORAGE);
        } catch {}
        setPin(null);
      }}
    />
  );
}

function PinScreen({ error, onUnlock }: { error: string; onUnlock: (pin: string, remember: boolean) => void }) {
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(true);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState("");
  const shown = localError || error;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.length < 4) return;
    setChecking(true);
    setLocalError("");
    const { data, error: err } = await getSupabase().rpc("admin_list_orders", { p_pin: value });
    setChecking(false);
    if (err) return setLocalError(errorMessage(err));
    const res = data as AdminResult;
    if (!res.ok) {
      setValue("");
      return setLocalError(REASON_TEXT[res.reason]);
    }
    onUnlock(value, remember);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-pine px-4 py-10">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5 rounded-[32px] bg-masa p-7 shadow-2xl"
      >
        <Logo />
        <h1 className="font-display text-3xl font-semibold italic">Panel de pedidos</h1>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Clave de acceso</span>
          <motion.input
            key={shown}
            animate={shown ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
            transition={{ duration: 0.4 }}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={12}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            aria-invalid={Boolean(shown)}
            className="w-full rounded-2xl bg-white px-4 py-4 text-center font-display text-3xl tracking-[0.5em] ring-1 ring-cocoa/12 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-poinsettia"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-soft">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-pine" />
          Recordar en este dispositivo
        </label>
        {shown && (
          <p role="alert" className="rounded-xl bg-poinsettia/10 p-3 text-sm font-medium text-poinsettia">
            {shown}
          </p>
        )}
        <button
          disabled={checking || value.length < 4}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-poinsettia py-3.5 font-semibold text-masa transition disabled:opacity-50"
        >
          {checking && <Loader2 className="h-4 w-4 animate-spin" />} Entrar al panel
        </button>
      </motion.form>
    </div>
  );
}

/** Pequeño aviso sonoro para pedidos nuevos (sin archivos externos). */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1175, 1568].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.55);
    });
  } catch {}
}

function Dashboard({ adminPin, onDenied, onExit }: { adminPin: string; onDenied: (reason: "invalid" | "locked") => void; onExit: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("activos");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);
  const [confirming, setConfirming] = useState<{ title: string; body: string; action: string; run: () => void } | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const load = useCallback(async (notify = false) => {
    const { data, error } = await getSupabase().rpc("admin_list_orders", { p_pin: adminPin });
    setLoading(false);
    if (error || !data) return;
    const res = data as AdminResult;
    if (!res.ok) return onDenied(res.reason);
    const list = res.orders;
    if (notify) {
      const fresh = list.filter((o) => !knownIds.current.has(o.id));
      if (fresh.length) {
        chime();
        setToast(`Nuevo pedido ${fresh[0].code} de ${fresh[0].customer_name}`);
      }
    }
    knownIds.current = new Set(list.map((o) => o.id));
    setOrders(list);
  }, [adminPin, onDenied]);

  // Comprueba pedidos nuevos cada 10 s mientras el panel está a la vista.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(true), 10_000);
    const onVisible = () => document.visibilityState === "visible" && load(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: orders.length, activos: 0 };
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
      if (o.status !== "entregado" && o.status !== "cancelado") c.activos++;
    }
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = orders.filter((o) =>
      filter === "todos" ? true : filter === "activos" ? !["entregado", "cancelado"].includes(o.status) : o.status === filter,
    );
    if (q) {
      list = list.filter((o) =>
        [o.code, o.customer_name, o.phone, o.address].some((v) => v.toLowerCase().includes(q)),
      );
    }
    if (filter === "activos" || STATUS_FLOW.includes(filter as never)) {
      list = [...list].sort((a, b) =>
        a.delivery_date === b.delivery_date
          ? a.delivery_slot.localeCompare(b.delivery_slot)
          : a.delivery_date.localeCompare(b.delivery_date),
      );
    }
    return list;
  }, [orders, filter, query]);

  async function setStatus(order: AdminOrder, status: OrderStatus) {
    setBusyId(order.id);
    setActionError(null);
    const { data, error } = await getSupabase().rpc("admin_set_status", { p_pin: adminPin, p_order_id: order.id, p_status: status });
    setBusyId(null);
    const res = data as { ok: boolean; reason?: "invalid" | "locked" } | null;
    if (res && !res.ok && res.reason) return onDenied(res.reason);
    if (error) setActionError({ id: order.id, msg: errorMessage(error) });
    else setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "activos", label: "Activos" },
    ...STATUS_FLOW.map((s) => ({ key: s as Filter, label: STATUS_META[s].label })),
    { key: "cancelado", label: "Cancelados" },
    { key: "todos", label: "Todos" },
  ];

  return (
    <div className="paper min-h-screen">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-masa/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={() => load()} aria-label="Actualizar" className="grid h-10 w-10 place-items-center rounded-full hover:bg-cocoa/5">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setConfirming({
                  title: "¿Cerrar el panel?",
                  body: "Se cerrará en este dispositivo. Para volver a entrar tendrás que escribir la clave.",
                  action: "Cerrar panel",
                  run: onExit,
                })
              }
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-cocoa/5"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Cerrar panel</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-4xl font-semibold italic">Pedidos</h1>
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código, nombre, teléfono…"
              aria-label="Buscar pedidos"
              className="w-full rounded-full bg-white py-3 pl-11 pr-4 ring-1 ring-cocoa/12"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                filter === f.key ? "text-masa" : "bg-white/70 text-cocoa/70 ring-1 ring-cocoa/10 hover:text-cocoa"
              }`}
            >
              {filter === f.key && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-pine" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">
                {f.label} <span className="tabular-nums opacity-70">{counts[f.key] ?? 0}</span>
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-72 rounded-[28px]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-16 text-center text-cocoa-soft">No hay pedidos en esta vista.</p>
        ) : (
          <motion.ul layout className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {visible.map((o) => (
                <AdminOrderCard
                  key={o.id}
                  order={o}
                  busy={busyId === o.id}
                  error={actionError?.id === o.id ? actionError.msg : undefined}
                  onStatus={(s) => setStatus(o, s)}
                  onCancel={() =>
                    setConfirming({
                      title: `¿Cancelar el pedido ${o.code}?`,
                      body: `El pedido de ${o.customer_name} quedará cancelado y no se podrá recuperar.`,
                      action: "Sí, cancelar",
                      run: () => setStatus(o, "cancelado"),
                    })
                  }
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-poinsettia p-4 text-masa shadow-2xl"
            role="status"
          >
            <BellRing className="h-5 w-5 shrink-0" />
            <p className="flex-1 font-semibold">{toast}</p>
            <button onClick={() => setToast(null)} aria-label="Cerrar aviso">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirming && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa/50 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirming(null)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full max-w-sm rounded-t-[32px] bg-masa p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[32px]"
            >
              <h2 id="confirm-title" className="font-display text-2xl font-semibold italic">
                {confirming.title}
              </h2>
              <p className="mt-2 text-cocoa-soft">{confirming.body}</p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button autoFocus onClick={() => setConfirming(null)} className="rounded-full bg-cocoa/8 py-3.5 font-semibold">
                  Volver
                </button>
                <button
                  onClick={() => {
                    const run = confirming.run;
                    setConfirming(null);
                    run();
                  }}
                  className="rounded-full bg-poinsettia py-3.5 font-semibold text-masa"
                >
                  {confirming.action}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ZONE_NAMES: Record<string, string> = { "a-coruna": "A Coruña", arteixo: "Arteixo", carballo: "Carballo" };

function AdminOrderCard({
  order,
  busy,
  error,
  onStatus,
  onCancel,
}: {
  order: AdminOrder;
  busy: boolean;
  error?: string;
  onStatus: (s: OrderStatus) => void;
  onCancel: () => void;
}) {
  const idx = statusIndex(order.status);
  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  const prev = idx > 0 && order.status !== "entregado" ? STATUS_FLOW[idx - 1] : null;
  const meta = STATUS_META[order.status];
  const Icon = meta.icon;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address}, ${ZONE_NAMES[order.zone_slug] ?? ""}`)}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex flex-col rounded-[28px] bg-white/85 p-5 ring-1 ring-cocoa/8 ${order.status === "cancelado" ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold italic">{order.code}</p>
          <p className="text-xs text-cocoa/50">Recibido {timeAgo(order.created_at)}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            order.status === "procesando"
              ? "bg-poinsettia text-masa"
              : order.status === "entregado"
                ? "bg-pine text-masa"
                : order.status === "cancelado"
                  ? "bg-cocoa/10 text-cocoa"
                  : "bg-gold/30 text-cocoa"
          }`}
        >
          <Icon className="h-3.5 w-3.5" /> {meta.label}
        </span>
      </div>

      {/* Progreso compacto */}
      {order.status !== "cancelado" && (
        <div className="mt-4 flex gap-1">
          {STATUS_FLOW.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= idx ? "bg-poinsettia" : "bg-cocoa/10"}`} />
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2 text-sm">
        <p className="text-base font-semibold">{order.customer_name}</p>
        <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-pine underline-offset-4 hover:underline">
          <Phone className="h-4 w-4" /> {order.phone}
        </a>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-cocoa-soft hover:text-cocoa">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {order.address}, {ZONE_NAMES[order.zone_slug] ?? order.zone_slug}
            {order.address_notes && <span className="block text-xs text-cocoa/50">{order.address_notes}</span>}
          </span>
        </a>
        <p className="flex items-center gap-2 font-semibold">
          <CalendarDays className="h-4 w-4" /> {formatDeliveryDate(order.delivery_date)}, {slotShort[order.delivery_slot].toLowerCase()}
        </p>
      </div>

      <ul className="mt-4 space-y-1 rounded-2xl bg-masa-deep/60 p-3 text-sm">
        {order.order_items.map((it) => (
          <li key={it.product_name}>
            <span className="font-semibold text-poinsettia">{it.quantity}×</span> {it.product_name}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm text-cocoa-soft">
          <Banknote className="h-4 w-4" /> Efectivo
          {order.cash_change_for_cents && (
            <span className="text-xs">(paga con {formatEuros(order.cash_change_for_cents)}, cambio {formatEuros(order.cash_change_for_cents - order.total_cents)})</span>
          )}
        </span>
        <span className="font-display text-2xl font-semibold tabular-nums">{formatEuros(order.total_cents)}</span>
      </div>

      {order.notes && (
        <p className="mt-3 flex gap-2 rounded-2xl bg-gold/15 p-3 text-sm">
          <StickyNote className="h-4 w-4 shrink-0" /> {order.notes}
        </p>
      )}

      {error && <p className="mt-3 rounded-xl bg-poinsettia/10 p-3 text-sm font-medium text-poinsettia">{error}</p>}

      {(next || prev || order.status === "procesando") && (
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {next && (
            <button
              disabled={busy}
              onClick={() => onStatus(next)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-pine px-4 py-3 text-sm font-semibold text-masa transition hover:bg-pine-soft active:scale-[0.97] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Pasar a «{STATUS_META[next].label}»
            </button>
          )}
          {prev && (
            <button
              disabled={busy}
              onClick={() => onStatus(prev)}
              aria-label={`Volver a ${STATUS_META[prev].label}`}
              title={`Volver a «${STATUS_META[prev].label}»`}
              className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-cocoa/15 hover:bg-cocoa/5 disabled:opacity-60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {order.status === "procesando" && (
            <button
              disabled={busy}
              onClick={onCancel}
              className="rounded-full px-4 py-3 text-sm font-semibold text-poinsettia ring-1 ring-poinsettia/40 hover:bg-poinsettia/5 disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </motion.li>
  );
}
