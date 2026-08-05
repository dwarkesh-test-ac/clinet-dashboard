import { useQuery } from "@tanstack/react-query";
import { fetchAlerts } from "../lib/api/alerts";
import { queryKeys } from "../lib/api/queryKeys";

export function useAlerts() {
  return useQuery({ queryKey: queryKeys.alerts, queryFn: fetchAlerts, refetchInterval: 5000 });
}
