"use client";

import Link from "next/link";
import { Separator } from "@/shared/components/ui/separator";
import { Logo } from "../brand/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size={32} />
            <p className="text-sm text-muted-foreground mt-3 max-w-sm">
              Starter pack lengkap untuk kesuksesan karir Anda. Dari pembuatan CV hingga mendapatkan pekerjaan impian.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Fitur</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Pembuat CV</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Roadmap Karir</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Ceklis Dokumen</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Asisten AI</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Dukungan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Pusat Bantuan</Link></li>
              <li><a href="#" className="hover:text-foreground">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-foreground">Syarat Layanan</a></li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} CareerPack. Dibuat untuk pencari kerja Indonesia.
        </p>
      </div>
    </footer>
  );
}
