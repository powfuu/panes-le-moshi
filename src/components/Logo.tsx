import Link from "next/link";

/** Marca: la espiral del corte del pan de jamón. */
export function SpiralMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-20 -20 40 40" aria-hidden className={className}>
      <circle r="19" fill="#b5762a" />
      <circle r="16.5" fill="#f7dfb4" />
      <path
        d="M0 0 C 2 -2, 4 0, 3 2.5 C 1.5 5.5, -4 5, -5 1 C -6.5 -4, -1 -8, 4 -7 C 10 -5.5, 11 2, 8 6.5 C 4 12, -6 12, -10 6 C -13.5 0, -11 -9, -4 -11.5"
        fill="none"
        stroke="#e07c7e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="6" cy="-3" r="1.6" fill="#55652a" />
      <circle cx="-7" cy="-4" r="1.4" fill="#4e2232" />
    </svg>
  );
}

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Panes le Moshi, inicio">
      <SpiralMark className="h-10 w-10 shrink-0 transition-transform duration-700 group-hover:rotate-[200deg]" />
      <span className="flex flex-col whitespace-nowrap leading-none">
        <span className={`font-display text-[0.8rem] tracking-[0.2em] ${light ? "text-masa/80" : "text-cocoa-soft"}`}>
          Panes
        </span>
        <span className={`font-script text-[1.9rem] -mt-0.5 ${light ? "text-masa" : "text-poinsettia"}`}>le Moshi</span>
      </span>
    </Link>
  );
}
