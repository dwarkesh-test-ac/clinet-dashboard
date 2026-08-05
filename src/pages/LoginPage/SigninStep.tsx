import type { FormEvent } from "react";
import { Button, TextInput } from "@navyug/ui";
import { CaptchaField } from "./CaptchaField";
import type { FlowState, UpdateFlow } from "./types";

interface SigninStepProps {
  state: FlowState;
  update: UpdateFlow;
  onSubmit: () => void;
  onRefreshCaptcha: () => void;
  onGotoSignup: () => void;
  onForgotPassword: () => void;
}

export function SigninStep({ state, update, onSubmit, onRefreshCaptcha, onGotoSignup, onForgotPassword }: SigninStepProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <>
      <h1 className="font-sans text-[22px] font-bold tracking-tight text-navy">Sign in to your fleet</h1>
      <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
        Enter your credentials, solve the captcha, and we'll send a one-time code. Demo — any
        email &amp; password work.
      </p>
      <form className="mt-6 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={state.loginEmail}
          onChange={(e) => update({ loginEmail: e.target.value })}
        />
        <TextInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={state.loginPassword}
          onChange={(e) => update({ loginPassword: e.target.value })}
        />
        <CaptchaField
          code={state.captchaCode}
          value={state.captchaInput}
          onChange={(v) => update({ captchaInput: v })}
          onRefresh={onRefreshCaptcha}
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-1.5 font-sans text-[12px] font-medium text-ink-muted">
            <input type="checkbox" className="accent-brand" />
            Remember me
          </label>
          <button type="button" onClick={onForgotPassword} className="font-sans text-[12px] font-semibold text-brand">
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="mt-1 h-[46px] w-full">
          Continue
        </Button>
      </form>
      <div className="mt-6 text-center font-sans text-[12.5px] font-medium text-ink-muted">
        New to Navyug?{" "}
        <button type="button" onClick={onGotoSignup} className="font-semibold text-brand">
          Create an account
        </button>
      </div>
    </>
  );
}
