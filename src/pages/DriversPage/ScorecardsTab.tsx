import { useMemo, useState } from "react";
import { ChalkboardTeacher, Medal, Star, ThumbsUp } from "@phosphor-icons/react";
import { KpiCard, Skeleton } from "@navyug/ui";
import { useScorecards } from "../../hooks/useScorecards";
import { ScorecardDetailModal } from "./ScorecardDetailModal";
import type { DriverScorecard } from "../../types";

const GRADE_COLOR: Record<DriverScorecard["grade"], string> = { A: "#16A34A", B: "#D97706", C: "#EF4444" };
const GRADE_BAND: Record<DriverScorecard["grade"], string> = { A: "Excellent", B: "Good", C: "Needs coaching" };

export function ScorecardsTab() {
  const { data: scorecards, isLoading } = useScorecards();
  const [selected, setSelected] = useState<DriverScorecard | null>(null);

  const stats = useMemo(() => {
    const rows = scorecards ?? [];
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
    return {
      avg,
      excellent: rows.filter((r) => r.grade === "A").length,
      good: rows.filter((r) => r.grade === "B").length,
      needsCoaching: rows.filter((r) => r.grade === "C").length,
    };
  }, [scorecards]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)
          : [
              { label: "Fleet Avg Score", value: `${stats.avg}/100`, icon: <Medal size={14} className="text-brand" weight="fill" /> },
              { label: "Excellent (A)", value: stats.excellent, icon: <Star size={14} className="text-success" weight="fill" /> },
              { label: "Good (B)", value: stats.good, icon: <ThumbsUp size={14} className="text-amber-500" weight="fill" /> },
              { label: "Needs Coaching (C)", value: stats.needsCoaching, icon: <ChalkboardTeacher size={14} className="text-danger" weight="fill" /> },
            ].map((k) => (
              <KpiCard key={k.label} label={k.label} value={<span className="inline-flex items-center gap-1.5">{k.icon}{k.value}</span>} />
            ))}
      </div>

      <p className="mt-3 font-sans text-[11.5px] font-medium text-ink-muted">
        Scores blend speed discipline, braking, acceleration, cornering and idle control over the trailing 30 days.
      </p>

      {isLoading ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(scorecards ?? []).map((s) => (
            <button
              key={s.driverId}
              type="button"
              onClick={() => setSelected(s)}
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-left outline-none transition-colors hover:border-brand/40 hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div
                className="relative h-14 w-14 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${GRADE_COLOR[s.grade]} ${s.score}%, #E5E7EB 0)` }}
              >
                <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-white">
                  <span className="font-sans text-[13px] font-extrabold text-ink">{s.score}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-sans text-[13px] font-bold text-ink">{s.driverName}</div>
                <div className="mt-0.5 font-mono text-[11px] font-bold text-ink-faint">{s.vehicleReg}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold" style={{ background: `${GRADE_COLOR[s.grade]}1A`, color: GRADE_COLOR[s.grade] }}>
                    {s.grade} · {GRADE_BAND[s.grade]}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10.5px] text-ink-faint">{s.distance30Km.toLocaleString("en-IN")} km · {s.trips30} trips</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <ScorecardDetailModal scorecard={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
