"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell, Loader2, Mail } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { notify } from "@/shared/lib/notify";

/**
 * Notification preferences card — opt-in toggles for the weekly digest
 * and any future channels (push, WhatsApp). Store on userProfiles so a
 * single read covers all channels (no separate notificationSettings table).
 */
export function NotificationsCard() {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const setDigest = useMutation(api.profile.mutations.setDigestEnabled);
  const [saving, setSaving] = useState(false);

  const enabled = me?.profile?.digestEnabled === true;

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    try {
      await setDigest({ enabled: next });
      notify.success(
        next
          ? "Digest mingguan aktif — kamu akan dapat email Senin pagi"
          : "Digest mingguan dimatikan",
      );
    } catch (err) {
      notify.fromError(err, "Gagal update preferensi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand" />
          Notifikasi
        </CardTitle>
        <CardDescription>
          Atur email yang kamu terima dari CareerPack.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="digest-toggle" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Digest mingguan lowongan
            </Label>
            <p className="text-xs text-muted-foreground">
              Email Senin pagi 09:00 WIB berisi 5 lowongan paling cocok dengan
              target role + skills kamu. Kamu bisa unsubscribe lewat link di
              email atau matikan di sini.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="digest-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={saving || me === undefined}
              aria-label="Toggle digest mingguan"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
