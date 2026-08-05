import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, TextInput } from "@navyug/ui";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";

export function ProfilePage() {
  const { profile } = useAuthStore();
  const showToast = useUiStore((s) => s.showToast);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState("+91 98105 44321");
  const [company, setCompany] = useState(profile.companyName || "Shastri Logistics Pvt. Ltd.");
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Profile updated");
    }, 400);
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[300px_1fr]">
        <Card bodyClassName="flex flex-col items-center py-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-tint font-sans text-2xl font-bold text-brand">
            {profile.initials}
          </span>
          <div className="mt-3 font-sans text-[15px] font-bold text-ink">{profile.name}</div>
          <div className="mt-0.5 font-mono text-[10.5px] font-semibold text-ink-faint">{profile.role}</div>
          <div className="mt-3 font-sans text-[12px] font-medium text-ink-muted">{profile.email}</div>
        </Card>

        <Card title="Account Details">
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <TextInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <TextInput label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <TextInput label="Email" value={profile.email} disabled />
            <Button type="submit" loading={saving} className="w-fit">
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
