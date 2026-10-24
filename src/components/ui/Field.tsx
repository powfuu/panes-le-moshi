"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useId } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string }) => React.ReactNode;
};

export const inputClass =
  "w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-base text-cocoa ring-1 ring-cocoa/12 placeholder:text-cocoa/35 transition aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-poinsettia";

export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-cocoa">
        {label}
        {optional && <span className="text-xs font-normal text-cocoa/50">Opcional</span>}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error || hint ? descId : undefined,
        className: inputClass,
      })}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="err"
            id={descId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-poinsettia"
          >
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" id={descId} className="mt-1.5 text-sm text-cocoa/55">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
