import { useMemo, useState } from "react";
import { Play, Stop } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, Skeleton } from "@navyug/ui";
import type { DataTableColumn } from "@navyug/ui";
import { useShifts, useEndShift } from "../../hooks/useShifts";
import { useUiStore } from "../../stores/uiStore";
import { formatDateTime } from "../../lib/format";
import { deriveShiftStats, shiftDurationMin } from "../../lib/shifts";
import { StartShiftModal } from "./StartShiftModal";
import type { DriverShift, Trip } from "../../types";

function fmtShiftDur(min: number): string {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d}d ${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ShiftsCard({ trips }: { trips: Trip[] }) {
  const { data: shifts, isLoading } = useShifts();
  const endShift = useEndShift();
  const showToast = useUiStore((s) => s.showToast);
  const [startModalOpen, setStartModalOpen] = useState(false);

  const sorted = useMemo(
    () => [...(shifts ?? [])].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [shifts],
  );
  const openDriverIds = useMemo(
    () => new Set((shifts ?? []).filter((s) => !s.endedAt).map((s) => s.driverId)),
    [shifts],
  );

  function handleEnd(shift: DriverShift) {
    endShift.mutate(shift.id, {
      onSuccess: () => showToast(`Shift ended for ${shift.driverName}`),
    });
  }

  const columns: DataTableColumn<DriverShift>[] = [
    { key: "driver", header: "Driver", sortValue: (s) => s.driverName, render: (s) => <span className="font-sans text-[12.5px] font-semibold">{s.driverName}</span> },
    { key: "vehicle", header: "Vehicle", sortValue: (s) => s.vehicleReg, render: (s) => <span className="font-mono text-[12px] font-bold">{s.vehicleReg}</span> },
    { key: "started", header: "Started", sortValue: (s) => s.startedAt, render: (s) => <span className="font-mono text-[11px] text-ink-faint">{formatDateTime(s.startedAt)}</span> },
    {
      key: "ended",
      header: "Ended",
      sortValue: (s) => s.endedAt ?? "",
      render: (s) =>
        s.endedAt ? (
          <span className="font-mono text-[11px] text-ink-faint">{formatDateTime(s.endedAt)}</span>
        ) : (
          <Badge tone="success" withDot>Ongoing</Badge>
        ),
    },
    { key: "duration", header: "Duration", sortValue: (s) => shiftDurationMin(s), render: (s) => fmtShiftDur(shiftDurationMin(s)), align: "right" },
    {
      key: "trips",
      header: "Trips",
      sortValue: (s) => deriveShiftStats(s, trips).tripCount,
      render: (s) => deriveShiftStats(s, trips).tripCount,
      align: "right",
    },
    {
      key: "distance",
      header: "Distance",
      sortValue: (s) => deriveShiftStats(s, trips).distanceKm,
      render: (s) => `${deriveShiftStats(s, trips).distanceKm.toLocaleString("en-IN")} km`,
      align: "right",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) =>
        s.endedAt ? null : (
          <Button size="sm" variant="secondary" leftIcon={<Stop size={12} weight="fill" />} onClick={() => handleEnd(s)} loading={endShift.isPending}>
            End Shift
          </Button>
        ),
    },
  ];

  return (
    <Card
      title="Driver Shifts"
      className="mt-3"
      padded={false}
      bodyClassName="px-4 py-2"
      action={
        <Button size="sm" leftIcon={<Play size={12} weight="fill" />} onClick={() => setStartModalOpen(true)}>
          Start Shift
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <DataTable
          caption="Driver shift log"
          rows={sorted}
          getRowId={(s) => s.id}
          emptyTitle="No shifts logged yet"
          emptyDescription="Start a shift to link a driver and vehicle to the trips they run."
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
        />
      )}
      <StartShiftModal open={startModalOpen} onClose={() => setStartModalOpen(false)} openDriverIds={openDriverIds} />
    </Card>
  );
}
