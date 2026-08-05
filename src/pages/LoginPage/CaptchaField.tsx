import { ArrowsClockwise } from "@phosphor-icons/react";
import { IconButton } from "@navyug/ui";

interface CaptchaFieldProps {
  code: string;
  value: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
}

export function CaptchaField({ code, value, onChange, onRefresh }: CaptchaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-ink-faint">Captcha</span>
      <div className="flex items-center gap-2">
        <div
          className="flex h-11 shrink-0 select-none items-center justify-center rounded-lg px-4 font-mono text-[16px] font-bold tracking-[.2em] text-line-soft"
          style={{
            background: "repeating-linear-gradient(45deg, #111827, #111827 6px, #1F2937 6px, #1F2937 12px)",
            transform: "skewX(-8deg)",
          }}
        >
          <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>{code}</span>
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter code"
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface-subtle px-3.5 font-mono text-[13.5px] font-semibold uppercase text-ink outline-none placeholder:normal-case placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
        <IconButton icon={<ArrowsClockwise size={15} />} label="Refresh captcha" onClick={onRefresh} />
      </div>
    </div>
  );
}
