import type { DriverScorecard } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchScorecards(): Promise<DriverScorecard[]> {
  if (!USE_MOCKS) return notImplemented("scorecards");
  return delay([...useMockWorldStore.getState().scorecards]);
}
