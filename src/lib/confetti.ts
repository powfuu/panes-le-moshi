import confetti from "canvas-confetti";

const COLORS = ["#c7252f", "#17402f", "#e2b65c", "#fbf3e4", "#2c5e47"];

/** Lluvia navideña de confeti desde ambos lados. */
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const end = Date.now() + 900;
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS, scalar: 1.1 });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS, scalar: 1.1 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  confetti({ particleCount: 90, spread: 100, origin: { y: 0.45 }, colors: COLORS, shapes: ["circle", "square", "star"] });
}
