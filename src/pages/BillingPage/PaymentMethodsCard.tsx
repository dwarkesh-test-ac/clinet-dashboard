import { useState } from "react";
import { CreditCard, Plus, QrCode } from "@phosphor-icons/react";
import { Badge, Button, Card } from "@navyug/ui";
import { usePaymentMethods, useSetPrimaryPaymentMethod } from "../../hooks/useBilling";
import { useUiStore } from "../../stores/uiStore";
import { AddPaymentMethodModal } from "./AddPaymentMethodModal";

export function PaymentMethodsCard() {
  const { data: methods } = usePaymentMethods();
  const setPrimary = useSetPrimaryPaymentMethod();
  const showToast = useUiStore((s) => s.showToast);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Card title="Payment Methods">
      <div className="flex flex-col gap-2">
        {(methods ?? []).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (m.isPrimary) return;
              setPrimary.mutate(m.id, { onSuccess: () => showToast(`${m.label} set as primary`) });
            }}
            className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:bg-surface-subtle"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
              {m.type === "upi" ? <QrCode size={15} weight="fill" /> : <CreditCard size={15} weight="fill" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-[12.5px] font-semibold text-ink">{m.label}</div>
              <div className="truncate font-mono text-[11px] text-ink-faint">{m.detail}</div>
            </div>
            {m.isPrimary && <Badge tone="success">Primary</Badge>}
          </button>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Plus size={13} weight="bold" />}
        className="mt-3 w-full"
        onClick={() => setModalOpen(true)}
      >
        Add Payment Method
      </Button>

      <AddPaymentMethodModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Card>
  );
}
