import { useQuery } from "@tanstack/react-query";
import { fetchInsurancePolicies } from "../lib/api/insurance";
import { queryKeys } from "../lib/api/queryKeys";

export function useInsurancePolicies() {
  return useQuery({ queryKey: queryKeys.insurancePolicies, queryFn: fetchInsurancePolicies });
}
