import { useMemo, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, Skeleton } from "@navyug/ui";
import { useBillingCycle, useInvoices, useUsageLedger } from "../../hooks/useBilling";
import { useVehicles } from "../../hooks/useVehicles";
import { useAuthStore } from "../../stores/authStore";
import { useUiStore } from "../../stores/uiStore";
import { formatDate } from "../../lib/format";
import { computeDeviceRate, GST_RATE } from "../../lib/pricing";
import { PaymentMethodsCard } from "./PaymentMethodsCard";
import { PaymentHealthCard } from "./PaymentHealthCard";
import { PAYMENT_STAGES } from "./stages";
import type { InvoiceStatus } from "../../types";

const INVOICE_TONE: Record<InvoiceStatus, "success" | "warning" | "danger"> = {
  Paid: "success",
  Due: "warning",
  Overdue: "danger",
};

export function BillingPage() {
  const { data: cycle } = useBillingCycle();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: ledger, isLoading: ledgerLoading } = useUsageLedger();
  const { data: vehicles } = useVehicles();
  const { modules } = useAuthStore();
  const showToast = useUiStore((s) => s.showToast);
  const [stageIndex, setStageIndex] = useState(0);

  const fleetSize = vehicles?.length ?? 0;
  const { devRate } = computeDeviceRate(modules);

  const cycleMath = useMemo(() => {
    if (!cycle) return null;
    const cycleEnd = new Date(cycle.cycleEndDate);
    const cycleStart = new Date(cycleEnd);
    cycleStart.setDate(cycleStart.getDate() - 30);
    const daysElapsed = Math.max(0, Math.min(30, Math.round((Date.now() - cycleStart.getTime()) / 86_400_000)));
    const cyclePct = (daysElapsed / 30) * 100;
    const deviceSubscriptions = fleetSize * devRate * (daysElapsed / 30);
    const adjustments = (ledger ?? []).reduce((s, e) => s + e.amount, 0);
    const subtotal = deviceSubscriptions + adjustments;
    const cgst = subtotal * (GST_RATE / 2);
    const sgst = subtotal * (GST_RATE / 2);
    const accruedTotal = subtotal + cgst + sgst;
    const estTotal = fleetSize * devRate * (1 + GST_RATE);
    const autoChargeDate = new Date(cycleEnd);
    autoChargeDate.setDate(autoChargeDate.getDate() + 3);
    return {
      cycleStart,
      cycleEnd,
      daysElapsed,
      cyclePct,
      deviceSubscriptions,
      adjustments,
      cgst,
      sgst,
      accruedTotal,
      estTotal,
      autoChargeDate,
      deviceDays: fleetSize * daysElapsed,
    };
  }, [cycle, fleetSize, devRate, ledger]);

  const stage = PAYMENT_STAGES[stageIndex]!;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      {stageIndex > 0 && (
        <div
          className={`mb-3 flex flex-wrap items-center gap-2.5 rounded-xl border p-3.5 ${
            stage.tone === "danger" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <WarningCircle size={16} weight="fill" className={stage.tone === "danger" ? "text-danger" : "text-amber-600"} />
          <span className="font-sans text-[12.5px] font-semibold text-ink">
            Payment status: {stage.label} — {stage.desc}
          </span>
          <Button size="sm" variant="danger" className="ml-auto" onClick={() => showToast("Payment attempted (demo)")}>
            Pay Now
          </Button>
        </div>
      )}

      <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5 font-sans text-[12px] font-medium leading-relaxed text-blue-900">
        Postpaid billing — you use your devices all month and pay one consolidated invoice at the end of each cycle.
        Charges accrue per active device, prorated to the day.
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Current Billing Cycle">
          {!cycleMath ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">
                  {cycleMath.cycleStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – {cycleMath.cycleEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Badge>
              </div>
              <div className="mt-2.5 font-sans text-2xl font-extrabold text-ink">
                ₹{Math.round(cycleMath.accruedTotal).toLocaleString("en-IN")}
                <span className="font-sans text-[13px] font-medium text-ink-faint"> of est. ₹{Math.round(cycleMath.estTotal).toLocaleString("en-IN")} this cycle</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-line-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${cycleMath.cyclePct}%` }} />
              </div>
              <div className="mt-1.5 font-sans text-[11.5px] font-medium text-ink-muted">
                Day {cycleMath.daysElapsed} of 30 · Invoice on {formatDate(cycleMath.cycleEnd.toISOString())} · auto-charge {formatDate(cycleMath.autoChargeDate.toISOString())}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line-soft pt-3.5">
                <div>
                  <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Active Devices</div>
                  <div className="mt-1 font-sans text-[15px] font-bold text-ink">{fleetSize}</div>
                </div>
                <div>
                  <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Rate / Device</div>
                  <div className="mt-1 font-sans text-[15px] font-bold text-ink">₹{devRate}</div>
                </div>
                <div>
                  <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Device-Days</div>
                  <div className="mt-1 font-sans text-[15px] font-bold text-ink">{cycleMath.deviceDays.toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div className="mt-3.5 flex flex-col gap-1.5 border-t border-line-soft pt-3.5 font-sans text-[12.5px] font-medium text-ink-soft">
                <div className="flex items-center justify-between">
                  <span>Device subscriptions ({fleetSize} × ₹{devRate})</span>
                  <span className="font-mono">₹{Math.round(cycleMath.deviceSubscriptions).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-success">
                  <span>Mid-cycle adjustments (prorated)</span>
                  <span className="font-mono">{cycleMath.adjustments >= 0 ? "+" : "-"}₹{Math.abs(Math.round(cycleMath.adjustments)).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CGST 9%</span>
                  <span className="font-mono">₹{Math.round(cycleMath.cgst).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SGST 9%</span>
                  <span className="font-mono">₹{Math.round(cycleMath.sgst).toLocaleString("en-IN")}</span>
                </div>
                <div className="my-1 border-t border-line-soft" />
                <div className="flex items-center justify-between font-bold text-ink">
                  <span>Estimated invoice</span>
                  <span className="font-mono">₹{Math.round(cycleMath.accruedTotal).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <PaymentMethodsCard />

          <Card title="Billed To">
            <div className="font-sans text-[12.5px] font-semibold text-ink">Shastri Logistics Pvt. Ltd.</div>
            <div className="mt-1 font-sans text-[11.5px] font-medium leading-relaxed text-ink-muted">
              Plot 14, Udyog Vihar Phase IV, Gurugram, Haryana – 122015
            </div>
            <div className="mt-2 font-mono text-[10.5px] text-ink-faint">GSTIN 06AABCS1429P1ZQ</div>
          </Card>

          <PaymentHealthCard stageIndex={stageIndex} onStageChange={setStageIndex} />
        </div>
      </div>

      <Card title="Usage This Cycle" className="mt-3" padded={false} bodyClassName="px-4 py-2">
        {ledgerLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <DataTable
            caption="Usage ledger for this billing cycle"
            rows={ledger ?? []}
            getRowId={(e) => e.id}
            emptyTitle="No usage events this cycle"
            columns={[
              { key: "date", header: "Date", sortValue: (e) => e.date, render: (e) => <span className="font-mono text-[11px] text-ink-faint">{formatDate(e.date)}</span> },
              { key: "event", header: "Event", sortValue: (e) => e.event, render: (e) => e.event },
              { key: "days", header: "Days", sortValue: (e) => e.days, render: (e) => <span className="font-mono text-[11.5px]">{e.days}</span>, align: "right" },
              { key: "amount", header: "Amount", sortValue: (e) => e.amount, render: (e) => <span className={`font-mono text-[12px] font-bold ${e.amount >= 0 ? "text-ink" : "text-success"}`}>{e.amount >= 0 ? "+" : "-"}₹{Math.abs(e.amount).toLocaleString("en-IN")}</span>, align: "right" },
            ]}
          />
        )}
      </Card>

      <Card title="Invoice History" className="mt-3" padded={false} bodyClassName="px-4 py-2">
        {invoicesLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <DataTable
            caption="Invoice history"
            rows={invoices ?? []}
            getRowId={(i) => i.id}
            emptyTitle="No invoices yet"
            columns={[
              { key: "id", header: "Invoice", sortValue: (i) => i.id, render: (i) => <span className="font-mono text-[11.5px] font-bold">{i.id}</span> },
              { key: "cycle", header: "Cycle", sortValue: (i) => i.cycleLabel, render: (i) => i.cycleLabel },
              { key: "amount", header: "Amount (incl. GST)", sortValue: (i) => i.amount, render: (i) => <span className="font-mono text-[12px] font-bold">₹{i.amount.toLocaleString("en-IN")}</span>, align: "right" },
              { key: "status", header: "Status", sortValue: (i) => i.status, render: (i) => <Badge tone={INVOICE_TONE[i.status]} withDot>{i.status}</Badge> },
              {
                key: "download",
                header: "",
                align: "right",
                render: (i) => (
                  <button
                    type="button"
                    onClick={() => showToast(`Downloading ${i.id} (demo)`)}
                    className="font-sans text-[11.5px] font-semibold text-brand outline-none hover:underline focus-visible:underline"
                  >
                    Download
                  </button>
                ),
              },
            ]}
          />
        )}
        <p className="mt-2 px-1 pb-2 font-sans text-[10.5px] text-ink-faint">GST tax invoices · HSN 998319</p>
      </Card>
    </div>
  );
}
