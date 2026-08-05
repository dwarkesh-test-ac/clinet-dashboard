import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ToastViewport } from "@navyug/ui";
import { useAuthStore } from "../../stores/authStore";
import { useRegisterDevice } from "../../hooks/useDevices";
import { useUiStore } from "../../stores/uiStore";
import { routes } from "../../config/routes";
import { DEFAULT_ADDONS, computePlanTotals } from "../../lib/addons";
import { TUT } from "./constants";
import { getDestination, isJourneyView } from "./globeMilestones";
import { PromoPanel } from "./PromoPanel";
import { SigninStep } from "./SigninStep";
import { SignupStep } from "./SignupStep";
import { OtpStep } from "./OtpStep";
import { TutorialStep } from "./TutorialStep";
import { ChoosePlanStep } from "./ChoosePlanStep";
import { PaymentStep } from "./PaymentStep";
import { FirstDeviceStep } from "./FirstDeviceStep";
import type { AcctType, FlowState, UpdateFlow } from "./types";

const OnboardingGlobe = lazy(() => import("./OnboardingGlobe"));

const CAPTCHA_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function genCaptcha(): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  return s;
}

function genOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

function initialState(): FlowState {
  return {
    authView: "signin",
    loginEmail: "",
    loginPassword: "",
    signupStep: "type",
    acctType: "organization",
    signupName: "",
    signupGstin: "",
    signupPan: "",
    signupContactName: "",
    signupContactPhone: "",
    signupAddress: "",
    signupEmail: "",
    signupPassword: "",
    captchaCode: genCaptcha(),
    captchaInput: "",
    otpCode: genOtp(),
    otpInput: "",
    otpFrom: "signin",
    tutStep: 0,
    calcDeviceCount: 5,
    addons: { ...DEFAULT_ADDONS },
    payMethod: "upi",
    upiId: "",
    paying: false,
    deviceForm: { deviceId: "", vehicleReg: "", chassisNo: "" },
  };
}

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const registerDevice = useRegisterDevice();
  const { toasts, showToast } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<FlowState>(initialState);
  const [journeyMounted, setJourneyMounted] = useState(false);
  const signinSceneRef = useRef<HTMLDivElement>(null);
  const journeySceneRef = useRef<HTMLDivElement>(null);

  const update: UpdateFlow = (patch) => setState((s) => ({ ...s, ...patch }));
  const journey = isJourneyView(state.authView, state.otpFrom);

  useEffect(() => {
    if (journey) setJourneyMounted(true);
  }, [journey]);

  // React 18's DOM attribute allowlist doesn't yet recognize `inert` as boolean, so the JSX
  // prop renders a bogus stringified attribute — set the real IDL property on the DOM node
  // directly instead. Depends on journeyMounted too since the journey scene only exists in
  // the DOM (and therefore has a ref to sync) once it's first been mounted.
  useEffect(() => {
    if (signinSceneRef.current) signinSceneRef.current.inert = journey;
    if (journeySceneRef.current) journeySceneRef.current.inert = !journey;
  }, [journey, journeyMounted]);

  function finishSignupLogin() {
    const companyName =
      state.signupName.trim() || (state.acctType === "organization" ? "New Fleet Operator" : "Individual Fleet Owner");
    completeOnboarding({ companyName, email: state.signupEmail.trim() || "demo@shastrilogistics.in", addons: state.addons });
    navigate(routes.dashboard, { replace: true });
  }

  useEffect(() => {
    if (state.authView !== "complete") return;
    const t = setTimeout(finishSignupLogin, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.authView]);

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? routes.dashboard;
    return <Navigate to={from} replace />;
  }

  function refreshCaptcha() {
    update({ captchaCode: genCaptcha(), captchaInput: "" });
  }

  function submitSignin() {
    if (!state.loginEmail.trim() || !state.loginPassword.trim()) {
      showToast("Enter both an email and a password to continue");
      return;
    }
    if (state.captchaInput.trim().toUpperCase() !== state.captchaCode) {
      showToast("Captcha does not match — try again");
      refreshCaptcha();
      return;
    }
    update({ authView: "otp", otpFrom: "signin", otpCode: genOtp(), otpInput: "" });
  }

  function gotoSignup() {
    update({ authView: "signup", signupStep: "type", captchaCode: genCaptcha(), captchaInput: "" });
  }

  function gotoSignin() {
    update({ authView: "signin", captchaCode: genCaptcha(), captchaInput: "" });
  }

  function chooseAcctType(type: AcctType) {
    update({ acctType: type, signupStep: "details" });
  }

  function backToType() {
    update({ signupStep: "type" });
  }

  function submitSignup() {
    if (!state.signupEmail.trim()) {
      showToast("Please enter your work email");
      return;
    }
    if (state.captchaInput.trim().toUpperCase() !== state.captchaCode) {
      showToast("Captcha does not match — try again");
      refreshCaptcha();
      return;
    }
    update({ authView: "otp", otpFrom: "signup", otpCode: genOtp(), otpInput: "" });
  }

  function verifyOtp() {
    if (state.otpInput !== state.otpCode) {
      showToast("Incorrect code — check the 6 digits and retry");
      return;
    }
    if (state.otpFrom === "signin") {
      login(state.loginEmail.trim() || "demo@shastrilogistics.in");
      showToast("Welcome back");
      const from = (location.state as { from?: Location })?.from?.pathname ?? routes.dashboard;
      navigate(from, { replace: true });
    } else {
      update({ authView: "tutorial", tutStep: 0, otpInput: "" });
    }
  }

  function resendOtp() {
    update({ otpCode: genOtp(), otpInput: "" });
    showToast("A new code has been sent");
  }

  function otpBack() {
    update({ authView: state.otpFrom, otpInput: "" });
  }

  function tutNext() {
    if (state.tutStep < TUT.length - 1) {
      update({ tutStep: state.tutStep + 1 });
    } else {
      update({ authView: "choosePlan" });
    }
  }

  function tutSkip() {
    update({ authView: "choosePlan" });
  }

  function confirmPlanCalc() {
    update({ authView: "payment", paying: false, payMethod: "upi" });
  }

  function backToPlans() {
    update({ authView: "choosePlan", paying: false });
  }

  function payNow() {
    const calc = computePlanTotals(state.addons, state.calcDeviceCount);
    if (calc.total > 0 && state.payMethod === "upi" && !state.upiId.trim()) {
      showToast("Enter your UPI ID to continue");
      return;
    }
    update({ paying: true });
    setTimeout(() => {
      update({ paying: false, authView: "firstDevice" });
      showToast("Mandate authorized — now add your first device");
    }, 1600);
  }

  function addFirstDevice() {
    if (!state.deviceForm.deviceId.trim() || !state.deviceForm.vehicleReg.trim()) {
      showToast("Device ID and vehicle RC number are required");
      return;
    }
    registerDevice.mutate(
      {
        deviceId: state.deviceForm.deviceId.trim(),
        vehicleReg: state.deviceForm.vehicleReg.trim().toUpperCase(),
        chassisNo: state.deviceForm.chassisNo.trim() || "—",
      },
      {
        onSuccess: () => {
          showToast("Device registered — welcome to Navyug");
          update({ authView: "complete" });
        },
      },
    );
  }

  function skipFirstDevice() {
    showToast("Setup complete — welcome to Navyug");
    update({ authView: "complete" });
  }

  function forgotPassword() {
    showToast("Password reset link sent (demo)");
  }

  const isWideStep = state.authView === "choosePlan" || state.authView === "payment";
  const destination = getDestination(state);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#05070d" }}>
      {/* Sign-in scene — untouched layout, crossfades out once the create-account journey starts */}
      <div
        ref={signinSceneRef}
        className={`absolute inset-0 flex transition-all duration-700 ease-out ${
          journey ? "pointer-events-none opacity-0 blur-sm" : "opacity-100"
        }`}
        style={{ background: "radial-gradient(circle at 28% 18%, #17224a 0%, #0B1220 55%, #05070d 100%)" }}
      >
        <PromoPanel />
        <div className="flex flex-1 justify-center overflow-auto p-4 sm:p-8">
          <div className="my-auto w-full max-w-[420px]">
            <div className="rounded-2xl bg-white p-7 shadow-modal sm:p-9">
              {state.authView === "signin" && (
                <SigninStep
                  state={state}
                  update={update}
                  onSubmit={submitSignin}
                  onRefreshCaptcha={refreshCaptcha}
                  onGotoSignup={gotoSignup}
                  onForgotPassword={forgotPassword}
                />
              )}
              {state.authView === "otp" && state.otpFrom === "signin" && (
                <OtpStep state={state} update={update} onVerify={verifyOtp} onResend={resendOtp} onBack={otpBack} />
              )}
            </div>
            <div className="mt-6 text-center font-sans text-[10.5px] font-semibold text-white/50">
              © 2026 Navyug Innovations · Built for modern fleets
            </div>
          </div>
        </div>
      </div>

      {/* Create-account journey scene — rotating 3D globe background, milestones connect as steps complete */}
      {journeyMounted && (
        <div
          ref={journeySceneRef}
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            journey ? "opacity-100" : "pointer-events-none opacity-0 blur-sm"
          }`}
        >
          <Suspense fallback={<div className="absolute inset-0" style={{ background: "#05070d" }} />}>
            <OnboardingGlobe destination={destination} active={journey} />
          </Suspense>
          {state.authView === "complete" ? (
            <div className="relative z-10 flex h-full items-center justify-center overflow-y-auto p-4 sm:p-8">
              <div
                className="flex flex-col items-center gap-3 text-center"
                style={{ textShadow: "0 2px 24px rgba(0,0,0,.85)" }}
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <div className="font-sans text-[16px] font-bold text-white">Fleet network live</div>
                <div className="font-sans text-[12.5px] font-medium text-white/70">Taking you to your dashboard…</div>
              </div>
            </div>
          ) : (
            <>
              {/* Dark only on the card's side — the rest of the globe (markers, arcs) stays clear */}
              <div
                className="pointer-events-none absolute inset-0 z-10"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(100deg, rgba(4,6,12,0) 36%, rgba(4,6,12,.55) 58%, rgba(4,6,12,.92) 100%)",
                }}
              />
              <div className="relative z-20 flex h-full justify-end overflow-y-auto p-4 py-10 sm:p-8 sm:pr-14 lg:pr-24">
                <div className={`my-auto w-full ${isWideStep ? "max-w-2xl" : "max-w-[420px]"}`}>
                  <div className="rounded-2xl bg-white p-7 shadow-modal sm:p-9">
                    {state.authView === "signup" && (
                      <SignupStep
                        state={state}
                        update={update}
                        onChooseType={chooseAcctType}
                        onBackToType={backToType}
                        onSubmit={submitSignup}
                        onRefreshCaptcha={refreshCaptcha}
                        onGotoSignin={gotoSignin}
                      />
                    )}
                    {state.authView === "otp" && state.otpFrom === "signup" && (
                      <OtpStep state={state} update={update} onVerify={verifyOtp} onResend={resendOtp} onBack={otpBack} />
                    )}
                    {state.authView === "tutorial" && <TutorialStep state={state} onNext={tutNext} onSkip={tutSkip} />}
                    {state.authView === "choosePlan" && (
                      <ChoosePlanStep state={state} update={update} onContinue={confirmPlanCalc} />
                    )}
                    {state.authView === "payment" && (
                      <PaymentStep state={state} update={update} onAuthorize={payNow} onBack={backToPlans} />
                    )}
                    {state.authView === "firstDevice" && (
                      <FirstDeviceStep
                        state={state}
                        update={update}
                        onFinish={addFirstDevice}
                        onSkip={skipFirstDevice}
                        registering={registerDevice.isPending}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <ToastViewport toasts={toasts} />
    </div>
  );
}
