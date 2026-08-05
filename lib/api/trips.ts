import type { Trip } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchTrips(vehicleId?: string): Promise<Trip[]> {
  if (!USE_MOCKS) return notImplemented("trips");
  let trips = useMockWorldStore.getState().trips;
  if (vehicleId) trips = trips.filter((t) => t.vehicleId === vehicleId);
  const sorted = [...trips].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  return delay(sorted);
}

export async function fetchTrip(id: string): Promise<Trip | undefined> {
  if (!USE_MOCKS) return notImplemented("trips");
  return delay(useMockWorldStore.getState().trips.find((t) => t.id === id));
}
