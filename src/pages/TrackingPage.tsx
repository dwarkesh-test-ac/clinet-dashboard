import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Broadcast,
  Clock,
  GasPump,
  GpsFix,
  Key,
  Record as RecordIcon,
  Play,
  Speedometer,
  Lightning,
  Wrench,
} from "@phosphor-icons/react";
import { Skeleton, Tabs } from "@navyug/ui";
import { useVehicle } from "../hooks/useVehicles";
import { useTrips } from "../hooks/useTrips";
import { useAlerts } from "../hooks/useAlerts";
import { useUiStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";
import { routes } from "../config/routes";
import { statusLabel, timeAgo } from "../lib/format";
import { FleetMap } from "../components/FleetMap";

const TABS = [
  { id: "live", label: "Live Info" },
  { id: "vehicle", label: "Vehicle Info" },
  { id: "driver", label: "Driver Info" },
  { id: "alerts", label: "Alerts" },
];

export function TrackingPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(vehicleId);
  const { data: trips } = useTrips(vehicleId);
  const { data: alerts } = useAlerts();
  const showToast = useUiStore((s) => s.showToast);
  const [tab, setTab] = useState("live");
  const { isModuleEnabled } = useAuthStore();
  const evEnabled = isModuleEnabled("ev");
  const maintEnabled = isModuleEnabled("maint");

  const vehicleAlerts = useMemo(() => (alerts ?? []).filter((a) => a.vehicleId === vehicleId), [alerts, vehicleId]);
  const latestTrip = trips?.[0];

  if (isLoading || !vehicle) {
    return (
      <div className="flex-1 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-3 h-[400px] w-full" />
      </div>
    );
  }

  const isMoving = vehicle.status === "moving";
  const statusColor = isMoving ? "#16A34A" : vehicle.status === "stopped" ? "#EF4444" : "#D97706";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-none border-b border-line bg-white px-[18px] py-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(routes.liveMap)}
            className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-ink outline-none focus-visible:underline"
          >
            <ArrowLeft size={13} />
            Back to Live Map
          </button>
          <button
            type="button"
            onClick={() => showToast("Share link copied")}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            Share Live Status
          </button>
          {latestTrip && (
            <Link
              to={routes.tripHistory(latestTrip.id)}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 font-sans text-[12px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Play size={11} weight="fill" />
              Playback
            </Link>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-lg bg-navy px-3 py-1.5 font-mono text-[12.5px] font-bold text-white">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
            {vehicle.reg}
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[12px] font-semibold" style={{ color: statusColor }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
            {statusLabel[vehicle.status]}
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-ink-soft">
            <Speedometer size={13} className="text-ink-muted" />
            {vehicle.speedKmh} km/h
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-ink-soft">
            <GpsFix size={13} className={vehicle.gpsOk ? "text-success" : "text-danger"} />
            GPS {vehicle.gpsOk ? "OK" : "Lost"}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <FleetMap vehicles={[vehicle]} selectedId={vehicle.id} className="relative flex-1" />

        <div className="flex w-[300px] flex-none flex-col overflow-auto border-l border-line bg-white">
          <Tabs items={TABS} activeId={tab} onChange={setTab} />
          <div className="px-4 py-1.5">
            {tab === "live" && (
              <>
                <InfoRow icon={<Speedometer size={14} />} label="Speed" value={`${vehicle.speedKmh} km/h`} />
                <InfoRow icon={<RecordIcon size={14} />} label="Status" value={statusLabel[vehicle.status]} valueColor={statusColor} />
                <InfoRow icon={<Clock size={14} />} label="Last Update" value={timeAgo(vehicle.lastUpdate)} />
                <InfoRow icon={<Key size={14} />} label="Ignition" value={vehicle.ignitionOn ? "ON" : "OFF"} valueColor={vehicle.ignitionOn ? "#16A34A" : "#EF4444"} />
                <InfoRow icon={<GpsFix size={14} />} label="GPS Status" value={vehicle.gpsOk ? "Active" : "Lost"} valueColor={vehicle.gpsOk ? "#16A34A" : "#EF4444"} />
                <InfoRow icon={<Broadcast size={14} />} label="Heading" value={`${Math.round(vehicle.heading)}°`} />
              </>
            )}
            {tab === "vehicle" && (
              <>
                {vehicle.fuelType === "EV" ? (
                  <>
                    <InfoRow icon={<Lightning size={14} />} label="Battery SoC" value={`${vehicle.fuelPct}%`} />
                    {evEnabled && vehicle.batterySohPct !== null && (
                      <InfoRow icon={<Lightning size={14} />} label="Battery SoH" value={`${vehicle.batterySohPct}%`} />
                    )}
                  </>
                ) : (
                  <InfoRow icon={<GasPump size={14} />} label={`Fuel Level (${vehicle.fuelType})`} value={`${vehicle.fuelPct}%`} />
                )}
                {maintEnabled && (
                  <InfoRow icon={<Wrench size={14} />} label="Health Status" value="Healthy" valueColor="#16A34A" />
                )}
                <InfoRow icon={<Speedometer size={14} />} label="Distance Today" value={`${vehicle.distanceTodayKm.toFixed(1)} km`} />
                <InfoRow icon={<RecordIcon size={14} />} label="Trips Today" value={`${vehicle.tripsToday}`} />
              </>
            )}
            {tab === "driver" && (
              <>
                <InfoRow icon={<RecordIcon size={14} />} label="Driver" value={vehicle.driverName} />
              </>
            )}
            {tab === "alerts" && (
              <div className="py-2">
                {vehicleAlerts.length === 0 ? (
                  <div className="py-6 text-center font-sans text-[12px] font-medium text-ink-faint">No alerts for this vehicle.</div>
                ) : (
                  vehicleAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b border-line-soft py-2.5">
                      <span className="font-sans text-[12px] font-semibold text-ink">{a.title}</span>
                      <span className="font-mono text-[10.5px] text-ink-faint">{timeAgo(a.occurredAt)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            <Link to={routes.liveMap} className="inline-block py-2.5 font-sans text-[11.5px] font-semibold text-brand">
              View on Map
            </Link>
          </div>

          <div className="px-4 pb-4 pt-1.5">
            <div className="mb-2.5 font-sans text-[12.5px] font-semibold text-ink">Today's Summary</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { icon: <Speedometer size={14} />, value: `${vehicle.distanceTodayKm.toFixed(0)}`, label: "KM" },
                { icon: <RecordIcon size={14} />, value: `${vehicle.tripsToday}`, label: "TRIPS" },
                { icon: <Clock size={14} />, value: `${Math.round(vehicle.tripsToday * 22)}m`, label: "IDLE" },
                evEnabled
                  ? { icon: <Lightning size={14} />, value: `${vehicle.fuelPct}%`, label: "SOC" }
                  : { icon: <GasPump size={14} />, value: `${vehicle.fuelPct}%`, label: "FUEL" },
              ].map((s) => (
                <div key={s.label} className="rounded-[10px] border border-line-soft p-2 text-center">
                  <span className="text-brand">{s.icon}</span>
                  <div className="mt-1 font-sans text-[11.5px] font-bold text-ink">{s.value}</div>
                  <div className="font-mono text-[9px] text-ink-faint">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line-soft py-2.5">
      <span className="mt-0.5 text-ink-muted">{icon}</span>
      <span className="font-sans text-[12px] font-medium text-ink-muted">{label}</span>
      <span className="ml-auto max-w-[150px] text-right font-sans text-[12px] font-semibold" style={{ color: valueColor ?? "#111827" }}>
        {value}
      </span>
    </div>
  );
}
