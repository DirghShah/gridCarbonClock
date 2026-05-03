"use client";

import { useEffect, useState } from "react";

export function ZipPicker({
  baName,
  state,
  zip: currentZip,
  onZip,
  onLocate,
  locating,
}: {
  baName: string;
  state: string | null;
  zip: string | null;
  onZip: (zip: string) => Promise<string | null>;
  onLocate: () => Promise<string | null>;
  locating: boolean;
}) {
  const [zip, setZip] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-submit when 5 digits are typed — no Enter needed
  useEffect(() => {
    if (zip.length !== 5) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setMsg(null);
      const err = await onZip(zip);
      if (cancelled) return;
      setBusy(false);
      if (err) setMsg(err);
      else setZip("");
    })();
    return () => {
      cancelled = true;
    };
  }, [zip, onZip]);

  async function locate() {
    setMsg(null);
    const err = await onLocate();
    if (err) setMsg(err);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-right text-xs text-[var(--color-muted)]">
        {baName}
        {state ? ` · ${state}` : ""}
        {currentZip ? ` · ${currentZip}` : ""}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={locating || busy}
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-50"
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
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
      </div>
      {msg ? <span className="text-xs text-[var(--color-mid)]">{msg}</span> : null}
    </div>
  );
}
