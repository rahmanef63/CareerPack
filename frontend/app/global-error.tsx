"use client";

import { useEffect } from "react";

/**
 * Last-resort fallback for crashes inside the root `app/layout.tsx`
 * itself (theme provider, Convex provider boot, etc.). When this
 * fires, the root layout's <html>/<body> didn't render — so this
 * component MUST render its own. No design-system imports here for
 * the same reason: if Tailwind didn't load we still want a readable
 * page. Plain inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#0c4a6e",
          color: "#f8fafc",
        }}
      >
        <main
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#0f172a",
            border: "1px solid rgba(248, 250, 252, 0.12)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h1 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 600 }}>
            Aplikasi gagal dimuat
          </h1>
          <p style={{ margin: 0, marginBottom: 16, fontSize: 14, color: "#cbd5e1" }}>
            Terjadi kesalahan parah saat boot. Coba muat ulang halaman ini.
            Kalau tetap gagal, beri tahu kami.
          </p>
          {error.digest && (
            <p style={{ margin: 0, marginBottom: 16, fontSize: 12, color: "#94a3b8" }}>
              Kode kesalahan: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(248, 250, 252, 0.25)",
              background: "transparent",
              color: "#f8fafc",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
