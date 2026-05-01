"use client";

import { useState } from "react";
import { zipToZone } from "@/lib/zones/zipToZone";
import { ZONE_LABELS, type ErcotZone } from "@/lib/zones/zones";

export function ZipPicker({
  zone,
  onChange,
}: {
  zone: ErcotZone;
  onChange: (zone: ErcotZone) => void;
}) {
  const [zip, setZip] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const result = zipToZone(zip);
    if (!result.ok) {
      setMsg(
        result.reason === "el-paso"
          ? "El Paso isn't on the ERCOT grid — coming soon."
          : result.reason === "not-texas"
            ? "We're Texas-first. Other regions coming soon."
            : "Enter a 5-digit ZIP.",
      );
      return;
    }
    onChange(result.zone);
    setZip("");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-muted)]">{ZONE_LABELS[zone]}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{5}"
        maxLength={5}
        placeholder="ZIP"
        value={zip}
        onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, ""))}
        className="w-20 rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-center tabular-nums focus:border-[var(--color-fg)] focus:outline-none"
      />
      {msg ? <span className="text-xs text-[var(--color-mid)]">{msg}</span> : null}
    </form>
  );
}
