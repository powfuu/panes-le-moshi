"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Check,
  Loader2,
  MapPin,
  Moon,
  Plus,
  ShoppingBag,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { celebrate } from "@/lib/confetti";
import { formatDeliveryDate, formatEuros, localISODate, normalizePhone } from "@/lib/format";
import { saveOrder, trackingPath } from "@/lib/my-orders";
import { errorMessage, getSupabase } from "@/lib/supabase";
import type { DeliverySlot, Product } from "@/lib/types";
import { PanIllustration } from "../art/PanIllustration";
import { QtyStepper } from "../ProductCard";
import { Field } from "../ui/Field";

const STEPS = ["Tus panes", "Entrega", "Confirmar"] as const;

/** Lleva la vista al primer campo con error (útil sobre todo en móvil). */
function scrollToFirstError() {
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 60);
}
const CUSTOMER_KEY = "moshi:customer";

type Form = {
  zone: string;
  address: string;
  addressNotes: string;
  date: string;
  slot: DeliverySlot | "";
  name: string;
  phone: string;
  email: string;
  notes: string;
  cashMode: "exacto" | "billete" | "otro";
  cashBill: number | null;
  cashOther: string;
  cashAck: boolean;
};

type Errors = Partial<Record<keyof Form | "cart", string>>;

const EMPTY: Form = {
  zone: "",
  address: "",
  addressNotes: "",
  date: "",
  slot: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
  cashMode: "exacto",
  cashBill: null,
  cashOther: "",
  cashAck: false,
};

export function OrderWizard() {
  const { products, zones } = useCatalog();
  const router = useRouter();
  const { lines, count, ready, clear, add, setQty } = useCart();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [cashToast, setCashToast] = useState(false);
  const [today, setToday] = useState<{ min: string; max: string; picks: { iso: string; label: string }[] } | null>(null);

  // Fechas calculadas en el cliente (zona horaria de Madrid) y datos del último pedido.
  useEffect(() => {
    const min = localISODate(1);
    const max = localISODate(90);
    const picks: { iso: string; label: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const iso = localISODate(i);
      const label = i === 1 ? "Mañana" : formatDeliveryDate(iso).split(",")[0] + " " + Number(iso.slice(8));
      picks.push({ iso, label });
    }
    const year = Number(min.slice(0, 4));
    const xmas = `${year}-12-24`;
    if (xmas >= min && xmas <= max && !picks.some((p) => p.iso === xmas)) picks.push({ iso: xmas, label: "Nochebuena" });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valores que solo existen en el navegador
    setToday({ min, max, picks });
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null");
      if (saved) setForm((f) => ({ ...f, ...saved }));
    } catch {}
  }, []);

  const cartLines = useMemo(
    () => products.filter((p) => lines[p.id]).map((p) => ({ product: p, qty: lines[p.id] })),
    [products, lines],
  );
  const subtotal = cartLines.reduce((s, l) => s + l.product.price_cents * l.qty, 0);
  const zone = zones.find((z) => z.slug === form.zone);
  const fee = zone?.delivery_fee_cents ?? 0;
  const total = subtotal + fee;
  const billOptions = [500, 1000, 2000, 5000, 10000].filter((b) => b > total).slice(0, 3);

  const cashForCents = (() => {
    if (form.cashMode === "billete") return form.cashBill;
    if (form.cashMode === "otro") {
      const n = Math.round(parseFloat(form.cashOther.replace(",", ".")) * 100);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  })();

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (cartLines.length === 0) e.cart = "Añade al menos un pan para continuar.";
      if (zone && subtotal < zone.min_order_cents) e.cart = `El pedido mínimo en ${zone.name} es ${formatEuros(zone.min_order_cents)}.`;
    }
    if (s === 1) {
      if (!form.zone) e.zone = "Elige dónde te lo llevamos.";
      if (form.address.trim().length < 5) e.address = "Escribe la calle, el número y el piso.";
      if (!form.date) e.date = "Elige el día de entrega.";
      else if (today && (form.date < today.min || form.date > today.max)) e.date = "Elige una fecha a partir de mañana.";
      if (!form.slot) e.slot = "Elige mañana o tarde.";
    }
    if (s === 2) {
      if (form.name.trim().length < 2) e.name = "Dinos tu nombre para saber a quién entregarlo.";
      if (!normalizePhone(form.phone)) e.phone = "Escribe un teléfono válido, por ejemplo 612 345 678.";
      if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = "Revisa el correo electrónico.";
      if (form.cashMode === "otro" && (!cashForCents || cashForCents < total))
        e.cashOther = `Debe ser igual o mayor que ${formatEuros(total)}.`;
      if (!form.cashAck) e.cashAck = "Confirma que pagarás en efectivo.";
    }
    return e;
  }

  function goTo(next: number) {
    if (next > step) {
      for (let s = step; s < next; s++) {
        const e = validate(s);
        if (Object.keys(e).length) {
          setErrors(e);
          setStep(s);
          scrollToFirstError();
          return;
        }
      }
    }
    setErrors({});
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const e = validate(2);
    if (Object.keys(e).length) {
      setErrors(e);
      scrollToFirstError();
      if (e.cashAck) {
        setCashToast(true);
        setTimeout(() => setCashToast(false), 4500);
      }
      return;
    }
    setSubmitting(true);
    setServerError("");
    const phone = normalizePhone(form.phone)!;
    const { data, error } = await getSupabase().rpc("create_order", {
      p_customer_name: form.name.trim(),
      p_phone: phone,
      p_email: form.email.trim() || null,
      p_zone: form.zone,
      p_address: form.address.trim(),
      p_address_notes: form.addressNotes.trim() || null,
      p_delivery_date: form.date,
      p_delivery_slot: form.slot,
      p_notes: form.notes.trim() || null,
      p_cash_change_for_cents: cashForCents,
      p_items: cartLines.map((l) => ({ product_id: l.product.id, quantity: l.qty })),
    });

    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      setSubmitting(false);
      setServerError(errorMessage(error));
      return;
    }

    try {
      localStorage.setItem(
        CUSTOMER_KEY,
        JSON.stringify({ name: form.name, phone: form.phone, email: form.email, zone: form.zone, address: form.address, addressNotes: form.addressNotes }),
      );
    } catch {}
    saveOrder({ code: row.code, token: row.access_token, createdAt: new Date().toISOString() });
    celebrate();
    clear();
    router.push(`${trackingPath(row.code, row.access_token)}&nuevo=1`);
  }

  const primaryLabel = step < 2 ? "Continuar" : "Confirmar pedido";
  const onPrimary = () => (step < 2 ? goTo(step + 1) : submit());

  return (
    <div className="paper min-h-[70vh] pb-36 lg:pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 className="font-display text-[clamp(2.4rem,7vw,3.8rem)] font-semibold italic leading-none">Tu pedido</h1>
            <p className="mt-2 flex items-center gap-2 text-cocoa-soft">
              <Banknote className="h-4 w-4 text-poinsettia" /> Pago únicamente en efectivo al recibirlo
            </p>
          </div>
          <Stepper step={step} onStep={goTo} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="relative min-w-0">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && (
                  <section aria-labelledby="s0" className="space-y-3">
                    <h2 id="s0" className="sr-only">Elige tus panes</h2>
                    {products.map((p, i) => {
                      const qty = lines[p.id] ?? 0;
                      return (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                          className={`flex items-center gap-3 rounded-[24px] bg-white/80 p-3 ring-1 transition sm:gap-5 sm:p-4 ${
                            qty ? "ring-2 ring-pine" : "ring-cocoa/8"
                          }`}
                        >
                          <div className="w-24 shrink-0 rounded-2xl bg-masa-deep sm:w-36">
                            <PanIllustration variant={p.variant} className="w-full" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-lg font-semibold italic leading-tight sm:text-xl">{p.name}</p>
                            <p className="mt-0.5 text-sm text-cocoa/60">{p.weight_label}</p>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="font-display text-lg font-semibold tabular-nums">{formatEuros(p.price_cents)}</span>
                              {ready && qty > 0 ? (
                                <QtyStepper product={p} size="sm" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    add(p.id, 1);
                                    setErrors({});
                                  }}
                                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-poinsettia px-4 text-sm font-semibold text-masa transition hover:bg-poinsettia-deep active:scale-95"
                                >
                                  <Plus className="h-4 w-4" /> Añadir
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <ErrorNote message={errors.cart} />
                  </section>
                )}

                {step === 1 && (
                  <section aria-labelledby="s1" className="space-y-7 rounded-[28px] bg-white/80 p-5 ring-1 ring-cocoa/8 sm:p-8">
                    <h2 id="s1" className="font-display text-2xl font-semibold italic">¿Dónde y cuándo?</h2>

                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">Municipio</legend>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {zones.map((z) => (
                          <ChoiceCard key={z.slug} selected={form.zone === z.slug} onClick={() => set("zone", z.slug)}>
                            <MapPin className="h-5 w-5" />
                            <span className="font-display text-[0.95rem] font-semibold italic sm:text-lg">{z.name}</span>
                          </ChoiceCard>
                        ))}
                      </div>
                      <ErrorNote message={errors.zone} />
                    </fieldset>

                    <Field label="Dirección" error={errors.address}>
                      {(p) => (
                        <input
                          {...p}
                          autoComplete="street-address"
                          placeholder="Calle, número, piso y puerta"
                          value={form.address}
                          onChange={(e) => set("address", e.target.value)}
                          maxLength={200}
                        />
                      )}
                    </Field>
                    <Field label="Indicaciones para el repartidor" optional>
                      {(p) => (
                        <input
                          {...p}
                          placeholder="Portal, timbre, referencia…"
                          value={form.addressNotes}
                          onChange={(e) => set("addressNotes", e.target.value)}
                          maxLength={200}
                        />
                      )}
                    </Field>

                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">Día de entrega</legend>
                      <div className="flex flex-wrap gap-2">
                        {today?.picks.map((d) => (
                          <button
                            key={d.iso}
                            type="button"
                            onClick={() => set("date", d.iso)}
                            className={`rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition active:scale-95 ${
                              form.date === d.iso ? "bg-pine text-masa" : "bg-masa-deep text-cocoa hover:bg-masa-deep/70"
                            } ${d.label === "Nochebuena" ? "ring-2 ring-poinsettia/40" : ""}`}
                          >
                            {d.label}
                          </button>
                        ))}
                        <input
                          type="date"
                          aria-label="Otra fecha"
                          min={today?.min}
                          max={today?.max}
                          value={form.date}
                          onChange={(e) => set("date", e.target.value)}
                          className="rounded-full bg-white px-4 py-2 text-sm ring-1 ring-cocoa/12"
                        />
                      </div>
                      {form.date && <p className="mt-2 text-sm text-pine">{formatDeliveryDate(form.date)}</p>}
                      <ErrorNote message={errors.date} />
                    </fieldset>

                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">Franja horaria</legend>
                      <div className="grid grid-cols-2 gap-3">
                        <ChoiceCard selected={form.slot === "manana"} onClick={() => set("slot", "manana")}>
                          <Sun className="h-5 w-5" />
                          <span className="font-semibold">Mañana</span>
                          <span className="text-xs opacity-70">10:00 a 14:00</span>
                        </ChoiceCard>
                        <ChoiceCard selected={form.slot === "tarde"} onClick={() => set("slot", "tarde")}>
                          <Moon className="h-5 w-5" />
                          <span className="font-semibold">Tarde</span>
                          <span className="text-xs opacity-70">17:00 a 21:00</span>
                        </ChoiceCard>
                      </div>
                      <ErrorNote message={errors.slot} />
                    </fieldset>
                  </section>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="rounded-[28px] bg-pine p-5 text-masa lg:hidden">
                      <Summary
                        lines={cartLines}
                        subtotal={subtotal}
                        fee={fee}
                        total={total}
                        zoneName={zone?.name}
                        date={form.date}
                        slot={form.slot}
                        onRemove={(id) => setQty(id, 0)}
                      />
                    </div>
                    <section aria-labelledby="s2" className="space-y-5 rounded-[28px] bg-white/80 p-5 ring-1 ring-cocoa/8 sm:p-8">
                      <h2 id="s2" className="font-display text-2xl font-semibold italic">Tus datos</h2>
                      <Field label="Nombre" error={errors.name}>
                        {(p) => (
                          <input {...p} autoComplete="name" placeholder="¿A nombre de quién?" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
                        )}
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Teléfono" hint="Te llamamos si hay cualquier cambio." error={errors.phone}>
                          {(p) => (
                            <input {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="612 345 678" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} />
                          )}
                        </Field>
                        <Field label="Correo electrónico" optional error={errors.email}>
                          {(p) => (
                            <input {...p} type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={120} />
                          )}
                        </Field>
                      </div>
                      <Field label="Notas del pedido" optional>
                        {(p) => (
                          <textarea {...p} rows={2} placeholder="¿Algo que debamos saber?" value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} />
                        )}
                      </Field>
                    </section>

                    <section aria-labelledby="cash" className="relative overflow-hidden rounded-[28px] bg-poinsettia p-5 text-masa sm:p-8">
                      <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-masa/40" />
                      <div className="relative">
                        <div className="flex items-start gap-4">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-masa text-poinsettia">
                            <Banknote className="h-6 w-6" />
                          </span>
                          <div>
                            <h2 id="cash" className="font-display text-2xl font-semibold italic leading-tight">Pago únicamente en efectivo</h2>
                            <p className="mt-1 text-masa/85">
                              Pagarás <strong className="font-bold">{formatEuros(total)}</strong> al recibir el pedido. No aceptamos tarjeta, Bizum ni transferencias.
                            </p>
                          </div>
                        </div>

                        <p className="mt-6 text-sm font-semibold">¿Con qué vas a pagar?</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <CashChip selected={form.cashMode === "exacto"} onClick={() => set("cashMode", "exacto")}>
                            Importe exacto
                          </CashChip>
                          {billOptions.map((b) => (
                            <CashChip
                              key={b}
                              selected={form.cashMode === "billete" && form.cashBill === b}
                              onClick={() => {
                                set("cashMode", "billete");
                                set("cashBill", b);
                              }}
                            >
                              Billete de {b / 100} €
                            </CashChip>
                          ))}
                          <CashChip selected={form.cashMode === "otro"} onClick={() => set("cashMode", "otro")}>
                            Otro importe
                          </CashChip>
                        </div>
                        <AnimatePresence initial={false}>
                          {form.cashMode === "otro" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="flex items-center gap-2 pt-3">
                                <input
                                  inputMode="decimal"
                                  aria-label="Importe con el que pagarás"
                                  placeholder={(total / 100).toFixed(2).replace(".", ",")}
                                  value={form.cashOther}
                                  onChange={(e) => set("cashOther", e.target.value.replace(/[^\d,.]/g, ""))}
                                  className="w-36 rounded-full border-0 bg-masa px-4 py-2.5 text-cocoa"
                                />
                                <span className="font-semibold">€</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {cashForCents && cashForCents > total && (
                          <p className="mt-3 text-sm text-masa/90">
                            Te llevaremos {formatEuros(cashForCents - total)} de cambio.
                          </p>
                        )}
                        {errors.cashOther && <p className="mt-2 text-sm font-semibold text-gold">{errors.cashOther}</p>}

                        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-masa/10 p-4">
                          <span className="relative mt-0.5">
                            <input
                              type="checkbox"
                              checked={form.cashAck}
                              onChange={(e) => set("cashAck", e.target.checked)}
                              className="peer sr-only"
                            />
                            <span className="grid h-6 w-6 place-items-center rounded-md border-2 border-masa bg-transparent transition peer-checked:bg-masa peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                              <Check className={`h-4 w-4 text-poinsettia transition ${form.cashAck ? "scale-100" : "scale-0"}`} strokeWidth={3} />
                            </span>
                          </span>
                          <span className="font-medium">
                            Entiendo que el pago es únicamente en efectivo, en el momento de la entrega.
                          </span>
                        </label>
                        {errors.cashAck && <p className="mt-2 text-sm font-semibold text-gold">{errors.cashAck}</p>}
                      </div>
                    </section>

                    <p className="px-2 text-sm text-cocoa-soft">
                      Podrás cancelar el pedido desde tu página de seguimiento solo mientras esté en «Procesando pedido».
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-cocoa-soft hover:bg-cocoa/5"
              >
                <ArrowLeft className="h-4 w-4" /> Volver
              </button>
            )}
          </div>

          {/* Resumen (escritorio) */}
          <aside className="sticky top-24 hidden rounded-[28px] bg-pine p-6 text-masa shadow-[0_30px_60px_-30px_rgb(15_46_33/0.8)] lg:block">
            <Summary
              lines={cartLines}
              subtotal={subtotal}
              fee={fee}
              total={total}
              zoneName={zone?.name}
              date={form.date}
              slot={form.slot}
              onRemove={(id) => setQty(id, 0)}
            />
            {serverError && <p className="mt-4 rounded-xl bg-poinsettia/90 p-3 text-sm font-medium">{serverError}</p>}
            <PrimaryButton onClick={onPrimary} disabled={submitting || (step === 0 && count === 0)} loading={submitting} label={primaryLabel} />
          </aside>
        </motion.div>
      </div>

      {/* Toast: confirmar efectivo */}
      <AnimatePresence>
        {cashToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed right-4 top-4 z-50 flex w-full max-w-xs items-start gap-3 rounded-2xl bg-poinsettia p-4 text-masa shadow-[0_20px_40px_-12px_rgb(199_37_47/0.55)]"
            role="alert"
          >
            <Banknote className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-semibold leading-snug">
              Confirma que pagarás únicamente en efectivo antes de continuar.
            </p>
            <button type="button" onClick={() => setCashToast(false)} aria-label="Cerrar">
              <X className="h-4 w-4 opacity-70 hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra inferior (móvil) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cocoa/10 bg-masa/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg lg:hidden">
        <AnimatePresence>
          {serverError && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-2 rounded-xl bg-poinsettia p-3 text-sm font-medium text-masa">
              {serverError}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-cocoa/60">
              {count} {count === 1 ? "pan" : "panes"}, en efectivo
            </p>
            <motion.p key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="origin-left font-display text-2xl font-semibold tabular-nums">
              {formatEuros(total)}
            </motion.p>
          </div>
          <PrimaryButton compact onClick={onPrimary} disabled={submitting || (step === 0 && count === 0)} loading={submitting} label={primaryLabel} />
        </div>
      </div>
    </div>
  );
}

function Stepper({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStep(i)}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold transition ${
                active ? "bg-pine text-masa" : done ? "bg-pine/10 text-pine" : "text-cocoa/45"
              }`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                  active ? "bg-poinsettia text-masa" : done ? "bg-pine text-masa" : "bg-cocoa/10"
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={active ? "" : "hidden sm:inline"}>{label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`h-0.5 w-4 rounded-full sm:w-6 ${done ? "bg-pine" : "bg-cocoa/15"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Summary({
  lines,
  subtotal,
  fee,
  total,
  zoneName,
  date,
  slot,
  onRemove,
}: {
  lines: { product: Product; qty: number }[];
  subtotal: number;
  fee: number;
  total: number;
  zoneName?: string;
  date: string;
  slot: string;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-2xl font-semibold italic">
        <ShoppingBag className="h-5 w-5 text-gold" /> Resumen
      </h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-masa/70">
          Aún no has añadido panes. <Link href="/#panes" className="underline underline-offset-4">Ver la carta</Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {lines.map(({ product, qty }) => (
              <motion.li
                key={product.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="group flex items-center justify-between gap-3 text-[0.95rem]"
              >
                <span className="min-w-0">
                  <span className="font-semibold tabular-nums text-gold">{qty}×</span> {product.name}
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  {formatEuros(product.price_cents * qty)}
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Quitar ${product.name}`}
                    className="grid h-7 w-7 place-items-center rounded-full text-masa/50 hover:bg-masa/10 hover:text-masa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <dl className="mt-5 space-y-1.5 border-t border-masa/15 pt-4 text-sm text-masa/80">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatEuros(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Entrega{zoneName ? ` en ${zoneName}` : ""}</dt>
          <dd className="tabular-nums">{fee ? formatEuros(fee) : "Sin coste"}</dd>
        </div>
        {date && (
          <div className="flex justify-between gap-4">
            <dt>Día</dt>
            <dd className="text-right">
              {formatDeliveryDate(date)}
              {slot && `, ${slot === "manana" ? "mañana" : "tarde"}`}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-4 flex items-end justify-between border-t border-masa/15 pt-4">
        <span className="text-sm text-masa/80">Total a pagar en efectivo</span>
        <motion.span key={total} initial={{ scale: 1.2, color: "#e2b65c" }} animate={{ scale: 1, color: "#fbf3e4" }} className="font-display text-3xl font-semibold tabular-nums">
          {formatEuros(total)}
        </motion.span>
      </div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  label,
  compact,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-poinsettia font-semibold text-masa shadow-[0_12px_30px_-10px_rgb(199_37_47/0.9)] transition hover:bg-poinsettia-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? "h-14 px-7 text-base" : "mt-6 h-14 w-full text-lg"
      }`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {loading ? "Enviando…" : label}
    </button>
  );
}

function ChoiceCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-4 text-center transition active:scale-[0.97] ${
        selected ? "bg-pine text-masa shadow-[0_12px_24px_-12px_rgb(15_46_33/0.8)]" : "bg-masa-deep/70 text-cocoa hover:bg-masa-deep"
      }`}
    >
      {selected && (
        <motion.span layoutId={undefined} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-gold text-cocoa">
          <Check className="h-3 w-3" strokeWidth={3} />
        </motion.span>
      )}
      {children}
    </button>
  );
}

function CashChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
        selected ? "bg-masa text-poinsettia" : "bg-masa/15 text-masa hover:bg-masa/25"
      }`}
    >
      {children}
    </button>
  );
}

function ErrorNote({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 0] }}
          exit={{ opacity: 0 }}
          className="mt-2 text-sm font-semibold text-poinsettia"
          role="alert"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
