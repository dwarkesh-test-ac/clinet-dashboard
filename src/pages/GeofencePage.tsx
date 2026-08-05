import { useState } from "react";
import type { FormEvent } from "react";
import { Circle, Polygon } from "@phosphor-icons/react";
import { Badge, Button, Modal, Select, Skeleton, TextInput } from "@navyug/ui";
import { useCreateGeofence, useGeofences } from "../hooks/useGeofences";
import { useUiStore } from "../stores/uiStore";
import { formatDate } from "../lib/format";
import { GeofenceMap } from "../components/GeofenceMap";
import type { DrawnGeometry } from "../components/GeofenceMap";
import type { Geofence } from "../types";

const emptyDetails = { name: "", alertOn: "Entry & Exit" as Geofence["alertOn"] };

export function GeofencePage() {
  const { data: geofences, isLoading } = useGeofences();
  const createGeofence = useCreateGeofence();
  const showToast = useUiStore((s) => s.showToast);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingGeometry, setPendingGeometry] = useState<DrawnGeometry | null>(null);
  const [details, setDetails] = useState(emptyDetails);

  function handleDrawComplete(geometry: DrawnGeometry) {
    setPendingGeometry(geometry);
    setDetails(emptyDetails);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!details.name.trim() || !pendingGeometry) return;
    createGeofence.mutate(
      {
        name: details.name.trim(),
        alertOn: details.alertOn,
        shape: pendingGeometry.shape,
        center: pendingGeometry.shape === "Circle" ? pendingGeometry.center : null,
        radiusKm: pendingGeometry.shape === "Circle" ? pendingGeometry.radiusKm : null,
        points: pendingGeometry.shape === "Polygon" ? pendingGeometry.points : null,
      },
      {
        onSuccess: (created) => {
          showToast("Geofence created");
          setPendingGeometry(null);
          setSelectedId(created.id);
        },
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <GeofenceMap
        geofences={geofences ?? []}
        selectedId={selectedId}
        onSelectGeofence={setSelectedId}
        onDrawComplete={handleDrawComplete}
        className="flex-1"
      />

      <div className="flex w-[320px] flex-none flex-col border-l border-line bg-white">
        <div className="border-b border-line-soft p-3.5">
          <span className="font-sans text-[13px] font-semibold text-ink">Geofences ({geofences?.length ?? 0})</span>
          <p className="mt-1 font-sans text-[11px] font-medium text-ink-faint">
            Use Draw Circle or Draw Polygon on the map to add a new one.
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-3.5">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            (geofences ?? []).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedId(g.id)}
                className={`flex w-full items-start gap-2.5 border-b border-line-soft px-3.5 py-3 text-left outline-none hover:bg-surface-subtle ${
                  selectedId === g.id ? "bg-brand-subtle" : ""
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint">
                  {g.shape === "Circle" ? (
                    <Circle size={15} weight="fill" className="text-brand" />
                  ) : (
                    <Polygon size={15} weight="fill" className="text-brand" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-sans text-[12.5px] font-semibold text-ink">{g.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Badge tone="neutral">{g.shape}</Badge>
                    <span className="font-mono text-[10px] text-ink-faint">{g.vehicleCount} vehicles</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-ink-faint">Added {formatDate(g.createdAt)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <Modal
        open={!!pendingGeometry}
        onClose={() => setPendingGeometry(null)}
        title="Name This Geofence"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingGeometry(null)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createGeofence.isPending}>Create Geofence</Button>
          </>
        }
      >
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2 font-sans text-[12px] font-semibold text-ink-soft">
            {pendingGeometry?.shape === "Circle" ? <Circle size={14} weight="fill" /> : <Polygon size={14} weight="fill" />}
            {pendingGeometry?.shape} shape drawn on the map
            {pendingGeometry?.shape === "Circle" && ` · ${pendingGeometry.radiusKm} km radius`}
          </div>
          <TextInput label="Name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} required />
          <Select
            label="Alert On"
            value={details.alertOn}
            onChange={(e) => setDetails({ ...details, alertOn: e.target.value as Geofence["alertOn"] })}
          >
            <option value="Entry & Exit">Entry &amp; Exit</option>
            <option value="Entry Only">Entry Only</option>
            <option value="Exit Only">Exit Only</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
