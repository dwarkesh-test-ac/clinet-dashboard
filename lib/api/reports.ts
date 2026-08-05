import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export interface ReportRow {
  vehicleId: string;
  vehicleReg: string;
  driverName: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalIdleMin: number;
  alertCount: number;
}

export type ReportType = "trip-summary" | "distance" | "idle-time" | "alerts";

export async function runReport(_type: ReportType): Promise<ReportRow[]> {
  if (!USE_MOCKS) return notImplemented("reports");
  const { vehicles, trips, alerts } = useMockWorldStore.getState();
  const rows: ReportRow[] = vehicles.map((v) => {
    const vTrips = trips.filter((t) => t.vehicleId === v.id);
    const vAlerts = alerts.filter((a) => a.vehicleId === v.id);
    return {
      vehicleId: v.id,
      vehicleReg: v.reg,
      driverName: v.driverName,
      totalTrips: vTrips.length,
      totalDistanceKm: Math.round(vTrips.reduce((s, t) => s + t.distanceKm, 0) * 10) / 10,
      totalIdleMin: vTrips.reduce((s, t) => s + t.idleMin, 0),
      alertCount: vAlerts.length,
    };
  });
  return delay(rows.sort((a, b) => b.totalDistanceKm - a.totalDistanceKm));
}
