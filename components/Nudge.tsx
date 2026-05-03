import type { Nudge as NudgeType } from "@/lib/carbon/nudge";

export function Nudge({ nudge }: { nudge: NudgeType }) {
  if (nudge.savingsPct <= 0) {
    return (
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Today&apos;s clean-grid tip
        </div>
        <p className="text-base text-[var(--color-muted)]">
          Your grid stays roughly steady over the next 24h — no big shift opportunities.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted)]">
        Today&apos;s clean-grid tip
      </div>
      <p className="text-xl font-medium leading-snug">{nudge.headline}</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{nudge.detail}</p>
    </div>
  );
}
