"use client";

import { RouteError } from "@/shared/components/errors/RouteError";

export default function MarketingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      segment="marketing"
      title="Halaman utama gagal dimuat"
      description="Coba muat ulang. Aplikasi inti tetap bisa diakses lewat tombol Masuk di pojok atas."
      hideHomeLink
    />
  );
}
