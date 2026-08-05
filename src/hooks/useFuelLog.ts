import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFuelOdometerEntries, logFuelEntry } from "../lib/api/fuelLog";
import { queryKeys } from "../lib/api/queryKeys";

export function useFuelOdometerEntries() {
  return useQuery({ queryKey: queryKeys.fuelOdometerEntries, queryFn: fetchFuelOdometerEntries });
}

export function useLogFuelEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logFuelEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.fuelOdometerEntries }),
  });
}
