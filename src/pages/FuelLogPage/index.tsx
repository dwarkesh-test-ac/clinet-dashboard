import { useMemo, useState } from "react";
import { CalendarBlank, Drop, Export, Gauge, GpsFix, MapPin, Path, Truck } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, KpiCard, Skeleton } from "@navyug/ui";
import { useFuelOdometerEntries } from "../../hooks/useFuelLog";
import { useTrips } from "../../hooks/useTrips";
import { useUiStore } from "../../stores/uiStore";
import { formatDate } from "../../lib/format";
import { buildVehicleTimelines, periodCutoff } from "../../lib/tripTimeline";
import type { TimelinePeriod } from "../../lib/tripTimeline";
import { ShiftsCard } from "./ShiftsCard";
import type { MatchTone } from "../../types";

const PERIODS: { id: TimelinePeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "all", label: "All Time" },
];

const MATCH_TONE: Record<MatchTone, "success" | "warning" | "danger"> = {
  match: "success",
  minor: "warning",
  review: "danger",
};

const MATCH_LABEL: Record<MatchTone, string> = {
  match: "GPS ✓ Odo",
  minor: "Minor gap",
  review: "Review",
};

const fmtDur = (min: number): string => {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d}d ${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export function FuelLogPage() {
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: entries, isLoading: entriesLoading } = useFuelOdometerEntries();
  const showToast = useUiStore((s) => s.showToast);
  const [period, setPeriod] = useState<TimelinePeriod>("week");

  const timelines = useMemo(() => buildVehicleTimelines(trips ?? [], entries ?? [], period), [trips, entries, period]);

  // Everything below scopes to the same period as the timeline, so the KPIs, reconciliation, and
  // ledger table all describe the same window shown in the header — mixing an all-time total with
  // a "this week" timeline was the source of the earlier confusing view.
  const cutoff = useMemo(() => periodCutoff(period), [period]);
  const periodTrips = useMemo(
    () => (trips ?? []).filter((t) => !cutoff || new Date(t.startedAt) >= cutoff),
    [trips, cutoff],
  );
  const periodEntries = useMemo(
    () =>
      (entries ?? [])
        .filter((e) => !cutoff || new Date(e.date) >= cutoff)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries, cutoff],
  );

  const fleetStats = useMemo(() => {
    const gpsKm = periodTrips.reduce((s, t) => s + t.distanceKm, 0);

    const latestByVehicle = new Map<string, (typeof periodEntries)[number]>();
    periodEntries.forEach((e) => {
      const existing = latestByVehicle.get(e.vehicleReg);
      if (!existing || new Date(e.date) > new Date(existing.date)) latestByVehicle.set(e.vehicleReg, e);
    });
    const odoKm = [...latestByVehicle.values()].reduce((s, e) => s + (e.odometerKm - e.prevOdo), 0);

    const mileages = periodEntries.map((e) => (e.odometerKm - e.prevOdo) / e.fuelLitres).filter((m) => Number.isFinite(m) && m > 0);
    const avgMileage = mileages.length ? mileages.reduce((s, m) => s + m, 0) / mileages.length : 0;

    return { gpsKm, odoKm, avgMileage, tripCount: periodTrips.length };
  }, [periodTrips, periodEntries]);

  // Reconciliation card compares the same vehicle set/window as the timeline below it (a vehicle's
  // in-period GPS km vs. its own latest odometer reading in that period) — mixing that against
  // fleet-wide, all-time GPS totals would produce a meaningless variance number.
  const reconciliation = useMemo(() => {
    const reconciled = timelines.filter((tl) => tl.odoKm !== null);
    const gpsKm = reconciled.reduce((s, tl) => s + tl.gpsKm, 0);
    const odoKm = reconciled.reduce((s, tl) => s + (tl.odoKm ?? 0), 0);
    const diffKm = odoKm - gpsKm;
    const variancePct = gpsKm > 0 ? (diffKm / gpsKm) * 100 : 0;
    return { gpsKm, odoKm, diffKm, variancePct };
  }, [timelines]);

  const isLoading = tripsLoading || entriesLoading;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <span className="font-sans text-[14px] font-semibold text-ink">Trips & Fuel Log</span>
        <div className="inline-flex items-center gap-1 rounded-lg border border-line-soft bg-white p-0.5">
          <CalendarBlank size={13} className="ml-1.5 text-ink-faint" />
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-2.5 py-1 font-sans text-[11.5px] font-semibold transition-colors ${
                period === p.id ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-subtle"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Export size={13} />}
            onClick={() => showToast("Trip & fuel report exported (demo)")}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)
          : [
              { label: "Trips Auto-Detected", value: fleetStats.tripCount, sub: "From GPS idle/movement", icon: <Path size={14} className="text-brand" /> },
              { label: "GPS Distance", value: `${Math.round(fleetStats.gpsKm).toLocaleString("en-IN")} km`, sub: "Sum of detected trips", icon: <GpsFix size={14} className="text-success" /> },
              { label: "Odometer Distance", value: `${Math.round(fleetStats.odoKm).toLocaleString("en-IN")} km`, sub: "From logged readings", icon: <Gauge size={14} className="text-purple-500" /> },
              { label: "Avg Mileage", value: `${fleetStats.avgMileage.toFixed(1)} km/L`, sub: "Distance since fill ÷ litres", icon: <Drop size={14} className="text-amber-500" /> },
            ].map((k) => (
              <KpiCard key={k.label} label={k.label} value={<span className="inline-flex items-center gap-1.5">{k.icon}{k.value}</span>} delta={k.sub} deltaTone="neutral" />
            ))}
      </div>

      <ShiftsCard trips={trips ?? []} />

      <Card title="GPS Distance vs. Odometer" className="mt-3">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[12.5px] font-medium text-ink-muted">
            Odometer readings reconciled against device-measured GPS distance, for vehicles with a
            detected timeline below
          </span>
          {reconciliation.gpsKm > 0 && (
            <Badge tone={Math.abs(reconciliation.variancePct) <= 3 ? "success" : Math.abs(reconciliation.variancePct) <= 6 ? "warning" : "danger"}>
              {reconciliation.variancePct >= 0 ? "+" : ""}{reconciliation.variancePct.toFixed(1)}% variance
            </Badge>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-purple-500"><Gauge size={11} />Odometer Distance</div>
            <div className="mt-1 font-sans text-lg font-bold text-ink">{Math.round(reconciliation.odoKm).toLocaleString("en-IN")} km</div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-success"><GpsFix size={11} />GPS Distance</div>
            <div className="mt-1 font-sans text-lg font-bold text-ink">{Math.round(reconciliation.gpsKm).toLocaleString("en-IN")} km</div>
          </div>
          <div>
            <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Difference</div>
            <div className="mt-1 font-sans text-lg font-bold text-ink">{Math.round(reconciliation.diffKm).toLocaleString("en-IN")} km</div>
          </div>
        </div>
      </Card>

      <Card title={`Auto-Detected Stop & Trip Timeline · ${PERIODS.find((p) => p.id === period)!.label}`} className="mt-3">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : timelines.length === 0 ? (
          <p className="font-sans text-[12.5px] text-ink-faint">
            No trips detected {period === "today" ? "today" : period === "week" ? "this week" : "yet"}.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-line-soft">
            {timelines.map((tl) => (
              <div key={tl.vehicleId} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12.5px] font-bold text-brand">{tl.vehicleReg}</span>
                  <span className="font-sans text-[12px] text-ink-muted">{tl.driverName}</span>
                  <Badge tone="neutral">{tl.tripCount} trips detected</Badge>
                  <div className="ml-auto flex items-center gap-2">
                    {tl.odoKm !== null && (
                      <span className="font-mono text-[11px] text-ink-faint">
                        GPS {tl.gpsKm} km linked to logged odometer {tl.odoKm} km
                      </span>
                    )}
                    {tl.matchTone && <Badge tone={MATCH_TONE[tl.matchTone]}>{MATCH_LABEL[tl.matchTone]}</Badge>}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-col gap-1.5">
                  {tl.blocks.map((b, i) => {
                    if (b.type === "day") {
                      return (
                        <div key={i} className="mb-0.5 mt-2 flex items-center gap-2 first:mt-0">
                          <CalendarBlank size={11} className="text-ink-faint" />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{b.label}</span>
                          <span className="h-px flex-1 bg-line-soft" />
                        </div>
                      );
                    }
                    if (b.type === "trip") {
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                            <Truck size={13} weight="fill" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[12px] font-semibold text-ink">Trip · {b.from} → {b.to}</span>
                            <span className="ml-2 font-mono text-[10.5px] text-ink-faint">
                              {fmtTime(b.startedAt)}–{fmtTime(b.endedAt)} · {fmtDur(b.durationMin)}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono text-[12px] font-bold text-success">{b.distanceKm} km</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-ink-faint">
                          <MapPin size={13} weight="fill" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-sans text-[12px] font-medium text-ink-muted">Stop · {b.place}</span>
                          <span className="ml-2 font-mono text-[10.5px] text-ink-faint">{fmtTime(b.startedAt)}</span>
                        </div>
                        <span className="shrink-0 font-mono text-[11.5px] text-ink-faint">{fmtDur(b.durationMin)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card
        title={`Fuel & Odometer Entries · ${PERIODS.find((p) => p.id === period)!.label}`}
        className="mt-3"
        padded={false}
        bodyClassName="px-4 py-2"
      >
        {entriesLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <DataTable
            caption="Fuel and odometer ledger entries"
            rows={periodEntries}
            getRowId={(e) => e.id}
            emptyTitle={`No entries logged ${period === "today" ? "today" : period === "week" ? "this week" : "yet"}`}
            columns={[
              { key: "vehicle", header: "Vehicle", sortValue: (e) => e.vehicleReg, render: (e) => <span className="font-mono text-[12px] font-bold">{e.vehicleReg}</span> },
              { key: "date", header: "Date", sortValue: (e) => e.date, render: (e) => <span className="font-mono text-[11px] text-ink-faint">{formatDate(e.date)}</span> },
              { key: "odometer", header: "Odometer (prev → now)", sortValue: (e) => e.odometerKm, render: (e) => <span className="font-mono text-[11.5px]">{e.prevOdo.toLocaleString("en-IN")} → {e.odometerKm.toLocaleString("en-IN")}</span> },
              { key: "distance", header: "Distance", sortValue: (e) => e.odometerKm - e.prevOdo, render: (e) => <span className="font-mono text-[12px] font-bold text-purple-500">{(e.odometerKm - e.prevOdo).toLocaleString("en-IN")} km</span>, align: "right" },
              { key: "fuel", header: "Fuel", sortValue: (e) => e.fuelLitres, render: (e) => <span className="font-mono text-[11.5px] text-amber-600">{e.fuelLitres} L</span>, align: "right" },
              { key: "mileage", header: "Mileage", sortValue: (e) => (e.odometerKm - e.prevOdo) / e.fuelLitres, render: (e) => <span className="font-mono text-[12px] font-bold">{((e.odometerKm - e.prevOdo) / e.fuelLitres).toFixed(1)} km/L</span>, align: "right" },
              { key: "cost", header: "Cost", sortValue: (e) => e.cost, render: (e) => <span className="font-mono text-[12px] font-bold">₹{e.cost.toLocaleString("en-IN")}</span>, align: "right" },
            ]}
          />
        )}
      </Card>

    </div>
  );
}
