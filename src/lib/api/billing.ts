import type { Invoice, PaymentMethod, UsageLedgerEntry } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export interface BillingCycleInfo {
  planCancelled: boolean;
  cycleEndDate: string;
}

export async function fetchBillingCycle(): Promise<BillingCycleInfo> {
  if (!USE_MOCKS) return notImplemented("billing");
  const { planCancelled, cycleEndDate } = useMockWorldStore.getState();
  return delay({ planCancelled, cycleEndDate });
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  if (!USE_MOCKS) return notImplemented("billing");
  return delay([...useMockWorldStore.getState().paymentMethods]);
}

export async function setPrimaryPaymentMethod(id: string): Promise<void> {
  if (!USE_MOCKS) return notImplemented("billing");
  useMockWorldStore.getState().setPrimaryPaymentMethod(id);
  return delay(undefined);
}

export async function addPaymentMethod(input: Pick<PaymentMethod, "type" | "label" | "detail">): Promise<void> {
  if (!USE_MOCKS) return notImplemented("billing");
  useMockWorldStore.getState().addPaymentMethod(input);
  return delay(undefined);
}

export async function fetchInvoices(): Promise<Invoice[]> {
  if (!USE_MOCKS) return notImplemented("billing");
  return delay([...useMockWorldStore.getState().invoices]);
}

export async function fetchUsageLedger(): Promise<UsageLedgerEntry[]> {
  if (!USE_MOCKS) return notImplemented("billing");
  return delay([...useMockWorldStore.getState().usageLedger]);
}

export async function cancelPlan(): Promise<void> {
  if (!USE_MOCKS) return notImplemented("billing");
  useMockWorldStore.getState().cancelPlan();
  return delay(undefined);
}

export async function reactivatePlan(): Promise<void> {
  if (!USE_MOCKS) return notImplemented("billing");
  useMockWorldStore.getState().reactivatePlan();
  return delay(undefined);
}
