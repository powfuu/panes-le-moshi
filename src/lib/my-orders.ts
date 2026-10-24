// Pedidos hechos desde este dispositivo, para encontrarlos sin buscar el enlace.
const KEY = "moshi:orders";

export type SavedOrder = { code: string; token: string; createdAt: string };

export function getSavedOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: SavedOrder) {
  try {
    const list = getSavedOrders().filter((o) => o.code !== order.code);
    localStorage.setItem(KEY, JSON.stringify([order, ...list].slice(0, 20)));
  } catch {
    // Sin almacenamiento disponible: el enlace del pedido sigue funcionando.
  }
}

export const trackingPath = (code: string, token: string) =>
  `/pedido/?c=${encodeURIComponent(code)}&t=${encodeURIComponent(token)}`;
