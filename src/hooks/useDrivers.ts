import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDriver, fetchDrivers } from "../lib/api/drivers";
import { queryKeys } from "../lib/api/queryKeys";

export function useDrivers() {
  return useQuery({ queryKey: queryKeys.drivers, queryFn: fetchDrivers });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.drivers }),
  });
}
