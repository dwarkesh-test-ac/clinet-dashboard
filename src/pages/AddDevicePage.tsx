import { useState } from "react";
import type { FormEvent } from "react";
import { Broadcast, Plus, Trash } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, IconButton, Modal, Skeleton, TextInput } from "@navyug/ui";
import { useDevices, useRegisterDevice, useRemoveDevice } from "../hooks/useDevices";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";
import { formatDate } from "../lib/format";
import { BASE_PRICE, computeDeviceRate } from "../lib/pricing";
import type { DeviceStatus, RegisteredDevice } from "../types";

const STATUS_TONE: Record<DeviceStatus, "success" | "warning" | "neutral"> = {
  Active: "success",
  Provisioning: "warning",
  Inactive: "neutral",
};

const STEPS = [
  { title: "Fit the unit", desc: "Mount the GPS tracker to the vehicle's OBD port or wiring harness — takes about 15 minutes." },
  { title: "Register with RC & chassis", desc: "Enter the device ID, vehicle RC number and 17-character chassis number in the form." },
  { title: "Live within 2 minutes", desc: "The vehicle appears on your live map as soon as the device gets its first GPS fix." },
];

const emptyForm = { deviceId: "", vehicleReg: "", chassisNo: "" };

export function AddDevicePage() {
  const { data: devices, isLoading } = useDevices();
  const registerDevice = useRegisterDevice();
  const removeDevice = useRemoveDevice();
  const { modules } = useAuthStore();
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState(emptyForm);
  const [removeTarget, setRemoveTarget] = useState<RegisteredDevice | null>(null);

  const { addonCost, devRate } = computeDeviceRate(modules);
  const basePct = Math.round((BASE_PRICE / devRate) * 100);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.deviceId.trim() || !form.vehicleReg.trim() || !form.chassisNo.trim()) return;
    registerDevice.mutate(
      { deviceId: form.deviceId.trim(), vehicleReg: form.vehicleReg.trim(), chassisNo: form.chassisNo.trim().toUpperCase() },
      {
        onSuccess: () => {
          showToast(`Device ${form.deviceId.trim()} registered — adds ₹${devRate}/month to your next invoice`);
          setForm(emptyForm);
        },
      },
    );
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeDevice.mutate(removeTarget.id, {
      onSuccess: () => {
        showToast(`${removeTarget.deviceId} removed`);
        setRemoveTarget(null);
      },
    });
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Card title="Register a New Device">
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <TextInput
              label="Device ID / IMEI"
              placeholder="NVG-00000 or 15-digit IMEI"
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
              required
            />
            <TextInput
              label="Vehicle RC Number"
              placeholder="DL 1LAE 1234"
              value={form.vehicleReg}
              onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })}
              required
            />
            <TextInput
              label="Chassis Number"
              placeholder="17-character VIN, e.g. MA3EYD32S00C81244"
              value={form.chassisNo}
              onChange={(e) => setForm({ ...form, chassisNo: e.target.value })}
              required
            />
            <div className="flex items-center gap-2.5 border-t border-line-soft pt-3.5">
              <Button type="submit" leftIcon={<Plus size={14} weight="bold" />} loading={registerDevice.isPending}>
                Register Device
              </Button>
              <span className="font-sans text-[11.5px] font-medium text-ink-faint">
                Adds ₹{devRate}/month to your next invoice · prorated from today
              </span>
            </div>
          </form>

          <div className="mt-5 border-t border-line-soft pt-4">
            <div className="mb-3 font-sans text-[13px] font-semibold text-ink">How it works</div>
            <div className="flex flex-col gap-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint font-sans text-[11px] font-bold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-sans text-[12.5px] font-semibold text-ink">{step.title}</div>
                    <div className="mt-0.5 font-sans text-[11.5px] font-medium text-ink-muted">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Cost per Device">
          <div className="font-sans text-2xl font-extrabold text-ink">₹{devRate}<span className="text-[13px] font-medium text-ink-faint">/mo</span></div>
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-line-soft">
            <div className="h-full bg-brand" style={{ width: `${basePct}%` }} />
            <div className="h-full bg-success" style={{ width: `${100 - basePct}%` }} />
          </div>
          <p className="mt-2.5 font-sans text-[11.5px] font-medium text-ink-muted">
            Base ₹{BASE_PRICE} + add-ons ₹{addonCost} = ₹{devRate} per device / month
          </p>
        </Card>
      </div>

      <Card title="Registered Devices" className="mt-3" padded={false} bodyClassName="px-4 py-2">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <DataTable
            caption="Registered devices"
            rows={devices ?? []}
            getRowId={(d) => d.id}
            emptyTitle="No devices registered yet"
            columns={[
              { key: "deviceId", header: "Device ID", sortValue: (d) => d.deviceId, render: (d) => <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold"><Broadcast size={13} className="text-ink-faint" />{d.deviceId}</span> },
              { key: "vehicleReg", header: "Vehicle RC", sortValue: (d) => d.vehicleReg, render: (d) => <span className="font-mono text-[12px] font-bold">{d.vehicleReg}</span> },
              { key: "chassisNo", header: "Chassis No.", sortValue: (d) => d.chassisNo, render: (d) => <span className="font-mono text-[11px] text-ink-faint">{d.chassisNo}</span> },
              { key: "addedAt", header: "Added", sortValue: (d) => d.addedAt, render: (d) => <span className="font-mono text-[11px] text-ink-faint">{formatDate(d.addedAt)}</span> },
              { key: "status", header: "Status", sortValue: (d) => d.status, render: (d) => <Badge tone={STATUS_TONE[d.status]} withDot>{d.status}</Badge> },
              {
                key: "actions",
                header: "",
                align: "right",
                render: (d) => (
                  <IconButton
                    icon={<Trash size={14} />}
                    label={`Remove ${d.deviceId}`}
                    size="sm"
                    onClick={() => setRemoveTarget(d)}
                    className="hover:bg-danger-subtle hover:text-danger"
                  />
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Device"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRemove} loading={removeDevice.isPending}>Remove Device</Button>
          </>
        }
      >
        <p className="font-sans text-[12.5px] font-medium text-ink-soft">
          Remove <span className="font-mono font-bold">{removeTarget?.deviceId}</span>? The vehicle disappears from
          your live map and billing stops immediately.
        </p>
      </Modal>
    </div>
  );
}
