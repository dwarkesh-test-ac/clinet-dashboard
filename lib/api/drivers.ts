import type { Driver } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchDrivers(): Promise<Driver[]> {
  if (!USE_MOCKS) return notImplemented("drivers");
  return delay([...useMockWorldStore.getState().drivers]);
}

export async function createDriver(input: Omit<Driver, "id" | "status" | "joinedAt">): Promise<Driver> {
  if (!USE_MOCKS) return notImplemented("drivers");
  const driver: Driver = {
    ...input,
    id: `drv-new-${Date.now()}`,
    status: "active",
    joinedAt: new Date().toISOString(),
  };
  useMockWorldStore.setState((s) => ({ drivers: [driver, ...s.drivers] }));
  return delay(driver);
}
