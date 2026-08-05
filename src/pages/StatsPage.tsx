import { useNavigate } from "react-router-dom";
import { Truck } from "@phosphor-icons/react";
import { Badge, Card, DataTable, SearchInput, Skeleton } from "@navyug/ui";
import type { DataTableColumn } from "@navyug/ui";
import { useState, useMemo } from "react";
import { useVehicles } from "../hooks/useVehicles";
import { useAuthStore } from "../stores/authStore";
import { routes } from "../config/routes";
import { statusLabel } from "../lib/format";
import type { Vehicle } from "../types";

const STATUS_TONE: Record<Vehicle["status"], "success" | "danger" | "warning" | "neutral"> = {
  moving: "success",
  stopped: "danger",
  idle: "warning",
  nodata: "neutral",
};

export function StatsPage() {
  const navigate = useNavigate();
  const { data: vehicles, isLoading } = useVehicles();
  const [search, setSearch] = useState("");
  const { isModuleEnabled } = useAuthStore();
  const evEnabled = isModuleEnabled("ev");
  const maintEnabled = isModuleEnabled("maint");

  const filtered = (vehicles ?? []).filter((v) => {
    const q = search.trim().toLowerCase();
    return !q || v.reg.toLowerCase().includes(q) || v.driverName.toLowerCase().includes(q);
  });

  const columns: DataTableColumn<Vehicle>[] = useMemo(() => {
    const base: DataTableColumn<Vehicle>[] = [
      {
        key: "reg",
        header: "Vehicle",
        sortValue: (v: Vehicle) => v.reg,
        render: (v: Vehicle) => (
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-tint">
              <Truck size={13} weight="fill" className="text-brand" />
            </span>
            <span className="font-mono text-[12px] font-bold">{v.reg}</span>
          </span>
        ),
      },
      { key: "driver", header: "Driver", sortValue: (v: Vehicle) => v.driverName, render: (v: Vehicle) => v.driverName },
      {
        key: "status",
        header: "Status",
        sortValue: (v: Vehicle) => v.status,
        render: (v: Vehicle) => <Badge tone={STATUS_TONE[v.status]} withDot>{statusLabel[v.status]}</Badge>,
      },
      { key: "speed", header: "Speed", sortValue: (v: Vehicle) => v.speedKmh, render: (v: Vehicle) => `${v.speedKmh} km/h`, align: "right" as const },
      {
        key: "distance",
        header: "Distance Today",
        sortValue: (v: Vehicle) => v.distanceTodayKm,
        render: (v: Vehicle) => `${v.distanceTodayKm.toFixed(1)} km`,
        align: "right" as const,
      },
      { key: "trips", header: "Trips", sortValue: (v: Vehicle) => v.tripsToday, render: (v: Vehicle) => v.tripsToday, align: "right" as const },
    ];

    if (maintEnabled) {
      base.push({
        key: "health",
        header: "Health Diagnostics",
        sortValue: (v: Vehicle) => {
          const hash = v.id.split("-")[1] || "1";
          const code = parseInt(hash, 10) % 7;
          return code === 0 ? "Fault" : code === 1 ? "Check" : "Healthy";
        },
        render: (v: Vehicle) => {
          const hash = v.id.split("-")[1] || "1";
          const code = parseInt(hash, 10) % 7;
          if (code === 0) return <Badge tone="danger">Fault: P0123</Badge>;
          if (code === 1) return <Badge tone="warning">Check Sensor</Badge>;
          return <Badge tone="success">Healthy</Badge>;
        },
        align: "left" as const,
      });
    }

    base.push({
      key: "fuel",
      header: "Fuel / Battery",
      sortValue: (v: Vehicle) => v.fuelPct,
      render: (v: Vehicle) =>
        v.fuelType === "EV" ? (
          <span className="font-mono text-[11.5px] font-semibold text-ink-soft">
            ⚡ {v.fuelPct}% SoC
            {evEnabled && v.batterySohPct !== null && (
              <span className="text-[10.5px] text-ink-faint"> ({v.batterySohPct}% SoH)</span>
            )}
          </span>
        ) : (
          <span className="font-mono text-[11.5px] font-medium text-ink-soft">
            {v.fuelPct}% <span className="text-[10.5px] text-ink-faint">· {v.fuelType}</span>
          </span>
        ),
      align: "right" as const,
    });

    return base;
  }, [evEnabled, maintEnabled]);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="mb-3 flex items-center gap-3">
        <SearchInput label="Search vehicles" className="h-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="font-sans text-[12px] font-medium text-ink-muted">{filtered.length} vehicles</span>
      </div>
      <Card padded={false} bodyClassName="px-4 py-2">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <DataTable
            caption="Vehicle statistics"
            rows={filtered}
            getRowId={(v) => v.id}
            onRowClick={(v) => navigate(routes.tracking(v.id))}
            columns={columns}
            emptyTitle="No vehicles match your search"
            pageSizeOptions={[25, 50, 100, 200]}
          />
        )}
      </Card>
    </div>
  );
}
