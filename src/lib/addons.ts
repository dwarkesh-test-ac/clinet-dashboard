import type { Icon } from "@phosphor-icons/react";
import { Brain, Broadcast, ClockCounterClockwise, Polygon, ShieldCheck, UsersThree } from "@phosphor-icons/react";

export interface AddonDef {
  id: string;
  label: string;
  icon: Icon;
  price: number;
  per: "device" | "flat";
  /** Nav ids (see config/nav.tsx) this add-on unlocks. Empty = doesn't gate any page. */
  pages: string[];
}

export const ADDONS: AddonDef[] = [
  { id: "geofence", label: "Geofencing & Zone Alerts", icon: Polygon, price: 60, per: "device", pages: ["geofence"] },
  { id: "ai", label: "Driver Behaviour AI + KPI Reports", icon: Brain, price: 90, per: "device", pages: ["reports"] },
  { id: "antitheft", label: "Anti-Theft Priority Alerts", icon: ShieldCheck, price: 40, per: "device", pages: ["events"] },
  { id: "commands", label: "Remote Device Commands", icon: Broadcast, price: 35, per: "device", pages: ["devices"] },
  { id: "history", label: "Extended Trip History (1 yr)", icon: ClockCounterClockwise, price: 25, per: "device", pages: [] },
  { id: "teamUsers", label: "Team Users (10 seats)", icon: UsersThree, price: 499, per: "flat", pages: ["groups", "users"] },
];

export const BASE_PRICE = 149;

export const DEFAULT_ADDONS: Record<string, boolean> = {
  geofence: true,
  ai: true,
  antitheft: true,
  commands: true,
  teamUsers: true,
  history: false,
};

/**
 * Which key in authStore's `modules` map each add-on controls, for the add-ons that gate a page
 * the app already locks (`ROUTE_MODULES` in layouts/AppShell.tsx: liveMap/timeline→map,
 * geofences→geo, devices→maint). "map" is never addon-gated — the base plan always includes live
 * tracking. The remaining add-ons (ai, antitheft, history, teamUsers) don't gate any page today;
 * they're still toggleable in Manage Add-ons for pricing/plan-summary fidelity with the design.
 */
export const ADDON_MODULE_MAP: Record<string, string | null> = {
  geofence: "geo",
  ai: null,
  antitheft: null,
  commands: "maint",
  history: null,
  teamUsers: null,
};

export interface PlanTotals {
  devRate: number;
  flatAddonPrice: number;
  sub: number;
  gst: number;
  total: number;
  activeCount: number;
}

export function computePlanTotals(addons: Record<string, boolean>, deviceCount: number): PlanTotals {
  const perDeviceAddonPrice = ADDONS.filter((a) => a.per === "device" && addons[a.id]).reduce((s, a) => s + a.price, 0);
  const flatAddonPrice = ADDONS.filter((a) => a.per === "flat" && addons[a.id]).reduce((s, a) => s + a.price, 0);
  const devRate = BASE_PRICE + perDeviceAddonPrice;
  const sub = deviceCount * devRate + flatAddonPrice;
  const gst = Math.round(sub * 0.18);
  return { devRate, flatAddonPrice, sub, gst, total: sub + gst, activeCount: ADDONS.filter((a) => addons[a.id]).length };
}
