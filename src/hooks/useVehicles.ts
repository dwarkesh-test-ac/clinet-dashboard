import { useQuery } from "@tanstack/react-query";
import { fetchKpiSummary, fetchVehicle, fetchVehicles } from "../lib/api/vehicles";
import { queryKeys } from "../lib/api/queryKeys";

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: fetchVehicles,
    refetchInterval: 5000,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicle(id ?? ""),
    queryFn: () => fetchVehicle(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useKpiSummary() {
  return useQuery({
    queryKey: queryKeys.kpiSummary,
    queryFn: fetchKpiSummary,
    refetchInterval: 5000,
  });
}
