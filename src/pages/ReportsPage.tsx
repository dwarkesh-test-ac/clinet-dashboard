import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "@phosphor-icons/react";
import { Button, Card, Select } from "@navyug/ui";
import { routes } from "../config/routes";
import type { ReportType } from "../lib/api/reports";

const REPORT_TYPES: Array<{ id: ReportType; label: string; description: string }> = [
  { id: "trip-summary", label: "Trip Summary", description: "Trips, distance and idle time per vehicle" },
  { id: "distance", label: "Distance Report", description: "Total distance covered per vehicle" },
  { id: "idle-time", label: "Idle Time Report", description: "Idle duration per vehicle" },
  { id: "alerts", label: "Alerts Report", description: "Alert counts per vehicle" },
];

export function ReportsPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<ReportType>("trip-summary");
  const [range, setRange] = useState("month-to-date");

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <Card title="Generate a Report" className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => setType(rt.id)}
                className="flex items-start gap-2.5 rounded-xl border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/30"
                style={{
                  borderColor: type === rt.id ? "#2563EB" : "#E5E7EB",
                  background: type === rt.id ? "#EFF6FF" : "#fff",
                }}
                aria-pressed={type === rt.id}
              >
                <FileText size={18} weight={type === rt.id ? "fill" : "regular"} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  <span className="block font-sans text-[13px] font-semibold text-ink">{rt.label}</span>
                  <span className="mt-0.5 block font-sans text-[11.5px] font-medium text-ink-muted">{rt.description}</span>
                </span>
              </button>
            ))}
          </div>
          <Select label="Date Range" value={range} onChange={(e) => setRange(e.target.value)} className="max-w-xs">
            <option value="today">Today</option>
            <option value="week-to-date">Week to Date</option>
            <option value="month-to-date">Month to Date</option>
            <option value="last-30-days">Last 30 Days</option>
          </Select>
          <Button className="w-fit" onClick={() => navigate(`${routes.reportResults}?type=${type}`)}>
            Run Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
