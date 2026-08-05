import { useEffect, useState } from "react";
import { Modal, Switch, Button } from "@navyug/ui";
import { ADDONS } from "../lib/addons";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";

interface ManageAddonsModalProps {
  open: boolean;
  onClose: () => void;
  highlightAddonId?: string | null;
}

export function ManageAddonsModal({ open, onClose, highlightAddonId }: ManageAddonsModalProps) {
  const addons = useAuthStore((s) => s.addons);
  const toggleAddon = useAuthStore((s) => s.toggleAddon);
  const showToast = useUiStore((s) => s.showToast);
  const [pending, setPending] = useState<Record<string, boolean>>(addons);

  // Re-sync the staged selection to the real, applied state every time the modal opens (and
  // pre-stage the add-on that sent the user here, if any) — nothing here takes effect until Save.
  useEffect(() => {
    if (!open) return;
    const next = { ...addons };
    if (highlightAddonId) next[highlightAddonId] = true;
    setPending(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highlightAddonId]);

  const dirty = ADDONS.some((a) => !!pending[a.id] !== !!addons[a.id]);

  function handleCancel() {
    setPending({ ...addons });
    onClose();
  }

  function handleSave() {
    const changedLabels: string[] = [];
    ADDONS.forEach((a) => {
      if (!!pending[a.id] !== !!addons[a.id]) {
        toggleAddon(a.id);
        changedLabels.push(a.label);
      }
    });
    if (changedLabels.length === 1) {
      showToast(`${changedLabels[0]} updated`);
    } else if (changedLabels.length > 1) {
      showToast(`${changedLabels.length} add-ons updated`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Manage Add-ons"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!dirty}>Save Changes</Button>
        </>
      }
    >
      <p className="mb-4 font-sans text-[12px] font-medium leading-relaxed text-ink-muted">
        Turn features on or off any time — nothing changes until you save, and changes prorate on
        your next invoice.
      </p>
      <div className="flex flex-col gap-2">
        {ADDONS.map((a) => {
          const on = !!pending[a.id];
          const isHighlighted = highlightAddonId === a.id;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                isHighlighted ? "border-brand bg-brand-subtle" : "border-line-soft"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-ink-muted">
                <a.icon size={15} weight="fill" className={on ? "text-brand" : "text-ink-faint"} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-sans text-[12.5px] font-semibold text-ink">{a.label}</div>
                <div className="font-mono text-[10.5px] font-medium text-ink-faint">
                  {a.per === "flat" ? `₹${a.price}/mo flat` : `+₹${a.price}/device/mo`}
                </div>
              </div>
              <Switch
                checked={on}
                onChange={() => setPending((p) => ({ ...p, [a.id]: !p[a.id] }))}
                label={`Toggle ${a.label}`}
              />
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
