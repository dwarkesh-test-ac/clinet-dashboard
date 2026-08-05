import type { FuelOdometerEntry, MatchTone, Trip } from "../types";

export type TimelinePeriod = "today" | "week" | "all";

export interface TimelineDayDivider {
  type: "day";
  label: string;
}

export interface TimelineTripBlock {
  type: "trip";
  from: string;
  to: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  distanceKm: number;
}

export interface TimelineStopBlock {
  type: "stop";
  place: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
}

export type TimelineBlock = TimelineDayDivider | TimelineTripBlock | TimelineStopBlock;

export interface VehicleTimeline {
  vehicleId: string;
  vehicleReg: string;
  driverName: string;
  tripCount: number;
  gpsKm: number;
  odoKm: number | null;
  diffKm: number | null;
  diffPct: number | null;
  matchTone: MatchTone | null;
  blocks: TimelineBlock[];
}

function matchToneFor(pct: number): MatchTone {
  const abs = Math.abs(pct);
  if (abs <= 3) return "match";
  if (abs <= 6) return "minor";
  return "review";
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function periodCutoff(period: TimelinePeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(now.getTime() - 7 * 86_400_000);
}

/**
 * Derives a per-vehicle stop→trip timeline, scoped to a period ("today" / "this week" / "all
 * time") so it's unambiguous which window is on screen — mirrors the design's "GPS auto-detects
 * trips from idle/movement" framing without needing raw GPS pings — a gap between two logged trips
 * is shown as a stop, and a day divider marks each date change within a vehicle's timeline.
 * Reconciles against that vehicle's latest fuel/odometer entry within the same period, if any.
 */
export function buildVehicleTimelines(
  trips: Trip[],
  fuelEntries: FuelOdometerEntry[],
  period: TimelinePeriod = "week",
  maxVehicles = 6,
): VehicleTimeline[] {
  const cutoff = periodCutoff(period);
  const inWindow = (iso: string) => !cutoff || new Date(iso) >= cutoff;

  const byVehicle = new Map<string, Trip[]>();
  trips.forEach((t) => {
    if (!inWindow(t.startedAt)) return;
    const list = byVehicle.get(t.vehicleId) ?? [];
    list.push(t);
    byVehicle.set(t.vehicleId, list);
  });

  const candidates = [...byVehicle.entries()]
    .map(([vehicleId, vehicleTrips]) => ({
      vehicleId,
      vehicleReg: vehicleTrips[0]!.vehicleReg,
      driverName: vehicleTrips[0]!.driverName,
      sorted: [...vehicleTrips].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
    }))
    .sort((a, b) => b.sorted.length - a.sorted.length);

  return candidates.slice(0, maxVehicles).map(({ vehicleId, vehicleReg, driverName, sorted }) => {
    const blocks: TimelineBlock[] = [];
    let lastDate: string | null = null;

    sorted.forEach((t, i) => {
      const date = dayLabel(t.startedAt);
      if (date !== lastDate) {
        blocks.push({ type: "day", label: date });
        lastDate = date;
      }
      blocks.push({
        type: "trip",
        from: t.startAddress,
        to: t.endAddress,
        startedAt: t.startedAt,
        endedAt: t.endedAt,
        durationMin: t.durationMin,
        distanceKm: t.distanceKm,
      });
      const next = sorted[i + 1];
      if (next) {
        const gapMin = Math.round((new Date(next.startedAt).getTime() - new Date(t.endedAt).getTime()) / 60_000);
        if (gapMin > 0) {
          blocks.push({
            type: "stop",
            place: t.endAddress,
            startedAt: t.endedAt,
            endedAt: next.startedAt,
            durationMin: gapMin,
          });
        }
      }
    });

    const gpsKm = Math.round(sorted.reduce((s, t) => s + t.distanceKm, 0) * 10) / 10;

    const latestEntry = fuelEntries
      .filter((e) => e.vehicleReg === vehicleReg && inWindow(e.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    let odoKm: number | null = null;
    let diffKm: number | null = null;
    let diffPct: number | null = null;
    let matchTone: MatchTone | null = null;
    if (latestEntry) {
      odoKm = Math.round((latestEntry.odometerKm - latestEntry.prevOdo) * 10) / 10;
      diffKm = Math.round((odoKm - gpsKm) * 10) / 10;
      diffPct = gpsKm > 0 ? Math.round((diffKm / gpsKm) * 1000) / 10 : 0;
      matchTone = matchToneFor(diffPct);
    }

    return { vehicleId, vehicleReg, driverName, tripCount: sorted.length, gpsKm, odoKm, diffKm, diffPct, matchTone, blocks };
  });
}
