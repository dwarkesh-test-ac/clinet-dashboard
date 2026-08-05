import { Button } from "@navyug/ui";
import { TUT } from "./constants";
import type { FlowState } from "./types";

interface TutorialStepProps {
  state: FlowState;
  onNext: () => void;
  onSkip: () => void;
}

export function TutorialStep({ state, onNext, onSkip }: TutorialStepProps) {
  const slide = TUT[state.tutStep]!;
  const isLast = state.tutStep === TUT.length - 1;
  const Icon = slide.icon;

  return (
    <>
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
        Getting Started · {state.tutStep + 1} of {TUT.length}
      </div>
      <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint text-brand">
        <Icon size={30} weight="fill" />
      </div>
      <h1 className="mt-5 font-sans text-[22px] font-bold tracking-tight text-navy">{slide.title}</h1>
      <p className="mt-2 font-sans text-[13px] font-medium leading-relaxed text-ink-muted">{slide.desc}</p>

      <div className="mt-6 flex gap-1.5">
        {TUT.map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i === state.tutStep ? "#2563EB" : "#E5E7EB" }}
          />
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button type="button" onClick={onSkip} className="font-sans text-[12.5px] font-semibold text-ink-muted">
          Skip tour
        </button>
        <Button onClick={onNext}>{isLast ? "Get Started" : "Next"}</Button>
      </div>
    </>
  );
}
