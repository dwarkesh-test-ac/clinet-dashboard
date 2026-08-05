import type { InsurancePolicy } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchInsurancePolicies(): Promise<InsurancePolicy[]> {
  if (!USE_MOCKS) return notImplemented("insurance");
  return delay([...useMockWorldStore.getState().insurancePolicies]);
}
