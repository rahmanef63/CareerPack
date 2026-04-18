"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Komponen fallback. Default: <SectionErrorFallback />.
   * Terima `error` + `reset()` untuk retry.
   */
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
  /** Pesan judul untuk fallback default. */
  title?: string;
  /** Hook event ketika error tertangkap (mis. logging). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Class-component ErrorBoundary. Pakai untuk membungkus area yang
 * berisiko gagal (mis. query Convex ke fungsi yang belum di-deploy)
 * supaya satu kegagalan tidak meng-crash seluruh app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) this.props.onError(error, info);
    else console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return (
        <SectionErrorFallback
          title={this.props.title}
          error={this.state.error}
          reset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

interface SectionErrorFallbackProps {
  title?: string;
  error: Error;
  reset: () => void;
}

function SectionErrorFallback({
  title = "Bagian ini sedang bermasalah",
  error,
  reset,
}: SectionErrorFallbackProps) {
  const isConvexNotDeployed =
    error.message.includes("Could not find public function") ||
    error.message.includes("CONVEX");

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" /> {title}
        </CardTitle>
        <CardDescription>
          {isConvexNotDeployed
            ? "Backend Convex belum punya function ini. Jalankan `npx convex deploy` di folder convex/, lalu segarkan halaman."
            : "Terjadi kesalahan saat memuat bagian ini. Coba segarkan."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded line-clamp-1 flex-1 font-mono">
          {error.message}
        </code>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-1" /> Coba lagi
        </Button>
      </CardContent>
    </Card>
  );
}
