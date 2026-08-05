import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCommandLog, sendCommand } from "../lib/api/commands";
import { queryKeys } from "../lib/api/queryKeys";

export function useCommandLog() {
  return useQuery({ queryKey: queryKeys.commandLog, queryFn: fetchCommandLog, refetchInterval: 5000 });
}

export function useSendCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleReg, command }: { vehicleReg: string; command: string }) =>
      sendCommand(vehicleReg, command),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.commandLog }),
  });
}
