import { useQuery } from "@tanstack/react-query";
import { fetchFinancialsSnapshot } from "../lib/api/financials";
import { queryKeys } from "../lib/api/queryKeys";

export function useFinancialsSnapshot() {
  return useQuery({ queryKey: queryKeys.financials, queryFn: fetchFinancialsSnapshot });
}
