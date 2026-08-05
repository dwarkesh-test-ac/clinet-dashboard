import type { RegisteredDevice } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchDevices(): Promise<RegisteredDevice[]> {
  if (!USE_MOCKS) return notImplemented("devices");
  return delay([...useMockWorldStore.getState().devices]);
}

export async function registerDevice(
  input: Pick<RegisteredDevice, "deviceId" | "vehicleReg" | "chassisNo">,
): Promise<void> {
  if (!USE_MOCKS) return notImplemented("devices");
  useMockWorldStore.getState().addDevice(input);
  return delay(undefined);
}

export async function removeDevice(id: string): Promise<void> {
  if (!USE_MOCKS) return notImplemented("devices");
  useMockWorldStore.getState().removeDevice(id);
  return delay(undefined);
}
