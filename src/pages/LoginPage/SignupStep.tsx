import type { FormEvent } from "react";
import { ArrowLeft, Buildings, User } from "@phosphor-icons/react";
import { Button, TextInput } from "@navyug/ui";
import { CaptchaField } from "./CaptchaField";
import type { AcctType, FlowState, UpdateFlow } from "./types";

interface SignupStepProps {
  state: FlowState;
  update: UpdateFlow;
  onChooseType: (type: AcctType) => void;
  onBackToType: () => void;
  onSubmit: () => void;
  onRefreshCaptcha: () => void;
  onGotoSignin: () => void;
}

export function SignupStep({ state, update, onChooseType, onBackToType, onSubmit, onRefreshCaptcha, onGotoSignin }: SignupStepProps) {
  if (state.signupStep === "type") {
    return (
      <>
        <h1 className="font-sans text-[22px] font-bold tracking-tight text-navy">Who's setting this up?</h1>
        <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
          This decides what we ask next — everything else about Navyug works the same either way.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onChooseType("individual")}
            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:border-brand/50 hover:bg-surface-subtle"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
              <User size={18} weight="fill" />
            </span>
            <div>
              <div className="font-sans text-[13.5px] font-bold text-ink">Individual</div>
              <div className="mt-0.5 font-sans text-[12px] font-medium text-ink-muted">One or a few of your own vehicles</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onChooseType("organization")}
            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:border-brand/50 hover:bg-surface-subtle"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
              <Buildings size={18} weight="fill" />
            </span>
            <div>
              <div className="font-sans text-[13.5px] font-bold text-ink">Organization</div>
              <div className="mt-0.5 font-sans text-[12px] font-medium text-ink-muted">A company or fleet operator with GSTIN</div>
            </div>
          </button>
        </div>
        <div className="mt-6 text-center font-sans text-[12.5px] font-medium text-ink-muted">
          Already have an account?{" "}
          <button type="button" onClick={onGotoSignin} className="font-semibold text-brand">
            Sign in
          </button>
        </div>
      </>
    );
  }

  const isOrg = state.acctType === "organization";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <>
      <button
        type="button"
        onClick={onBackToType}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1.5 font-sans text-[11.5px] font-semibold text-ink-muted"
      >
        <ArrowLeft size={12} weight="bold" />
        {isOrg ? "Organization" : "Individual"}
      </button>
      <h1 className="font-sans text-[22px] font-bold tracking-tight text-navy">Create your account</h1>
      <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
        Set up your Navyug fleet in under two minutes.
      </p>
      <form className="mt-6 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label={isOrg ? "Company Name" : "Full Name"}
          placeholder={isOrg ? "Shastri Logistics Pvt. Ltd." : "Rohan Shastri"}
          value={state.signupName}
          onChange={(e) => update({ signupName: e.target.value })}
        />
        {isOrg && (
          <>
            <TextInput
              label="GSTIN (optional)"
              placeholder="06AABCS1429P1ZQ"
              value={state.signupGstin}
              onChange={(e) => update({ signupGstin: e.target.value })}
            />
            <TextInput
              label="Company PAN"
              placeholder="AABCS1429P"
              value={state.signupPan}
              onChange={(e) => update({ signupPan: e.target.value })}
            />
            <p className="-mt-2 font-sans text-[11px] font-medium leading-relaxed text-ink-faint">
              GSTIN speeds up tax invoicing but isn't required to sign up — PAN alone identifies the company.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Contact Person"
                placeholder="Anil Mehta"
                value={state.signupContactName}
                onChange={(e) => update({ signupContactName: e.target.value })}
              />
              <TextInput
                label="Contact Phone"
                placeholder="+91 98xxx xxxxx"
                value={state.signupContactPhone}
                onChange={(e) => update({ signupContactPhone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ink-faint">Registered Address</span>
              <textarea
                value={state.signupAddress}
                onChange={(e) => update({ signupAddress: e.target.value })}
                placeholder="Plot / street, city, state, PIN code"
                rows={2}
                className="rounded-lg border border-line bg-surface-subtle px-3.5 py-2.5 font-sans text-[13px] text-ink outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </>
        )}
        <TextInput
          label={isOrg ? "Company Email" : "Phone or Email"}
          placeholder="you@company.com"
          value={state.signupEmail}
          onChange={(e) => update({ signupEmail: e.target.value })}
        />
        <TextInput
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          value={state.signupPassword}
          onChange={(e) => update({ signupPassword: e.target.value })}
        />
        <CaptchaField
          code={state.captchaCode}
          value={state.captchaInput}
          onChange={(v) => update({ captchaInput: v })}
          onRefresh={onRefreshCaptcha}
        />
        <Button type="submit" className="mt-1 h-[46px] w-full">
          Create Account
        </Button>
      </form>
    </>
  );
}
