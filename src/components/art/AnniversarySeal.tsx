"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Sello circular «30 años» con el texto girando alrededor. */
export function AnniversarySeal({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={`relative aspect-square ${className}`} role="img" aria-label="30 años horneando la Navidad, desde 1996">
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        <defs>
          <path id="seal-circle" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="#c7252f" />
        <circle cx="100" cy="100" r="92" fill="none" stroke="#fbf3e4" strokeWidth="1.2" strokeDasharray="2 4" />
        <text className="fill-masa font-sans text-[15px] font-semibold" letterSpacing="3.2">
          <textPath href="#seal-circle">DESDE 1996 ✦ 30 NAVIDADES ✦ HECHO A MANO ✦</textPath>
        </text>
      </motion.svg>
      <div className="absolute inset-[24%] grid place-items-center rounded-full bg-masa text-poinsettia shadow-inner">
        <div className="text-center leading-none">
          <span className="block font-display text-[2.6em] font-bold italic">30</span>
          <span className="block font-display text-[0.8em] italic">años</span>
        </div>
      </div>
    </div>
  );
}
