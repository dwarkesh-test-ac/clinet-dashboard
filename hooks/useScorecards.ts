import { useQuery } from "@tanstack/react-query";
import { fetchScorecards } from "../lib/api/scorecards";
import { queryKeys } from "../lib/api/queryKeys";

export function useScorecards() {
  return useQuery({ queryKey: queryKeys.scorecards, queryFn: fetchScorecards });
}
