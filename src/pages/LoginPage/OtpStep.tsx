import type { FormEvent } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@navyug/ui";
import type { FlowState, UpdateFlow } from "./types";

interface OtpStepProps {
  state: FlowState;
  update: UpdateFlow;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
}

export function OtpStep({ state, update, onVerify, onResend, onBack }: OtpStepProps) {
  const dest = state.otpFrom === "signup" ? state.signupEmail : state.loginEmail;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onVerify();
  }

  return (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-[#F4D06F]">
        <ShieldCheck size={22} weight="fill" />
      </div>
      <h1 className="mt-4 font-sans text-[22px] font-bold tracking-tight text-navy">Verify it's you</h1>
      <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
        We sent a 6-digit code to <strong className="text-ink">{dest || "your email"}</strong> and your
        registered mobile number.
      </p>
      <form className="mt-6 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
        <input
          value={state.otpInput}
          onChange={(e) => update({ otpInput: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          inputMode="numeric"
          placeholder="000000"
          className="h-14 w-full rounded-lg border border-line bg-surface-subtle text-center font-mono text-[22px] font-bold tracking-[.5em] text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 font-mono text-[11px] font-semibold text-ink-faint">
          DEMO OTP · {state.otpCode}
        </div>
        <Button type="submit" className="mt-1 h-[46px] w-full">
          Verify &amp; Continue
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between font-sans text-[12px] font-semibold">
        <button type="button" onClick={onBack} className="text-ink-muted">
          ← Back
        </button>
        <button type="button" onClick={onResend} className="text-brand">
          Resend code
        </button>
      </div>
    </>
  );
}
