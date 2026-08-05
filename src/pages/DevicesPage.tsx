import { useState } from "react";
import { Broadcast } from "@phosphor-icons/react";
import { Badge, Button, Card, DataTable, Select, Skeleton } from "@navyug/ui";
import { useCommandLog, useSendCommand } from "../hooks/useCommands";
import { useVehicles } from "../hooks/useVehicles";
import { useUiStore } from "../stores/uiStore";
import { formatDateTime } from "../lib/format";

const COMMANDS = ["Request Location", "Immobilize Vehicle", "Restore Mobility", "Reboot Device", "Set Overspeed Limit (70 km/h)"];

const STATUS_TONE = { Success: "success", Pending: "warning", Failed: "danger" } as const;

export function DevicesPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: log, isLoading } = useCommandLog();
  const sendCommand = useSendCommand();
  const showToast = useUiStore((s) => s.showToast);
  const [vehicleId, setVehicleId] = useState("");
  const [command, setCommand] = useState(COMMANDS[0]!);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  function handleSend() {
    if (!vehicle) return;
    sendCommand.mutate(
      { vehicleReg: vehicle.reg, command },
      { onSuccess: () => showToast(`"${command}" sent to ${vehicle.reg}`) },
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <Card title="Send a Command" className="max-w-2xl">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-56">
            <option value="">Select vehicle</option>
            {vehicles.slice(0, 80).map((v) => (
              <option key={v.id} value={v.id}>{v.reg}</option>
            ))}
          </Select>
          <Select label="Command" value={command} onChange={(e) => setCommand(e.target.value)} className="w-64">
            {COMMANDS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Button leftIcon={<Broadcast size={14} />} disabled={!vehicle} loading={sendCommand.isPending} onClick={handleSend}>
            Send Command
          </Button>
        </div>
      </Card>

      <Card title="Command History" className="mt-3" padded={false} bodyClassName="px-4 py-2">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <DataTable
            caption="Device command history"
            rows={log ?? []}
            getRowId={(c) => c.id}
            emptyTitle="No commands sent yet"
            columns={[
              { key: "vehicle", header: "Vehicle", sortValue: (c) => c.vehicleReg, render: (c) => <span className="font-mono text-[12px] font-bold">{c.vehicleReg}</span> },
              { key: "command", header: "Command", sortValue: (c) => c.command, render: (c) => c.command },
              { key: "by", header: "Sent By", sortValue: (c) => c.by, render: (c) => c.by },
              {
                key: "status",
                header: "Status",
                sortValue: (c) => c.status,
                render: (c) => <Badge tone={STATUS_TONE[c.status]} withDot>{c.status}</Badge>,
              },
              { key: "time", header: "Time", sortValue: (c) => c.time, render: (c) => <span className="font-mono text-[11px] text-ink-faint">{formatDateTime(c.time)}</span>, align: "right" },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
