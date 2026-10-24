import { Banknote, MapPin } from "lucide-react";
import Link from "next/link";
import { Garland } from "./art/Decor";
import { SpiralMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-pine-deep text-masa">
      <Garland className="-mb-1 bg-masa" />
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SpiralMark className="h-14 w-14" />
          <p className="mt-3 font-script text-5xl">le Moshi</p>
          <p className="mt-1 font-display text-sm italic tracking-[0.2em] text-gold">Desde 1996</p>
          <p className="mt-2 max-w-sm text-masa/70">Treinta años de pan de jamón venezolano hecho a mano.</p>
        </div>

        <nav className="mt-10 border-y border-masa/15 py-5">
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm">
            <li><Link href="/#panes" className="hover:text-gold">Nuestros panes</Link></li>
            <li><Link href="/#historia" className="hover:text-gold">Nuestra historia</Link></li>
            <li><Link href="/#como-funciona" className="hover:text-gold">Cómo funciona</Link></li>
            <li><Link href="/pedir" className="hover:text-gold">Hacer pedido</Link></li>
            <li><Link href="/seguimiento" className="hover:text-gold">Seguir mi pedido</Link></li>
          </ul>
        </nav>

        <div className="mt-8 grid gap-4 text-sm text-masa/75 sm:grid-cols-2">
          <p className="flex items-center justify-center gap-2 sm:justify-start">
            <MapPin className="h-4 w-4 text-gold" /> Repartimos en A Coruña, Arteixo y Carballo
          </p>
          <p className="flex items-center justify-center gap-2 sm:justify-end">
            <Banknote className="h-4 w-4 text-gold" /> Pago únicamente en efectivo a la entrega
          </p>
        </div>
        <p className="mt-10 text-center text-xs text-masa/45">
          © Panes le Moshi. Hecho con cariño y mucho papelón.
        </p>
      </div>
    </footer>
  );
}
