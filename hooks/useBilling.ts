import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPaymentMethod,
  cancelPlan,
  fetchBillingCycle,
  fetchInvoices,
  fetchPaymentMethods,
  fetchUsageLedger,
  reactivatePlan,
  setPrimaryPaymentMethod,
} from "../lib/api/billing";
import { queryKeys } from "../lib/api/queryKeys";

export function useBillingCycle() {
  return useQuery({ queryKey: queryKeys.billingCycle, queryFn: fetchBillingCycle });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: fetchPaymentMethods });
}

export function useSetPrimaryPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setPrimaryPaymentMethod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods }),
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods }),
  });
}

export function useInvoices() {
  return useQuery({ queryKey: queryKeys.invoices, queryFn: fetchInvoices });
}

export function useUsageLedger() {
  return useQuery({ queryKey: queryKeys.usageLedger, queryFn: fetchUsageLedger });
}

export function useCancelPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.billingCycle }),
  });
}

export function useReactivatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivatePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.billingCycle }),
  });
}
