import { useQuery } from "@tanstack/react-query";
import { fetchTrip, fetchTrips } from "../lib/api/trips";
import { queryKeys } from "../lib/api/queryKeys";

export function useTrips(vehicleId?: string) {
  return useQuery({ queryKey: queryKeys.trips(vehicleId), queryFn: () => fetchTrips(vehicleId) });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.trip(id ?? ""),
    queryFn: () => fetchTrip(id!),
    enabled: !!id,
  });
}
