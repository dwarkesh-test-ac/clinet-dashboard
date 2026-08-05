import type { Geofence } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchGeofences(): Promise<Geofence[]> {
  if (!USE_MOCKS) return notImplemented("geofences");
  return delay([...useMockWorldStore.getState().geofences]);
}

export async function createGeofence(
  input: Pick<Geofence, "name" | "shape" | "alertOn" | "center" | "radiusKm" | "points">,
): Promise<Geofence> {
  if (!USE_MOCKS) return notImplemented("geofences");
  const geofence: Geofence = {
    ...input,
    id: `geo-new-${Date.now()}`,
    vehicleCount: 0,
    createdAt: new Date().toISOString(),
  };
  useMockWorldStore.setState((s) => ({ geofences: [geofence, ...s.geofences] }));
  return delay(geofence);
}
