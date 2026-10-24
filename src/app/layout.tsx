import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, Pinyon_Script } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Panes le Moshi · Pan de jamón venezolano en A Coruña",
    template: "%s · Panes le Moshi",
  },
  description:
    "Desde 1996, pan de jamón venezolano hecho a mano para tu Navidad. Pide online y recíbelo en A Coruña, Arteixo o Carballo. Pago únicamente en efectivo a la entrega.",
  keywords: ["pan de jamón", "pan de jamón venezolano", "A Coruña", "Arteixo", "Carballo", "Navidad", "panadería venezolana"],
  openGraph: {
    title: "Panes le Moshi",
    description: "Pan de jamón venezolano para tu mesa de Navidad. Entregas en A Coruña, Arteixo y Carballo.",
    locale: "es_ES",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#17402f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fraunces.variable} ${instrument.variable} ${pinyon.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
