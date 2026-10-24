import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient | undefined;

/** Cliente del navegador. La plataforma no usa cuentas: todo va por tickets y enlaces privados. */
export function getSupabase() {
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return browserClient;
}

/** Cliente sin sesión para lecturas públicas en el servidor. */
export function getServerSupabase() {
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Extrae un mensaje legible de un error de Supabase/PostgREST. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: unknown }).message);
    if (/fetch|network/i.test(msg)) return "No hay conexión. Revisa tu internet e inténtalo de nuevo.";
    return msg;
  }
  return "Algo no ha salido bien. Inténtalo de nuevo.";
}
