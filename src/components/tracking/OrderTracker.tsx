"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  Check,
  Copy,
  Loader2,
  Lock,
  MapPin,
  PartyPopper,
  RefreshCw,
  Share2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { celebrate } from "@/lib/confetti";
import { formatDeliveryDate, formatEuros, slotLabel, timeAgo } from "@/lib/format";
import { saveOrder } from "@/lib/my-orders";
import { STATUS_META } from "@/lib/status";
import { errorMessage, getSupabase } from "@/lib/supabase";
import type { PublicOrder } from "@/lib/types";
import { LookupForm } from "./LookupForm";
import { StatusTimeline } from "./StatusTimeline";
import { StatusVisual } from "./StatusVisual";

const POLL_MS = 10_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ticket en la URL: /pedido/?c=LM-XXXXXX&t=<token> (página estática, todo ocurre en el navegador). */
export function OrderTracker() {
  const sp = useSearchParams();
  const code = (sp.get("c") ?? "").toUpperCase();
  const rawToken = sp.get("t");
  const token = rawToken && UUID.test(rawToken) ? rawToken : null;
  // Se fija al abrir: el parámetro «nuevo» se quita de la URL justo después.
  const [isNew] = useState(() => sp.get("nuevo") === "1");

  if (!token) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-[28px] bg-white/80 p-6 ring-1 ring-cocoa/8 sm:p-8">
          <h1 className="font-display text-3xl font-semibold italic">Busca tu pedido</h1>
          <p className="mb-6 mt-2 text-cocoa-soft">Por seguridad, confirma el teléfono con el que hiciste el pedido.</p>
          <LookupForm initialCode={code} />
        </div>
      </Shell>
    );
  }
  return <Tracker code={code} token={token} isNew={isNew} />;
}

function Tracker({ code, token, isNew }: { code: string; token: string; isNew: boolean }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [lastSync, setLastSync] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [, forceTick] = useState(0);
  const prevStatus = useRef<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await getSupabase().rpc("get_order", { p_code: code, p_token: token });
    setRefreshing(false);
    if (error) {
      setState((s) => (s === "ready" ? s : "error"));
      return;
    }
    if (!data) {
      setState("notfound");
      return;
    }
    const next = data as PublicOrder;
    if (prevStatus.current && prevStatus.current !== next.status && next.status === "entregado") celebrate();
    prevStatus.current = next.status;
    setOrder(next);
    setState("ready");
    setLastSync(new Date().toISOString());
  }, [code, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    load();
    saveOrder({ code, token, createdAt: new Date().toISOString() });
    if (isNew) {
      const url = new URL(window.location.href);
      url.searchParams.delete("nuevo");
      window.history.replaceState(null, "", url);
    }
  }, [load, code, token, isNew]);

  // Actualización periódica mientras el pedido siga vivo.
  const finished = order?.status === "entregado" || order?.status === "cancelado";
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    const tick = setInterval(() => forceTick((n) => n + 1), 15_000);
    return () => {
      clearInterval(id);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [finished, load]);

  if (state === "loading") return <TrackerSkeleton />;
  if (state === "notfound" || state === "error" || !order) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-[28px] bg-white/80 p-6 text-center ring-1 ring-cocoa/8 sm:p-8">
          <h1 className="font-display text-3xl font-semibold italic">
            {state === "error" ? "No hemos podido cargar el pedido" : "No encontramos este pedido"}
          </h1>
          <p className="mt-3 text-cocoa-soft">
            {state === "error"
              ? "Comprueba tu conexión e inténtalo de nuevo."
              : "El enlace no es correcto o está incompleto. Búscalo con tu número de ticket y teléfono."}
          </p>
          {state === "error" ? (
            <button onClick={load} className="mt-6 rounded-full bg-pine px-6 py-3 font-semibold text-masa">
              Reintentar
            </button>
          ) : (
            <Link href="/seguimiento" className="mt-6 inline-block rounded-full bg-pine px-6 py-3 font-semibold text-masa">
              Buscar mi pedido
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  const meta = STATUS_META[order.status];
  const firstName = order.customer_name.split(" ")[0];

  return (
    <Shell>
      <AnimatePresence>{isNew && <NewOrderBanner name={firstName} />}</AnimatePresence>

      <div className="ticket relative flex flex-col gap-4 bg-white px-7 py-6 shadow-[0_20px_40px_-24px_rgb(43_22_16/0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <p className="text-sm text-cocoa-soft">Ticket de {firstName}</p>
          <h1 className="mt-1 font-display text-[clamp(2.4rem,8vw,3.6rem)] font-semibold italic leading-none tracking-wide">{order.code}</h1>
          <p className="mt-2 text-xs text-cocoa/55">Con este ticket sigues tu pedido sin registrarte.</p>
        </div>
        <ShareActions code={order.code} />
      </div>

      {/* Estado actual */}
      <motion.section
        layout
        aria-live="polite"
        className={`relative mt-6 overflow-hidden rounded-[32px] p-6 text-masa sm:p-10 ${order.status === "cancelado" ? "bg-cocoa" : "bg-pine"}`}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 80% at 90% 10%, rgb(226 182 92 / 0.25), transparent 70%)" }}
        />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <StatusVisual status={order.status} />
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={order.status}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm font-semibold text-gold">{meta.label}</p>
                <h2 className="mt-1 font-display text-[clamp(2rem,6vw,3rem)] font-semibold italic leading-[1.05]">{meta.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-masa/80 sm:mx-0">{meta.description}</p>
              </motion.div>
            </AnimatePresence>
            {!["entregado", "cancelado"].includes(order.status) && (
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-masa/60">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Se actualiza solo. Última comprobación {lastSync ? timeAgo(lastSync) : ""}
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {order.status !== "cancelado" && (
        <section className="mt-6 rounded-[28px] bg-white/80 p-5 ring-1 ring-cocoa/8 sm:p-8">
          <h2 className="sr-only">Progreso del pedido</h2>
          <StatusTimeline order={order} />
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-[28px] bg-white/80 p-5 ring-1 ring-cocoa/8 sm:p-8">
          <h2 className="font-display text-2xl font-semibold italic">Tu pedido</h2>
          <ul className="mt-4 divide-y divide-cocoa/8">
            {order.items.map((it) => (
              <li key={it.product_name} className="flex justify-between gap-4 py-2.5">
                <span>
                  <span className="font-semibold text-poinsettia tabular-nums">{it.quantity}×</span> {it.product_name}
                </span>
                <span className="tabular-nums">{formatEuros(it.line_total_cents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-cocoa/10 pt-3 text-sm text-cocoa-soft">
            <div className="flex justify-between">
              <dt>Entrega</dt>
              <dd>{order.delivery_fee_cents ? formatEuros(order.delivery_fee_cents) : "Sin coste"}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-display text-3xl font-semibold tabular-nums">{formatEuros(order.total_cents)}</span>
          </div>

          <div className="mt-6 space-y-3 text-[0.95rem]">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pine" />
              <span>
                {order.address}, {order.zone.name}
                {order.address_notes && <span className="block text-sm text-cocoa/60">{order.address_notes}</span>}
              </span>
            </p>
            <p className="flex gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-pine" />
              <span>
                {formatDeliveryDate(order.delivery_date)}
                <span className="block text-sm text-cocoa/60">{slotLabel[order.delivery_slot]}</span>
              </span>
            </p>
            {order.notes && <p className="rounded-2xl bg-masa-deep/60 p-3 text-sm text-cocoa-soft">“{order.notes}”</p>}
          </div>
        </section>

        <div className="space-y-6">
          {order.status !== "cancelado" && (
            <section className="relative overflow-hidden rounded-[28px] bg-poinsettia p-6 text-masa">
              <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-masa/40" />
              <div className="relative">
                <Banknote className="h-7 w-7" />
                <h2 className="mt-2 font-display text-2xl font-semibold italic leading-tight">
                  {order.status === "entregado" ? "Pagado en efectivo" : "Ten preparado el efectivo"}
                </h2>
                <p className="mt-1 text-masa/90">
                  {order.status === "entregado"
                    ? `Total: ${formatEuros(order.total_cents)}.`
                    : `Pagarás ${formatEuros(order.total_cents)} en efectivo al recibir el pedido. Es la única forma de pago.`}
                </p>
                {order.cash_change_for_cents && order.status !== "entregado" && (
                  <p className="mt-3 rounded-xl bg-masa/15 p-3 text-sm">
                    Pagarás con {formatEuros(order.cash_change_for_cents)}: te llevamos{" "}
                    {formatEuros(order.cash_change_for_cents - order.total_cents)} de cambio.
                  </p>
                )}
              </div>
            </section>
          )}

          <CancelArea order={order} code={code} token={token} onDone={load} />
        </div>
      </div>
    </Shell>
  );
}

function CancelArea({ order, code, token, onDone }: { order: PublicOrder; code: string; token: string; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (order.status === "cancelado") {
    return (
      <section className="rounded-[28px] bg-white/80 p-6 ring-1 ring-cocoa/8">
        <h2 className="font-display text-xl font-semibold italic">Pedido cancelado</h2>
        <p className="mt-1 text-sm text-cocoa-soft">No se preparará ni se cobrará nada.</p>
        <Link href="/pedir" className="mt-4 inline-block rounded-full bg-poinsettia px-5 py-3 font-semibold text-masa">
          Hacer un pedido nuevo
        </Link>
      </section>
    );
  }

  if (order.status !== "procesando") {
    if (order.status === "entregado") return null;
    return (
      <section className="flex gap-3 rounded-[28px] bg-white/80 p-6 text-sm ring-1 ring-cocoa/8">
        <Lock className="h-5 w-5 shrink-0 text-cocoa/50" />
        <p className="text-cocoa-soft">
          Tu pedido ya está en marcha. A partir de «En preparación» no es posible cancelarlo.
        </p>
      </section>
    );
  }

  async function cancel() {
    setBusy(true);
    setError("");
    const { error: err } = await getSupabase().rpc("cancel_order", { p_code: code, p_token: token, p_reason: reason || null });
    setBusy(false);
    if (err) {
      setError(errorMessage(err));
      await onDone();
      return;
    }
    setOpen(false);
    await onDone();
  }

  return (
    <section className="rounded-[28px] bg-white/80 p-6 ring-1 ring-cocoa/8">
      <h2 className="font-display text-xl font-semibold italic">¿Necesitas cancelarlo?</h2>
      <p className="mt-1 text-sm text-cocoa-soft">
        Solo puedes cancelar mientras esté en «Procesando pedido». En cuanto empecemos a prepararlo ya no será posible.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-full border-2 border-poinsettia/80 px-5 py-3 font-semibold text-poinsettia transition hover:bg-poinsettia hover:text-masa"
      >
        Cancelar pedido
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full max-w-md rounded-t-[32px] bg-masa p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[32px] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 id="cancel-title" className="font-display text-2xl font-semibold italic">
                  ¿Cancelar el pedido <span className="whitespace-nowrap">{code}</span>?
                </h3>
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-cocoa/5">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-cocoa-soft">No prepararemos tus panes. Esta acción no se puede deshacer.</p>
              <label className="mt-5 block text-sm font-semibold" htmlFor="reason">
                Cuéntanos el motivo <span className="font-normal text-cocoa/50">(opcional)</span>
              </label>
              <textarea
                id="reason"
                rows={2}
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-white px-4 py-3 ring-1 ring-cocoa/12 focus:outline-none focus:ring-2 focus:ring-pine"
              />
              {error && <p className="mt-3 rounded-xl bg-poinsettia/10 p-3 text-sm font-medium text-poinsettia">{error}</p>}
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button onClick={() => setOpen(false)} className="rounded-full bg-pine py-3.5 font-semibold text-masa">
                  Mantener pedido
                </button>
                <button
                  onClick={cancel}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-poinsettia py-3.5 font-semibold text-masa disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sí, cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ShareActions({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- capacidad del navegador
  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex gap-2">
      <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-cocoa/10 transition hover:ring-cocoa/25">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={copied ? "y" : "n"} initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
            {copied ? <Check className="h-4 w-4 text-pine" /> : <Copy className="h-4 w-4" />}
          </motion.span>
        </AnimatePresence>
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
      {canShare && (
        <button
          onClick={() => navigator.share({ title: `Pedido ${code}`, url: window.location.href }).catch(() => {})}
          aria-label="Compartir enlace del pedido"
          className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-cocoa/10"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function NewOrderBanner({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="mb-8 flex gap-4 rounded-[28px] bg-gold/25 p-5 ring-1 ring-gold/50 sm:p-6"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-cocoa">
        <PartyPopper className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold italic">¡Gracias, {name}! Pedido recibido</p>
        <p className="mt-1 text-cocoa-soft">
          Este es tu ticket: guarda esta página y verás cada paso de tu pedido. También lo encontrarás en «Seguir mi pedido» desde este
          dispositivo.
        </p>
      </div>
    </motion.div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper min-h-[70vh] py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">{children}</div>
    </div>
  );
}

export function TrackerSkeleton() {
  return (
    <Shell>
      <div className="skeleton h-5 w-32 rounded-full" />
      <div className="skeleton mt-3 h-12 w-64 rounded-2xl" />
      <div className="skeleton mt-6 h-56 rounded-[32px]" />
      <div className="skeleton mt-6 h-28 rounded-[28px]" />
    </Shell>
  );
}
