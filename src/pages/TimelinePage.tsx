import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Select, Skeleton } from "@navyug/ui";
import { useVehicles } from "../hooks/useVehicles";
import { useTrips } from "../hooks/useTrips";
import { useAlerts } from "../hooks/useAlerts";
import { useFuelOdometerEntries } from "../hooks/useFuelLog";
import { useShifts } from "../hooks/useShifts";
import { routes } from "../config/routes";
import {
  CaretRight,
  CheckCircle,
  Flag,
  GasPump,
  Play,
  Warning,
  XCircle,
  Timer,
  User,
  Heartbeat,
} from "@phosphor-icons/react";

interface TimelineEvent {
  id: string;
  type: "shift-start" | "shift-end" | "trip-start" | "trip-end" | "alert" | "refuel";
  time: Date;
  title: string;
  desc: string;
  link?: string;
  meta?: any;
}

export function TimelinePage() {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  
  // Use first vehicle in list as default
  const activeId = vehicleId ?? vehicles[0]?.id ?? "";
  const activeVehicle = vehicles.find((v) => v.id === activeId);

  // Queries
  const { data: trips = [], isLoading: tripsLoading } = useTrips(activeId);
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const { data: fuelEntries = [], isLoading: fuelLoading } = useFuelOdometerEntries();
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();

  // 1. Filter today's trips
  const todaysTrips = useMemo(() => {
    return [...trips]
      .filter((t) => new Date(t.startedAt).toDateString() === new Date().toDateString())
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  }, [trips]);

  // 2. Filter today's alerts for this vehicle
  const todaysAlerts = useMemo(() => {
    if (!activeVehicle) return [];
    return alerts
      .filter((a) => a.vehicleId === activeVehicle.id && new Date(a.occurredAt).toDateString() === new Date().toDateString())
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }, [alerts, activeVehicle]);

  // 3. Filter today's shifts for this vehicle
  const todaysShifts = useMemo(() => {
    if (!activeVehicle) return [];
    return shifts
      .filter((s) => s.vehicleId === activeVehicle.id && new Date(s.startedAt).toDateString() === new Date().toDateString())
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  }, [shifts, activeVehicle]);

  // 4. Filter today's fuel refuels for this vehicle
  const todaysRefuels = useMemo(() => {
    if (!activeVehicle) return [];
    return fuelEntries
      .filter((e) => e.vehicleReg.toLowerCase() === activeVehicle.reg.toLowerCase() && new Date(e.date).toDateString() === new Date().toDateString())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [fuelEntries, activeVehicle]);

  // 5. Generate integrated chronological event stream
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add Shift Starts and Ends
    todaysShifts.forEach((s) => {
      events.push({
        id: `shift-start-${s.id}`,
        type: "shift-start",
        time: new Date(s.startedAt),
        title: "Shift Checked In",
        desc: `Driver ${s.driverName} checked in and began shift.`,
      });
      if (s.endedAt) {
        events.push({
          id: `shift-end-${s.id}`,
          type: "shift-end",
          time: new Date(s.endedAt),
          title: "Shift Checked Out",
          desc: `Driver ${s.driverName} completed shift checkout.`,
        });
      }
    });

    // Add Trips (Start and End)
    todaysTrips.forEach((t) => {
      events.push({
        id: `trip-start-${t.id}`,
        type: "trip-start",
        time: new Date(t.startedAt),
        title: "Trip Started",
        desc: `Began journey from ${t.startAddress}`,
        link: routes.tripHistory(t.id),
      });
      events.push({
        id: `trip-end-${t.id}`,
        type: "trip-end",
        time: new Date(t.endedAt),
        title: "Trip Completed",
        desc: `Arrived at ${t.endAddress} (${t.distanceKm.toFixed(1)} km, ${t.durationMin} mins)`,
        link: routes.tripHistory(t.id),
        meta: {
          distance: t.distanceKm,
          duration: t.durationMin,
          idle: t.idleMin,
        },
      });
    });

    // Add Alerts
    todaysAlerts.forEach((a) => {
      let alertLabel = "Safety Warning";
      if (a.kind === "speed") alertLabel = "Speed Limit Exceeded";
      else if (a.kind === "brake") alertLabel = "Harsh Braking Event";
      else if (a.kind === "device") alertLabel = "GPS Device Reconnection";

      events.push({
        id: `alert-${a.id}`,
        type: "alert",
        time: new Date(a.occurredAt),
        title: alertLabel,
        desc: `${a.title} (${a.severity} severity warning)`,
        meta: { severity: a.severity, kind: a.kind },
      });
    });

    // Add Refuels
    todaysRefuels.forEach((f) => {
      events.push({
        id: `refuel-${f.id}`,
        type: "refuel",
        time: new Date(f.date),
        title: "Fuel Refill Logged",
        desc: `${f.fuelLitres}L filled for ₹${f.cost.toLocaleString("en-IN")} at odometer ${f.odometerKm} km.`,
      });
    });

    // Sort ascending (chronological day order)
    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [todaysTrips, todaysAlerts, todaysShifts, todaysRefuels]);

  // 6. Stats Summary
  const stats = useMemo(() => {
    let totalDist = 0;
    let totalDuration = 0;
    let totalIdle = 0;
    todaysTrips.forEach((t) => {
      totalDist += t.distanceKm;
      totalDuration += t.durationMin;
      totalIdle += t.idleMin;
    });

    const totalRefuelCost = todaysRefuels.reduce((sum, f) => sum + f.cost, 0);
    const totalRefuelLiters = todaysRefuels.reduce((sum, f) => sum + f.fuelLitres, 0);

    return {
      distance: totalDist,
      duration: totalDuration,
      idle: totalIdle,
      alerts: todaysAlerts.length,
      refuels: todaysRefuels.length,
      refuelCost: totalRefuelCost,
      refuelLiters: totalRefuelLiters,
    };
  }, [todaysTrips, todaysAlerts, todaysRefuels]);

  // 7. Activity Timeline Segments
  const segments = useMemo(() => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayMs = 24 * 3_600_000;
    const blocks: Array<{ startPct: number; widthPct: number; kind: "moving" | "idle" }> = [];
    for (const t of todaysTrips) {
      const start = new Date(t.startedAt).getTime();
      const end = new Date(t.endedAt).getTime();
      blocks.push({
        startPct: ((start - dayStart.getTime()) / dayMs) * 100,
        widthPct: Math.max(0.4, ((end - start) / dayMs) * 100),
        kind: "moving",
      });
    }
    return blocks;
  }, [todaysTrips]);

  const isLoading = vehiclesLoading || tripsLoading || alertsLoading || fuelLoading || shiftsLoading;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      {/* Top filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Select
            label="Vehicle"
            hideLabel
            value={activeId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="h-9 w-60 border-slate-300 shadow-sm"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reg} — {v.driverName} ({v.fuelType})
              </option>
            ))}
          </Select>
          {activeVehicle && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand/10 text-brand font-mono">
              <span className={`h-2 w-2 rounded-full ${activeVehicle.status === "moving" ? "bg-success-fill animate-pulse" : "bg-ink-faint"}`} />
              {activeVehicle.status.toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-[11.5px] font-medium text-ink-faint">
          Timeline view for <span className="font-bold text-ink">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : !activeVehicle ? (
        <div className="py-20 text-center font-sans text-[13px] font-medium text-ink-faint">
          No vehicles registered. Register devices to track activity.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">
          {/* LEFT COLUMN: Vehicle Stats Card & Today Activity Bar */}
          <div className="lg:col-span-1 space-y-4.5">
            {/* Today Activity visual bar */}
            <Card title="Today's Active Timeline">
              <div className="relative h-10 w-full overflow-hidden rounded-lg bg-surface-subtle border border-line-soft">
                {segments.map((s, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full bg-[#3B82F6]"
                    style={{ left: `${s.startPct}%`, width: `${s.widthPct}%` }}
                    title="Moving segment"
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] font-bold text-ink-faint tracking-wider uppercase">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>12 AM</span>
              </div>
            </Card>

            {/* Daily Operational Stats */}
            <Card title="Operational Performance Today">
              <div className="grid grid-cols-2 gap-3.5 py-1">
                <div className="border border-line-soft rounded-lg p-2.5 bg-surface-subtle/40">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Play size={13} className="text-blue-500" /> Distance Covered
                  </div>
                  <div className="font-mono text-[16px] font-black text-ink">
                    {stats.distance.toFixed(1)} km
                  </div>
                </div>

                <div className="border border-line-soft rounded-lg p-2.5 bg-surface-subtle/40">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Timer size={13} className="text-emerald-500" /> Driving Hours
                  </div>
                  <div className="font-mono text-[16px] font-black text-ink">
                    {(stats.duration / 60).toFixed(1)} hrs
                  </div>
                  <div className="text-[9px] text-ink-faint mt-0.5">({stats.duration} minutes total)</div>
                </div>

                <div className="border border-line-soft rounded-lg p-2.5 bg-surface-subtle/40">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Warning size={13} className="text-rose-500" /> Safety Incidents
                  </div>
                  <div className={`font-mono text-[16px] font-black ${stats.alerts > 0 ? "text-danger" : "text-success-fill"}`}>
                    {stats.alerts} warnings
                  </div>
                </div>

                <div className="border border-line-soft rounded-lg p-2.5 bg-surface-subtle/40">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[10px] uppercase font-bold tracking-wider mb-1">
                    <GasPump size={13} className="text-teal-500" /> Fuel Refills
                  </div>
                  <div className="font-mono text-[16px] font-black text-ink">
                    {stats.refuels} refuels
                  </div>
                  {stats.refuels > 0 && (
                    <div className="text-[9px] text-ink-faint mt-0.5">
                      {stats.refuelLiters}L filled · ₹{stats.refuelCost.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                <div className="col-span-2 border border-line-soft rounded-lg p-2.5 bg-surface-subtle/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-ink-faint text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      <Heartbeat size={13} className="text-indigo-500" /> Excess Idling Time
                    </div>
                    <span className="font-mono text-[14px] font-black text-ink">
                      {stats.idle} mins idled
                    </span>
                  </div>
                  <span className="text-[9.5px] text-ink-faint max-w-[140px] text-right font-medium">
                    Engine run while speed is 0 during shifts.
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Chronological Activity Feed */}
          <div className="lg:col-span-2">
            <Card title="Activity Feed & Trip Chronology">
              {timelineEvents.length === 0 ? (
                <div className="py-20 text-center font-sans text-[13px] font-medium text-ink-faint">
                  No telematics events or shifts recorded for this vehicle today.
                </div>
              ) : (
                <div className="relative border-l-2 border-line-soft ml-4.5 pl-6 py-2.5 space-y-7">
                  {timelineEvents.map((e) => {
                    // Decide color & icon based on event type
                    let circleBg = "bg-slate-100 text-slate-500 border-slate-300";
                    let Icon = User;

                    if (e.type === "shift-start") {
                      circleBg = "bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/20";
                      Icon = CheckCircle;
                    } else if (e.type === "shift-end") {
                      circleBg = "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-950/20";
                      Icon = XCircle;
                    } else if (e.type === "trip-start") {
                      circleBg = "bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/20";
                      Icon = Play;
                    } else if (e.type === "trip-end") {
                      circleBg = "bg-indigo-50 text-indigo-600 border-indigo-300 dark:bg-indigo-950/20";
                      Icon = Flag;
                    } else if (e.type === "alert") {
                      circleBg = "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/20 animate-pulse";
                      Icon = Warning;
                    } else if (e.type === "refuel") {
                      circleBg = "bg-teal-50 text-teal-600 border-teal-300 dark:bg-teal-950/20";
                      Icon = GasPump;
                    }

                    return (
                      <div key={e.id} className="relative group/event">
                        {/* Circle Badge */}
                        <span className={`absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border bg-white ${circleBg} shadow-sm transition-transform duration-200 group-hover/event:scale-110`}>
                          <Icon size={10} weight="bold" />
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                          <span className="font-sans text-[12.5px] font-bold text-ink group-hover/event:text-brand transition-colors">
                            {e.title}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-ink-faint bg-surface-subtle px-1.5 py-0.5 rounded border border-line-soft">
                            {e.time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <p className="font-sans text-[11.5px] text-ink-muted leading-relaxed">
                          {e.desc}
                        </p>

                        {/* Optional action links */}
                        {e.link && (
                          <div className="mt-1.5">
                            <Link
                              to={e.link}
                              className="inline-flex items-center gap-0.5 text-[10.5px] font-extrabold text-brand hover:text-[#0b41cd] select-none transition-colors border border-brand/20 rounded px-1.5 py-0.5 bg-brand/5"
                            >
                              Inspect Trip Details <CaretRight size={10} />
                            </Link>
                          </div>
                        )}

                        {/* Special parameters block for trips/alerts */}
                        {e.type === "trip-end" && e.meta && (
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-mono font-bold text-ink-muted">
                            <span className="bg-surface-subtle border border-line-soft px-1.5 py-0.5 rounded">
                              DIST: {e.meta.distance.toFixed(1)} km
                            </span>
                            <span className="bg-surface-subtle border border-line-soft px-1.5 py-0.5 rounded">
                              DUR: {e.meta.duration} mins
                            </span>
                            {e.meta.idle > 0 && (
                              <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/55 px-1.5 py-0.5 rounded">
                                IDLE: {e.meta.idle} mins
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
