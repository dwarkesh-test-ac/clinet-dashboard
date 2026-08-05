import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VehicleGroup } from "../types";
import { createGroup, fetchGroups, updateGroup } from "../lib/api/groups";
import { queryKeys } from "../lib/api/queryKeys";

export function useGroups() {
  return useQuery({ queryKey: queryKeys.groups, queryFn: fetchGroups });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: Pick<VehicleGroup, "name" | "description" | "managerName" | "icon"> }) =>
      updateGroup(vars.id, vars.input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}
