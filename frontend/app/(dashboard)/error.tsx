"use client";

import { RouteError } from "@/shared/components/errors/RouteError";

export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      segment="dashboard"
      title="Dashboard ini sedang bermasalah"
      description="Coba muat ulang halaman ini. Data Anda tersimpan dengan aman di backend."
    />
  );
}
