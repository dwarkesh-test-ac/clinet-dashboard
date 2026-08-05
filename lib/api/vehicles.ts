import type { KpiSummary, Vehicle } from "../../types";
import { useMockWorldStore, startLiveTicker } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchVehicles(): Promise<Vehicle[]> {
  if (!USE_MOCKS) return notImplemented("vehicles");
  startLiveTicker();
  return delay([...useMockWorldStore.getState().vehicles]);
}

export async function fetchVehicle(id: string): Promise<Vehicle | undefined> {
  if (!USE_MOCKS) return notImplemented("vehicles");
  startLiveTicker();
  return delay(useMockWorldStore.getState().vehicles.find((v) => v.id === id));
}

export async function fetchKpiSummary(): Promise<KpiSummary> {
  if (!USE_MOCKS) return notImplemented("vehicles");
  const { vehicles, alerts } = useMockWorldStore.getState();
  const summary: KpiSummary = {
    totalVehicles: vehicles.length,
    movingVehicles: vehicles.filter((v) => v.status === "moving").length,
    stoppedVehicles: vehicles.filter((v) => v.status === "stopped").length,
    idleVehicles: vehicles.filter((v) => v.status === "idle").length,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    majorAlerts: alerts.filter((a) => a.severity === "major").length,
  };
  return delay(summary);
}
