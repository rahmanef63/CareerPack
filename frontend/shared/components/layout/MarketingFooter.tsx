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
            {/* "Who built this" and "how do I reach you" are the two most
                predictable questions from a visitor who has no account — and
                until now both answers lived inside the dashboard, behind the
                auth guard. The constants already existed; they were just
                unreachable from the public side. */}
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@careerpack.org" className="hover:text-foreground">
                  support@careerpack.org
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rahmanef63/CareerPack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li><Link href="/privacy" className="hover:text-foreground">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Syarat Layanan</Link></li>
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
