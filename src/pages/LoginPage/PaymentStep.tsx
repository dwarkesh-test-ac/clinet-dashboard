import { useMemo } from "react";
import { Button } from "@navyug/ui";
import { computePlanTotals } from "../../lib/addons";
import type { FlowState, UpdateFlow } from "./types";

interface PaymentStepProps {
  state: FlowState;
  update: UpdateFlow;
  onAuthorize: () => void;
  onBack: () => void;
}

export function PaymentStep({ state, update, onAuthorize, onBack }: PaymentStepProps) {
  const calc = useMemo(() => computePlanTotals(state.addons, state.calcDeviceCount), [state.addons, state.calcDeviceCount]);
  const isOrg = state.acctType === "organization";
  const isUpiPay = state.payMethod === "upi";

  const planName = `Navyug Base${calc.activeCount > 0 ? ` + ${calc.activeCount} add-on${calc.activeCount > 1 ? "s" : ""}` : ""}`;
  const mandateLabel = isOrg ? "Mandate Type" : "Autopay Method";
  const rail1Label = isOrg ? "NACH e-Mandate" : "UPI Autopay";
  const rail2Label = isOrg ? "Invoice on terms" : "Card";

  return (
    <>
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
        Step 2 of 3 · Authorize Payment
      </div>
      <h1 className="mt-4 font-sans text-[22px] font-bold tracking-tight text-navy">Set up {planName} mandate</h1>
      <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
        You are authorizing a mandate, not paying now. The first metered invoice is raised at the
        end of your billing cycle.
      </p>

      <div className="mt-5 flex flex-col gap-1.5 rounded-xl border border-line-soft bg-surface-subtle p-4 font-sans text-[12.5px] font-medium text-ink-soft">
        <div className="flex items-center justify-between">
          <span>Devices</span>
          <span className="font-mono">{state.calcDeviceCount} devices × ₹{calc.devRate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-mono">₹{calc.sub.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>GST (18%)</span>
          <span className="font-mono">₹{calc.gst.toLocaleString("en-IN")}</span>
        </div>
        <div className="my-1 border-t border-line" />
        <div className="flex items-center justify-between font-bold text-ink">
          <span>Total</span>
          <span className="font-mono">₹{calc.total.toLocaleString("en-IN")} / month</span>
        </div>
      </div>

      <div className="mt-5">
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ink-faint">{mandateLabel}</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update({ payMethod: "upi" })}
            className={`rounded-lg border px-3 py-2.5 font-sans text-[12.5px] font-semibold transition-colors ${
              isUpiPay ? "border-brand bg-brand-subtle text-brand" : "border-line text-ink-muted"
            }`}
          >
            {rail1Label}
          </button>
          <button
            type="button"
            onClick={() => update({ payMethod: "card" })}
            className={`rounded-lg border px-3 py-2.5 font-sans text-[12.5px] font-semibold transition-colors ${
              !isUpiPay ? "border-brand bg-brand-subtle text-brand" : "border-line text-ink-muted"
            }`}
          >
            {rail2Label}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isUpiPay ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ink-faint">
              {isOrg ? "Bank Account Number" : "UPI ID"}
            </span>
            <input
              value={state.upiId}
              onChange={(e) => update({ upiId: e.target.value })}
              placeholder={isOrg ? "50100xxxxxxxxx · for NACH debit" : "yourname@okhdfc"}
              className="h-11 rounded-lg border border-line bg-surface-subtle px-3.5 font-sans text-[13.5px] font-medium text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-line-soft bg-surface-subtle p-3.5">
            <div className="font-sans text-[13px] font-semibold text-ink">
              {isOrg ? "Net 30 invoice-on-terms" : "HDFC Bank Business Card"}
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] text-ink-faint">
              {isOrg ? "PO-based · pay within 30 days of invoice" : "•••• •••• •••• 4821 · Expires 08/28"}
            </div>
          </div>
        )}
      </div>

      <Button onClick={onAuthorize} loading={state.paying} className="mt-5 h-[46px] w-full">
        {state.paying ? "Authorizing mandate…" : "Authorize & Activate"}
      </Button>
      <div className="mt-4 text-center">
        <button type="button" onClick={onBack} className="font-sans text-[12px] font-semibold text-ink-muted">
          ← Change plan
        </button>
      </div>
    </>
  );
}
