import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, inviteUser, updateUserRole } from "../lib/api/users";
import { queryKeys } from "../lib/api/queryKeys";

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: fetchUsers });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Parameters<typeof updateUserRole>[1] }) =>
      updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
