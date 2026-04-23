"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ExternalLink, Globe, ShieldCheck } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

const SLUG_HINT =
  "Huruf kecil, angka, tanda '-'. Diawali huruf, diakhiri huruf/angka. 3-30 karakter.";

export function PublicProfileSection() {
  const data = useQuery(api.publicProfile.getMyPublicProfile);
  const update = useMutation(api.publicProfile.updateMyPublicProfile);

  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bioShow, setBioShow] = useState(false);
  const [skillsShow, setSkillsShow] = useState(false);
  const [targetRoleShow, setTargetRoleShow] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [allowIndex, setAllowIndex] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setSlug(data.slug);
    setHeadline(data.headline);
    setBioShow(data.bioShow);
    setSkillsShow(data.skillsShow);
    setTargetRoleShow(data.targetRoleShow);
    setContactEmail(data.contactEmail);
    setLinkedinUrl(data.linkedinUrl);
    setPortfolioUrl(data.portfolioUrl);
    setAllowIndex(data.allowIndex);
  }, [data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await update({
        enabled,
        slug: slug.trim(),
        headline,
        bioShow,
        skillsShow,
        targetRoleShow,
        contactEmail,
        linkedinUrl,
        portfolioUrl,
        allowIndex,
      });
      toast.success("Profil publik tersimpan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const canEnable = slug.trim().length >= 3;
  const publicUrl = slug ? `/${slug}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand" />
          Profil Publik (Personal Brand)
        </CardTitle>
        <CardDescription>
          Halaman publik di <code className="font-mono text-[11px]">careerpack.org/slug</code>.
          Tiap kolom di-opt-in — hanya yang dicentang yang dibagikan. Default: tidak diindeks mesin pencari.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data === undefined && (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        )}
        {data !== undefined && (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Aktifkan halaman publik</p>
                <p className="text-xs text-muted-foreground">
                  Saat mati, URL Anda akan merespons 404 seolah tidak pernah ada.
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!canEnable && !enabled}
                aria-label="Aktifkan profil publik"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="public-slug">Slug URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">careerpack.org/</span>
                <Input
                  id="public-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="budi-santoso"
                  maxLength={30}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="url"
                />
              </div>
              <p className="text-xs text-muted-foreground">{SLUG_HINT}</p>
              {enabled && slug && (
                <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
                  <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Buka {publicUrl}
                  </Link>
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="public-headline">Headline</Label>
              <Textarea
                id="public-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Contoh: Frontend Engineer fokus di React + a11y"
                rows={2}
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                {headline.length}/120 karakter
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Kolom yang dibagikan</p>
              <OptField
                label="Target Role"
                description="Contoh: Frontend Engineer"
                checked={targetRoleShow}
                onChange={setTargetRoleShow}
              />
              <OptField
                label="Bio"
                description="Dari Profil Akun — pastikan bio siap dibaca publik"
                checked={bioShow}
                onChange={setBioShow}
              />
              <OptField
                label="Keterampilan"
                description="Chip skills dari Profil Akun"
                checked={skillsShow}
                onChange={setSkillsShow}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="public-contact-email">Email kontak publik (opsional)</Label>
              <Input
                id="public-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="kerjasama@email.com"
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                Sengaja terpisah dari email login — jangan pakai email auth Anda di sini.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="public-linkedin">LinkedIn URL</Label>
                <Input
                  id="public-linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/…"
                  inputMode="url"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="public-portfolio">Portfolio URL</Label>
                <Input
                  id="public-portfolio"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  Izinkan mesin pencari (Google, dll.)
                </p>
                <p className="text-xs text-muted-foreground">
                  Default mati → halaman publik pakai <code className="font-mono text-[10px]">noindex</code>. Nyalakan hanya
                  setelah Anda yakin tidak ada data sensitif yang bocor.
                </p>
              </div>
              <Switch
                checked={allowIndex}
                onCheckedChange={setAllowIndex}
                aria-label="Izinkan indexing mesin pencari"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="gap-1 bg-brand-muted text-brand-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Opt-in per kolom
              </Badge>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

interface OptFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function OptField({ label, description, checked, onChange }: OptFieldProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={`Bagikan ${label}`} />
    </div>
  );
}
