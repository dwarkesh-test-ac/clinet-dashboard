import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, UserCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, Modal, Select, Skeleton, TextInput } from "@navyug/ui";
import { useInviteUser, useUpdateUserRole, useUsers } from "../hooks/useUsers";
import { useUiStore } from "../stores/uiStore";
import { timeAgo } from "../lib/format";
import type { UserRole } from "../types";

const ROLES: UserRole[] = ["Owner", "Admin", "Manager", "Viewer"];
const emptyForm = { name: "", email: "", role: "Viewer" as UserRole };

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const inviteUser = useInviteUser();
  const updateRole = useUpdateUserRole();
  const showToast = useUiStore((s) => s.showToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    inviteUser.mutate(
      { name: form.name.trim(), email: form.email.trim(), role: form.role },
      {
        onSuccess: () => {
          showToast(`Invite sent to ${form.email}`);
          setModalOpen(false);
          setForm(emptyForm);
        },
      },
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="font-sans text-[14px] font-semibold text-ink">Team Members</span>
        <Button size="sm" leftIcon={<Plus size={13} weight="bold" />} className="ml-auto" onClick={() => setModalOpen(true)}>
          Invite User
        </Button>
      </div>

      <Card padded={false} bodyClassName="px-4 py-2">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <DataTable
            caption="Team members"
            rows={users ?? []}
            getRowId={(u) => u.id}
            emptyTitle="No team members yet"
            columns={[
              {
                key: "name",
                header: "Name",
                sortValue: (u) => u.name,
                render: (u) => (
                  <span className="flex items-center gap-2">
                    <UserCircle size={18} className="text-ink-faint" />
                    <span>
                      <span className="block font-sans text-[12.5px] font-semibold">{u.name}</span>
                      <span className="block font-sans text-[10.5px] font-medium text-ink-faint">{u.email}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "role",
                header: "Role",
                sortValue: (u) => u.role,
                render: (u) => (
                  <Select
                    label={`Role for ${u.name}`}
                    hideLabel
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as UserRole })}
                    className="h-8 w-32"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                ),
              },
              {
                key: "status",
                header: "Status",
                sortValue: (u) => u.status,
                render: (u) => <Badge tone={u.status === "active" ? "success" : "warning"} withDot>{u.status}</Badge>,
              },
              { key: "lastActive", header: "Last Active", sortValue: (u) => u.lastActive, render: (u) => timeAgo(u.lastActive), align: "right" },
            ]}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={inviteUser.isPending}>Send Invite</Button>
          </>
        }
      >
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <TextInput label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </form>
      </Modal>
    </div>
  );
}
