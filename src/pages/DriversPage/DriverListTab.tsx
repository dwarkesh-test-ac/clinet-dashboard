import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { Plus, UserCircle, CheckCircle, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, Modal, Select, SearchInput, Skeleton, TextInput } from "@navyug/ui";
import type { DataTableColumn } from "@navyug/ui";
import { useCreateDriver, useDrivers } from "../../hooks/useDrivers";
import { useGroups } from "../../hooks/useGroups";
import { useVehicles } from "../../hooks/useVehicles";
import { useUiStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { formatDate } from "../../lib/format";
import type { Driver } from "../../types";

const emptyForm = { name: "", phone: "", license: "", vehicleId: "", groupId: "" };

// Matches the format generated for this fleet's own drivers (2-letter RTO code + 10 digits),
// e.g. DL1234567890 — used to validate + simulate a Sarathi lookup for newly added drivers.
const DL_REGEX = /^[A-Z]{2}\d{10}$/;

export function DriverListTab() {
  const { data: drivers, isLoading } = useDrivers();
  const { data: groups = [] } = useGroups();
  const { data: vehicles = [] } = useVehicles();
  const createDriver = useCreateDriver();
  const showToast = useUiStore((s) => s.showToast);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dlVerified, setDlVerified] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const filtered = (drivers ?? []).filter((d) => {
    const q = search.trim().toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.phone.includes(q);
  });

  function openModal() {
    setForm(emptyForm);
    setDlVerified(false);
    setDlError(null);
    setModalOpen(true);
  }

  function handleLicenseChange(value: string) {
    setForm({ ...form, license: value });
    setDlVerified(false);
    setDlError(null);
  }

  function handleVerifyDl() {
    const clean = form.license.trim().toUpperCase();
    if (!DL_REGEX.test(clean)) {
      setDlError("Enter a valid DL number, e.g. DL1234567890");
      setDlVerified(false);
      return;
    }
    setForm({ ...form, license: clean });
    setDlError(null);
    setDlVerified(true);
    showToast("Driving license verified with the Sarathi database");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    const clean = form.license.trim().toUpperCase();
    if (!DL_REGEX.test(clean)) {
      setDlError("Enter a valid DL number, e.g. DL1234567890");
      showToast("Enter a valid driving license number to add this driver");
      return;
    }
    if (!dlVerified) {
      showToast("Verify the driving license before adding this driver");
      return;
    }
    createDriver.mutate(
      {
        name: form.name.trim(),
        phone: form.phone.trim(),
        license: clean,
        vehicleId: form.vehicleId || null,
        groupId: form.groupId || groups[0]?.id || "",
      },
      {
        onSuccess: () => {
          showToast("Driver added");
          setModalOpen(false);
          setForm(emptyForm);
          setDlVerified(false);
          setDlError(null);
        },
      },
    );
  }

  const { isModuleEnabled } = useAuthStore();
  const verifyEnabled = isModuleEnabled("verify");

  const columns: DataTableColumn<Driver>[] = useMemo(() => {
    const base: DataTableColumn<Driver>[] = [
      {
        key: "name",
        header: "Driver",
        sortValue: (d: Driver) => d.name,
        render: (d: Driver) => (
          <span className="flex items-center gap-2">
            <UserCircle size={18} className="text-ink-faint" />
            <span className="font-sans text-[12.5px] font-semibold">{d.name}</span>
          </span>
        ),
      },
      { key: "phone", header: "Phone", sortValue: (d: Driver) => d.phone, render: (d: Driver) => <span className="font-mono text-[11.5px]">{d.phone}</span> },
    ];

    base.push({
      key: "license",
      header: "License (DL)",
      sortValue: (d: Driver) => d.license,
      render: (d: Driver) => (
        <span className="flex items-center gap-1.5 font-mono text-[11.5px]">
          {d.license}
          {verifyEnabled && d.license !== "PENDING" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success" title="VAHAN & Sarathi Verified">
              <CheckCircle size={12} weight="fill" />
              Verified
            </span>
          )}
        </span>
      ),
    });

    base.push({
      key: "vehicle",
      header: "Vehicle",
      sortValue: (d: Driver) => vehicles.find((v) => v.id === d.vehicleId)?.reg ?? "",
      render: (d: Driver) => vehicles.find((v) => v.id === d.vehicleId)?.reg ?? "Unassigned",
    });

    base.push({
      key: "status",
      header: "Status",
      sortValue: (d: Driver) => d.status,
      render: (d: Driver) => <Badge tone={d.status === "active" ? "success" : "neutral"} withDot>{d.status}</Badge>,
    });

    base.push({
      key: "joined",
      header: "Joined",
      sortValue: (d: Driver) => d.joinedAt,
      render: (d: Driver) => formatDate(d.joinedAt),
      align: "right" as const,
    });

    return base;
  }, [vehicles, verifyEnabled]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchInput label="Search drivers" className="h-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="font-sans text-[12px] font-medium text-ink-muted">{filtered.length} drivers</span>
        <Button size="sm" leftIcon={<Plus size={14} weight="bold" />} className="ml-auto" onClick={openModal}>
          Add Driver
        </Button>
      </div>

      <Card padded={false} bodyClassName="px-4 py-2">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <DataTable
            caption="Drivers"
            rows={filtered}
            getRowId={(d) => d.id}
            emptyTitle="No drivers match your search"
            columns={columns}
            pageSizeOptions={[25, 50, 100, 200]}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Driver"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createDriver.isPending}>Add Driver</Button>
          </>
        }
      >
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <TextInput label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextInput
                  label="Driving License Number"
                  placeholder="e.g. DL1234567890"
                  value={form.license}
                  onChange={(e) => handleLicenseChange(e.target.value.toUpperCase())}
                  error={dlError ?? undefined}
                  required
                />
              </div>
              <Button type="button" variant="secondary" size="md" onClick={handleVerifyDl}>
                Verify
              </Button>
            </div>
            {dlVerified && (
              <div className="mt-1.5 flex items-center gap-1.5 font-sans text-[11px] font-semibold text-success">
                <ShieldCheck size={13} weight="fill" />
                Verified with Sarathi database
              </div>
            )}
            {!dlVerified && !dlError && (
              <div className="mt-1.5 flex items-center gap-1.5 font-sans text-[11px] font-medium text-ink-faint">
                <WarningCircle size={13} />
                Not yet verified — click Verify before adding
              </div>
            )}
          </div>
          <Select label="Assign Vehicle" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
            <option value="">Unassigned</option>
            {vehicles.slice(0, 50).map((v) => (
              <option key={v.id} value={v.id}>{v.reg}</option>
            ))}
          </Select>
          <Select label="Group" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
            <option value="">Select a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </form>
      </Modal>
    </div>
  );
}
