"use client";

import { RouteError } from "@/shared/components/errors/RouteError";

export default function PublicProfileError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      segment="public-profile"
      title="Profil publik tidak bisa dimuat"
      description="Halaman ini mungkin sudah tidak aktif atau slug-nya salah."
    />
  );
}
