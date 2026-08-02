"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import type { ProviderOption } from "./providerAuth";

/**
 * The three inputs and the one destructive button that both AI surfaces
 * (Setelan → AI, Admin → AI) render identically. Grouped in one file rather
 * than four because none of them is big enough to look for on its own.
 */

export function ProviderSelect({
  id,
  providers,
  value,
  onChange,
  disabled,
}: {
  id: string;
  providers: ProviderOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Provider</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Pilih provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ApiKeyField({
  id,
  value,
  onChange,
  placeholder,
  docsUrl,
  helper,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  docsUrl?: string;
  /** Scope-specific caveat, shown under the field where it applies. */
  helper?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id}>API Key</Label>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand inline-flex items-center gap-1 hover:underline"
          >
            Buat API key <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan key" : "Tampilkan key"}
          className="absolute right-0 top-0 text-muted-foreground hover:bg-transparent"
        >
          {show ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {helper}
    </div>
  );
}

export function BaseUrlField({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Base URL{" "}
        {!required && <span className="text-muted-foreground">(opsional)</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

/**
 * Confirm-then-destroy button. Two callers — "Putuskan" next to a connected
 * account and "Hapus" at the bottom of the form — which is why the dialog
 * lives here instead of twice inline.
 */
export function ConfirmDestructiveButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  size,
  disabled,
  icon,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  size?: "sm" | "default";
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <ResponsiveAlertDialog>
      <ResponsiveAlertDialogTrigger asChild>
        <Button variant="outline" size={size} disabled={disabled}>
          {icon}
          {label}
        </Button>
      </ResponsiveAlertDialogTrigger>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>{title}</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>{description}</ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction variant="destructive" onClick={() => void onConfirm()}>
            {confirmLabel}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
