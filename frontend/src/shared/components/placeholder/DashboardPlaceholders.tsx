"use client";

import { Bell, Compass, Folder, HelpCircle, Users } from "lucide-react";
import { PlaceholderView } from "@/shared/components/placeholder/PlaceholderView";

export function MatcherView() {
  return (
    <PlaceholderView
      icon={Compass}
      title="Pencocok Lowongan"
      description="AI akan mencocokkan profil Anda dengan lowongan terbaru. Buka Asisten AI lalu ketik /match untuk demo."
    />
  );
}

export function NetworkingView() {
  return (
    <PlaceholderView
      icon={Users}
      title="Jaringan"
      description="Kelola kontak profesional, mentor, dan rekruter yang Anda kenal."
    />
  );
}

export function PortfolioView() {
  return (
    <PlaceholderView
      icon={Folder}
      title="Portofolio"
      description="Tampilkan proyek terbaik Anda. Akan ditarik otomatis dari bagian Proyek di CV."
    />
  );
}

export function NotificationsView() {
  return (
    <PlaceholderView
      icon={Bell}
      title="Notifikasi"
      description="Pemberitahuan terkait progres karir, tenggat dokumen, dan update lowongan akan muncul di sini."
    />
  );
}

export function HelpView() {
  return (
    <PlaceholderView
      icon={HelpCircle}
      title="Pusat Bantuan"
      description="Tanya jawab, panduan penggunaan, dan kontak dukungan."
    />
  );
}
