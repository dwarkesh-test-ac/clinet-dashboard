import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Drop, LockKey } from "@phosphor-icons/react";
import { Card, KpiCard, Skeleton, SkeletonRows, StatusDot } from "@navyug/ui";
import { useKpiSummary, useVehicles } from "../hooks/useVehicles";
import { useAlerts } from "../hooks/useAlerts";
import { useTrips } from "../hooks/useTrips";
import { useFuelOdometerEntries } from "../hooks/useFuelLog";
import { useAuthStore } from "../stores/authStore";
import { routes } from "../config/routes";
import { alertVisuals, formatDate, timeAgo } from "../lib/format";
import { FleetMapPreview } from "../components/FleetMapPreview";

export function DashboardPage() {
  const { data: kpi, isLoading: kpiLoading } = useKpiSummary();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: alerts } = useAlerts();
  const { data: trips } = useTrips();
  const { data: fuelEntries } = useFuelOdometerEntries();
  const { isModuleEnabled } = useAuthStore();
  const mapEnabled = isModuleEnabled("map");

  const topVehicles = useMemo(
    () => [...(vehicles ?? [])].sort((a, b) => b.distanceTodayKm - a.distanceTodayKm).slice(0, 5),
    [vehicles],
  );

  const dailyTrips = useMemo(() => {
    if (!trips) return [];
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const count = trips.filter((t) => new Date(t.startedAt).toDateString() === key).length;
      days.push({ label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count });
    }
    return days;
  }, [trips]);

  const maxTrips = Math.max(1, ...dailyTrips.map((d) => d.count));
  const sparkPoints = dailyTrips
    .map((d, i) => `${(i / Math.max(1, dailyTrips.length - 1)) * 256 + 2},${56 - (d.count / maxTrips) * 50}`)
    .join(" ");

  const moving = kpi?.movingVehicles ?? 0;
  const stopped = kpi?.stoppedVehicles ?? 0;
  const idle = kpi?.idleVehicles ?? 0;
  const total = Math.max(1, kpi?.totalVehicles ?? 1);
  const movingPct = (moving / total) * 100;
  const stoppedPct = (stopped / total) * 100;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpiLoading || !kpi
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)
          : [
              { label: "Total Vehicles", value: kpi.totalVehicles, delta: "", tone: "neutral" as const },
              { label: "Moving Vehicles", value: kpi.movingVehicles, delta: `▲ ${movingPct.toFixed(1)}%`, tone: "success" as const },
              { label: "Stopped Vehicles", value: kpi.stoppedVehicles, delta: `${stoppedPct.toFixed(1)}%`, tone: "danger" as const },
              { label: "Idle Vehicles", value: kpi.idleVehicles, delta: `${((idle / total) * 100).toFixed(1)}%`, tone: "warning" as const },
              {
                label: "Alerts",
                value: kpi.activeAlerts,
                delta: `Critical ${kpi.criticalAlerts} · Major ${kpi.majorAlerts}`,
                tone: "danger" as const,
              },
            ].map((k) => <KpiCard key={k.label} label={k.label} value={k.value} delta={k.delta} deltaTone={k.tone} />)}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.9fr_1fr]">
        <Card title="Live Map" action={mapEnabled && <Link to={routes.liveMap} className="font-sans text-[11.5px] font-semibold text-brand">View All</Link>} padded={false}>
          {mapEnabled ? (
            <FleetMapPreview vehicles={vehicles ?? []} />
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center bg-surface-subtle p-6 text-center">
              <span className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-navy">
                <LockKey size={19} weight="fill" className="text-[#F4D06F]" />
              </span>
              <div className="font-sans text-[13px] font-bold text-ink">Live Map isn't in your plan</div>
              <div className="mt-1 max-w-[280px] font-sans text-[11.5px] text-ink-faint">
                Live tracking isn't included yet.{" "}
                <Link to={routes.subscription} className="font-semibold text-brand">View your plan</Link> to add it.
              </div>
            </div>
          )}
          <div className="px-[15px] py-3">
            <div className="mb-2 font-sans text-[13px] font-semibold text-ink">Top 5 Vehicles (By Distance)</div>
            <div className="grid grid-cols-[1.4fr_1fr_.6fr] border-b border-line-soft py-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[.04em] text-ink-faint">
              <span>Vehicle No.</span>
              <span>Distance (km)</span>
              <span>Trips</span>
            </div>
            {vehiclesLoading ? (
              <SkeletonRows rows={5} className="mt-2" />
            ) : (
              topVehicles.map((v) => (
                <Link
                  key={v.id}
                  to={routes.tracking(v.id)}
                  className="grid grid-cols-[1.4fr_1fr_.6fr] border-b border-surface-subtle py-[7px] font-sans text-[12px] font-medium outline-none hover:bg-surface-subtle focus-visible:bg-surface-subtle"
                >
                  <span className="font-mono text-[12px] font-bold">{v.reg}</span>
                  <span>{v.distanceTodayKm.toFixed(1)}</span>
                  <span>{v.tripsToday}</span>
                </Link>
              ))
            )}
            <Link to={routes.stats} className="mt-2 inline-block font-sans text-[11.5px] font-semibold text-brand">
              View All
            </Link>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card title="Alerts" action={<Link to={routes.events} className="font-sans text-[11.5px] font-semibold text-brand">View All</Link>}>
            <div className="flex flex-col gap-2.5">
              {(alerts ?? []).slice(0, 4).map((a) => {
                const v = alertVisuals[a.kind];
                return (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: v.bg }}>
                      <StatusDot status={a.kind === "device" ? "nodata" : "stopped"} />
                    </span>
                    <div className="flex-1">
                      <div className="font-sans text-[12px] font-semibold text-ink">{a.title}</div>
                      <div className="mt-px font-mono text-[11px] text-ink-faint">{a.vehicleReg}</div>
                    </div>
                    <span className="font-mono text-[10.5px] font-medium text-ink-faint">{timeAgo(a.occurredAt)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Fleet Status">
            <div className="flex items-center gap-4">
              <div
                className="relative h-24 w-24 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#22C55E 0 ${movingPct}%, #EF4444 ${movingPct}% ${movingPct + stoppedPct}%, #F59E0B ${movingPct + stoppedPct}% 100%)`,
                }}
                role="img"
                aria-label={`${moving} moving, ${stopped} stopped, ${idle} idle out of ${total} vehicles`}
              >
                <div className="absolute inset-3.5 flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-sans text-lg font-bold text-ink">{total}</span>
                  <span className="font-mono text-[9.5px] text-ink-faint">TOTAL</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 font-sans text-[11.5px] font-medium">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-success-fill" />Moving&nbsp;&nbsp;{moving} ({movingPct.toFixed(1)}%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-danger" />Stopped&nbsp;&nbsp;{stopped} ({stoppedPct.toFixed(1)}%)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning" />Idle&nbsp;&nbsp;{idle} ({((idle / total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="mt-3.5">
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-[12px] font-semibold text-ink-muted">Trips</span>
                <span className="font-sans text-[15px] font-bold text-ink">
                  {dailyTrips.reduce((s, d) => s + d.count, 0)}
                </span>
              </div>
              <svg viewBox="0 0 260 60" className="mt-1 h-14 w-full" role="img" aria-label="Trips over the last 7 days">
                <polyline points={sparkPoints} fill="none" stroke="#2563EB" strokeWidth={2} />
              </svg>
              <div className="flex justify-between font-mono text-[9.5px] text-ink-faint">
                {dailyTrips.filter((_, i) => i % 2 === 0).map((d) => (
                  <span key={d.label}>{d.label}</span>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Latest Readings" action={<Link to={routes.fuelLog} className="font-sans text-[11.5px] font-semibold text-brand">Open Trips &amp; Fuel Log →</Link>}>
            <div className="flex flex-col gap-2.5">
              {(fuelEntries ?? []).slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint">
                    <Drop size={14} weight="fill" className="text-brand" />
                  </span>
                  <div className="flex-1">
                    <div className="font-mono text-[12px] font-bold text-ink">{e.vehicleReg}</div>
                    <div className="mt-px font-sans text-[11px] text-ink-faint">{e.fuelLitres}L · {e.odometerKm.toLocaleString("en-IN")} km</div>
                  </div>
                  <span className="font-mono text-[10.5px] font-medium text-ink-faint">{formatDate(e.date)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
