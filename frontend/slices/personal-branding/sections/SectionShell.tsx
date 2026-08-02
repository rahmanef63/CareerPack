"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export interface SectionShellProps {
  title: ReactNode;
  /** Optional leading icon in the title row. When present the title
   *  gains the `flex items-center gap-2` layout; when absent it renders
   *  plain. Pass the fully-styled element (e.g. `<Mail className="h-4
   *  w-4 text-brand" />`). */
  icon?: ReactNode;
  description?: ReactNode;
  className?: string;
  /** Extra classes on the CardContent wrapper (e.g. `space-y-3`). */
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Shared Card shell for personal-branding section cards — collapses the
 * repeated `<Card><CardHeader><CardTitle>{icon}{title}</CardTitle>
 * <CardDescription>…</CardDescription></CardHeader><CardContent>…` markup.
 */
export function SectionShell({
  title,
  icon,
  description,
  className,
  contentClassName,
  children,
}: SectionShellProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle
          className={icon ? "flex items-center gap-2 text-base" : "text-base"}
        >
          {icon}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
