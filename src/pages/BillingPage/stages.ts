export interface PaymentStage {
  label: string;
  desc: string;
  tone: "success" | "warning" | "danger";
}

export const PAYMENT_STAGES: PaymentStage[] = [
  { label: "Active", desc: "On due date · auto-charge attempt runs against your primary payment method.", tone: "success" },
  { label: "Auto-retry", desc: "Day 0–3 past due · 2–3 automatic retries against your payment methods.", tone: "warning" },
  { label: "Grace period", desc: "Day 3–7 past due · full access continues while payment is resolved.", tone: "warning" },
  { label: "Restricted", desc: "Day 7–15 past due · access limited to live map only.", tone: "danger" },
  { label: "Suspended", desc: "Day 15+ past due · full account lock until payment clears.", tone: "danger" },
  { label: "Flagged device", desc: "Last resort · device serial numbers added to the network blocklist.", tone: "danger" },
];
