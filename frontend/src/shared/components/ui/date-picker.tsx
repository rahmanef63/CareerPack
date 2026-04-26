"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { id as localeID } from "react-day-picker/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverTrigger,
} from "@/shared/components/ui/responsive-popover";

export interface DatePickerProps {
  /** ISO date string YYYY-MM-DD */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Default bahasa Indonesia. */
  locale?: typeof localeID;
  /** Batas tanggal paling awal yang boleh dipilih. */
  fromDate?: Date;
  /** Batas tanggal paling akhir yang boleh dipilih. */
  toDate?: Date;
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
}

function parseISO(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

function formatISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Date picker konsisten untuk seluruh app. Input native `type="date"`
 * tak konsisten antar browser (Chrome beda dengan Safari), susah
 * di-a11y, dan ga pakai bahasa Indonesia. Popover + DayPicker sini
 * konsisten, keyboard-accessible, dan bisa di-extend dengan preset.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  id,
  className,
  locale = localeID,
  fromDate,
  toDate,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseISO(value);

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      drawerTitle={placeholder}
    >
      <ResponsivePopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
          aria-haspopup="dialog"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected
            ? format(selected, "dd MMM yyyy", { locale })
            : placeholder}
        </Button>
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) onChange?.(formatISO(d));
            setOpen(false);
          }}
          locale={locale}
          captionLayout={captionLayout}
          disabled={(date) => {
            if (fromDate && date < fromDate) return true;
            if (toDate && date > toDate) return true;
            return false;
          }}
          defaultMonth={selected}
        />
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
}
