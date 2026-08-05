import type { VehicleGroup } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchGroups(): Promise<VehicleGroup[]> {
  if (!USE_MOCKS) return notImplemented("groups");
  return delay([...useMockWorldStore.getState().groups]);
}

export async function createGroup(
  input: Pick<VehicleGroup, "name" | "description" | "managerName" | "icon">,
): Promise<VehicleGroup> {
  if (!USE_MOCKS) return notImplemented("groups");
  const group: VehicleGroup = { ...input, id: `grp-new-${Date.now()}`, vehicleCount: 0 };
  useMockWorldStore.setState((s) => ({ groups: [group, ...s.groups] }));
  return delay(group);
}

export async function updateGroup(
  id: string,
  input: Pick<VehicleGroup, "name" | "description" | "managerName" | "icon">,
): Promise<void> {
  if (!USE_MOCKS) return notImplemented("groups");
  useMockWorldStore.setState((s) => ({
    groups: s.groups.map((g) => (g.id === id ? { ...g, ...input } : g)),
  }));
  return delay(undefined);
}
