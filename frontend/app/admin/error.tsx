"use client";

import { RouteError } from "@/shared/components/errors/RouteError";

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      segment="admin"
      title="Panel admin bermasalah"
      description="Cek log internal. Akses pengguna lain tidak terdampak."
    />
  );
}
