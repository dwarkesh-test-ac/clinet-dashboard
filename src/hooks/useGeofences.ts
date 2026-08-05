import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGeofence, fetchGeofences } from "../lib/api/geofences";
import { queryKeys } from "../lib/api/queryKeys";

export function useGeofences() {
  return useQuery({ queryKey: queryKeys.geofences, queryFn: fetchGeofences });
}

export function useCreateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGeofence,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.geofences }),
  });
}
