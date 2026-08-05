import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endShift, fetchShifts, startShift } from "../lib/api/shifts";
import { queryKeys } from "../lib/api/queryKeys";

export function useShifts() {
  return useQuery({ queryKey: queryKeys.shifts, queryFn: fetchShifts });
}

export function useStartShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.shifts }),
  });
}

export function useEndShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.shifts }),
  });
}
