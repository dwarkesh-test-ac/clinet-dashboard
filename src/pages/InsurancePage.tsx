import { useMemo } from "react";
import { ShieldStar, WarningCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, KpiCard, Skeleton } from "@navyug/ui";
import { useInsurancePolicies } from "../hooks/useInsurance";
import { useUiStore } from "../stores/uiStore";
import { formatDate } from "../lib/format";
import type { InsuranceStatus } from "../types";

const STATUS_TONE: Record<InsuranceStatus, "success" | "warning" | "danger"> = {
  Active: "success",
  Expiring: "warning",
  Expired: "danger",
};

function daysLabel(expiryDate: string): { label: string; tone: "danger" | "warning" | "neutral" } {
  const days = Math.round((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: `${Math.abs(days)} days ago`, tone: "danger" };
  if (days <= 30) return { label: `${days} days left`, tone: "warning" };
  return { label: `${days} days left`, tone: "neutral" };
}

export function InsurancePage() {
  const { data: policies, isLoading } = useInsurancePolicies();
  const showToast = useUiStore((s) => s.showToast);

  const stats = useMemo(() => {
    const rows = policies ?? [];
    return {
      active: rows.filter((p) => p.status === "Active").length,
      expiring: rows.filter((p) => p.status === "Expiring").length,
      expired: rows.filter((p) => p.status === "Expired").length,
      annualPremium: rows.reduce((s, p) => s + p.premium, 0),
    };
  }, [policies]);

  const attention = useMemo(
    () => (policies ?? []).filter((p) => p.status !== "Active").sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()),
    [policies],
  );

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)
          : [
              { label: "Active Policies", value: stats.active },
              { label: "Expiring ≤ 30 Days", value: stats.expiring },
              { label: "Expired", value: stats.expired },
              { label: "Annual Premium", value: `₹${stats.annualPremium.toLocaleString("en-IN")}` },
            ].map((k) => <KpiCard key={k.label} label={k.label} value={k.value} />)}
      </div>

      {attention.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2.5 flex items-center gap-1.5 font-sans text-[13px] font-bold text-amber-800">
            <WarningCircle size={15} weight="fill" />
            Policies needing attention
          </div>
          <div className="flex flex-col gap-2">
            {attention.map((p) => {
              const { label } = daysLabel(p.expiryDate);
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2">
                  <span className="font-mono text-[12px] font-bold text-ink">{p.vehicleReg}</span>
                  <span className="font-sans text-[12px] text-ink-muted">{p.insurer} · {p.type}</span>
                  <span className="font-mono text-[11px] text-ink-faint">{label} · {formatDate(p.expiryDate)}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="ml-auto"
                    onClick={() => showToast(`Renewal started with ${p.insurer} for ${p.vehicleReg}`)}
                  >
                    Renew
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Card
        title="Vehicle Insurance Policies"
        className="mt-3"
        padded={false}
        bodyClassName="px-4 py-2"
        action={<Button size="sm" leftIcon={<ShieldStar size={13} weight="fill" />} onClick={() => showToast("Add-policy form (demo)")}>+ Add Policy</Button>}
      >
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <DataTable
            caption="Vehicle insurance policies"
            rows={policies ?? []}
            getRowId={(p) => p.id}
            emptyTitle="No insurance policies on file"
            columns={[
              { key: "vehicle", header: "Vehicle", sortValue: (p) => p.vehicleReg, render: (p) => <span className="font-mono text-[12px] font-bold">{p.vehicleReg}</span> },
              { key: "insurer", header: "Insurer", sortValue: (p) => p.insurer, render: (p) => p.insurer },
              { key: "policyNo", header: "Policy No.", sortValue: (p) => p.policyNo, render: (p) => <span className="font-mono text-[11px] text-ink-faint">{p.policyNo}</span> },
              { key: "type", header: "Type", sortValue: (p) => p.type, render: (p) => p.type },
              { key: "idv", header: "IDV", sortValue: (p) => p.idv, render: (p) => <span className="font-mono text-[11.5px]">₹{p.idv.toLocaleString("en-IN")}</span>, align: "right" },
              { key: "premium", header: "Premium", sortValue: (p) => p.premium, render: (p) => <span className="font-mono text-[12px] font-bold">₹{p.premium.toLocaleString("en-IN")}</span>, align: "right" },
              {
                key: "validity",
                header: "Validity",
                sortValue: (p) => p.expiryDate,
                render: (p) => {
                  const { label } = daysLabel(p.expiryDate);
                  return (
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge tone={STATUS_TONE[p.status]} withDot>{p.status}</Badge>
                      <span className="font-mono text-[10.5px] text-ink-faint">{formatDate(p.expiryDate)} · {label}</span>
                    </div>
                  );
                },
                align: "right",
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
