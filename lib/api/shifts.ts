import type { DriverShift } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchShifts(): Promise<DriverShift[]> {
  if (!USE_MOCKS) return notImplemented("shifts");
  return delay([...useMockWorldStore.getState().shifts]);
}

export async function startShift(input: { driverId: string; vehicleId: string }): Promise<void> {
  if (!USE_MOCKS) return notImplemented("shifts");
  useMockWorldStore.getState().startShift(input);
  return delay(undefined);
}

export async function endShift(id: string): Promise<void> {
  if (!USE_MOCKS) return notImplemented("shifts");
  useMockWorldStore.getState().endShift(id);
  return delay(undefined);
}
