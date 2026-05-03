"use client";

import { useCallback, useEffect, useState } from "react";
import { Dial } from "./Dial";
import { ForecastChart } from "./ForecastChart";
import { Nudge } from "./Nudge";
import { ZipPicker } from "./ZipPicker";
import { buildNudge, cleanestWindow } from "@/lib/carbon/nudge";
import { DEFAULT_BA, type BACode } from "@/lib/zones/balancingAuthorities";
import type { CurrentIntensity, Forecast } from "@/lib/types";

const ZONE_KEY = "gcc:ba";
const ZIP_KEY = "gcc:zip";
const STATE_KEY = "gcc:state";

export function Dashboard() {
  const [ba, setBA] = useState<BACode>(DEFAULT_BA);
  const [state, setState] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentIntensity | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedBA = localStorage.getItem(ZONE_KEY);
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedBA) setBA(savedBA as BACode);
    if (savedState) setState(savedState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ZONE_KEY, ba);
    if (state) localStorage.setItem(STATE_KEY, state);
  }, [ba, state]);

  // Fetch on BA change
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCurrent(null);
    setForecast(null);
    Promise.all([
      fetch(`/api/intensity?ba=${ba}`).then((r) => r.json()),
      fetch(`/api/forecast?ba=${ba}`).then((r) => r.json()),
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
  }, [ba]);

  const handleZip = useCallback(async (zip: string): Promise<string | null> => {
    const res = await fetch(`/api/zip-lookup?zip=${zip}`);
    const json = await res.json();
    if (!json.ok) {
      switch (json.reason) {
        case "invalid": return "Enter a 5-digit ZIP.";
        case "not-us": return "We cover the US grid only.";
        case "unsupported": return "That region isn't on the EIA-930 grid (Alaska, Hawaii, military).";
        default: return "Couldn't resolve that ZIP.";
      }
    }
    setBA(json.ba);
    setState(json.state);
    if (typeof window !== "undefined") localStorage.setItem(ZIP_KEY, zip);
    return null;
  }, []);

  const nudge = forecast ? buildNudge(forecast.hours) : null;
  const window4 = forecast ? cleanestWindow(forecast.hours, 4) : null;
  const highlightStart = forecast && window4 ? forecast.hours[window4.startIdx]?.ts : undefined;
  const highlightEnd =
    forecast && window4 ? forecast.hours[Math.min(window4.startIdx + 3, forecast.hours.length - 1)]?.ts : undefined;

  const isMock = current?.source === "mock" || forecast?.source === "mock";

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Grid Carbon Clock</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Live carbon intensity for the US grid. Enter your ZIP.
          </p>
        </div>
        <ZipPicker baName={current?.baName ?? "—"} state={state} onZip={handleZip} />
      </header>

      {isMock ? (
        <div className="rounded-2xl border border-[var(--color-mid)] bg-[var(--color-card)] p-3 text-sm">
          <strong>Demo data.</strong> Add a free EIA API key (
          <a className="underline" href="https://www.eia.gov/opendata/register.php" target="_blank" rel="noreferrer">
            register here
          </a>
          ) to <code className="rounded bg-black/30 px-1">EIA_API_KEY</code> in
          <code className="rounded bg-black/30 px-1">.env.local</code> for live numbers.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[var(--color-dirty)] bg-[var(--color-card)] p-4 text-sm">
          Couldn&apos;t load grid data: {error}
        </div>
      ) : null}

      {current ? (
        <Dial
          gPerKWh={current.gPerKWh}
          tier={current.tier}
          asOf={current.asOf}
          baName={current.baName}
          topFuel={current.topFuel}
          mix={current.mix}
        />
      ) : (
        <Skeleton h={360} />
      )}

      {forecast ? (
        <ForecastChart hours={forecast.hours} highlightStart={highlightStart} highlightEnd={highlightEnd} />
      ) : (
        <Skeleton h={320} />
      )}

      {nudge ? <Nudge nudge={nudge} /> : <Skeleton h={120} />}

      <footer className="mt-auto pt-8 text-center text-xs text-[var(--color-muted)]">
        Data: <a className="underline" href="https://www.eia.gov/opendata/" target="_blank" rel="noreferrer">EIA-930</a>{" "}
        hourly fuel mix per balancing authority. Emission factors: EPA eGRID + IPCC AR6.
        Forecast: 7-day hour-of-day average.
        {state ? <> ZIP→grid mapping is at the state level — accuracy varies near BA borders.</> : null}
      </footer>
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-3xl bg-[var(--color-card)]" style={{ height: h }} />;
}
