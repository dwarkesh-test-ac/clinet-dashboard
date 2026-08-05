import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export interface FinancialsSnapshot {
  fleetSize: number;
  movingVehicles: number;
  idleVehicles: number;
  activeAlerts: number;
  criticalAlerts: number;
  majorAlerts: number;
  avgScore: number;
}

export async function fetchFinancialsSnapshot(): Promise<FinancialsSnapshot> {
  if (!USE_MOCKS) return notImplemented("financials");
  const { vehicles, alerts, scorecards } = useMockWorldStore.getState();
  const avgScore = scorecards.length
    ? Math.round(scorecards.reduce((s, c) => s + c.score, 0) / scorecards.length)
    : 0;
  const snapshot: FinancialsSnapshot = {
    fleetSize: vehicles.length,
    movingVehicles: vehicles.filter((v) => v.status === "moving").length,
    idleVehicles: vehicles.filter((v) => v.status === "idle").length,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    majorAlerts: alerts.filter((a) => a.severity === "major").length,
    avgScore,
  };
  return delay(snapshot);
}
