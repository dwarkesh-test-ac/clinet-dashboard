import type { FleetAlert } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchAlerts(): Promise<FleetAlert[]> {
  if (!USE_MOCKS) return notImplemented("alerts");
  const sorted = [...useMockWorldStore.getState().alerts].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  return delay(sorted);
}
