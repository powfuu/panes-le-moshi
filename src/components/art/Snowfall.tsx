"use client";

import { useEffect, useRef } from "react";

/** Nieve suave en canvas. Se detiene fuera de pantalla y con movimiento reducido. */
export function Snowfall({ density = 70, className }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const count = window.innerWidth < 640 ? Math.round(density * 0.55) : density;
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 2.4,
      vy: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      sway: 0.2 + Math.random() * 0.6,
    }));

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += (f.vy * (f.r / 2.5)) / h * 1.6;
        if (f.y > 1.02) {
          f.y = -0.02;
          f.x = Math.random();
        }
        const x = f.x * w + Math.sin(t / 1600 + f.phase) * 14 * f.sway;
        ctx.beginPath();
        ctx.arc(x, f.y * h, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 240, ${0.35 + f.r / 6})`;
        ctx.fill();
      }
      if (visible) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
