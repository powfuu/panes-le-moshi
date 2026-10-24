"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { HandHeart, Soup, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Snowflake } from "../art/Decor";

const ease = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  {
    icon: Soup,
    title: "La receta de la familia",
    text: "La misma masa, el mismo relleno y el mismo papelón desde la primera Navidad.",
  },
  {
    icon: UsersRound,
    title: "Miles de mesas",
    text: "Familias que nos esperan cada diciembre y que ya han hecho de nuestro pan su tradición.",
  },
  {
    icon: HandHeart,
    title: "Hecho a mano, pan por pan",
    text: "Cada pan se amasa, se rellena y se enrolla a mano. Así lo hacíamos y así lo seguimos haciendo.",
  },
];

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, { duration: 1.8, ease: "easeOut", onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}

export function Legacy() {
  return (
    <section aria-labelledby="legacy-title" className="relative overflow-hidden bg-pine-deep py-20 text-masa sm:py-28">
      <Snowflake className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-masa/5" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[auto_1fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
          className="text-center lg:text-left"
        >
          <p className="font-display text-[clamp(8rem,28vw,15rem)] font-bold italic leading-[0.8] text-gold">
            <CountUp to={30} />
          </p>
          <p className="mt-2 font-script text-4xl text-masa/90 sm:text-5xl">años de Navidad</p>
        </motion.div>

        <div>
          <motion.h2
            id="legacy-title"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease }}
            className="font-display text-[clamp(2.2rem,5.5vw,3.4rem)] font-semibold italic leading-[1.05]"
          >
            Treinta años haciendo lo que amamos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="mt-5 max-w-[58ch] text-lg leading-relaxed text-masa/80"
          >
            Desde 1996 horneamos pan de jamón para que cada familia tenga la mejor Navidad posible. Tres décadas de
            diciembres con el horno encendido, de encargos que se repiten año tras año y de clientes que ya son parte
            de la casa. Gracias por confiar en nosotros tantas Navidades.
          </motion.p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {PILLARS.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.12, ease }}
                className="rounded-[24px] bg-masa/[0.06] p-5 ring-1 ring-masa/10"
              >
                <p.icon className="h-6 w-6 text-gold" />
                <h3 className="mt-3 font-display text-xl font-semibold italic">{p.title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-masa/70">{p.text}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
