import type { CtaBenefitWithIcon } from "../types/cta.types";

interface CtaBenefitRowProps {
  benefit: CtaBenefitWithIcon;
}

/** One row inside the right-column benefits card — icon chip + bold
 * title + a single honest, factual description line. */
export function CtaBenefitRow({ benefit }: CtaBenefitRowProps) {
  const Icon = benefit.icon;

  return (
    <div className="group flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="font-medium text-foreground">{benefit.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{benefit.description}</p>
      </div>
    </div>
  );
}
