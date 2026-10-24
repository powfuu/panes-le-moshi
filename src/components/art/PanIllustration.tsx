"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import type { ProductVariant } from "@/lib/types";

/** Espiral de Arquímedes aplanada: el corte del pan de jamón. */
function spiral(cx: number, cy: number, maxR: number, turns: number, squash: number) {
  const pts: [number, number][] = [];
  const end = Math.PI * 2 * turns;
  for (let t = 0; t <= end; t += 0.12) {
    const r = 2 + (t / end) * maxR;
    pts.push([cx + r * Math.cos(t) * squash, cy + r * Math.sin(t)]);
  }
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { d, pts };
}

const SPIRAL = spiral(0, 0, 48, 3.1, 0.82);
// Relleno repartido entre las vueltas (determinista para que coincida en SSR).
const OLIVES = SPIRAL.pts.filter((_, i) => i > 12 && i % 23 === 0);
const RAISINS = SPIRAL.pts.filter((_, i) => i > 8 && i % 17 === 5);

type LoafProps = {
  width: number;
  raisins: boolean;
  animate: boolean;
  delay?: number;
  gid: string;
};

/** Un pan entero visto de lado con el extremo cortado mostrando la espiral. */
function Loaf({ width, raisins, animate, delay = 0, gid }: LoafProps) {
  const h = 136;
  const faceX = width - 6;
  const pricks: [number, number][] = [];
  for (let row = 0; row < 3; row++) {
    for (let x = 52 + (row % 2) * 16; x < width - 70; x += 32) pricks.push([x, 34 + row * 26]);
  }

  return (
    <g>
      <ellipse cx={width / 2 + 10} cy={h + 8} rx={width / 2 + 30} ry={14} fill="#2b1610" opacity={0.18} />
      <rect x={0} y={0} width={width} height={h} rx={h / 2} fill={`url(#crust-${gid})`} />
      <rect x={0} y={0} width={width} height={h} rx={h / 2} fill={`url(#shine-${gid})`} />
      <path
        d={`M${h / 2 - 10} 22 Q ${width / 2} 6 ${width - 70} 22`}
        stroke="#fff3d6"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
      {pricks.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={2.4} ry={1.5} fill="#6e3410" opacity={0.5} />
      ))}

      <g transform={`translate(${faceX} ${h / 2})`}>
        <ellipse rx={56} ry={68} fill="#a85c22" />
        <ellipse rx={51} ry={63} fill="#f7dfb4" />
        <ellipse rx={51} ry={63} fill={`url(#crumb-${gid})`} />
        <motion.path
          d={SPIRAL.d}
          fill="none"
          stroke="#e07c7e"
          strokeWidth={6.5}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1], delay }}
        />
        <motion.path
          d={SPIRAL.d}
          fill="none"
          stroke="#b54a44"
          strokeWidth={1.6}
          strokeDasharray="7 11"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1], delay: delay + 0.15 }}
        />
        {OLIVES.map(([x, y], i) => (
          <motion.g
            key={`o${i}`}
            initial={animate ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.9 + i * 0.12, type: "spring", stiffness: 380, damping: 14 }}
          >
            <circle cx={x + 4} cy={y - 3} r={3.6} fill="#55652a" />
            <circle cx={x + 4} cy={y - 3} r={1.4} fill="#d2452f" />
          </motion.g>
        ))}
        {raisins &&
          RAISINS.map(([x, y], i) => (
            <motion.ellipse
              key={`r${i}`}
              cx={x - 3}
              cy={y + 4}
              rx={2.8}
              ry={2.2}
              fill="#4e2232"
              initial={animate ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 1.2 + i * 0.1, type: "spring", stiffness: 380, damping: 14 }}
            />
          ))}
      </g>
    </g>
  );
}

type Props = {
  variant?: ProductVariant;
  animate?: boolean;
  className?: string;
  title?: string;
};

export function PanIllustration({ variant = "clasico", animate = false, className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const play = animate && !reduce;

  return (
    <svg
      viewBox="0 0 440 240"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`crust-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2bc68" />
          <stop offset="0.45" stopColor="#cf8434" />
          <stop offset="1" stopColor="#874515" />
        </linearGradient>
        <radialGradient id={`shine-${uid}`} cx="0.4" cy="0.2" r="0.6">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`crumb-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="#e9c48b" stopOpacity="0" />
          <stop offset="1" stopColor="#d9a35e" stopOpacity="0.8" />
        </radialGradient>
      </defs>

      {variant === "mini" ? (
        <>
          <g transform="translate(46 30) scale(0.5)">
            <Loaf width={220} raisins animate={play} gid={uid} delay={0} />
          </g>
          <g transform="translate(240 30) scale(0.5)">
            <Loaf width={220} raisins animate={play} gid={uid} delay={0.2} />
          </g>
          <g transform="translate(120 104) scale(0.6)">
            <Loaf width={260} raisins animate={play} gid={uid} delay={0.4} />
          </g>
        </>
      ) : variant === "familiar" ? (
        <g transform="translate(18 40) scale(1.02)">
          <Loaf width={330} raisins animate={play} gid={uid} />
        </g>
      ) : (
        <g transform="translate(48 46)">
          <Loaf width={290} raisins={variant !== "sinpasas"} animate={play} gid={uid} />
        </g>
      )}
    </svg>
  );
}
