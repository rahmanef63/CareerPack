import { cn } from "@/shared/lib/utils";

interface LoadingScreenProps {
  /** Full viewport height (auth/guard fallback). Default true. */
  fullScreen?: boolean;
  /** Screen-reader label. Default "Memuat". */
  label?: string;
  /** Optional extra classes on the outer container. */
  className?: string;
}

/**
 * Pusat spinner aplikasi. Dipakai oleh RouteGuard, Suspense fallback,
 * dan tiap tempat yang perlu "loading full-screen / inline".
 */
export function LoadingScreen({
  fullScreen = true,
  label = "Memuat",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen" : "min-h-[50vh]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
