import type { FormEvent } from "react";
import { Button, TextInput } from "@navyug/ui";
import type { FlowState, UpdateFlow } from "./types";

interface FirstDeviceStepProps {
  state: FlowState;
  update: UpdateFlow;
  onFinish: () => void;
  onSkip: () => void;
  registering: boolean;
}

export function FirstDeviceStep({ state, update, onFinish, onSkip, registering }: FirstDeviceStepProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onFinish();
  }

  return (
    <>
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
        Step 3 of 3 · Add Your First Device
      </div>
      <h1 className="mt-4 font-sans text-[22px] font-bold tracking-tight text-navy">Connect your first vehicle</h1>
      <p className="mt-1.5 font-sans text-[12.5px] font-medium leading-relaxed text-ink-muted">
        Enter the ID printed on your Navyug GPS device and the vehicle it's installed in. You can
        add more devices anytime.
      </p>
      <form className="mt-6 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Device ID / IMEI"
          placeholder="NVG-00000 or 15-digit IMEI"
          value={state.deviceForm.deviceId}
          onChange={(e) => update({ deviceForm: { ...state.deviceForm, deviceId: e.target.value } })}
        />
        <TextInput
          label="Vehicle RC Number"
          placeholder="DL 1LAE 1234"
          value={state.deviceForm.vehicleReg}
          onChange={(e) => update({ deviceForm: { ...state.deviceForm, vehicleReg: e.target.value } })}
        />
        <TextInput
          label="Chassis Number"
          placeholder="17-character VIN, e.g. MA3EYD32S00C81244"
          value={state.deviceForm.chassisNo}
          onChange={(e) => update({ deviceForm: { ...state.deviceForm, chassisNo: e.target.value } })}
        />
        <Button type="submit" loading={registering} className="mt-1 h-[46px] w-full">
          Add Device &amp; Finish Setup
        </Button>
      </form>
      <div className="mt-4 text-center">
        <button type="button" onClick={onSkip} className="font-sans text-[12.5px] font-semibold text-ink-muted">
          Skip — add devices later
        </button>
      </div>
    </>
  );
}
