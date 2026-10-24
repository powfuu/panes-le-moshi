"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Banknote, CalendarHeart } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { AnniversarySeal } from "../art/AnniversarySeal";
import { Holly, Snowflake, StringLights } from "../art/Decor";
import { PanIllustration } from "../art/PanIllustration";
import { Snowfall } from "../art/Snowfall";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const panY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const panRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -6]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-pine text-masa">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 75% 45%, rgb(226 182 92 / 0.22), transparent 70%), radial-gradient(50% 60% at 10% 90%, rgb(199 37 47 / 0.25), transparent 70%)",
        }}
      />
      <Snowfall className="absolute inset-0 h-full w-full" />
      <StringLights className="relative -mt-1" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-36 pt-6 sm:px-6 sm:pb-44 lg:grid-cols-[1.05fr_1fr] lg:pt-10">
        <div className="text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="font-script text-3xl text-gold sm:text-4xl"
          >
            30 años horneando la Navidad
          </motion.p>

          <h1 className="mt-2 font-display leading-[0.92]">
            {["Pan", "de", "jamón"].map((word, i) => (
              <span key={word} className="inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  className="inline-block pr-[0.22em] text-[clamp(3.6rem,13vw,7.5rem)] font-semibold italic"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease, delay: 0.15 + i * 0.12 }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
            <motion.span
              className="mt-1 block text-[clamp(1.6rem,5vw,2.6rem)] font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              para tu mesa de Navidad
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.85 }}
            className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-masa/80 lg:mx-0"
          >
            Desde 1996 llevamos la receta venezolana de toda la vida a miles de mesas. Horneado por encargo y entregado
            en A Coruña, Arteixo y Carballo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 1 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              href="/pedir"
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-poinsettia px-8 py-4 text-lg font-semibold text-masa shadow-[0_14px_40px_-12px_rgb(199_37_47/0.9)] transition active:scale-[0.97] sm:w-auto"
            >
              <span className="relative z-10">Hacer mi pedido</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              href="#panes"
              className="inline-flex w-full items-center justify-center rounded-full border border-masa/30 px-8 py-4 text-lg font-medium text-masa transition hover:bg-masa/10 sm:w-auto"
            >
              Ver los panes
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
            className="mt-8 flex flex-col items-center gap-2.5 text-sm text-masa/75 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start"
          >
            <li className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-gold" /> Pagas en efectivo al recibirlo
            </li>
            <li className="flex items-center gap-2">
              <CalendarHeart className="h-4 w-4 text-gold" /> Tú eliges día y franja
            </li>
          </motion.ul>
        </div>

        <motion.div style={{ y: panY, rotate: panRotate }} className="relative mx-auto w-full max-w-[560px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 0.3 }}
            className="relative"
          >
            {/* Plato */}
            <div className="absolute inset-x-[4%] bottom-[2%] top-[30%] rounded-[50%] bg-masa shadow-[0_40px_60px_-20px_rgb(0_0_0/0.55),inset_0_-10px_0_rgb(226_182_92/0.35)]" />
            <div className="absolute inset-x-[11%] bottom-[9%] top-[37%] rounded-[50%] border-2 border-dashed border-papelon/30" />
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <PanIllustration animate className="relative w-full drop-shadow-[0_20px_25px_rgb(0_0_0/0.35)]" title="Pan de jamón cortado mostrando su espiral de jamón, aceitunas y pasas" />
            </motion.div>
            <Holly className="absolute -left-2 bottom-[6%] w-20 animate-sway sm:w-24" />
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 12, delay: 1.6 }}
              className="absolute -top-2 right-0 w-24 drop-shadow-[0_12px_20px_rgb(0_0_0/0.35)] sm:-top-4 sm:w-32"
            >
              <AnniversarySeal className="text-[11px] sm:text-[14px]" />
            </motion.div>
            {[
              "left-[8%] top-[6%] h-7 w-7",
              "right-[6%] top-[0%] h-10 w-10",
              "right-[18%] bottom-[-4%] h-6 w-6",
            ].map((pos, i) => (
              <motion.span
                key={pos}
                className={`absolute text-gold ${pos}`}
                animate={reduce ? undefined : { rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 8 + i * 3, repeat: Infinity, ease: "linear" }}
              >
                <Snowflake className="h-full w-full" />
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
