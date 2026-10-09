"use client";

interface TranslatePickerProps { className?: string; label?: string }

/** Browser translation is an explicit visitor choice; no script reads private pages. */
export function TranslatePicker({ className }: TranslatePickerProps) {
  return <p className={className}>Gunakan fitur terjemahan browser jika diperlukan.</p>;
}
