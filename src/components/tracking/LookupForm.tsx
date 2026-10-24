"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveOrder, trackingPath } from "@/lib/my-orders";
import { errorMessage, getSupabase } from "@/lib/supabase";
import { Field } from "../ui/Field";

export function LookupForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let clean = code.trim().toUpperCase().replace(/\s/g, "");
    if (!clean.startsWith("LM-")) clean = `LM-${clean.replace(/^LM/, "")}`;
    if (!/^LM-[A-Z0-9]{6}$/.test(clean)) {
      setError("El número de ticket tiene este formato: LM-ABC123.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setError("Escribe el teléfono con el que hiciste el pedido.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: err } = await getSupabase().rpc("find_order", { p_code: clean, p_phone: phone });
    setLoading(false);
    if (err) return setError(errorMessage(err));
    if (!data) return setError("No encontramos ningún ticket con ese número y teléfono. Revisa los dos datos.");
    saveOrder({ code: clean, token: data as string, createdAt: new Date().toISOString() });
    router.push(trackingPath(clean, data as string));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Número de ticket">
        {(p) => (
          <input
            {...p}
            placeholder="LM-ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            className={`${p.className} font-display text-lg tracking-wider`}
            maxLength={9}
          />
        )}
      </Field>
      <Field label="Teléfono del pedido">
        {(p) => (
          <input {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="612 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
        )}
      </Field>
      {error && (
        <p role="alert" className="rounded-xl bg-poinsettia/10 p-3 text-sm font-medium text-poinsettia">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-pine py-3.5 font-semibold text-masa transition hover:bg-pine-soft active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        Buscar mi pedido
      </button>
    </form>
  );
}
