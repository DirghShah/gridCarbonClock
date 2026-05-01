import type { Nudge as NudgeType } from "@/lib/carbon/nudge";

export function Nudge({ nudge }: { nudge: NudgeType }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted)]">
        Today's clean-grid tip
      </div>
      <p className="text-xl font-medium leading-snug">{nudge.headline}</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{nudge.detail}</p>
    </div>
  );
}
