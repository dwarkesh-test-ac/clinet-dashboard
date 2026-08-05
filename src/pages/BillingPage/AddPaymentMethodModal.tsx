import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Modal, Select, TextInput } from "@navyug/ui";
import { useAddPaymentMethod } from "../../hooks/useBilling";
import { useUiStore } from "../../stores/uiStore";

interface AddPaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm = { type: "card" as "card" | "upi", label: "", detail: "" };

export function AddPaymentMethodModal({ open, onClose }: AddPaymentMethodModalProps) {
  const addPaymentMethod = useAddPaymentMethod();
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState(emptyForm);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.label.trim() || !form.detail.trim()) return;
    addPaymentMethod.mutate(
      { type: form.type, label: form.label.trim(), detail: form.detail.trim() },
      {
        onSuccess: () => {
          showToast("Payment method added");
          setForm(emptyForm);
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Payment Method"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={addPaymentMethod.isPending}>Add Method</Button>
        </>
      }
    >
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "card" | "upi" })}>
          <option value="card">Card</option>
          <option value="upi">UPI Mandate</option>
        </Select>
        <TextInput label="Label" placeholder="e.g. HDFC Business Card" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
        <TextInput label="Detail" placeholder="e.g. •••• 1234 · Exp 04/29" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} required />
      </form>
    </Modal>
  );
}
