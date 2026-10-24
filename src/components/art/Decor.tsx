const BULB_COLORS = ["#e2b65c", "#c7252f", "#7fbf7a", "#fff1c9", "#e07c7e"];

/** Tira de luces navideñas que cuelga de lado a lado. */
export function StringLights({ count = 22, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none flex w-full overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const color = BULB_COLORS[i % BULB_COLORS.length];
        return (
          <svg key={i} viewBox="0 0 120 56" className="h-11 w-[120px] shrink-0 sm:h-14" overflow="visible">
            <path d="M0 8 Q60 34 120 8" stroke="#0b1f16" strokeWidth="2" fill="none" />
            <rect x="56" y="19" width="8" height="7" rx="1.5" fill="#3a3a32" />
            <path
              d="M60 25 C 52 31, 52 44, 60 49 C 68 44, 68 31, 60 25 Z"
              fill={color}
              style={{ color, animationDelay: `${(i * 0.37) % 2.4}s` }}
              className="animate-twinkle"
            />
          </svg>
        );
      })}
    </div>
  );
}

/** Guirnalda de pino con bayas, como el marco navideño de las referencias. */
export function Garland({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`block h-9 w-full ${flip ? "rotate-180" : ""} ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={`garland${flip ? "-f" : ""}`} width="96" height="36" patternUnits="userSpaceOnUse">
          <path d="M0 18 Q24 6 48 18 T96 18" stroke="#17402f" strokeWidth="3" fill="none" />
          {[6, 18, 30, 42, 54, 66, 78, 90].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i % 2 ? 20 : 14}) rotate(${i % 2 ? 35 : -35})`}>
              <path d="M0 0 L-9 -3 M0 0 L-9 3 M0 0 L-7 -6 M0 0 L-7 6" stroke={i % 3 ? "#2c5e47" : "#17402f"} strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="24" cy="22" r="3.4" fill="#c7252f" />
          <circle cx="29" cy="25" r="2.8" fill="#9c1a23" />
          <circle cx="72" cy="13" r="3.2" fill="#c7252f" />
          <circle cx="68" cy="9" r="2.4" fill="#e2b65c" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#garland${flip ? "-f" : ""})`} />
    </svg>
  );
}

/** Copo de nieve de seis brazos para acentos. */
export function Snowflake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-12 -12 24 24" aria-hidden className={className}>
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="0" y1="-10" x2="0" y2="10" />
          <path d="M-3 -7 L0 -4.5 L3 -7 M-3 7 L0 4.5 L3 7" fill="none" />
        </g>
      ))}
    </svg>
  );
}

/** Ramita de acebo. */
export function Holly({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden className={className}>
      <path d="M30 22 C 22 8, 6 10, 2 4 C 8 14, 4 20, 10 24 C 14 20, 22 24, 30 22 Z" fill="#17402f" />
      <path d="M34 22 C 42 8, 58 10, 62 4 C 56 14, 60 20, 54 24 C 50 20, 42 24, 34 22 Z" fill="#2c5e47" />
      <circle cx="28" cy="26" r="5" fill="#c7252f" />
      <circle cx="37" cy="26" r="5" fill="#9c1a23" />
      <circle cx="32.5" cy="33" r="5" fill="#c7252f" />
      <circle cx="26.5" cy="24.5" r="1.4" fill="#fff" opacity="0.6" />
    </svg>
  );
}
