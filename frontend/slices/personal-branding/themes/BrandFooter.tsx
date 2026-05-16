import Link from "next/link";
import { BrandMark } from "@/shared/components/brand/Logo";

export function BrandFooter({
  slug, displayName,
}: {
  slug: string;
  displayName: string;
}) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} CareerPack ·{" "}
          <span className="font-medium text-foreground/80">{displayName}</span>
          {slug && <span className="opacity-60"> /{slug}</span>}
        </span>
        <Link
          href="/"
          className="flex items-center gap-1.5 font-medium text-brand underline-offset-4 hover:underline"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
            <BrandMark size={12} stroke="hsl(var(--brand-foreground))" strokeWidth={2.4} />
          </span>
          Buat halamanmu juga →
        </Link>
      </div>
    </footer>
  );
}
