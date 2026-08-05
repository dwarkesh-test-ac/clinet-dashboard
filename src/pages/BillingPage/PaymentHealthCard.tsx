import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Badge, Card, IconButton } from "@navyug/ui";
import { PAYMENT_STAGES } from "./stages";

interface PaymentHealthCardProps {
  stageIndex: number;
  onStageChange: (index: number) => void;
}

export function PaymentHealthCard({ stageIndex, onStageChange }: PaymentHealthCardProps) {
  const stage = PAYMENT_STAGES[stageIndex]!;

  return (
    <Card title="Payment Health">
      <div className="flex items-center justify-between">
        <Badge tone={stage.tone} withDot>{stage.label}</Badge>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<CaretLeft size={13} />}
            label="Simulate previous stage"
            size="sm"
            disabled={stageIndex === 0}
            onClick={() => onStageChange(Math.max(0, stageIndex - 1))}
          />
          <IconButton
            icon={<CaretRight size={13} />}
            label="Simulate next stage"
            size="sm"
            disabled={stageIndex === PAYMENT_STAGES.length - 1}
            onClick={() => onStageChange(Math.min(PAYMENT_STAGES.length - 1, stageIndex + 1))}
          />
        </div>
      </div>
      <p className="mt-2.5 font-sans text-[12px] font-medium text-ink-muted">{stage.desc}</p>
      <p className="mt-3 rounded-lg bg-surface-subtle p-2.5 font-sans text-[11px] font-medium leading-relaxed text-ink-faint">
        Dev note — this is an escalating, reversible dunning ladder, not a hard cutoff. Any payment at any stage
        restores full access immediately. Use the arrows above to preview each stage (demo only).
      </p>
    </Card>
  );
}
