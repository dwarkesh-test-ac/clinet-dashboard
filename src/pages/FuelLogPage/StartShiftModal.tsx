import { useEffect, useState } from "react";
import { Button, Modal, Select } from "@navyug/ui";
import { useDrivers } from "../../hooks/useDrivers";
import { useVehicles } from "../../hooks/useVehicles";
import { useStartShift } from "../../hooks/useShifts";
import { useUiStore } from "../../stores/uiStore";

interface StartShiftModalProps {
  open: boolean;
  onClose: () => void;
  openDriverIds: Set<string>;
}

export function StartShiftModal({ open, onClose, openDriverIds }: StartShiftModalProps) {
  const { data: drivers = [] } = useDrivers();
  const { data: vehicles = [] } = useVehicles();
  const startShift = useStartShift();
  const showToast = useUiStore((s) => s.showToast);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const availableDrivers = drivers.filter((d) => !openDriverIds.has(d.id));

  useEffect(() => {
    if (!open) return;
    const first = availableDrivers[0];
    setDriverId(first?.id ?? "");
    setVehicleId(first?.vehicleId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDriverChange(id: string) {
    setDriverId(id);
    const driver = drivers.find((d) => d.id === id);
    if (driver?.vehicleId) setVehicleId(driver.vehicleId);
  }

  function handleSubmit() {
    if (!driverId || !vehicleId) return;
    startShift.mutate(
      { driverId, vehicleId },
      {
        onSuccess: () => {
          const driver = drivers.find((d) => d.id === driverId);
          showToast(`Shift started for ${driver?.name ?? "driver"}`);
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start Shift"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={startShift.isPending} disabled={!driverId || !vehicleId}>
            Start Shift
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {availableDrivers.length === 0 ? (
          <p className="font-sans text-[12.5px] text-ink-muted">
            Every driver already has an open shift. End one before starting another.
          </p>
        ) : (
          <>
            <Select label="Driver" value={driverId} onChange={(e) => handleDriverChange(e.target.value)}>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.slice(0, 80).map((v) => (
                <option key={v.id} value={v.id}>{v.reg}</option>
              ))}
            </Select>
          </>
        )}
      </div>
    </Modal>
  );
}
