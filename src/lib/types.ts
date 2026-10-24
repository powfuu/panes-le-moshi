export type OrderStatus =
  | "procesando"
  | "en_preparacion"
  | "listo"
  | "en_reparto"
  | "entregado"
  | "cancelado";

export type ProductVariant = "clasico" | "familiar" | "sinpasas" | "mini";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  weight_label: string | null;
  badge: string | null;
  variant: ProductVariant;
  max_per_order: number;
};

export type Zone = {
  slug: string;
  name: string;
  delivery_fee_cents: number;
  min_order_cents: number;
};

export type DeliverySlot = "manana" | "tarde";

export type PublicOrder = {
  code: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  zone: { slug: string; name: string };
  address: string;
  address_notes: string | null;
  delivery_date: string;
  delivery_slot: DeliverySlot;
  notes: string | null;
  payment_method: "efectivo";
  cash_change_for_cents: number | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  items: { product_name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[];
  history: { status: OrderStatus; changed_at: string }[];
};

export type AdminOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  email: string | null;
  zone_slug: string;
  address: string;
  address_notes: string | null;
  delivery_date: string;
  delivery_slot: DeliverySlot;
  notes: string | null;
  cash_change_for_cents: number | null;
  total_cents: number;
  created_at: string;
  updated_at: string;
  order_items: { product_name: string; quantity: number }[];
};
