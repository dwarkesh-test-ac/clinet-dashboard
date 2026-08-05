import type { FleetUser, UserRole } from "../../types";
import { useMockWorldStore } from "../mock/store";
import { delay, USE_MOCKS, notImplemented } from "./config";

export async function fetchUsers(): Promise<FleetUser[]> {
  if (!USE_MOCKS) return notImplemented("users");
  return delay([...useMockWorldStore.getState().users]);
}

export async function inviteUser(input: { name: string; email: string; role: UserRole }): Promise<FleetUser> {
  if (!USE_MOCKS) return notImplemented("users");
  const user: FleetUser = {
    ...input,
    id: `usr-new-${Date.now()}`,
    status: "invited",
    lastActive: new Date().toISOString(),
  };
  useMockWorldStore.setState((s) => ({ users: [user, ...s.users] }));
  return delay(user);
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  if (!USE_MOCKS) return notImplemented("users");
  useMockWorldStore.setState((s) => ({
    users: s.users.map((u) => (u.id === id ? { ...u, role } : u)),
  }));
  return delay(undefined);
}
