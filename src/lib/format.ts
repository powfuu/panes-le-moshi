const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export const formatEuros = (cents: number) => euro.format(cents / 100);

export function formatDeliveryDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const text = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const slotLabel = { manana: "Mañana, de 10:00 a 14:00", tarde: "Tarde, de 17:00 a 21:00" } as const;
export const slotShort = { manana: "Mañana", tarde: "Tarde" } as const;

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  const min = Math.round(diff / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return formatDateTime(iso);
}

/** Fecha local (Madrid) en formato YYYY-MM-DD con desplazamiento en días. */
export function localISODate(offsetDays = 0) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  now.setDate(now.getDate() + offsetDays);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Normaliza un teléfono español: devuelve null si no es válido. */
export function normalizePhone(raw: string) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (cleaned.startsWith("+")) return digits.length >= 9 && digits.length <= 15 ? `+${digits}` : null;
  if (/^[6789]\d{8}$/.test(digits)) return digits;
  if (/^34[6789]\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}
