import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTracker, TrackerSkeleton } from "@/components/tracking/OrderTracker";

export const metadata: Metadata = {
  title: "Seguimiento de pedido",
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <Suspense fallback={<TrackerSkeleton />}>
      <OrderTracker />
    </Suspense>
  );
}