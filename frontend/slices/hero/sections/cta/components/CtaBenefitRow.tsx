import type { CtaBenefitWithIcon } from "../types/cta.types";

interface CtaBenefitRowProps {
  benefit: CtaBenefitWithIcon;
}

/** One row inside the right-column benefits card — icon chip + bold
 * title + a single honest, factual description line. */
export function CtaBenefitRow({ benefit }: CtaBenefitRowProps) {
  const Icon = benefit.icon;

  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-landing-blue/10 text-landing-blue">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="font-medium text-landing-ink">{benefit.title}</p>
        <p className="mt-0.5 text-sm text-landing-muted">{benefit.description}</p>
      </div>
    </div>
  );
}
