import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, DataTable, Skeleton, Tabs } from "@navyug/ui";
import { useAlerts } from "../hooks/useAlerts";
import { routes } from "../config/routes";
import { formatDateTime } from "../lib/format";
import type { AlertKind } from "../types";

const KIND_TABS: Array<{ id: AlertKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "brake", label: "Harsh Braking" },
  { id: "geo", label: "Geo-fence" },
  { id: "speed", label: "Overspeeding" },
  { id: "device", label: "Device" },
];

const SEVERITY_TONE = { critical: "danger", major: "warning", minor: "neutral" } as const;

export function EventsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const [kind, setKind] = useState<AlertKind | "all">("all");

  const filtered = useMemo(
    () => (alerts ?? []).filter((a) => kind === "all" || a.kind === kind),
    [alerts, kind],
  );

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <Card padded={false}>
        <Tabs items={KIND_TABS} activeId={kind} onChange={(id) => setKind(id as AlertKind | "all")} />
        <div className="px-4 py-2">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <DataTable
              caption="Fleet event timeline"
              rows={filtered}
              getRowId={(a) => a.id}
              emptyTitle="No events of this type"
              columns={[
                {
                  key: "title",
                  header: "Event",
                  sortValue: (a) => a.title,
                  render: (a) => <span className="font-sans text-[12.5px] font-semibold text-ink">{a.title}</span>,
                },
                {
                  key: "vehicle",
                  header: "Vehicle",
                  sortValue: (a) => a.vehicleReg,
                  render: (a) => (
                    <Link to={routes.tracking(a.vehicleId)} className="font-mono text-[12px] font-bold text-brand">
                      {a.vehicleReg}
                    </Link>
                  ),
                },
                {
                  key: "severity",
                  header: "Severity",
                  sortValue: (a) => a.severity,
                  render: (a) => <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>,
                },
                {
                  key: "when",
                  header: "Occurred",
                  sortValue: (a) => a.occurredAt,
                  render: (a) => <span className="font-mono text-[11px] text-ink-faint">{formatDateTime(a.occurredAt)}</span>,
                  align: "right",
                },
              ]}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
