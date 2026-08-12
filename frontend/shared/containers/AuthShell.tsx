import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/shared/components/brand/Logo";
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
  // ponytail: `via-background` not `via-white` — the hard white middle stop
  // made the dark-theme shell flash white and hid the white Logo twin.
  // min-h-svh not min-h-screen: 100vh on iOS Safari is the URL-bar-COLLAPSED
  // height, so with the bar showing /login scrolled even though the card fits,
  // and items-center centred it against the taller box.
  return (
    <div className="min-h-svh flex items-center justify-center bg-gradient-to-br from-brand-muted via-background to-brand-muted p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center mb-8"
          aria-label="Kembali ke beranda"
        >
          <Logo size={40} />
        </Link>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center">
            {/* h1, not the CardTitle default h3: on /login, /forgot-password and
                /reset-password this string IS the page heading, and those pages
                shipped with no h1 at all. */}
            <CardTitle as="h1" className="text-2xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer}
      </div>
    </div>
  );
}
