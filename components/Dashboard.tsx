"use client";

import { useEffect, useState } from "react";
import { Dial } from "./Dial";
import { ForecastChart } from "./ForecastChart";
import { Nudge } from "./Nudge";
import { ZipPicker } from "./ZipPicker";
import { buildNudge, cleanestWindow } from "@/lib/carbon/nudge";
import { DEFAULT_ZONE, type ErcotZone } from "@/lib/zones/zones";
import type { CurrentIntensity, Forecast } from "@/lib/types";

const STORAGE_KEY = "gcc:zone";

export function Dashboard() {
  const [zone, setZone] = useState<ErcotZone>(DEFAULT_ZONE);
  const [current, setCurrent] = useState<CurrentIntensity | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate zone from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setZone(saved as ErcotZone);
  }, []);

  // Persist zone changes
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, zone);
  }, [zone]);

  // Fetch on zone change
  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      fetch(`/api/intensity?zone=${zone}`).then((r) => r.json()),
      fetch(`/api/forecast?zone=${zone}`).then((r) => r.json()),
    ])
      .then(([c, f]) => {
        if (cancelled) return;
        setCurrent(c);
        setForecast(f);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [zone]);

  const nudge = forecast ? buildNudge(forecast.hours) : null;
  const window4 = forecast ? cleanestWindow(forecast.hours, 4) : null;
  const highlightStart = forecast && window4 ? forecast.hours[window4.startIdx]?.ts : undefined;
  const highlightEnd =
    forecast && window4 ? forecast.hours[Math.min(window4.startIdx + 3, forecast.hours.length - 1)]?.ts : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Grid Carbon Clock</h1>
          <p className="text-sm text-[var(--color-muted)]">When is Texas electricity cleanest?</p>
        </div>
        <ZipPicker zone={zone} onChange={setZone} />
      </header>

      {error ? (
        <div className="rounded-2xl border border-[var(--color-dirty)] bg-[var(--color-card)] p-4 text-sm">
          Couldn't load grid data: {error}
        </div>
      ) : null}

      {current ? (
        <Dial gPerKWh={current.gPerKWh} asOf={current.asOf} zone={zone} />
      ) : (
        <Skeleton h={280} />
      )}

      {forecast ? (
        <ForecastChart hours={forecast.hours} highlightStart={highlightStart} highlightEnd={highlightEnd} />
      ) : (
        <Skeleton h={320} />
      )}

      {nudge ? <Nudge nudge={nudge} /> : <Skeleton h={120} />}

      <footer className="mt-auto pt-8 text-center text-xs text-[var(--color-muted)]">
        Data: ERCOT public dashboards. Emission factors: EPA eGRID + IPCC AR6.
        {current?.source === "mock" ? " (Demo data — live feed unavailable.)" : ""}
      </footer>
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return (
    <div
      className="animate-pulse rounded-3xl bg-[var(--color-card)]"
      style={{ height: h }}
    />
  );
}
