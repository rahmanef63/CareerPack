import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/shared/components/brand/Logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Extra content rendered below the card (e.g., copyright). */
  footer?: ReactNode;
}

/**
 * Full-screen centered shell untuk halaman auth standalone (login,
 * forgot-password, reset-password). Branded gradient + logo header +
 * Card wrapper — satu-satunya pola DRY untuk layar auth.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-muted via-white to-brand-muted p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8"
          aria-label="Kembali ke beranda"
        >
          <span
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center text-brand-foreground"
            style={{ boxShadow: "0 10px 24px -8px oklch(var(--brand) / 0.4)" }}
          >
            <BrandMark
              size={24}
              stroke="oklch(var(--brand-foreground))"
              strokeWidth={2.4}
            />
          </span>
          <span className="text-2xl font-bold bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-transparent">
            CareerPack
          </span>
        </Link>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer}
      </div>
    </div>
  );
}
