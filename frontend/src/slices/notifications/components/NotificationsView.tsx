"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  Calendar,
  CheckCheck,
  FileText,
  Lightbulb,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { notify } from "@/shared/lib/notify";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
  ResponsiveAlertDialogTrigger,
} from "@/shared/components/ui/responsive-alert-dialog";
import { cn } from "@/shared/lib/utils";
import { useNotifications } from "../hooks/useNotifications";
import type {
  NotificationDoc,
  NotificationFilter,
  NotificationGroup,
  NotificationType,
} from "../types";
import { IMPORTANT_TYPES } from "../types";

const TYPE_META: Record<
  NotificationType | "default",
  { icon: typeof Bell; tint: string }
> = {
  deadline: { icon: Calendar, tint: "bg-warning/20 text-warning" },
  interview: { icon: MessageSquare, tint: "bg-accent text-brand" },
  application: { icon: FileText, tint: "bg-info/20 text-info" },
  system: { icon: Bell, tint: "bg-muted text-muted-foreground" },
  tip: { icon: Lightbulb, tint: "bg-success/20 text-success" },
  default: { icon: Bell, tint: "bg-muted text-muted-foreground" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupByDate(items: NotificationDoc[]): NotificationGroup[] {
  const now = Date.now();
  const today = startOfDay(now);
  const yesterday = today - DAY_MS;
  const weekStart = today - 6 * DAY_MS;

  const groups: Record<string, NotificationDoc[]> = {
    "Hari ini": [],
    Kemarin: [],
    "Minggu ini": [],
    "Lebih lama": [],
  };

  for (const n of items) {
    if (n._creationTime >= today) groups["Hari ini"].push(n);
    else if (n._creationTime >= yesterday) groups["Kemarin"].push(n);
    else if (n._creationTime >= weekStart) groups["Minggu ini"].push(n);
    else groups["Lebih lama"].push(n);
  }

  return Object.entries(groups)
    .filter(([, v]) => v.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Baru saja";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}j`;
  if (diff < 7 * DAY_MS) return `${Math.floor(diff / DAY_MS)}h`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

interface NotificationRowProps {
  n: NotificationDoc;
  onRead: () => void;
  onDismiss: () => void;
}

function NotificationRow({ n, onRead, onDismiss }: NotificationRowProps) {
  const meta = TYPE_META[n.type as NotificationType] ?? TYPE_META.default;
  const Icon = meta.icon;

  const rowContent = (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          meta.tint,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "line-clamp-1 text-sm",
              n.read ? "text-foreground" : "font-semibold text-foreground",
            )}
          >
            {n.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelative(n._creationTime)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          {n.message}
        </p>
      </div>
      {!n.read && (
        <span
          aria-label="Belum dibaca"
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand"
        />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3 transition-colors",
        !n.read && "bg-brand-muted/30",
      )}
    >
      {n.actionUrl ? (
        <Link
          href={n.actionUrl}
          onClick={() => {
            if (!n.read) onRead();
          }}
          className="block"
        >
          {rowContent}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!n.read) onRead();
          }}
          className="block w-full text-left"
        >
          {rowContent}
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute right-1 top-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Hapus notifikasi"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function NotificationsView() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss, dismissAll } =
    useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "important")
      return notifications.filter((n) =>
        IMPORTANT_TYPES.includes(n.type as NotificationType),
      );
    return notifications;
  }, [notifications, filter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const importantCount = notifications.filter((n) =>
    IMPORTANT_TYPES.includes(n.type as NotificationType),
  ).length;

  const handleMarkAll = async () => {
    await markAllRead();
    notify.success("Semua notifikasi ditandai sudah dibaca");
  };

  return (
    <div className="space-y-4">
      <ResponsivePageHeader
        title="Notifikasi"
        description={
          unreadCount > 0
            ? `${unreadCount} belum dibaca`
            : "Semua sudah dibaca"
        }
        actions={
          <>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkAll}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Tandai semua dibaca</span>
                <span className="sm:hidden">Tandai</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <ResponsiveAlertDialog>
                <ResponsiveAlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Bersihkan</span>
                  </Button>
                </ResponsiveAlertDialogTrigger>
                <ResponsiveAlertDialogContent>
                  <ResponsiveAlertDialogHeader>
                    <ResponsiveAlertDialogTitle>
                      Hapus semua notifikasi?
                    </ResponsiveAlertDialogTitle>
                    <ResponsiveAlertDialogDescription>
                      {notifications.length} notifikasi akan dihapus permanen.
                    </ResponsiveAlertDialogDescription>
                  </ResponsiveAlertDialogHeader>
                  <ResponsiveAlertDialogFooter>
                    <ResponsiveAlertDialogCancel>
                      Batal
                    </ResponsiveAlertDialogCancel>
                    <ResponsiveAlertDialogAction
                      variant="destructive"
                      onClick={async () => {
                        await dismissAll();
                        notify.success("Semua notifikasi dibersihkan");
                      }}
                    >
                      Ya, hapus
                    </ResponsiveAlertDialogAction>
                  </ResponsiveAlertDialogFooter>
                </ResponsiveAlertDialogContent>
              </ResponsiveAlertDialog>
            )}
          </>
        }
      />

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as NotificationFilter)}
      >
        <TabsList variant="pills">
          <TabsTrigger value="all" className="gap-2">
            Semua
            <Badge variant="secondary" className="h-5 rounded-full px-1.5">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Belum dibaca
            {unreadCount > 0 && (
              <Badge className="h-5 rounded-full bg-brand px-1.5 text-brand-foreground">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="important" className="gap-2">
            Penting
            {importantCount > 0 && (
              <Badge variant="secondary" className="h-5 rounded-full px-1.5">
                {importantCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-5">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <BellOff className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {filter === "unread"
                  ? "Tidak ada notifikasi belum dibaca"
                  : filter === "important"
                    ? "Tidak ada notifikasi penting"
                    : "Belum ada notifikasi"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pemberitahuan terkait progres karir akan muncul di sini.
              </p>
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.label} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.label}
                </h3>
                <div className="space-y-2">
                  {g.items.map((n) => (
                    <NotificationRow
                      key={n._id}
                      n={n}
                      onRead={() => markRead(n._id)}
                      onDismiss={async () => {
                        await dismiss(n._id);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
