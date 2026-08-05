// import { useMemo, useEffect } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, DownloadSimple, ShareNetwork, Truck } from "@phosphor-icons/react";
// import { Card, Skeleton } from "@navyug/ui";
// import { useTrip } from "../hooks/useTrips";
// import { useUiStore } from "../stores/uiStore";
// import { routes } from "../config/routes";
// import { formatDateTime } from "../lib/format";
// import { RouteReplay3D } from "../components/RouteReplay3D";
// import { FleetMap } from "../components/FleetMap";
// import { useMockWorldStore, startLiveTicker } from "../lib/mock/store";

// export function TripHistoryPage() {
//   const { tripId } = useParams<{ tripId: string }>();
//   const navigate = useNavigate();
//   const { data: trip, isLoading } = useTrip(tripId);
//   const showToast = useUiStore((s) => s.showToast);

//   // Start live GPS movement updates
//   useEffect(() => {
//     startLiveTicker();
//   }, []);

//   // Fetch live vehicles directly from Zustand store
//   const vehicles = useMockWorldStore((s) => s.vehicles);

//   // Find active vehicle by ID or fallback
//   const activeVehicle = useMemo(() => {
//     if (vehicles.length === 0) return null;
//     if (!trip) return vehicles[0] || null;
//     return (
//       vehicles.find((v) => v.id === trip.vehicleId) ||
//       vehicles.find((v) => v.reg === trip.vehicleReg) ||
//       vehicles[0] ||
//       null
//     );
//   }, [vehicles, trip]);

//   const speedSeries = useMemo(() => {
//     if (!trip) return "";
//     const points = 24;
//     return Array.from({ length: points })
//       .map((_, i) => {
//         const t = i / (points - 1);
//         const wobble = Math.sin(i * 1.3) * (trip.maxSpeedKmh - trip.avgSpeedKmh) * 0.4;
//         const v = Math.max(0, trip.avgSpeedKmh + wobble * (0.4 + t * 0.6));
//         return `${t * 700 + 10},${140 - (v / trip.maxSpeedKmh) * 120}`;
//       })
//       .join(" ");
//   }, [trip]);

//   const handleShareLiveStatus = async () => {
//     if (!trip) return;
//     const targetVehId = activeVehicle?.id || trip.vehicleId || "veh-1";
//     const shareUrl = `${window.location.origin}/share/demo-token?vehicleId=${targetVehId}`;
//     try {
//       await navigator.clipboard.writeText(shareUrl);
//       showToast("Live share link copied to clipboard!");
//     } catch {
//       showToast("Failed to copy link");
//     }
//   };

//   if (isLoading || !trip) {
//     return (
//       <div className="flex-1 p-4">
//         <Skeleton className="h-8 w-40" />
//         <Skeleton className="mt-3 h-[250px] w-full" />
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 overflow-auto p-3.5 sm:p-[18px]">
//       {/* Action Header */}
//       <div className="flex items-center gap-2.5">
//         <button
//           type="button"
//           onClick={() => navigate(routes.tracking(trip.vehicleId))}
//           className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-ink outline-none focus-visible:underline"
//         >
//           <ArrowLeft size={13} />
//           Back
//         </button>
//         <button
//           type="button"
//           onClick={() => showToast("Report download started")}
//           className="ml-auto flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
//         >
//           <DownloadSimple size={13} />
//           Download Report
//         </button>
//         <button
//           type="button"
//           onClick={handleShareLiveStatus}
//           className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
//         >
//           <ShareNetwork size={13} />
//           Share Live Status
//         </button>
//       </div>

//       {/* Vehicle Summary Banner */}
//       <Card className="mt-3" bodyClassName="flex flex-wrap items-center gap-x-[22px] gap-y-3">
//         <div className="flex items-center gap-2.5">
//           <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-brand-tint">
//             <Truck size={16} weight="fill" className="text-brand" />
//           </span>
//           <div>
//             <div className="font-mono text-[13px] font-bold">{trip.vehicleReg}</div>
//             <div className="font-sans text-[11px] font-medium text-ink-faint">{trip.driverName}</div>
//           </div>
//         </div>
//         {[
//           { label: "Distance", value: `${trip.distanceKm.toFixed(1)} km` },
//           { label: "Duration", value: `${Math.floor(trip.durationMin / 60)}h ${trip.durationMin % 60}m` },
//           { label: "Avg Speed", value: `${trip.avgSpeedKmh} km/h` },
//           { label: "Max Speed", value: `${trip.maxSpeedKmh} km/h` },
//           { label: "Idle Time", value: `${trip.idleMin} min` },
//         ].map((s) => (
//           <div key={s.label} className="border-l border-line-soft pl-[22px]">
//             <div className="font-mono text-[9.5px] font-semibold uppercase text-ink-faint">{s.label}</div>
//             <div className="mt-0.5 font-sans text-[12.5px] font-semibold text-ink">{s.value}</div>
//           </div>
//         ))}
//       </Card>

//       {/* 3D Route Playback */}
//       <Card className="mt-3" padded={false}>
//         <div className="h-[350px] w-full overflow-hidden rounded-xl">
//           <RouteReplay3D tripId={trip.id} />
//         </div>
//       </Card>

//       {/* Bottom Grid */}
//       <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
//         <Card
//           title={
//             <span className="flex flex-wrap items-center gap-3.5">
//               Speed Over Time
//               <span className="flex items-center gap-1.5 font-sans text-[10.5px] font-medium text-ink-muted">
//                 <span className="h-[3px] w-2 rounded bg-brand" />Average Speed
//               </span>
//               <span className="flex items-center gap-1.5 font-sans text-[10.5px] font-medium text-ink-muted">
//                 <span className="h-[3px] w-2 rounded bg-danger" />Max Speed
//               </span>
//             </span>
//           }
//         >
//           <svg viewBox="0 0 720 150" className="h-[150px] w-full">
//             <polyline points={speedSeries} fill="none" stroke="#2563EB" strokeWidth={2} />
//             <line
//               x1="10"
//               y1={140 - (trip.maxSpeedKmh / trip.maxSpeedKmh) * 120}
//               x2="710"
//               y2={140 - (trip.maxSpeedKmh / trip.maxSpeedKmh) * 120}
//               stroke="#EF4444"
//               strokeDasharray="4 4"
//             />
//           </svg>
//         </Card>

//         {/* Live Driver Info & Location */}
//         <Card title="Live Driver Info & Location">
//           <div className="flex flex-col gap-3">
//             {/* Live Vehicle Location Map */}
//             <div className="h-[200px] w-full overflow-hidden rounded-lg border border-line relative">
//               {activeVehicle ? (
//                 <FleetMap
//                   vehicles={[activeVehicle]}
//                   selectedId={activeVehicle.id}
//                   interactive={true}
//                   className="h-full w-full"
//                 />
//               ) : (
//                 <div className="flex h-full w-full items-center justify-center bg-gray-50 text-xs text-gray-400">
//                   Loading Live GPS...
//                 </div>
//               )}
//             </div>

//             <div className="flex flex-col gap-2 font-sans text-[12px] font-medium">
//               <div>
//                 <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-success">
//                   <span className="h-1.5 w-1.5 rounded-full bg-success" />
//                   Start
//                 </div>
//                 <div className="mt-0.5 font-mono text-[11px] font-semibold">{formatDateTime(trip.startedAt)}</div>
//                 <div className="mt-0.5 text-ink-muted">{trip.startAddress}</div>
//               </div>
//               <div>
//                 <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-danger">
//                   <span className="h-1.5 w-1.5 rounded-full bg-danger" />
//                   End
//                 </div>
//                 <div className="mt-0.5 font-mono text-[11px] font-semibold">{formatDateTime(trip.endedAt)}</div>
//                 <div className="mt-0.5 text-ink-muted">{trip.endAddress}</div>
//               </div>
//             </div>
//           </div>
//         </Card>
//       </div>

//       <Link to={routes.tracking(trip.vehicleId)} className="mt-3 inline-block font-sans text-[12px] font-semibold text-brand">
//         ← Back to vehicle tracking
//       </Link>
//     </div>
//   );
// }

import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, DownloadSimple, ShareNetwork, Truck } from "@phosphor-icons/react";
import { Card, Skeleton } from "@navyug/ui";
import { useTrip } from "../hooks/useTrips";
import { useUiStore } from "../stores/uiStore";
import { routes } from "../config/routes";
import { formatDateTime } from "../lib/format";
import { RouteMap } from "../components/RouteMap";

export function TripHistoryPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading } = useTrip(tripId);
  const showToast = useUiStore((s) => s.showToast);

  const speedSeries = useMemo(() => {
    if (!trip) return "";
    const points = 24;
    return Array.from({ length: points })
      .map((_, i) => {
        const t = i / (points - 1);
        const wobble = Math.sin(i * 1.3) * (trip.maxSpeedKmh - trip.avgSpeedKmh) * 0.4;
        const v = Math.max(0, trip.avgSpeedKmh + wobble * (0.4 + t * 0.6));
        return `${(t * 700) + 10},${140 - (v / trip.maxSpeedKmh) * 120}`;
      })
      .join(" ");
  }, [trip]);

  if (isLoading || !trip) {
    return (
      <div className="flex-1 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-[250px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-3.5 sm:p-[18px]">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate(routes.tracking(trip.vehicleId))}
          className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-ink outline-none focus-visible:underline"
        >
          <ArrowLeft size={13} />
          Back
        </button>
        <button
          type="button"
          onClick={() => showToast("Report download started")}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <DownloadSimple size={13} />
          Download Report
        </button>
        <button
          type="button"
          onClick={() => showToast("Share link copied")}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <ShareNetwork size={13} />
          Share
        </button>
      </div>

      <Card className="mt-3" bodyClassName="flex flex-wrap items-center gap-x-[22px] gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-brand-tint">
            <Truck size={16} weight="fill" className="text-brand" />
          </span>
          <div>
            <div className="font-mono text-[13px] font-bold">{trip.vehicleReg}</div>
            <div className="font-sans text-[11px] font-medium text-ink-faint">{trip.driverName}</div>
          </div>
        </div>
        {[
          { label: "Distance", value: `${trip.distanceKm.toFixed(1)} km` },
          { label: "Duration", value: `${Math.floor(trip.durationMin / 60)}h ${trip.durationMin % 60}m` },
          { label: "Avg Speed", value: `${trip.avgSpeedKmh} km/h` },
          { label: "Max Speed", value: `${trip.maxSpeedKmh} km/h` },
          { label: "Idle Time", value: `${trip.idleMin} min` },
        ].map((s) => (
          <div key={s.label} className="border-l border-line-soft pl-[22px]">
            <div className="font-mono text-[9.5px] font-semibold uppercase text-ink-faint">{s.label}</div>
            <div className="mt-0.5 font-sans text-[12.5px] font-semibold text-ink">{s.value}</div>
          </div>
        ))}
      </Card>

      <Card className="mt-3" padded={false}>
        <RouteMap path={trip.path} className="h-[250px] w-full" />
      </Card>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Card
          title={
            <span className="flex flex-wrap items-center gap-3.5">
              Speed Over Time
              <span className="flex items-center gap-1.5 font-sans text-[10.5px] font-medium text-ink-muted">
                <span className="h-[3px] w-2 rounded bg-brand" />Average Speed
              </span>
              <span className="flex items-center gap-1.5 font-sans text-[10.5px] font-medium text-ink-muted">
                <span className="h-[3px] w-2 rounded bg-danger" />Max Speed
              </span>
            </span>
          }
        >
          <svg viewBox="0 0 720 150" className="h-[150px] w-full">
            <polyline points={speedSeries} fill="none" stroke="#2563EB" strokeWidth={2} />
            <line x1="10" y1={140 - (trip.maxSpeedKmh / trip.maxSpeedKmh) * 120} x2="710" y2={140 - (trip.maxSpeedKmh / trip.maxSpeedKmh) * 120} stroke="#EF4444" strokeDasharray="4 4" />
          </svg>
        </Card>
        <Card title="Route">
          <div className="flex flex-col gap-3 font-sans text-[12px] font-medium">
            <div>
              <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Start
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold">{formatDateTime(trip.startedAt)}</div>
              <div className="mt-0.5 text-ink-muted">{trip.startAddress}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                End
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold">{formatDateTime(trip.endedAt)}</div>
              <div className="mt-0.5 text-ink-muted">{trip.endAddress}</div>
            </div>
          </div>
        </Card>
      </div>
      <Link to={routes.tracking(trip.vehicleId)} className="mt-3 inline-block font-sans text-[12px] font-semibold text-brand">
        ← Back to vehicle tracking
      </Link>
    </div>
  );
}
