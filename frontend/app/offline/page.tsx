import Link from "next/link";
import type { Metadata } from "next";

/**
 * Offline fallback page. The service worker serves this static HTML
 * for navigation requests when the network is unreachable AND the
 * destination URL is not already in the cache. Plain Server Component
 * so it pre-renders to a single HTML file the SW can precache.
 */
export const metadata: Metadata = {
  title: "Offline · CareerPack",
  description: "Anda sedang offline.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 8.82a15 15 0 0 1 20 0" />
          <path d="M5 12.86a10 10 0 0 1 14 0" />
          <path d="M8.5 16.43a5 5 0 0 1 7 0" />
          <path d="M12 20h.01" />
          <path d="m2 2 20 20" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold">Tidak ada koneksi internet</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Halaman ini belum tersimpan offline. Saat sinyal kembali,
        sentuh tombol di bawah untuk melanjutkan.
      </p>
      <div className="flex gap-2">
        <Link
          href="/"
          prefetch={false}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Coba lagi
        </Link>
      </div>
    </main>
  );
}
