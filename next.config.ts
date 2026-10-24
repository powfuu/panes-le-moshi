import type { NextConfig } from "next";

// Web 100 % estática: los datos vivos (carta, pedidos, seguimiento) se leen de Supabase en el navegador.
// Así no hay funciones de servidor que mantener y se puede servir desde cualquier CDN.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
