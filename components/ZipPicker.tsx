"use client";

import { useState } from "react";

export function ZipPicker({
  baName,
  state,
  onZip,
}: {
  baName: string;
  state: string | null;
  onZip: (zip: string) => Promise<string | null>; // returns error message or null on success
}) {
  const [zip, setZip] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!/^\d{5}$/.test(zip)) {
      setMsg("Enter a 5-digit ZIP.");
      return;
    }
    setBusy(true);
    const err = await onZip(zip);
    setBusy(false);
    if (err) {
      setMsg(err);
    } else {
      setZip("");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form onSubmit={submit} className="flex items-center gap-2 text-sm">
        <span className="text-[var(--color-muted)]">
          {baName}
          {state ? ` · ${state}` : ""}
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="ZIP"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, ""))}
          className="w-20 rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-center tabular-nums focus:border-[var(--color-fg)] focus:outline-none"
          disabled={busy}
        />
      </form>
      {msg ? <span className="text-xs text-[var(--color-mid)]">{msg}</span> : null}
    </div>
  );
}
