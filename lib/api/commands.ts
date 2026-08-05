import type { DeviceCommandLogEntry } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchCommandLog(): Promise<DeviceCommandLogEntry[]> {
  if (!USE_MOCKS) return notImplemented("commands");
  const sorted = [...useMockWorldStore.getState().commandLog].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
  return delay(sorted);
}

export async function sendCommand(vehicleReg: string, command: string): Promise<DeviceCommandLogEntry> {
  if (!USE_MOCKS) return notImplemented("commands");
  const entry: DeviceCommandLogEntry = {
    id: `cmd-new-${Date.now()}`,
    time: new Date().toISOString(),
    vehicleReg,
    command,
    by: "Demo User",
    status: "Pending",
  };
  useMockWorldStore.setState((s) => ({ commandLog: [entry, ...s.commandLog] }));
  setTimeout(() => {
    useMockWorldStore.setState((s) => ({
      commandLog: s.commandLog.map((c) => (c.id === entry.id ? { ...c, status: "Success" } : c)),
    }));
  }, 2200);
  return delay(entry);
}
