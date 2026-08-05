import { useState } from "react";
import type { FormEvent } from "react";
import { Bus, Car, Motorcycle, PencilSimple, Plus, Stack, Truck, Van } from "@phosphor-icons/react";
import { Button, Card, IconButton, Modal, Skeleton, TextInput } from "@navyug/ui";
import { useCreateGroup, useGroups, useUpdateGroup } from "../hooks/useGroups";
import { useUiStore } from "../stores/uiStore";
import type { VehicleGroup, VehicleIconKey } from "../types";

const ICON_OPTIONS: { key: VehicleIconKey; label: string; Icon: typeof Truck }[] = [
  { key: "truck", label: "Truck", Icon: Truck },
  { key: "van", label: "Van", Icon: Van },
  { key: "bike", label: "Bike", Icon: Motorcycle },
  { key: "bus", label: "Bus", Icon: Bus },
  { key: "car", label: "Car", Icon: Car },
];

const ICON_COMPONENTS: Record<VehicleIconKey, typeof Truck> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.key, o.Icon]),
) as Record<VehicleIconKey, typeof Truck>;

const emptyForm = { name: "", description: "", managerName: "", icon: "truck" as VehicleIconKey };

export function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const showToast = useUiStore((s) => s.showToast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VehicleGroup | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(g: VehicleGroup) {
    setEditTarget(g);
    setForm({ name: g.name, description: g.description, managerName: g.managerName, icon: g.icon });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.managerName.trim()) return;
    const input = { name: form.name.trim(), description: form.description.trim(), managerName: form.managerName.trim(), icon: form.icon };
    if (editTarget) {
      updateGroup.mutate(
        { id: editTarget.id, input },
        {
          onSuccess: () => {
            showToast("Group updated");
            setModalOpen(false);
          },
        },
      );
    } else {
      createGroup.mutate(input, {
        onSuccess: () => {
          showToast("Group created");
          setModalOpen(false);
          setForm(emptyForm);
        },
      });
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="font-sans text-[14px] font-semibold text-ink">Vehicle Groups</span>
        <Button size="sm" leftIcon={<Plus size={13} weight="bold" />} className="ml-auto" onClick={openCreate}>
          New Group
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(groups ?? []).map((g) => {
            const GroupIcon = ICON_COMPONENTS[g.icon] ?? Stack;
            return (
              <Card key={g.id}>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-tint">
                    <GroupIcon size={17} weight="fill" className="text-brand" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-sans text-[13.5px] font-bold text-ink">{g.name}</div>
                    <div className="mt-0.5 font-sans text-[11.5px] font-medium text-ink-muted">{g.description}</div>
                  </div>
                  <IconButton icon={<PencilSimple size={13} />} label={`Edit ${g.name}`} size="sm" onClick={() => openEdit(g)} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-2.5">
                  <span className="font-mono text-[10.5px] text-ink-faint">Manager: {g.managerName}</span>
                  <span className="font-sans text-[12px] font-bold text-brand">{g.vehicleCount} vehicles</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Group" : "Create Group"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createGroup.isPending || updateGroup.isPending}>
              {editTarget ? "Save Changes" : "Create Group"}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <TextInput label="Group Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextInput label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextInput label="Manager" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} required />
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ink-faint">Map Icon</span>
            <div className="flex gap-2">
              {ICON_OPTIONS.map((o) => {
                const active = form.icon === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setForm({ ...form, icon: o.key })}
                    title={o.label}
                    aria-label={o.label}
                    aria-pressed={active}
                    className={`flex h-11 flex-1 items-center justify-center rounded-lg border transition-colors ${
                      active ? "border-brand bg-brand-subtle text-brand" : "border-line text-ink-faint hover:bg-surface-subtle"
                    }`}
                  >
                    <o.Icon size={18} weight="fill" />
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
