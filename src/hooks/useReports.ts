import { useQuery } from "@tanstack/react-query";
import { runReport, type ReportType } from "../lib/api/reports";
import { queryKeys } from "../lib/api/queryKeys";

export function useReport(type: ReportType, enabled = true) {
  return useQuery({
    queryKey: queryKeys.report(type),
    queryFn: () => runReport(type),
    enabled,
  });
}
