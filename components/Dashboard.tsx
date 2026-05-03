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

type FetchError = { reason: string; message?: string };

export function Dashboard() {
  const [ba, setBA] = useState<BACode>(DEFAULT_BA);
  const [state, setState] = useState<string | null>(null);
  const [zip, setZip] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentIntensity | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<FetchError | null>(null);
  const [locating, setLocating] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedBA = localStorage.getItem(ZONE_KEY);
    const savedState = localStorage.getItem(STATE_KEY);
    const savedZip = localStorage.getItem(ZIP_KEY);
    if (savedBA) setBA(savedBA as BACode);
    if (savedState) setState(savedState);
    if (savedZip) setZip(savedZip);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ZONE_KEY, ba);
    if (state) localStorage.setItem(STATE_KEY, state);
    if (zip) localStorage.setItem(ZIP_KEY, zip);
  }, [ba, state, zip]);

  // Fetch on BA change (or manual refresh)
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCurrent(null);
    setForecast(null);

    Promise.all([
      fetch(`/api/intensity?ba=${ba}`).then(async (r) => ({ ok: r.ok, body: await r.json() })),
      fetch(`/api/forecast?ba=${ba}`).then(async (r) => ({ ok: r.ok, body: await r.json() })),
    ])
      .then(([c, f]) => {
        if (cancelled) return;
        if (!c.ok) {
          setError({ reason: c.body?.reason ?? "unknown", message: c.body?.message });
          return;
        }
        if (!f.ok) {
          setError({ reason: f.body?.reason ?? "unknown", message: f.body?.message });
          return;
        }
        setCurrent(c.body);
        setForecast(f.body);
      })
      .catch((e) => {
        if (cancelled) return;
        setError({ reason: "network", message: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [ba, refreshTick]);

  const handleZip = useCallback(async (newZip: string): Promise<string | null> => {
    const res = await fetch(`/api/zip-lookup?zip=${newZip}`);
    const json = await res.json();
    if (!json.ok) {
      switch (json.reason) {
        case "invalid": return "Enter a 5-digit ZIP.";
        case "not-us": return "We cover the US grid only.";
        case "unsupported": return "That region isn't on the EIA-930 grid (Alaska, Hawaii, military).";
        default: return "Couldn't resolve that ZIP.";
      }
    }
    setBA(json.ba as BACode);
    setState(json.state);
    setZip(newZip);
    setRefreshTick((t) => t + 1); // force refetch even if BA unchanged
    return null;
  }, []);

  const handleLocate = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return "Geolocation isn't available in this browser.";
    }
    setLocating(true);
    try {
      const coords = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        });
      });
      const { latitude, longitude } = coords.coords;
      const res = await fetch(`/api/locate?lat=${latitude}&lon=${longitude}`);
      const json = await res.json();
      if (!json.ok) {
        switch (json.reason) {
          case "not-us": return "Looks like you're outside the US — we cover the US grid only.";
          case "unsupported": return "Your state isn't on the EIA-930 grid yet (AK/HI).";
          case "geocode-failed": return "Couldn't determine your location's grid. Try entering a ZIP.";
          default: return "Location lookup failed.";
        }
      }
      setBA(json.ba as BACode);
      setState(json.state);
      setZip(null);
      setRefreshTick((t) => t + 1);
      return null;
    } catch (err) {
      const e = err as GeolocationPositionError;
      if (e?.code === 1) return "Location permission denied. Enter a ZIP instead.";
      if (e?.code === 3) return "Location request timed out. Try again or enter a ZIP.";
      return "Couldn't get your location.";
    } finally {
      setLocating(false);
    }
  }, []);

  const nudge = forecast ? buildNudge(forecast.hours) : null;
  const window4 = forecast ? cleanestWindow(forecast.hours, 4) : null;
  const highlightStart = forecast && window4 ? forecast.hours[window4.startIdx]?.ts : undefined;
  const highlightEnd =
    forecast && window4 ? forecast.hours[Math.min(window4.startIdx + 3, forecast.hours.length - 1)]?.ts : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Grid Carbon Clock</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Live carbon intensity for the US grid.
          </p>
        </div>
        <ZipPicker
          baName={current?.baName ?? "—"}
          state={state}
          zip={zip}
          onZip={handleZip}
          onLocate={handleLocate}
          locating={locating}
        />
      </header>

      {error ? <ErrorCard err={error} onRetry={() => setRefreshTick((t) => t + 1)} /> : null}

      {!error && current ? <StaleNotice asOf={current.asOf} /> : null}

      {!error && current ? (
        <Dial
          gPerKWh={current.gPerKWh}
          tier={current.tier}
          asOf={current.asOf}
          baName={current.baName}
          topFuel={current.topFuel}
          mix={current.mix}
        />
      ) : !error ? (
        <Skeleton h={360} />
      ) : null}

      {!error && forecast ? (
        <ForecastChart hours={forecast.hours} highlightStart={highlightStart} highlightEnd={highlightEnd} />
      ) : !error ? (
        <Skeleton h={320} />
      ) : null}

      {!error && nudge ? <Nudge nudge={nudge} /> : !error ? <Skeleton h={120} /> : null}

      <footer className="mt-auto pt-8 text-center text-xs text-[var(--color-muted)]">
        Data:{" "}
        <a className="underline" href="https://www.eia.gov/opendata/" target="_blank" rel="noreferrer">
          EIA-930
        </a>{" "}
        hourly fuel mix per balancing authority. Emission factors: EPA eGRID + IPCC AR6. Forecast: 7-day
        hour-of-day average. EIA publishes data with a ~2–3 hour delay.
      </footer>
    </div>
  );
}

function ErrorCard({ err, onRetry }: { err: FetchError; onRetry: () => void }) {
  const headline =
    err.reason === "no-key"
      ? "Live grid data isn't configured"
      : err.reason === "eia-down"
        ? "Live grid data is currently unavailable"
        : err.reason === "network"
          ? "Couldn't reach the server"
          : "Something went wrong loading grid data";
  const body =
    err.reason === "no-key"
      ? "The site needs an EIA API key. If you're the operator, set EIA_API_KEY in your environment."
      : err.reason === "eia-down"
        ? "The EIA-930 feed isn't responding right now. This usually clears within a few minutes."
        : err.message ?? "Try again shortly.";
  return (
    <div className="rounded-3xl border border-[var(--color-dirty)] bg-[var(--color-card)] p-6">
      <div className="mb-1 text-xs uppercase tracking-widest text-[var(--color-dirty)]">Live data unavailable</div>
      <div className="text-lg font-medium">{headline}</div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{body}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5"
      >
        Retry
      </button>
    </div>
  );
}

function StaleNotice({ asOf }: { asOf: string }) {
  const ageHours = (Date.now() - new Date(asOf).getTime()) / 3600_000;
  if (ageHours < 4) return null;
  const display = ageHours < 24 ? `${Math.round(ageHours)} hours` : `${Math.round(ageHours / 24)} days`;
  return (
    <div className="rounded-2xl border border-[var(--color-mid)] bg-[var(--color-card)] p-3 text-sm">
      <strong>Heads up:</strong> EIA-930 hasn&apos;t published fresh data for this grid in {display}. The
      numbers below are from the most recent hour they reported.
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-3xl bg-[var(--color-card)]" style={{ height: h }} />;
}
