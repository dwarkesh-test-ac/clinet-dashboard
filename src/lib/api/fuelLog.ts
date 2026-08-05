import type { FuelOdometerEntry } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchFuelOdometerEntries(): Promise<FuelOdometerEntry[]> {
  if (!USE_MOCKS) return notImplemented("fuel-log");
  return delay([...useMockWorldStore.getState().fuelOdometerEntries]);
}

export async function logFuelEntry(
  input: Pick<FuelOdometerEntry, "vehicleReg" | "odometerKm" | "fuelLitres" | "cost">,
): Promise<void> {
  if (!USE_MOCKS) return notImplemented("fuel-log");
  useMockWorldStore.getState().logFuelEntry(input);
  return delay(undefined);
}
