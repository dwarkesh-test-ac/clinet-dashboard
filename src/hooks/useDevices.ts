import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDevices, registerDevice, removeDevice } from "../lib/api/devices";
import { queryKeys } from "../lib/api/queryKeys";

export function useDevices() {
  return useQuery({ queryKey: queryKeys.devices, queryFn: fetchDevices });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices }),
  });
}

export function useRemoveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices }),
  });
}
