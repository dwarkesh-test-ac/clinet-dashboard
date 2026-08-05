import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX, WarningCircle, XCircle } from "@phosphor-icons/react";
import { Button, Card } from "@navyug/ui";
import { useBillingCycle, useCancelPlan, useReactivatePlan } from "../hooks/useBilling";
import { useVehicles } from "../hooks/useVehicles";
import { useUiStore } from "../stores/uiStore";
import { formatDate } from "../lib/format";
import { computeDeviceRate, GST_RATE } from "../lib/pricing";
import { routes } from "../config/routes";
import { useAuthStore } from "../stores/authStore";

const REASONS = [
  { id: "too-expensive", label: "Too expensive for our fleet size" },
  { id: "missing-features", label: "Missing features we need" },
  { id: "switching", label: "Switching to another provider" },
  { id: "downsizing", label: "Downsizing or pausing operations" },
  { id: "hardware", label: "Issues with GPS devices or install" },
  { id: "other", label: "Other reason" },
];

const LOSSES = [
  "Live GPS tracking on all your devices",
  "Trip history & timeline records",
  "Overspeed/geofence/ignition alerts",
  "Scheduled reports & driving scores",
  "Team member access",
];

export function CancelPlanPage() {
  const { data: cycle } = useBillingCycle();
  const { data: vehicles } = useVehicles();
  const { modules } = useAuthStore();
  const cancelPlan = useCancelPlan();
  const reactivatePlan = useReactivatePlan();
  const showToast = useUiStore((s) => s.showToast);
  const [reason, setReason] = useState("too-expensive");
  const [note, setNote] = useState("");

  const fleetSize = vehicles?.length ?? 0;
  const { devRate } = computeDeviceRate(modules);
  const estTotal = Math.round(fleetSize * devRate * (1 + GST_RATE));
  const cycleEndLabel = cycle?.cycleEndDate ? formatDate(cycle.cycleEndDate) : "—";
  const showNote = reason === "other" || reason === "missing-features";

  function handleCancel() {
    cancelPlan.mutate(undefined, {
      onSuccess: () => showToast(`Auto-renewal turned off — access until ${cycleEndLabel}`),
    });
  }

  function handleReactivate() {
    reactivatePlan.mutate(undefined, {
      onSuccess: () => showToast("Plan reactivated — auto-renewal is back on"),
    });
  }

  if (cycle?.planCancelled) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-[18px]">
        <Card className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <CalendarX size={26} weight="fill" />
          </div>
          <div className="mt-3.5 font-sans text-[16px] font-bold text-ink">Auto-renewal turned off</div>
          <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
            Your Navyug plan will remain active until <strong>{cycleEndLabel}</strong>, after which auto-renewal
            will not occur and access will end. You can reactivate at any time before then.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={handleReactivate} loading={reactivatePlan.isPending}>Reactivate Plan</Button>
            <Link to={routes.subscription}>
              <Button variant="secondary" className="w-full">Back to Subscription</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <div className="font-sans text-[13px] font-bold text-ink">You're about to cancel your Navyug plan</div>
          <div className="mt-0.5 font-sans text-[12px] font-medium text-ink-muted">
            Your fleet keeps working normally until <strong>{cycleEndLabel}</strong>, after which access ends.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Before You Go — Why Are You Leaving?">
          <div className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 has-[:checked]:border-brand has-[:checked]:bg-brand-tint">
                <input
                  type="radio"
                  name="cancel-reason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  className="h-4 w-4 accent-brand"
                />
                <span className="font-sans text-[12.5px] font-medium text-ink-soft">{r.label}</span>
              </label>
            ))}
          </div>
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell us more (optional)…"
              rows={3}
              className="mt-3 w-full rounded-lg border border-line bg-surface-subtle px-3.5 py-2.5 font-sans text-[12.5px] text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <Card title="What You'll Lose">
            <div className="flex flex-col gap-2">
              {LOSSES.map((l) => (
                <div key={l} className="flex items-start gap-2">
                  <XCircle size={15} weight="fill" className="mt-0.5 shrink-0 text-danger" />
                  <span className="font-sans text-[12px] font-medium text-ink-soft">{l}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Final Invoice">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] font-medium text-ink-muted">Current cycle to {cycleEndLabel}</span>
              <span className="font-mono text-[13px] font-bold text-ink">₹{estTotal.toLocaleString("en-IN")}</span>
            </div>
            <p className="mt-1.5 font-sans text-[11px] font-medium text-ink-faint">
              Billed on {cycleEndLabel} as usual, then no further charges.
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center gap-2.5 rounded-xl border border-line-soft bg-white p-4 sm:flex-row sm:justify-between">
        <span className="font-sans text-[11.5px] font-medium text-ink-faint">
          Changed your mind? You can keep everything with one click.
        </span>
        <div className="flex gap-2.5">
          <Link to={routes.subscription}>
            <Button>Keep My Plan</Button>
          </Link>
          <Button variant="secondary" className="border-danger text-danger hover:bg-danger-subtle" onClick={handleCancel} loading={cancelPlan.isPending}>
            Cancel Plan Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
