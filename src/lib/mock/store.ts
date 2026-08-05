import { create } from "zustand";
import type { DriverShift, FuelOdometerEntry, PaymentMethod, RegisteredDevice, Vehicle } from "../../types";
import { generateWorld, type MockWorld } from "./generate";

interface MockWorldState extends MockWorld {
  tick: () => void;
  addDevice: (input: Pick<RegisteredDevice, "deviceId" | "vehicleReg" | "chassisNo">) => void;
  removeDevice: (id: string) => void;
  logFuelEntry: (input: Pick<FuelOdometerEntry, "vehicleReg" | "odometerKm" | "fuelLitres" | "cost">) => void;
  setPrimaryPaymentMethod: (id: string) => void;
  addPaymentMethod: (input: Pick<PaymentMethod, "type" | "label" | "detail">) => void;
  cancelPlan: () => void;
  reactivatePlan: () => void;
  startShift: (input: { driverId: string; vehicleId: string }) => void;
  endShift: (id: string) => void;
}

const world = generateWorld();

/** Single in-memory "backend" for the mock API layer. Ticks vehicle positions every 5s to fake live GPS. */
export const useMockWorldStore = create<MockWorldState>((set, get) => ({
  ...world,
  addDevice: (input) => {
    const device: RegisteredDevice = {
      ...input,
      id: `dev-new-${Date.now()}`,
      addedAt: new Date().toISOString(),
      status: "Provisioning",
    };
    set((s) => ({ devices: [device, ...s.devices] }));
  },
  removeDevice: (id) => {
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) }));
  },
  logFuelEntry: (input) => {
    const priorEntries = get()
      .fuelOdometerEntries.filter((e) => e.vehicleReg === input.vehicleReg)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const prevOdo = priorEntries[0]?.odometerKm ?? Math.max(0, input.odometerKm - 200);
    const entry: FuelOdometerEntry = { ...input, prevOdo, id: `fo-new-${Date.now()}`, date: new Date().toISOString() };
    set((s) => ({ fuelOdometerEntries: [entry, ...s.fuelOdometerEntries] }));
  },
  setPrimaryPaymentMethod: (id) => {
    set((s) => ({ paymentMethods: s.paymentMethods.map((pm) => ({ ...pm, isPrimary: pm.id === id })) }));
  },
  addPaymentMethod: (input) => {
    const method: PaymentMethod = { ...input, id: `pm-new-${Date.now()}`, isPrimary: false };
    set((s) => ({ paymentMethods: [...s.paymentMethods, method] }));
  },
  cancelPlan: () => set({ planCancelled: true }),
  reactivatePlan: () => set({ planCancelled: false }),
  startShift: ({ driverId, vehicleId }) => {
    const { drivers, vehicles } = get();
    const driver = drivers.find((d) => d.id === driverId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!driver || !vehicle) return;
    const shift: DriverShift = {
      id: `shift-new-${Date.now()}`,
      driverId,
      driverName: driver.name,
      vehicleId,
      vehicleReg: vehicle.reg,
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    set((s) => ({ shifts: [shift, ...s.shifts] }));
  },
  endShift: (id) => {
    set((s) => ({
      shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, endedAt: new Date().toISOString() } : sh)),
    }));
  },
  tick: () => {
    const { vehicles } = get();
    const next: Vehicle[] = vehicles.map((v) => {
      if (v.status !== "moving") return v;
      const headingRad = (v.heading * Math.PI) / 180;
      const metersPerTick = (v.speedKmh * 1000) / 3600 / 20; // ~5s of travel at km/h, softened
      const dLat = (Math.cos(headingRad) * metersPerTick) / 111_320;
      const dLng =
        (Math.sin(headingRad) * metersPerTick) /
        (111_320 * Math.cos((v.lat * Math.PI) / 180));
      const speedDelta = Math.round((Math.random() - 0.5) * 8);
      return {
        ...v,
        lat: v.lat + dLat,
        lng: v.lng + dLng,
        heading: (v.heading + (Math.random() - 0.5) * 12 + 360) % 360,
        speedKmh: Math.max(0, Math.min(110, v.speedKmh + speedDelta)),
        lastUpdate: new Date().toISOString(),
      };
    });
    set({ vehicles: next });
  },
}));

let tickerStarted = false;
export function startLiveTicker() {
  if (tickerStarted) return;
  tickerStarted = true;
  setInterval(() => useMockWorldStore.getState().tick(), 5000);
}
