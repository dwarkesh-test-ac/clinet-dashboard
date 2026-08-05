import type { DriverShift, Trip } from "../types";

export interface ShiftStats {
  tripCount: number;
  distanceKm: number;
}

/**
 * Derives a shift's trip count/distance live from the real `Trip[]` data rather than storing it
 * on the shift itself — this is the actual "map this shift + vehicle to its trips" linkage.
 */
export function deriveShiftStats(shift: DriverShift, trips: Trip[]): ShiftStats {
  const start = new Date(shift.startedAt).getTime();
  const end = shift.endedAt ? new Date(shift.endedAt).getTime() : Date.now();
  const matching = trips.filter((t) => {
    if (t.vehicleId !== shift.vehicleId) return false;
    const startedAt = new Date(t.startedAt).getTime();
    return startedAt >= start && startedAt <= end;
  });
  return {
    tripCount: matching.length,
    distanceKm: Math.round(matching.reduce((s, t) => s + t.distanceKm, 0) * 10) / 10,
  };
}

export function shiftDurationMin(shift: DriverShift): number {
  const start = new Date(shift.startedAt).getTime();
  const end = shift.endedAt ? new Date(shift.endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 60_000));
}
