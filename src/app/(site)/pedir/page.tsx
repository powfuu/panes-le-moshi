import type { Metadata } from "next";
import { OrderWizard } from "@/components/order/OrderWizard";
import { CatalogProvider } from "@/lib/catalog";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  title: "Hacer pedido",
  description: "Elige tus panes de jamón, el día de entrega y paga en efectivo al recibirlos.",
};

export default async function OrderPage() {
  return (
    <CatalogProvider initial={await getCatalog()}>
      <OrderWizard />
    </CatalogProvider>
  );
}