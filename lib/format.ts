import type { AlertKind, VehicleStatus } from "../types";

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("en-IN", { maximumFractionDigits: 1 })} km`;
}

export const alertVisuals: Record<AlertKind, { color: string; bg: string }> = {
  brake: { color: "#EF4444", bg: "#FEE2E2" },
  geo: { color: "#F59E0B", bg: "#FEF3C7" },
  speed: { color: "#EF4444", bg: "#FEE2E2" },
  device: { color: "#6B7280", bg: "#F3F4F6" },
};

export const statusLabel: Record<VehicleStatus, string> = {
  moving: "Moving",
  stopped: "Stopped",
  idle: "Idle",
  nodata: "No Data",
};
