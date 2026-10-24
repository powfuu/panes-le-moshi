"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Banknote, Lock, MapPin, Plus, ShoppingBag, Undo2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatEuros } from "@/lib/format";
import { STATUS_FLOW, STATUS_META } from "@/lib/status";
import { useCatalog } from "@/lib/catalog";
import { Holly, Snowflake } from "../art/Decor";

const ease = [0.22, 1, 0.36, 1] as const;

/* -------------------------------------------------------------------------- */
/* Anatomía del pan: el corte con sus ingredientes señalados                   */
/* -------------------------------------------------------------------------- */

function spiralPoints(maxR: number, turns: number) {
  const pts: [number, number][] = [];
  const end = Math.PI * 2 * turns;
  for (let t = 0; t <= end; t += 0.1) {
    const r = 4 + (t / end) * maxR;
    pts.push([r * Math.cos(t), r * Math.sin(t) * 1.1]);
  }
  return pts;
}
const BIG = spiralPoints(118, 3.3);
const BIG_D = BIG.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

const CALLOUTS = [
  { label: "Jamón", x: 70, y: -40, lx: 196, ly: -112, anchor: "start" },
  { label: "Tocineta", x: -34, y: 52, lx: -198, ly: 128, anchor: "end" },
  { label: "Aceitunas rellenas", x: 92, y: 58, lx: 200, ly: 140, anchor: "start" },
  { label: "Pasas", x: -78, y: -50, lx: -200, ly: -120, anchor: "end" },
  { label: "Glaseado de papelón", x: -8, y: -150, lx: 40, ly: -190, anchor: "start" },
] as const;

export function Anatomy() {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="-290 -215 580 430"
      className="w-full"
      role="img"
      aria-label="Corte de un pan de jamón: masa enrollada con jamón, tocineta, aceitunas rellenas y pasas, con glaseado de papelón"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      <ellipse cx="0" cy="12" rx="152" ry="170" fill="#2b1610" opacity="0.08" />
      <ellipse rx="148" ry="166" fill="#a85c22" />
      <ellipse rx="138" ry="156" fill="#f7dfb4" />
      <motion.path
        d={BIG_D}
        fill="none"
        stroke="#e07c7e"
        strokeWidth="15"
        strokeLinecap="round"
        variants={{ hidden: { pathLength: reduce ? 1 : 0 }, show: { pathLength: 1 } }}
        transition={{ duration: 2.4, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.path
        d={BIG_D}
        fill="none"
        stroke="#b54a44"
        strokeWidth="3"
        strokeDasharray="14 18"
        strokeLinecap="round"
        variants={{ hidden: { pathLength: reduce ? 1 : 0 }, show: { pathLength: 1 } }}
        transition={{ duration: 2.4, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
      />
      {BIG.filter((_, i) => i > 20 && i % 19 === 0).map(([x, y], i) => (
        <motion.g
          key={`o${i}`}
          variants={{ hidden: { scale: reduce ? 1 : 0 }, show: { scale: 1 } }}
          transition={{ delay: 1 + i * 0.08, type: "spring", stiffness: 400, damping: 14 }}
        >
          <circle cx={x + 9} cy={y - 6} r="8" fill="#55652a" />
          <circle cx={x + 9} cy={y - 6} r="3" fill="#d2452f" />
        </motion.g>
      ))}
      {BIG.filter((_, i) => i > 14 && i % 15 === 6).map(([x, y], i) => (
        <motion.ellipse
          key={`r${i}`}
          cx={x - 8}
          cy={y + 9}
          rx="6"
          ry="4.6"
          fill="#4e2232"
          variants={{ hidden: { scale: reduce ? 1 : 0 }, show: { scale: 1 } }}
          transition={{ delay: 1.3 + i * 0.07, type: "spring", stiffness: 400, damping: 14 }}
        />
      ))}

      {CALLOUTS.map((c, i) => (
        <motion.g
          key={c.label}
          variants={{ hidden: { opacity: reduce ? 1 : 0 }, show: { opacity: 1 } }}
          transition={{ delay: 2 + i * 0.15, duration: 0.6 }}
        >
          <line x1={c.x} y1={c.y} x2={c.lx} y2={c.ly} stroke="#2b1610" strokeWidth="1.2" />
          <circle cx={c.x} cy={c.y} r="4" fill="#2b1610" />
          <text
            x={c.lx + (c.anchor === "start" ? 6 : -6)}
            y={c.ly + 6}
            textAnchor={c.anchor}
            className="fill-cocoa font-display text-[19px] italic"
          >
            {c.label}
          </text>
        </motion.g>
      ))}
    </motion.svg>
  );
}

export function Story() {
  return (
    <section id="historia" className="scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <Anatomy />
        </div>
        <motion.div
          className="order-1 lg:order-2"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease }}
        >
          <Holly className="mb-4 w-16" />
          <h2 className="font-display text-[clamp(2.3rem,6vw,3.6rem)] font-semibold italic leading-[1.02]">
            Una tradición que cruzó el Atlántico
          </h2>
          <div className="mt-6 max-w-[60ch] space-y-4 font-display text-[1.13rem] leading-[1.75] text-cocoa-soft">
            <p>
              En Venezuela, diciembre huele a pan de jamón. Es el pan que acompaña a las hallacas, el que se parte en
              Nochebuena con toda la familia y el que se lleva de regalo a casa de los vecinos.
            </p>
            <p>
              Lo hacemos como en casa: masa suave y apenas dulce, relleno generoso enrollado a mano y un glaseado de
              papelón que lo deja brillante. Cada pan se hornea por encargo, para que llegue a tu mesa en su punto.
            </p>
            <p>
              Llevamos treinta años haciéndolo igual, y por eso tantas familias nos vuelven a elegir cada diciembre.
              Ahora lo llevamos por toda la comarca para que nadie se quede sin su pan en Navidad.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Pago en efectivo                                                            */
/* -------------------------------------------------------------------------- */

export function CashBand() {
  return (
    <section aria-labelledby="cash-title" className="grid lg:grid-cols-[1fr_2.2fr_1fr]">
      <div aria-hidden className="relative hidden overflow-hidden bg-pine lg:block">
        <Snowflake className="absolute right-8 top-10 h-16 w-16 text-gold/70" />
        <Snowflake className="absolute left-10 top-1/2 h-8 w-8 text-masa/40" />
        <Snowflake className="absolute -bottom-10 -left-10 h-56 w-56 text-masa/10" />
      </div>
      <div className="bg-poinsettia px-5 py-14 text-masa sm:px-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease }}
          className="relative mx-auto max-w-2xl border border-masa/70 p-2"
        >
          <div className="border border-masa/40 px-6 py-10 text-center sm:px-12">
            <motion.div
              initial={{ rotate: -12, y: 10 }}
              whileInView={{ rotate: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 120, damping: 10, delay: 0.3 }}
              className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-masa text-poinsettia"
            >
              <Banknote className="h-8 w-8" />
            </motion.div>
            <h2 id="cash-title" className="font-display text-[clamp(2rem,5.5vw,3.2rem)] font-semibold italic leading-tight">
              Pagas en efectivo, al recibirlo
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-masa/90">
              Es la única forma de pago. No aceptamos tarjeta, Bizum ni transferencias. Dinos con qué billete pagarás y
              te llevamos el cambio.
            </p>
            <Link
              href="/pedir"
              className="mt-7 inline-flex items-center rounded-full bg-masa px-7 py-3.5 font-semibold text-poinsettia transition hover:bg-white active:scale-95"
            >
              Hacer mi pedido
            </Link>
          </div>
        </motion.div>
      </div>
      <div aria-hidden className="relative hidden overflow-hidden bg-pine-deep lg:block">
        <Holly className="absolute right-6 top-10 w-36 rotate-12" />
        <Holly className="absolute bottom-10 left-6 w-28 -rotate-12" />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Cómo funciona: los 5 estados                                                */
/* -------------------------------------------------------------------------- */

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-masa-deep/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(2.3rem,6vw,3.6rem)] font-semibold italic leading-[1.02]">
            Así viaja tu pedido
          </h2>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-cocoa-soft">
            Cada pedido es un ticket con su propia página de seguimiento, sin registrarte. Verás en qué paso está en todo momento, desde que lo
            recibimos hasta que llega a tu mesa.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-5 lg:grid-cols-5 lg:gap-4">
          <motion.span
            aria-hidden
            className="candy absolute left-[1.9rem] top-8 bottom-8 w-1.5 origin-top rounded-full lg:left-[10%] lg:right-[10%] lg:top-[1.9rem] lg:bottom-auto lg:h-1.5 lg:w-auto lg:origin-left"
            initial={{ scaleY: 0, scaleX: 0 }}
            whileInView={{ scaleY: 1, scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease }}
          />
          {STATUS_FLOW.map((s, i) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            const cancellable = s === "procesando";
            return (
              <motion.li
                key={s}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease }}
                className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center"
              >
                <span className="relative z-10 grid h-[3.8rem] w-[3.8rem] shrink-0 place-items-center rounded-full bg-pine text-masa ring-[6px] ring-masa">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-cocoa">
                    {i + 1}
                  </span>
                </span>
                <div className="pt-1 lg:pt-2">
                  <h3 className="font-display text-xl font-semibold italic">{meta.label}</h3>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-cocoa-soft">{meta.description.split(".")[0]}.</p>
                  <p
                    className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      cancellable ? "bg-pine/10 text-pine" : "bg-cocoa/5 text-cocoa/60"
                    }`}
                  >
                    {cancellable ? <Undo2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {cancellable ? "Puedes cancelar" : "Ya no se cancela"}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Zonas de entrega                                                            */
/* -------------------------------------------------------------------------- */

export function Zones() {
  const { zones } = useCatalog();
  const reduce = useReducedMotion();
  const route = "M 70 150 C 170 40, 300 40, 400 150 S 640 210, 760 90";
  const pins = [
    { x: 70, y: 150, name: "A Coruña" },
    { x: 400, y: 150, name: "Arteixo" },
    { x: 760, y: 90, name: "Carballo" },
  ];

  return (
    <section id="zonas" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(2.3rem,6vw,3.6rem)] font-semibold italic leading-[1.02]">
            Llevamos tu pan hasta casa
          </h2>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-cocoa-soft">
            Por ahora repartimos en tres municipios. Eliges el día y la franja, mañana o tarde, y nosotros nos encargamos
            del resto.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[32px] bg-pine p-4 text-masa sm:p-8">
          <svg viewBox="0 0 830 230" className="w-full" aria-hidden>
            <path d={route} fill="none" stroke="rgb(251 243 228 / 0.35)" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
            {!reduce && (
              <g>
                <circle r="9" fill="#e2b65c">
                  <animateMotion dur="9s" repeatCount="indefinite" path={route} rotate="auto" />
                </circle>
                <circle r="18" fill="#e2b65c" opacity="0.25">
                  <animateMotion dur="9s" repeatCount="indefinite" path={route} />
                </circle>
              </g>
            )}
            {pins.map((p) => (
              <g key={p.name} transform={`translate(${p.x} ${p.y})`}>
                <circle r="16" fill="#c7252f" />
                <circle r="6" fill="#fbf3e4" />
                <text y="50" textAnchor="middle" className="fill-masa font-display text-[26px] italic">
                  {p.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {zones.map((z, i) => (
            <motion.li
              key={z.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease }}
              className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-cocoa/8"
            >
              <MapPin className="h-5 w-5 shrink-0 text-poinsettia" />
              <div>
                <p className="font-display text-lg font-semibold italic">{z.name}</p>
                <p className="text-sm text-cocoa-soft">
                  {z.delivery_fee_cents === 0 ? "Entrega sin coste" : `Entrega: ${formatEuros(z.delivery_fee_cents)}`}
                  {z.min_order_cents > 0 && `, pedido mínimo ${formatEuros(z.min_order_cents)}`}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Preguntas frecuentes                                                        */
/* -------------------------------------------------------------------------- */

const FAQ = [
  {
    q: "¿Cómo se paga?",
    a: "Únicamente en efectivo, en el momento de la entrega. No aceptamos tarjeta, Bizum ni transferencias. Al hacer el pedido puedes indicarnos con qué billete pagarás para llevarte el cambio.",
  },
  {
    q: "¿Puedo cancelar mi pedido?",
    a: "Sí, pero solo mientras esté en «Procesando pedido». Desde tu página de seguimiento verás el botón para cancelarlo. En cuanto pasa a «En preparación» ya estamos horneando y no es posible cancelarlo.",
  },
  {
    q: "¿Con cuánta antelación tengo que pedir?",
    a: "Horneamos por encargo, así que puedes elegir la entrega a partir del día siguiente. Para Nochebuena te recomendamos reservar con unos días de margen.",
  },
  {
    q: "¿Cuánto dura el pan de jamón?",
    a: "Está en su mejor momento los primeros tres o cuatro días, bien envuelto y en un lugar fresco. Un golpe de horno de cinco minutos lo deja como recién hecho.",
  },
  {
    q: "¿Repartís fuera de A Coruña, Arteixo y Carballo?",
    a: "De momento no. Si estás cerca y te interesa, escríbenos y lo tendremos en cuenta para las próximas zonas.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-display text-lg font-semibold italic sm:text-xl"
      >
        {q}
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine/8 text-pine"
        >
          <Plus className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[62ch] pb-5 leading-relaxed text-cocoa-soft">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <section className="bg-masa-deep/60 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <h2 className="text-center font-display text-[clamp(2.3rem,6vw,3.6rem)] font-semibold italic leading-[1.02]">
          Preguntas frecuentes
        </h2>
        <div className="mt-10 divide-y divide-cocoa/10 rounded-[28px] bg-white/70 px-5 ring-1 ring-cocoa/8 sm:px-8">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Llamada final y carrito flotante (móvil)                                    */
/* -------------------------------------------------------------------------- */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24 text-center sm:py-32">
      <Snowflake className="pointer-events-none absolute -left-16 top-6 h-64 w-64 text-pine/5" />
      <Snowflake className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 text-poinsettia/5" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease }}
        className="relative mx-auto max-w-2xl px-5"
      >
        <p className="font-script text-4xl text-poinsettia sm:text-5xl">Feliz Navidad</p>
        <h2 className="mt-3 font-display text-[clamp(2.4rem,7vw,4.2rem)] font-semibold italic leading-[1.02]">
          Reserva tu pan para Nochebuena
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg text-cocoa-soft">
          Treinta Navidades después, seguimos con la misma ilusión. Elige tus panes, el día y la franja, y lo pagas en
          efectivo cuando llegue a tu puerta.
        </p>
        <Link
          href="/pedir"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-poinsettia px-9 py-4 text-lg font-semibold text-masa shadow-[0_14px_40px_-12px_rgb(199_37_47/0.8)] transition hover:bg-poinsettia-deep active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" /> Hacer mi pedido
        </Link>
      </motion.div>
    </section>
  );
}

export function FloatingCart() {
  const { products } = useCatalog();
  const { lines, count, ready } = useCart();
  const total = products.reduce((sum, p) => sum + (lines[p.id] ?? 0) * p.price_cents, 0);
  return (
    <AnimatePresence>
      {ready && count > 0 && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
        >
          <Link
            href="/pedir"
            className="flex items-center justify-between rounded-full bg-pine py-2 pl-5 pr-2 text-masa shadow-[0_20px_40px_-12px_rgb(15_46_33/0.7)]"
          >
            <span className="text-sm">
              <span className="font-semibold">{count} {count === 1 ? "pan" : "panes"}</span>
              <span className="text-masa/70"> en tu pedido</span>
            </span>
            <span className="flex items-center gap-2 rounded-full bg-poinsettia px-4 py-2.5 font-semibold">
              {formatEuros(total)} <ShoppingBag className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
