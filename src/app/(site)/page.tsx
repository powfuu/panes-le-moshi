import { Hero } from "@/components/landing/Hero";
import { Legacy } from "@/components/landing/Legacy";
import { CashBand, Faq, FinalCta, FloatingCart, HowItWorks, Story, Zones } from "@/components/landing/Sections";
import { ProductGrid } from "@/components/ProductCard";
import { CatalogProvider } from "@/lib/catalog";
import { getCatalog } from "@/lib/data";

export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <CatalogProvider initial={catalog}>
      <Hero />

      <section id="panes" className="relative z-10 -mt-24 scroll-mt-24 sm:-mt-32">
        <div className="paper mx-auto max-w-6xl rounded-t-[36px] px-4 pb-6 pt-10 sm:px-8 sm:pt-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="font-display text-[clamp(2.3rem,6vw,3.6rem)] font-semibold italic leading-[1.02]">
              Nuestros panes
            </h2>
            <p className="mt-3 max-w-md text-lg text-cocoa-soft">
              Todos llevan la misma masa y el mismo cariño. Cambia el tamaño, y las pasas si no eres de pasas.
            </p>
          </div>
          <ProductGrid />
        </div>
      </section>

      <Legacy />
      <Story />
      <CashBand />
      <HowItWorks />
      <Zones />
      <Faq />
      <FinalCta />
      <FloatingCart />
    </CatalogProvider>
  );
}
