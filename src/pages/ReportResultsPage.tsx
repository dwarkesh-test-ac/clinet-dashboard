import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ArrowLeft, DownloadSimple } from "@phosphor-icons/react";
import { Card, DataTable, Skeleton } from "@navyug/ui";
import { useReport } from "../hooks/useReports";
import { useUiStore } from "../stores/uiStore";
import { routes } from "../config/routes";
import type { ReportType } from "../lib/api/reports";

const TITLES: Record<ReportType, string> = {
  "trip-summary": "Trip Summary Report",
  distance: "Distance Report",
  "idle-time": "Idle Time Report",
  alerts: "Alerts Report",
};

export function ReportResultsPage() {
  const [params] = useSearchParams();
  const type = (params.get("type") as ReportType) || "trip-summary";
  const { data: rows, isLoading } = useReport(type);
  const showToast = useUiStore((s) => s.showToast);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="flex items-center gap-2.5">
        <Link to={routes.reports} className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-ink outline-none focus-visible:underline">
          <ArrowLeft size={13} />
          Back
        </Link>
        <h2 className="font-sans text-[14px] font-bold text-ink">{TITLES[type]}</h2>
        <button
          type="button"
          onClick={() => showToast("Report download started")}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <DownloadSimple size={13} />
          Export CSV
        </button>
      </div>

      <Card className="mt-3" padded={false} bodyClassName="px-4 py-2">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <DataTable
            caption={TITLES[type]}
            rows={rows ?? []}
            getRowId={(r) => r.vehicleId}
            emptyTitle="No data for this report"
            columns={[
              {
                key: "vehicle",
                header: "Vehicle",
                sortValue: (r) => r.vehicleReg,
                render: (r) => (
                  <Link to={routes.tracking(r.vehicleId)} className="font-mono text-[12px] font-bold text-brand">
                    {r.vehicleReg}
                  </Link>
                ),
              },
              { key: "driver", header: "Driver", sortValue: (r) => r.driverName, render: (r) => r.driverName },
              { key: "trips", header: "Trips", sortValue: (r) => r.totalTrips, render: (r) => r.totalTrips, align: "right" },
              {
                key: "distance",
                header: "Distance",
                sortValue: (r) => r.totalDistanceKm,
                render: (r) => `${r.totalDistanceKm.toFixed(1)} km`,
                align: "right",
              },
              { key: "idle", header: "Idle Time", sortValue: (r) => r.totalIdleMin, render: (r) => `${r.totalIdleMin} min`, align: "right" },
              { key: "alerts", header: "Alerts", sortValue: (r) => r.alertCount, render: (r) => r.alertCount, align: "right" },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
