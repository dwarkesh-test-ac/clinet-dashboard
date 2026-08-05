import { CarSimple, Gauge, Speedometer, SteeringWheel, Timer } from "@phosphor-icons/react";
import { Modal } from "@navyug/ui";
import type { DriverScorecard } from "../../types";

const GRADE_COLOR: Record<DriverScorecard["grade"], string> = { A: "#16A34A", B: "#D97706", C: "#EF4444" };
const GRADE_BAND: Record<DriverScorecard["grade"], string> = { A: "Excellent", B: "Good", C: "Needs coaching" };

const BREAKDOWN_ITEMS: Array<{ key: keyof DriverScorecard["breakdown"]; label: string; icon: React.ReactNode }> = [
  { key: "speed", label: "Speed discipline", icon: <Speedometer size={13} /> },
  { key: "braking", label: "Smooth braking", icon: <CarSimple size={13} /> },
  { key: "acceleration", label: "Gentle acceleration", icon: <Gauge size={13} /> },
  { key: "cornering", label: "Cornering", icon: <SteeringWheel size={13} /> },
  { key: "idle", label: "Idle control", icon: <Timer size={13} /> },
];

const RISK_ITEMS: Array<{ key: keyof DriverScorecard["riskEvents"]; label: string }> = [
  { key: "overspeeding", label: "Overspeeding" },
  { key: "harshBraking", label: "Harsh braking" },
  { key: "harshAcceleration", label: "Harsh acceleration" },
  { key: "sharpCornering", label: "Sharp cornering" },
  { key: "excessIdling", label: "Excess idling" },
];

function barColor(value: number): string {
  if (value >= 85) return "#16A34A";
  if (value >= 70) return "#D97706";
  return "#EF4444";
}

interface ScorecardDetailModalProps {
  scorecard: DriverScorecard | null;
  onClose: () => void;
}

export function ScorecardDetailModal({ scorecard, onClose }: ScorecardDetailModalProps) {
  return (
    <Modal open={!!scorecard} onClose={onClose} title="Driving Scorecard">
      {scorecard && (
        <div>
          <div className="flex items-center gap-4">
            <div
              className="relative h-20 w-20 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${GRADE_COLOR[scorecard.grade]} ${scorecard.score}%, #E5E7EB 0)` }}
            >
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white">
                <span className="font-sans text-lg font-extrabold text-ink">{scorecard.score}</span>
              </div>
            </div>
            <div>
              <div className="font-sans text-[15px] font-bold text-ink">{scorecard.driverName}</div>
              <div className="mt-0.5 font-mono text-[11.5px] font-bold text-ink-faint">{scorecard.vehicleReg} · {scorecard.groupName}</div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold" style={{ background: `${GRADE_COLOR[scorecard.grade]}1A`, color: GRADE_COLOR[scorecard.grade] }}>
                Grade {scorecard.grade} · {GRADE_BAND[scorecard.grade]}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line-soft pt-3.5">
            <div className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Score Breakdown</div>
            <div className="flex flex-col gap-2.5">
              {BREAKDOWN_ITEMS.map((item) => {
                const value = scorecard.breakdown[item.key];
                return (
                  <div key={item.key}>
                    <div className="mb-1 flex items-center justify-between font-sans text-[12px] font-medium text-ink-soft">
                      <span className="inline-flex items-center gap-1.5 text-ink-faint">{item.icon}{item.label}</span>
                      <span className="font-mono font-bold text-ink">{value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: barColor(value) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-line-soft pt-3.5">
            <div className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Risk Events · Last 30 Days</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {RISK_ITEMS.map((item) => (
                <div key={item.key} className="rounded-lg bg-surface-subtle p-2.5 text-center">
                  <div className="font-sans text-lg font-extrabold text-ink">{scorecard.riskEvents[item.key]}</div>
                  <div className="mt-0.5 font-sans text-[10px] font-medium leading-tight text-ink-faint">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
