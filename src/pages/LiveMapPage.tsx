// import { useMemo, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useVirtualizer } from "@tanstack/react-virtual";
// import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
// import { SearchInput, Select, StatusDot } from "@navyug/ui";
// import { useVehicles } from "../hooks/useVehicles";
// import { useGroups } from "../hooks/useGroups";
// import { routes } from "../config/routes";
// import { statusLabel } from "../lib/format";
// import { FleetMap } from "../components/FleetMap";
// import type { VehicleIconKey, VehicleStatus } from "../types";

// const STATUS_FILTERS: Array<{ id: VehicleStatus; dot: string }> = [
//   { id: "moving", dot: "#22C55E" },
//   { id: "stopped", dot: "#EF4444" },
//   { id: "idle", dot: "#F59E0B" },
//   { id: "nodata", dot: "#9CA3AF" },
// ];

// export function LiveMapPage() {
//   const navigate = useNavigate();
//   const { data: vehicles = [] } = useVehicles();
//   const { data: groups = [] } = useGroups();
//   const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
//   const [groupFilter, setGroupFilter] = useState("all");
//   const [search, setSearch] = useState("");
//   const listRef = useRef<HTMLDivElement>(null);

//   const filtered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     return vehicles.filter((v) => {
//       if (statusFilter !== "all" && v.status !== statusFilter) return false;
//       if (groupFilter !== "all" && v.groupId !== groupFilter) return false;
//       if (q && !v.reg.toLowerCase().includes(q) && !v.driverName.toLowerCase().includes(q)) return false;
//       return true;
//     });
//   }, [vehicles, statusFilter, groupFilter, search]);

//   const groupIcons = useMemo<Record<string, VehicleIconKey>>(
//     () => Object.fromEntries(groups.map((g) => [g.id, g.icon])),
//     [groups],
//   );

//   const virtualizer = useVirtualizer({
//     count: filtered.length,
//     getScrollElement: () => listRef.current,
//     estimateSize: () => 54,
//     overscan: 8,
//   });

//   function openVehicle(id: string) {
//     navigate(routes.tracking(id));
//   }

//   return (
//     <div className="flex min-h-0 flex-1 flex-col">
//       <div className="flex flex-none flex-wrap items-center gap-2 border-b border-line bg-white px-[18px] py-2.5">
//         <SearchInput
//           label="Search Vehicle / Group"
//           hideLabel
//           className="h-8 w-[220px]"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         <Select label="Group" hideLabel value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="h-8 w-auto">
//           <option value="all">All Groups</option>
//           {groups.map((g) => (
//             <option key={g.id} value={g.id}>{g.name}</option>
//           ))}
//         </Select>
//         {STATUS_FILTERS.map((f) => {
//           const active = statusFilter === f.id;
//           return (
//             <button
//               key={f.id}
//               type="button"
//               onClick={() => setStatusFilter(active ? "all" : f.id)}
//               className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
//               style={{
//                 borderColor: active ? "#2563EB" : "#E5E7EB",
//                 background: active ? "#EFF6FF" : "#fff",
//                 color: active ? "#2563EB" : "#374151",
//               }}
//               aria-pressed={active}
//             >
//               <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.dot }} />
//               {statusLabel[f.id]}
//             </button>
//           );
//         })}
//       </div>

//       <div className="flex min-h-0 flex-1">
//         <FleetMap vehicles={filtered} onSelectVehicle={openVehicle} groupIcons={groupIcons} className="relative flex-1" />

//         <div className="flex w-[280px] flex-none flex-col border-l border-line bg-white">
//           <div className="border-b border-line-soft p-3.5">
//             <div className="flex items-center">
//               <span className="font-sans text-[13px] font-semibold text-ink">All Vehicles ({filtered.length})</span>
//             </div>
//             <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-ink-faint">
//               <MagnifyingGlass size={12} />
//               <span className="font-sans text-[11.5px] font-medium">{search || "Search"}</span>
//               <CaretDown size={10} className="ml-auto" />
//             </div>
//           </div>
//           <div ref={listRef} className="flex-1 overflow-auto">
//             <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
//               {virtualizer.getVirtualItems().map((row) => {
//                 const v = filtered[row.index]!;
//                 return (
//                   <button
//                     key={v.id}
//                     type="button"
//                     onClick={() => openVehicle(v.id)}
//                     style={{ position: "absolute", top: row.start, left: 0, right: 0, height: row.size }}
//                     className="flex w-full items-center gap-2.5 border-b border-line-soft px-3.5 text-left outline-none hover:bg-surface-subtle focus-visible:bg-surface-subtle"
//                   >
//                     <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-surface-subtle">
//                       <StatusDot status={v.status} pulse={v.status === "moving"} className="h-2.5 w-2.5" />
//                     </span>
//                     <div className="min-w-0 flex-1">
//                       <div className="font-mono text-[12px] font-bold text-ink">{v.reg}</div>
//                       <div className="truncate font-sans text-[10.5px] font-medium text-ink-faint">{v.driverName}</div>
//                     </div>
//                     <span className="font-mono text-[11.5px] font-semibold text-ink-soft">{v.speedKmh} km/h</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { SearchInput, Select, StatusDot } from "@navyug/ui";
import { useVehicles } from "../hooks/useVehicles";
import { useGroups } from "../hooks/useGroups";
import { routes } from "../config/routes";
import { statusLabel } from "../lib/format";
import { FleetMap } from "../components/FleetMap";
import { startLiveTicker } from "../lib/mock/store";
import type { VehicleIconKey, VehicleStatus } from "../types";

const STATUS_FILTERS: Array<{ id: VehicleStatus; dot: string }> = [
  { id: "moving", dot: "#22C55E" },
  { id: "stopped", dot: "#EF4444" },
  { id: "idle", dot: "#F59E0B" },
  { id: "nodata", dot: "#9CA3AF" },
];

export function LiveMapPage() {
  const navigate = useNavigate();

  // Start real-time GPS movement ticks
  useEffect(() => {
    startLiveTicker();
  }, []);

  const { data: vehicles = [] } = useVehicles();
  const { data: groups = [] } = useGroups();
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (groupFilter !== "all" && v.groupId !== groupFilter) return false;
      if (q && !v.reg.toLowerCase().includes(q) && !v.driverName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [vehicles, statusFilter, groupFilter, search]);

  const groupIcons = useMemo<Record<string, VehicleIconKey>>(
    () => Object.fromEntries(groups.map((g) => [g.id, g.icon])),
    [groups],
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 54,
    overscan: 8,
  });

  function openVehicle(id: string) {
    navigate(routes.tracking(id));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top Filter Bar */}
      <div className="flex flex-none flex-wrap items-center gap-2 border-b border-line bg-white px-[18px] py-2.5">
        <SearchInput
          label="Search Vehicle / Group"
          hideLabel
          className="h-8 w-[220px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select label="Group" hideLabel value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="h-8 w-auto">
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(active ? "all" : f.id)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              style={{
                borderColor: active ? "#2563EB" : "#E5E7EB",
                background: active ? "#EFF6FF" : "#fff",
                color: active ? "#2563EB" : "#374151",
              }}
              aria-pressed={active}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.dot }} />
              {statusLabel[f.id]}
            </button>
          );
        })}
      </div>

      {/* Main Container: Full Live Fleet Map + Sidebar Vehicle List */}
      <div className="flex min-h-0 flex-1">
        <FleetMap vehicles={filtered} onSelectVehicle={openVehicle} groupIcons={groupIcons} className="relative flex-1" />

        <div className="flex w-[280px] flex-none flex-col border-l border-line bg-white">
          <div className="border-b border-line-soft p-3.5">
            <div className="flex items-center">
              <span className="font-sans text-[13px] font-semibold text-ink">All Vehicles ({filtered.length})</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-ink-faint">
              <MagnifyingGlass size={12} />
              <span className="font-sans text-[11.5px] font-medium">{search || "Search"}</span>
              <CaretDown size={10} className="ml-auto" />
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-auto">
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((row) => {
                const v = filtered[row.index]!;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => openVehicle(v.id)}
                    style={{ position: "absolute", top: row.start, left: 0, right: 0, height: row.size }}
                    className="flex w-full items-center gap-2.5 border-b border-line-soft px-3.5 text-left outline-none hover:bg-surface-subtle focus-visible:bg-surface-subtle"
                  >
                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-surface-subtle">
                      <StatusDot status={v.status} pulse={v.status === "moving"} className="h-2.5 w-2.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[12px] font-bold text-ink">{v.reg}</div>
                      <div className="truncate font-sans text-[10.5px] font-medium text-ink-faint">{v.driverName}</div>
                    </div>
                    <span className="font-mono text-[11.5px] font-semibold text-ink-soft">{v.speedKmh} km/h</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}