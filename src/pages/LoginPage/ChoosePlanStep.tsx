import { useMemo } from "react";
import { CheckCircle, Minus, Plus } from "@phosphor-icons/react";
import { Button } from "@navyug/ui";
import { ADDONS, BASE_PRICE, computePlanTotals } from "../../lib/addons";
import type { FlowState, UpdateFlow } from "./types";

const BASE_FEATURES = [
  "Live map & real-time tracking",
  "Vehicle & driver management",
  "30-day trip history",
  "Standard email alerts",
];

interface ChoosePlanStepProps {
  state: FlowState;
  update: UpdateFlow;
  onContinue: () => void;
}

export function ChoosePlanStep({ state, update, onContinue }: ChoosePlanStepProps) {
  const calc = useMemo(() => computePlanTotals(state.addons, state.calcDeviceCount), [state.addons, state.calcDeviceCount]);

  function toggleAddon(id: string) {
    update({ addons: { ...state.addons, [id]: !state.addons[id] } });
  }

  function setDeviceCount(delta: number) {
    update({ calcDeviceCount: Math.max(1, Math.min(500, state.calcDeviceCount + delta)) });
  }

  return (
    <>
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
        Step 1 of 3 · Build Your Plan
      </div>
      <h1 className="mt-4 font-sans text-[22px] font-bold tracking-tight text-navy">Price calculator</h1>
      <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
        One base plan, add only what you need. Total recalculates live — change anytime, no lock-in.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[13.5px] font-bold text-ink">Navyug Base</span>
            <span className="rounded-full bg-success-subtle px-2.5 py-0.5 font-sans text-[10.5px] font-bold text-success">INCLUDED</span>
          </div>
          <div className="mt-2 font-sans text-2xl font-extrabold text-ink">
            ₹{BASE_PRICE}
            <span className="font-sans text-[12px] font-medium text-ink-faint"> /device/mo</span>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5">
            {BASE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-ink-soft">
                <CheckCircle size={14} weight="fill" className="text-success" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-line-soft pt-3.5">
            <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Fleet Size (Estimate)</div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeviceCount(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-surface-subtle"
                aria-label="Decrease device count"
              >
                <Minus size={13} weight="bold" />
              </button>
              <span className="w-10 text-center font-sans text-[16px] font-bold text-ink">{state.calcDeviceCount}</span>
              <button
                type="button"
                onClick={() => setDeviceCount(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-surface-subtle"
                aria-label="Increase device count"
              >
                <Plus size={13} weight="bold" />
              </button>
              <span className="font-sans text-[11.5px] font-medium text-ink-faint">devices to be tracked</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line p-4">
          <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Add-ons · Toggle What You Need</div>
          <div className="mt-3 flex flex-col gap-2">
            {ADDONS.map((a) => {
              const active = !!state.addons[a.id];
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAddon(a.id)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    active ? "border-brand bg-brand-subtle" : "border-line bg-white"
                  }`}
                >
                  <Icon size={16} weight="fill" className={active ? "text-brand" : "text-ink-faint"} />
                  <span className="min-w-0 flex-1 font-sans text-[12px] font-semibold text-ink">{a.label}</span>
                  <span className="shrink-0 font-mono text-[10.5px] font-bold text-ink-faint">
                    {a.per === "flat" ? `₹${a.price}/mo flat` : `+₹${a.price}/device/mo`}
                  </span>
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                    style={{ borderColor: active ? "#2563EB" : "#D1D5DB", background: active ? "#2563EB" : "#fff" }}
                  >
                    {active && <CheckCircle size={12} weight="fill" className="text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line-soft bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Estimated Monthly Total</div>
          <div className="mt-1 font-sans text-2xl font-extrabold text-ink">₹{calc.total.toLocaleString("en-IN")}<span className="text-[13px] font-medium text-ink-faint"> /month</span></div>
          <div className="mt-1 font-sans text-[11px] font-medium text-ink-faint">
            {state.calcDeviceCount} devices × ₹{calc.devRate}{calc.flatAddonPrice > 0 ? ` + ₹${calc.flatAddonPrice} flat` : ""} + GST
          </div>
        </div>
        <Button onClick={onContinue} className="h-[46px] w-full sm:w-auto sm:px-8">
          Continue
        </Button>
      </div>
      <p className="mt-2 font-sans text-[10.5px] font-medium text-ink-faint">
        GST 18% extra · change add-ons or fleet size anytime — changes prorate on the next invoice · hardware assumed already owned.
      </p>
    </>
  );
}
