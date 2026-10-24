import { ChefHat, ClipboardCheck, Gift, Home, Truck, XCircle, type LucideIcon } from "lucide-react";
import type { OrderStatus } from "./types";

export const STATUS_FLOW: Exclude<OrderStatus, "cancelado">[] = [
  "procesando",
  "en_preparacion",
  "listo",
  "en_reparto",
  "entregado",
];

type StatusMeta = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  procesando: {
    label: "Procesando pedido",
    title: "Hemos recibido tu pedido",
    description: "Lo estamos revisando. Mientras siga en este paso puedes cancelarlo.",
    icon: ClipboardCheck,
  },
  en_preparacion: {
    label: "En preparación",
    title: "Tu pan está en el horno",
    description: "Estamos amasando, rellenando y horneando tu pedido. Ya no se puede cancelar.",
    icon: ChefHat,
  },
  listo: {
    label: "Listo para la entrega",
    title: "Recién horneado y envuelto",
    description: "Tu pedido está glaseado, envuelto y esperando a salir hacia tu casa.",
    icon: Gift,
  },
  en_reparto: {
    label: "En reparto",
    title: "Vamos de camino",
    description: "Tu pedido va hacia tu dirección. Ten listo el importe en efectivo.",
    icon: Truck,
  },
  entregado: {
    label: "Entregado",
    title: "¡Que aproveche!",
    description: "Tu pedido ha sido entregado. Gracias por celebrar la Navidad con nosotros.",
    icon: Home,
  },
  cancelado: {
    label: "Cancelado",
    title: "Pedido cancelado",
    description: "Este pedido se canceló y no se preparará.",
    icon: XCircle,
  },
};

export const statusIndex = (s: OrderStatus) => STATUS_FLOW.indexOf(s as (typeof STATUS_FLOW)[number]);
