import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Funnel,
  GasPump,
  Plus,
  ShieldCheck,
  ShieldStar,
  Timer,
  Wrench,
} from "@phosphor-icons/react";
import { Card, KpiCard, Skeleton, SearchInput, Select, DataTable, Button } from "@navyug/ui";
import type { DataTableColumn } from "@navyug/ui";
import { useVehicles } from "../hooks/useVehicles";
import { useFuelOdometerEntries } from "../hooks/useFuelLog";
import { useInsurancePolicies } from "../hooks/useInsurance";
import { useTrips } from "../hooks/useTrips";
import { useScorecards } from "../hooks/useScorecards";
import { useGroups } from "../hooks/useGroups";
import { useAuthStore } from "../stores/authStore";
import { computeDeviceRate } from "../lib/pricing";
import { routes } from "../config/routes";
import { LogFuelModal } from "./FuelLogPage/LogFuelModal";

const DIESEL_PRICE = 96;
const PETROL_PRICE = 96;
const CNG_PRICE = 82;
const EV_PRICE = 8;
const WEAR_EVENT_COST = 250; // ₹250 estimated cost per harsh jerk event (brakes, tires, suspension)
const IDLE_LPH_DIESEL = 1.5; // Liters per hour idling
const IDLE_KWH_EV = 0.3; // kWh per hour idling

interface VehicleFinancialRecord {
  id: string;
  reg: string;
  groupName: string;
  groupId: string;
  fuelType: string;
  distance: number;
  fuelCost: number;
  fuelLitres: number;
  actualMileage: number | null;
  baselineMileage: number;
  maintenanceCost: number;
  driverSalary: number;
  insuranceCost: number;
  tollsCost: number;
  softwareCost: number;
  wearPenalty: number;
  idleCost: number;
  idleMin: number;
  harshEvents: number;
  totalCost: number;
  cpk: number;
  hasLogs: boolean;
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function FinancialsPage() {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: fuelEntries = [], isLoading: fuelLoading } = useFuelOdometerEntries();
  const { data: insurancePolicies = [], isLoading: insuranceLoading } = useInsurancePolicies();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: scorecards = [], isLoading: scorecardsLoading } = useScorecards();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { modules } = useAuthStore();
  const { devRate } = computeDeviceRate(modules);

  // Local state for inline baseline mileage overrides (persisted in localStorage)
  const [mileageOverrides, setMileageOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("navyug.mileageOverrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveMileageOverride = (vehicleId: string, value: number) => {
    setMileageOverrides((prev) => {
      const next = { ...prev, [vehicleId]: value };
      try {
        localStorage.setItem("navyug.mileageOverrides", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Search and Group Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");

  // Fuel logging modal state
  const [isLogFuelOpen, setIsLogFuelOpen] = useState(false);

  // Group default mileage tracking (persisted in localStorage)
  const [groupMileageDefaults, setGroupMileageDefaults] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("navyug.groupMileageDefaults");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveGroupMileageDefault = (groupId: string, value: number) => {
    setGroupMileageDefaults((prev) => {
      const next = { ...prev, [groupId]: value };
      try {
        localStorage.setItem("navyug.groupMileageDefaults", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Fleet Budget Tracking State (initialized with realistic values, saved in localStorage)
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("navyug.budgetOverrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveBudget = (category: string, value: number) => {
    setBudgets((prev) => {
      const next = { ...prev, [category]: value };
      try {
        localStorage.setItem("navyug.budgetOverrides", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isLoading = vehiclesLoading || fuelLoading || insuranceLoading || tripsLoading || scorecardsLoading || groupsLoading;

  // 1. Process all vehicle financials
  const financials = useMemo(() => {
    return vehicles.map((v): VehicleFinancialRecord => {
      const sc = scorecards.find((s) => s.vehicleReg.toLowerCase() === v.reg.toLowerCase());
      const grp = groups.find((g) => g.id === v.groupId);

      // Distance: scorecard 30-day trailing or fallback based on current daily run
      const distance = sc?.distance30Km ?? Math.round(v.distanceTodayKm * 20 + 200);

      // Baseline Mileage configuration
      let baselineMileage = mileageOverrides[v.id];
      if (baselineMileage === undefined) {
        const groupDefault = groupMileageDefaults[v.groupId];
        if (groupDefault !== undefined) {
          baselineMileage = groupDefault;
        } else {
          if (v.fuelType === "EV") baselineMileage = 6.0;
          else if (v.fuelType === "CNG") baselineMileage = 9.0;
          else if (v.fuelType === "Petrol") baselineMileage = 7.5;
          else baselineMileage = 5.2; // Diesel
        }
      }

      // Fuel log actuals vs GPS projected
      const vEntries = fuelEntries.filter((e) => e.vehicleReg.toLowerCase() === v.reg.toLowerCase());
      let fuelCost = 0;
      let fuelLitres = 0;
      let actualMileage: number | null = null;
      const hasLogs = vEntries.length > 0;

      if (hasLogs) {
        const totalLogCost = vEntries.reduce((sum, e) => sum + e.cost, 0);
        const totalLogLiters = vEntries.reduce((sum, e) => sum + e.fuelLitres, 0);
        const totalLogDist = vEntries.reduce((sum, e) => sum + Math.max(0, e.odometerKm - e.prevOdo), 0);

        fuelCost = totalLogCost;
        fuelLitres = totalLogLiters;
        if (totalLogLiters > 0 && totalLogDist > 0) {
          actualMileage = totalLogDist / totalLogLiters;
        }
      } else {
        const price = v.fuelType === "EV" ? EV_PRICE : v.fuelType === "CNG" ? CNG_PRICE : v.fuelType === "Petrol" ? PETROL_PRICE : DIESEL_PRICE;
        fuelLitres = distance / baselineMileage;
        fuelCost = fuelLitres * price;
      }

      // Maintenance cost: dynamic simulation (EV is lower, heavy trucks higher)
      const regNum = parseInt(v.reg.replace(/[^0-9]/g, "")) || 1000;
      const baseMaint = 4500 + (regNum % 8) * 1500;
      const maintenanceCost = Math.round(v.fuelType === "EV" ? baseMaint * 0.6 : baseMaint);

      // Driver salary (flat monthly wage if assigned)
      const driverSalary = v.driverId ? 22000 : 0;

      // Insurance cost: monthly share of annual premium
      const policy = insurancePolicies.find((p) => p.vehicleReg.toLowerCase() === v.reg.toLowerCase());
      const insuranceCost = policy ? Math.round(policy.premium / 12) : 2500;

      // Tolls & misc operational costs
      const tollsCost = 3000 + (regNum % 5) * 1200;

      // Telematics cost (Navyug subscription)
      const softwareCost = devRate;

      // Telemetry Harsh events wear & tear cost (jerk events)
      const harshEvents = sc
        ? sc.riskEvents.overspeeding +
          sc.riskEvents.harshBraking +
          sc.riskEvents.harshAcceleration +
          sc.riskEvents.sharpCornering
        : Math.round(regNum % 6);
      const wearPenalty = harshEvents * WEAR_EVENT_COST;

      // GPS trip log Idling waste cost
      const vTrips = trips.filter((t) => t.vehicleId === v.id);
      const idleMin = vTrips.reduce((sum, t) => sum + t.idleMin, 0) || (sc ? sc.riskEvents.excessIdling * 15 : (regNum % 12) * 20);
      const idleRate = v.fuelType === "EV" ? IDLE_KWH_EV : IDLE_LPH_DIESEL;
      const idlePrice = v.fuelType === "EV" ? EV_PRICE : v.fuelType === "CNG" ? CNG_PRICE : v.fuelType === "Petrol" ? PETROL_PRICE : DIESEL_PRICE;
      const idleCost = Math.round((idleMin / 60) * idleRate * idlePrice);

      const totalCost =
        fuelCost + maintenanceCost + driverSalary + insuranceCost + tollsCost + softwareCost + wearPenalty;
      const cpk = distance > 0 ? totalCost / distance : 0;

      return {
        id: v.id,
        reg: v.reg,
        groupName: grp?.name ?? "General Fleet",
        groupId: v.groupId,
        fuelType: v.fuelType,
        distance,
        fuelCost,
        fuelLitres,
        actualMileage,
        baselineMileage,
        maintenanceCost,
        driverSalary,
        insuranceCost,
        tollsCost,
        softwareCost,
        wearPenalty,
        idleCost,
        idleMin,
        harshEvents,
        totalCost,
        cpk,
        hasLogs,
      };
    });
  }, [vehicles, fuelEntries, insurancePolicies, trips, scorecards, groups, devRate, mileageOverrides, groupMileageDefaults]);

  // Unit helper for group default mileage
  const groupUnit = useMemo(() => {
    if (selectedGroupId === "all") return "km/L";
    const firstInGroup = vehicles.find((v) => v.groupId === selectedGroupId);
    if (firstInGroup?.fuelType === "EV") return "km/kWh";
    if (firstInGroup?.fuelType === "CNG") return "km/kg";
    return "km/L";
  }, [selectedGroupId, vehicles]);

  // 2. Aggregate fleet metrics
  const totals = useMemo(() => {
    const defaultRes = {
      cost: 0,
      distance: 0,
      fuel: 0,
      maintenance: 0,
      driver: 0,
      insurance: 0,
      tolls: 0,
      software: 0,
      wear: 0,
      idleCost: 0,
      harshEvents: 0,
      idleMin: 0,
    };
    if (financials.length === 0) return defaultRes;

    return financials.reduce((acc, f) => {
      acc.cost += f.totalCost;
      acc.distance += f.distance;
      acc.fuel += f.fuelCost;
      acc.maintenance += f.maintenanceCost;
      acc.driver += f.driverSalary;
      acc.insurance += f.insuranceCost;
      acc.tolls += f.tollsCost;
      acc.software += f.softwareCost;
      acc.wear += f.wearPenalty;
      acc.idleCost += f.idleCost;
      acc.harshEvents += f.harshEvents;
      acc.idleMin += f.idleMin;
      return acc;
    }, defaultRes);
  }, [financials]);

  const fleetCpk = totals.distance > 0 ? totals.cost / totals.distance : 0;

  // 3. Filter financials list for table
  const filteredFinancials = useMemo(() => {
    return financials.filter((f) => {
      const matchesSearch = f.reg.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroupId === "all" || f.groupId === selectedGroupId;
      return matchesSearch && matchesGroup;
    });
  }, [financials, searchQuery, selectedGroupId]);

  // 4. Custom Conic Donut Percentages
  const chartSlices = useMemo(() => {
    if (totals.cost === 0) return [];
    const pFuel = (totals.fuel / totals.cost) * 100;
    const pDriver = (totals.driver / totals.cost) * 100;
    const pMaint = (totals.maintenance / totals.cost) * 100;
    const pTolls = (totals.tolls / totals.cost) * 100;
    const pIns = (totals.insurance / totals.cost) * 100;
    const pSoft = (totals.software / totals.cost) * 100;
    const pWear = 100 - pFuel - pDriver - pMaint - pTolls - pIns - pSoft;

    return [
      { label: "Fuel Cost", value: totals.fuel, pct: pFuel, color: "#3B82F6" },
      { label: "Driver Wages", value: totals.driver, pct: pDriver, color: "#10B981" },
      { label: "Maintenance", value: totals.maintenance, pct: pMaint, color: "#F59E0B" },
      { label: "Tolls & Misc", value: totals.tolls, pct: pTolls, color: "#EC4899" },
      { label: "Insurance", value: totals.insurance, pct: pIns, color: "#8B5CF6" },
      { label: "Harsh Driving Wear", value: totals.wear, pct: pWear, color: "#EF4444" },
      { label: "Software Fee", value: totals.software, pct: pSoft, color: "#6366F1" },
    ].sort((a, b) => b.value - a.value);
  }, [totals]);

  // Conic gradient background string
  const conicGradient = useMemo(() => {
    let currentPct = 0;
    const slices = chartSlices.map((s) => {
      const start = currentPct;
      currentPct += s.pct;
      return `${s.color} ${start.toFixed(1)}% ${currentPct.toFixed(1)}%`;
    });
    return `conic-gradient(${slices.join(", ")})`;
  }, [chartSlices]);

  // 5. Stacked Bar Chart Trend Data (TCO)
  const monthlyTrendData = useMemo(() => {
    // Current July numbers
    const curFuel = totals.fuel;
    const curMaint = totals.maintenance;
    const curOther = totals.cost - totals.fuel - totals.maintenance;

    // Historically scale prior months (showing optimization over time)
    const months = [
      { name: "Mar", fuel: curFuel * 1.25, maint: curMaint * 1.30, other: curOther * 1.06 },
      { name: "Apr", fuel: curFuel * 1.18, maint: curMaint * 1.22, other: curOther * 1.05 },
      { name: "May", fuel: curFuel * 1.11, maint: curMaint * 1.14, other: curOther * 1.03 },
      { name: "Jun", fuel: curFuel * 1.05, maint: curMaint * 1.08, other: curOther * 1.02 },
      { name: "Jul", fuel: curFuel, maint: curMaint, other: curOther },
    ];

    // Find max total to scale the SVG heights
    const maxTotal = Math.max(...months.map((m) => m.fuel + m.maint + m.other)) || 1;

    return {
      months,
      maxTotal,
    };
  }, [totals]);

  // 6. Dynamic Financial Anomalies
  const anomalies = useMemo(() => {
    if (financials.length === 0) return [];
    const list = [...financials];

    // Top Idle Waster
    const topIdle = [...list].sort((a, b) => b.idleCost - a.idleCost)[0];
    // Top Jerk Wear cost
    const topWear = [...list].sort((a, b) => b.wearPenalty - a.wearPenalty)[0];
    // Worst Efficiency (Must have logs and actual mileage < baseline mileage)
    const worstEfficiency = [...list]
      .filter((f) => f.actualMileage !== null)
      .sort((a, b) => {
        const gapA = a.baselineMileage - (a.actualMileage || 0);
        const gapB = b.baselineMileage - (b.actualMileage || 0);
        return gapB - gapA;
      })[0];

    // Insurance renewals due
    const expiringPolicies = insurancePolicies.filter((p) => p.status === "Expiring").length;

    const results = [];
    if (topIdle && topIdle.idleCost > 1500) {
      results.push({
        type: "idle",
        title: `Excessive Idling Waste`,
        desc: `Vehicle ${topIdle.reg} logged ${Math.round(topIdle.idleMin)} min of idling, wasting ${inr(topIdle.idleCost)} in fuel.`,
        action: "Enforce shutdown alert",
      });
    }
    if (topWear && topWear.wearPenalty > 2000) {
      results.push({
        type: "wear",
        title: `Harsh Jerk Wear Penalty`,
        desc: `Driver of ${topWear.reg} logged ${topWear.harshEvents} harsh jerk events, causing an estimated ${inr(topWear.wearPenalty)} in tire/brake wear.`,
        action: "Schedule driver coaching",
      });
    }
    if (worstEfficiency && worstEfficiency.actualMileage && worstEfficiency.actualMileage < worstEfficiency.baselineMileage) {
      const gapPct = Math.round(((worstEfficiency.baselineMileage - worstEfficiency.actualMileage) / worstEfficiency.baselineMileage) * 100);
      results.push({
        type: "efficiency",
        title: `Fuel Efficiency Deficit`,
        desc: `Vehicle ${worstEfficiency.reg} runs at ${worstEfficiency.actualMileage.toFixed(1)} km/L (${gapPct}% below its baseline ${worstEfficiency.baselineMileage} km/L).`,
        action: "Perform engine service",
      });
    }
    if (expiringPolicies > 0) {
      results.push({
        type: "insurance",
        title: `Insurance Policy Renewals`,
        desc: `${expiringPolicies} vehicle insurance policies are expiring within 30 days. Action required to avoid legal fines.`,
        action: "Renew policies",
      });
    }

    return results.slice(0, 3);
  }, [financials, insurancePolicies]);

  // 7. Fleet Target Budget Calculations
  const budgetFuel = budgets.fuel !== undefined ? budgets.fuel : Math.round(totals.fuel * 0.95);
  const budgetMaint = budgets.maintenance !== undefined ? budgets.maintenance : Math.round(totals.maintenance * 1.05);
  const budgetDriver = budgets.driver !== undefined ? budgets.driver : Math.round(totals.driver * 1.0);
  const budgetTolls = budgets.tolls !== undefined ? budgets.tolls : Math.round(totals.tolls * 1.02);
  const budgetWear = budgets.wear !== undefined ? budgets.wear : Math.round(totals.wear * 0.7);

  const totalBudget = budgetFuel + budgetMaint + budgetDriver + budgetTolls + budgetWear + totals.software;

  // 8. DataTable Column definitions
  const columns: DataTableColumn<VehicleFinancialRecord>[] = useMemo(() => {
    return [
      {
        key: "reg",
        header: "Vehicle No.",
        sortValue: (r) => r.reg,
        render: (r) => (
          <div className="flex flex-col">
            <Link
              to={routes.tracking(r.id)}
              className="font-mono text-[12.5px] font-bold text-ink hover:text-brand transition-colors outline-none"
            >
              {r.reg}
            </Link>
            <span className="text-[9.5px] text-ink-faint font-extrabold tracking-wider uppercase">
              {r.fuelType}
            </span>
          </div>
        ),
      },
      {
        key: "group",
        header: "Group",
        sortValue: (r) => r.groupName,
        render: (r) => <span className="text-[12px] font-medium text-ink-muted">{r.groupName}</span>,
      },
      {
        key: "distance",
        header: "GPS Dist (30D)",
        align: "right",
        sortValue: (r) => r.distance,
        render: (r) => <span className="font-mono text-[12px] font-medium">{r.distance.toLocaleString("en-IN")} km</span>,
      },
      {
        key: "mileage",
        header: "Mileage",
        align: "center",
        sortValue: (r) => r.actualMileage ?? r.baselineMileage,
        render: (r) => {
          const unit = r.fuelType === "EV" ? "km/kWh" : r.fuelType === "CNG" ? "km/kg" : "km/L";
          return (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-ink-faint font-medium">Base:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="40"
                  value={r.baselineMileage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      saveMileageOverride(r.id, val);
                    }
                  }}
                  className="w-14 px-1.5 py-0.5 rounded border border-slate-300 dark:border-zinc-700 bg-white text-ink text-center focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 hover:border-slate-400 transition-colors shadow-sm font-mono text-[11px] font-bold"
                />
                <span className="text-[9.5px] text-ink-faint font-mono">{unit}</span>
              </div>
              {r.actualMileage !== null ? (
                <span className="text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  Act: {r.actualMileage.toFixed(1)}
                </span>
              ) : (
                <span className="text-[9px] text-ink-faint italic font-semibold">No refill logs</span>
              )}
            </div>
          );
        },
      },
      {
        key: "fuelCost",
        header: "Fuel / Energy",
        align: "right",
        sortValue: (r) => r.fuelCost,
        render: (r) => (
          <div className="flex flex-col items-end">
            <span className="font-mono text-[12px] font-bold text-ink">{inr(r.fuelCost)}</span>
            <span className="text-[9.5px] text-ink-faint font-medium">
              {r.hasLogs ? "Logged receipt" : "Proj. fallback"}
            </span>
          </div>
        ),
      },
      {
        key: "wearPenalty",
        header: "Wear & Tear",
        align: "right",
        sortValue: (r) => r.wearPenalty,
        render: (r) => (
          <div className="flex flex-col items-end">
            <span className="font-mono text-[12px] font-bold text-ink">{inr(r.wearPenalty)}</span>
            <span className="text-[9.5px] text-ink-faint">{r.harshEvents} harsh jerks</span>
          </div>
        ),
      },
      {
        key: "totalCost",
        header: "Total (TCO)",
        align: "right",
        sortValue: (r) => r.totalCost,
        render: (r) => <span className="font-mono text-[12.5px] font-extrabold text-ink">{inr(r.totalCost)}</span>,
      },
      {
        key: "cpk",
        header: "Cost / Km",
        align: "right",
        sortValue: (r) => r.cpk,
        render: (r) => {
          const tone = r.cpk < 6.2 ? "success" : r.cpk > 8.5 ? "danger" : "neutral";
          const colorClass =
            tone === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
              : tone === "danger"
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
              : "bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400";
          return (
            <span className={`inline-block font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded ${colorClass}`}>
              ₹{r.cpk.toFixed(2)}/km
            </span>
          );
        },
      },
    ];
  }, [mileageOverrides]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-xl" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px] space-y-4">
      {/* 1. KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Fleet TCO (Trailing 30D)" value={inr(totals.cost)} />
        <KpiCard
          label="Fleet CPK (Avg Cost/Km)"
          value={`₹${fleetCpk.toFixed(2)}/km`}
          delta="Optimized 9.4% MoM"
          deltaTone="success"
        />
        <KpiCard
          label="Wasted Idling Cost"
          value={inr(totals.idleCost)}
          delta={`${Math.round(totals.idleMin / 60)} hrs idling`}
          deltaTone="warning"
        />
        <KpiCard
          label="Jerk Wear Penalty"
          value={inr(totals.wear)}
          delta={`${totals.harshEvents} telemetry jerk events`}
          deltaTone="danger"
        />
      </div>

      {/* 2. Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Expense Allocation Breakdown">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-full py-2">
            <div
              className="relative h-32 w-32 shrink-0 rounded-full flex items-center justify-center shadow-inner"
              style={{ background: conicGradient }}
            >
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white dark:bg-[#121214] shadow">
                <span className="font-sans text-[16px] font-extrabold text-ink">{inr(totals.cost)}</span>
                <span className="font-mono text-[8.5px] text-ink-faint font-bold uppercase tracking-wider">TCO Total</span>
              </div>
            </div>
            <div className="flex-1 w-full max-w-[280px]">
              <div className="grid grid-cols-1 gap-2 font-sans text-[11.5px] font-medium">
                {chartSlices.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-ink-muted">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="font-mono font-bold text-ink">
                      {inr(s.value)} <span className="text-[10px] text-ink-faint font-normal">({s.pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Cost of Ownership Trend">
          <div className="flex flex-col justify-between h-full py-1 gap-2">
            {/* Headers */}
            <div className="flex items-center gap-6 px-1 mb-1 text-ink-muted">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-faint">Total Costs (July)</span>
                <div className="font-sans text-[16px] font-black text-ink">{inr(totals.cost)}</div>
              </div>
              <div className="border-l border-line-soft pl-6">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-faint">Cost per Km</span>
                <div className="font-sans text-[16px] font-black text-ink">₹{fleetCpk.toFixed(2)}/km</div>
              </div>
            </div>

            {/* SVG stacked bar chart */}
            <div className="relative w-full h-[140px]">
              <svg viewBox="0 0 460 140" className="w-full h-full" role="img" aria-label="Monthly fleet total cost of ownership stacked bar chart">
                {/* Grid Lines */}
                <line x1="20" y1="130" x2="440" y2="130" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="20" y1="70" x2="440" y2="70" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="10" x2="440" y2="10" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

                {/* Bars */}
                {monthlyTrendData.months.map((m, i) => {
                  const x = 50 + i * 85;
                  const barWidth = 32;
                  const total = m.fuel + m.maint + m.other;

                  const fuelH = (m.fuel / monthlyTrendData.maxTotal) * 110;
                  const maintH = (m.maint / monthlyTrendData.maxTotal) * 110;
                  const otherH = (m.other / monthlyTrendData.maxTotal) * 110;

                  const fuelY = 130 - fuelH;
                  const maintY = fuelY - maintH;
                  const otherY = maintY - otherH;

                  return (
                    <g key={m.name} className="group/bar cursor-pointer">
                      {/* Fuel (Teal) */}
                      <rect x={x} y={fuelY} width={barWidth} height={fuelH} fill="#0D9488" className="transition-all duration-200 group-hover/bar:opacity-90" />
                      {/* Maintenance (Amber) */}
                      <rect x={x} y={maintY} width={barWidth} height={maintH} fill="#F59E0B" className="transition-all duration-200 group-hover/bar:opacity-90" />
                      {/* Other (Lavender) */}
                      <rect x={x} y={otherY} width={barWidth} height={otherH} fill="#8B5CF6" className="transition-all duration-200 group-hover/bar:opacity-90" />

                      {/* Tooltip on hover */}
                      <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none">
                        <rect x={x - 14} y={otherY - 26} width={60} height={20} rx={4} fill="#1E293B" />
                        <text x={x + 16} y={otherY - 12} textAnchor="middle" fill="#FFFFFF" className="font-mono text-[9px] font-bold">
                          {Math.round(total / 100000)}L
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Labels and Legend */}
            <div className="flex justify-between px-[54px] font-mono text-[9.5px] font-bold text-ink-faint tracking-wider uppercase border-t border-line-soft pt-2">
              {monthlyTrendData.months.map((m) => (
                <span key={m.name}>{m.name}</span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 px-1 font-sans text-[11px] font-semibold text-ink-muted mt-2 border-t border-line-soft/40 pt-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488] shrink-0" />
                Fuel Costs
                <span className="font-mono text-ink text-[10px] font-bold ml-0.5">{inr(totals.fuel)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                Service Costs
                <span className="font-mono text-ink text-[10px] font-bold ml-0.5">{inr(totals.maintenance)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                Other Costs
                <span className="font-mono text-ink text-[10px] font-bold ml-0.5">{inr(totals.cost - totals.fuel - totals.maintenance)}</span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Anomalies & Operational Simulator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Financial Anomalies & Insights">
          {anomalies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldCheck size={40} className="text-success-fill" />
              <p className="mt-2 font-sans text-[13px] font-bold text-ink">Operational costs inside thresholds</p>
              <p className="mt-1 font-sans text-[11px] text-ink-faint">No high spend or driving behavior alerts detected.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 h-full justify-center">
              {anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-surface-subtle pb-2.5 last:border-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                    {a.type === "idle" && <Timer size={16} />}
                    {a.type === "wear" && <Wrench size={16} />}
                    {a.type === "efficiency" && <GasPump size={16} />}
                    {a.type === "insurance" && <ShieldStar size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-[12.5px] font-bold text-ink">{a.title}</div>
                    <div className="mt-0.5 font-sans text-[11.5px] text-ink-muted leading-relaxed">{a.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-brand hover:text-[#0b41cd] select-none transition-colors ml-2 shrink-0 border border-brand/20 hover:border-brand px-2 py-1 rounded-md"
                  >
                    Action <ArrowRight size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Operational Budget vs Actuals">
          <div className="flex flex-col gap-3 font-sans text-[12px] h-full justify-center">
            {/* List of categories with budget inputs, progress bars, and variances */}
            {[
              { label: "Fuel & Energy", key: "fuel", actual: totals.fuel, budget: budgetFuel, color: "bg-blue-500" },
              { label: "Driver Wages", key: "driver", actual: totals.driver, budget: budgetDriver, color: "bg-emerald-500" },
              { label: "Maintenance & Repairs", key: "maintenance", actual: totals.maintenance, budget: budgetMaint, color: "bg-amber-500" },
              { label: "Tolls & Route Misc", key: "tolls", actual: totals.tolls, budget: budgetTolls, color: "bg-pink-500" },
              { label: "Wear & Tear Penalty", key: "wear", actual: totals.wear, budget: budgetWear, color: "bg-red-500" },
            ].map((cat) => {
              const diff = cat.actual - cat.budget;
              const isOver = diff > 0;
              const percent = cat.budget > 0 ? (cat.actual / cat.budget) * 100 : 0;
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-semibold text-ink-muted">
                      <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-ink-faint">Budget: ₹</span>
                        <input
                          type="number"
                          step="5000"
                          value={cat.budget}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              saveBudget(cat.key, val);
                            }
                          }}
                          className="w-24 px-2 py-0.5 rounded border border-slate-300 dark:border-zinc-700 bg-white text-ink text-right focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 hover:border-slate-400 transition-colors shadow-sm font-mono text-[11.5px] font-bold"
                        />
                      </div>
                      <span className="font-mono font-bold text-ink w-16 text-right">
                        {inr(cat.actual)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-subtle h-2 rounded-full overflow-hidden border border-line-soft/30">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isOver ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] font-bold w-24 text-right shrink-0 ${isOver ? "text-danger" : "text-success-fill"}`}>
                      {isOver ? `+${inr(diff)} Over` : `-${inr(Math.abs(diff))} Under`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Total Budget Row */}
            <div className="mt-2 pt-3 border-t border-line-soft">
              <div className="flex justify-between items-baseline">
                <div className="flex flex-col">
                  <span className="font-sans text-[13px] font-extrabold text-ink">Total Operational Budget</span>
                  <span className="text-[10px] text-ink-faint">Includes software telematics subscription</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-ink-muted">
                    Budget: {inr(totalBudget)}
                  </div>
                  <div className={`font-mono text-[12.5px] font-extrabold mt-0.5 ${totals.cost > totalBudget ? "text-danger" : "text-success-fill"}`}>
                    {totals.cost > totalBudget 
                      ? `Over Budget by ${inr(totals.cost - totalBudget)}` 
                      : `Under Budget by ${inr(totalBudget - totals.cost)}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Table */}
      <Card
        title="Vehicle Operational Cost Analysis"
        padded={false}
        action={
          <Button
            variant="secondary"
            onClick={() => setIsLogFuelOpen(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold h-7 py-0 px-2.5"
          >
            <Plus size={13} weight="bold" /> Log Fuel Receipt
          </Button>
        }
      >
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 px-[15px] py-3 border-b border-line-soft">
          <div className="relative w-full sm:w-64">
            <SearchInput
              label="Search vehicle number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-ink-faint">
              <Funnel size={14} />
            </span>
            <Select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full sm:w-48 text-[12.5px] font-medium"
            >
              <option value="all">All Vehicle Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          {selectedGroupId !== "all" && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto bg-surface-subtle border border-line-soft rounded-lg px-2.5 h-8 animate-fade-in">
              <span className="text-[11px] font-bold text-ink-muted whitespace-nowrap">Group Default Mileage:</span>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="40"
                value={groupMileageDefaults[selectedGroupId] ?? (selectedGroupId === "grp-6" ? 6.0 : 5.2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    saveGroupMileageDefault(selectedGroupId, val);
                  }
                }}
                className="w-12 text-center font-mono text-[11.5px] font-bold border border-slate-300 dark:border-zinc-700 rounded p-0.5 bg-white text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 hover:border-slate-400 transition-colors shadow-sm"
              />
              <span className="text-[10px] font-mono text-ink-faint font-bold uppercase">{groupUnit}</span>
            </div>
          )}

          <div className="sm:ml-auto text-[11.5px] text-ink-faint font-medium">
            Showing <span className="font-bold text-ink">{filteredFinancials.length}</span> of{" "}
            <span className="font-bold text-ink">{financials.length}</span> vehicles
          </div>
        </div>

        {/* Table View */}
        <div className="p-3">
          <DataTable
            columns={columns}
            rows={filteredFinancials}
            getRowId={(r) => r.id}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            caption="Vehicle operational cost analysis details"
            emptyTitle="No vehicles found"
            emptyDescription="Try adjusting your search criteria or group filter."
          />
        </div>
      </Card>

      <LogFuelModal
        open={isLogFuelOpen}
        onClose={() => setIsLogFuelOpen(false)}
        vehicles={vehicles}
      />
    </div>
  );
}
