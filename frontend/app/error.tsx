"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-lg border border-destructive/40 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-semibold">Terjadi kesalahan</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Maaf, halaman ini gagal dimuat. Coba muat ulang.
        </p>
        <code className="block text-xs bg-muted px-2 py-1 rounded mb-4 font-mono line-clamp-2">
          {error.message}
        </code>
        <Button onClick={reset} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-1" /> Coba lagi
        </Button>
      </div>
    </div>
  );
}
