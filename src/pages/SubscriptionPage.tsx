import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Badge, Button, Card } from "@navyug/ui";
import { useKpiSummary } from "../hooks/useVehicles";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";
import { routes } from "../config/routes";
import { ADDONS } from "../lib/addons";
import { ManageAddonsModal } from "../components/ManageAddonsModal";

const PLAN_FEATURES = [
  "Up to 200 vehicles",
  "Real-time GPS tracking",
  "Unlimited trip history",
  "Geofencing & alerts",
  "Device command console",
  "Priority support",
];

export function SubscriptionPage() {
  const { data: kpi } = useKpiSummary();
  const showToast = useUiStore((s) => s.showToast);
  const addons = useAuthStore((s) => s.addons);
  const [addonsModalOpen, setAddonsModalOpen] = useState(false);
  const used = kpi?.totalVehicles ?? 0;
  const limit = 200;
  const usagePct = Math.min(100, (used / limit) * 100);
  const activeAddonCount = ADDONS.filter((a) => addons[a.id]).length;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Card title="Current Plan">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sans text-[18px] font-bold text-ink">Business</div>
              <div className="mt-0.5 font-sans text-[12px] font-medium text-ink-muted">Billed annually · Renews 1 Apr 2027</div>
            </div>
            <span className="rounded-full bg-brand-tint px-3 py-1 font-sans text-[11.5px] font-bold text-brand">Active</span>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 font-sans text-[12.5px] font-medium text-ink-soft">
                <CheckCircle size={15} weight="fill" className="text-success" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2.5 border-t border-line-soft pt-4">
            <Button onClick={() => showToast("Our team will reach out shortly")}>Contact Sales</Button>
            <Button variant="secondary" onClick={() => showToast("Invoice history requested")}>View Invoices</Button>
          </div>
        </Card>

        <Card title="Vehicle Usage">
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-2xl font-bold text-ink">{used}</span>
            <span className="font-sans text-[12px] font-medium text-ink-muted">of {limit} vehicles</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-line-soft">
            <div className="h-full rounded-full bg-brand" style={{ width: `${usagePct}%` }} />
          </div>
          <p className="mt-3 font-sans text-[11.5px] font-medium text-ink-muted">
            You're using {usagePct.toFixed(0)}% of your plan's vehicle allowance. Upgrade for a higher limit.
          </p>
        </Card>
      </div>

      <Card title="Add-ons" className="mt-3" action={<Button size="sm" onClick={() => setAddonsModalOpen(true)}>Manage Add-ons</Button>}>
        <div className="flex flex-wrap gap-2">
          {ADDONS.map((a) => {
            const on = !!addons[a.id];
            return (
              <Badge key={a.id} tone={on ? "success" : "neutral"} withDot>
                {a.label}
              </Badge>
            );
          })}
        </div>
        <p className="mt-3 font-sans text-[11.5px] font-medium text-ink-muted">
          {activeAddonCount} of {ADDONS.length} add-ons active. Toggle any of them on or off any time — no need to
          contact anyone, changes prorate on your next invoice.
        </p>
      </Card>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-line-soft bg-white px-4 py-3">
        <span className="font-sans text-[11.5px] font-medium text-ink-faint">
          Need to pause or end your subscription?
        </span>
        <Link to={routes.cancelPlan} className="font-sans text-[11.5px] font-semibold text-danger hover:underline">
          Cancel Plan
        </Link>
      </div>

      <ManageAddonsModal open={addonsModalOpen} onClose={() => setAddonsModalOpen(false)} />
    </div>
  );
}
