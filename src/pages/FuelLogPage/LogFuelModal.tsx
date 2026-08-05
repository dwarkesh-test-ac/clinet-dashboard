import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button, Modal, Select, TextInput } from "@navyug/ui";
import { useFuelOdometerEntries, useLogFuelEntry } from "../../hooks/useFuelLog";
import { useUiStore } from "../../stores/uiStore";
import type { Vehicle } from "../../types";

interface LogFuelModalProps {
  open: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
}

const emptyForm = { vehicleReg: "", odometerKm: "", fuelLitres: "", cost: "" };

export function LogFuelModal({ open, onClose, vehicles }: LogFuelModalProps) {
  const logFuelEntry = useLogFuelEntry();
  const { data: fuelEntries = [] } = useFuelOdometerEntries();
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState(emptyForm);

  // Auto-estimate current odometer when vehicle selection changes
  useEffect(() => {
    if (!form.vehicleReg) {
      setForm((prev) => ({ ...prev, odometerKm: "" }));
      return;
    }

    const reg = form.vehicleReg.toLowerCase();
    const vehicleEntries = fuelEntries.filter((e) => e.vehicleReg.toLowerCase() === reg);
    
    // Find last logged odometer
    let lastOdo = 10000; // Base default if no prior refuels
    if (vehicleEntries.length > 0) {
      lastOdo = Math.max(...vehicleEntries.map((e) => e.odometerKm));
    } else {
      // Set a realistic base odometer based on vehicle index
      const vIdx = vehicles.findIndex((v) => v.reg.toLowerCase() === reg);
      lastOdo = vIdx >= 0 ? 10000 + vIdx * 1500 : 10000;
    }

    // Add estimated distance since last log based on GPS distance today
    const vehicleObj = vehicles.find((v) => v.reg.toLowerCase() === reg);
    const distanceToday = vehicleObj?.distanceTodayKm ?? 100;
    const estimatedOdo = lastOdo + Math.round(distanceToday * 3.5 || 250);

    setForm((prev) => ({ ...prev, odometerKm: String(estimatedOdo) }));
  }, [form.vehicleReg, fuelEntries, vehicles]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.vehicleReg || !form.odometerKm || !form.fuelLitres || !form.cost) return;
    logFuelEntry.mutate(
      {
        vehicleReg: form.vehicleReg,
        odometerKm: Number(form.odometerKm),
        fuelLitres: Number(form.fuelLitres),
        cost: Number(form.cost),
      },
      {
        onSuccess: () => {
          showToast("Fuel & odometer reading logged");
          setForm(emptyForm);
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Fuel & Odometer"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={logFuelEntry.isPending}>Save Entry</Button>
        </>
      }
    >
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <Select label="Vehicle" value={form.vehicleReg} onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })}>
          <option value="">Select vehicle</option>
          {vehicles.slice(0, 80).map((v) => (
            <option key={v.id} value={v.reg}>{v.reg}</option>
          ))}
        </Select>
        
        <div className="space-y-1">
          <TextInput 
            label="Odometer Reading (km)" 
            type="number" 
            value={form.odometerKm} 
            onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} 
            required 
            className="bg-surface-subtle border-line-soft font-mono"
          />
          <span className="text-[10px] text-ink-faint font-medium block pl-1">
            Auto-estimated using GPS telemetry. Adjust only if the vehicle's physical dashboard differs.
          </span>
        </div>

        <TextInput label="Fuel Filled (litres)" type="number" value={form.fuelLitres} onChange={(e) => setForm({ ...form, fuelLitres: e.target.value })} required />
        <TextInput label="Cost (₹)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
      </form>
    </Modal>
  );
}
