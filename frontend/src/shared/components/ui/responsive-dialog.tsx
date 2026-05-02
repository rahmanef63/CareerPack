"use client";

import * as React from "react";
import { X } from "lucide-react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";

/**
 * Responsive dialog primitive.
 *
 * Desktop (≥lg): Dialog modal klasik, centred, scrim gelap.
 * Mobile (<lg): Drawer bottom-sheet (vaul) — lebih PWA-friendly,
 * handle swipe-down-to-dismiss, respek safe-area inset.
 *
 * Width preset via `size` prop — kalau cuma pass `className` dengan
 * `max-w-...` tanpa `sm:` prefix, shadcn `sm:max-w-lg` default menang
 * di Tailwind responsive cascade dan dialog ke-stuck di 512 px walau
 * user maksudnya lebih lebar. Pakai `size="content"` untuk preview /
 * konten lebar, atau `size="3xl"` dst untuk form besar.
 */

type Mode = "dialog" | "drawer";

const ResponsiveDialogContext = React.createContext<Mode>("dialog");

function useResponsiveMode(): Mode {
  return React.useContext(ResponsiveDialogContext);
}

export type ResponsiveDialogSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "content"
  | "full";

/** Pre-set max-width yang ditranslate ke `sm:max-w-*` sehingga override
 *  shadcn default `sm:max-w-lg` dengan benar lewat twMerge dedup.
 *  Tanpa prefix `sm:`, twMerge menganggap base utility ≠ sm: variant
 *  dan dua-duanya bertahan; akibatnya yang sm: menang di cascade order
 *  meski user menulis-nya belakangan di className. */
const SIZE_CLASSES: Record<ResponsiveDialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  /** Konten lebar (CV preview, browser yang panel-nya luas). Cap ke
   *  98 vw supaya tidak menyentuh tepi layar di laptop kecil dan
   *  cap absolut 1240 px supaya tidak meledak di monitor ultrawide. */
  content: "sm:max-w-[min(98vw,1240px)]",
  /** Hampir full-bleed — untuk dialog yang butuh hampir seluruh viewport. */
  full: "sm:max-w-[98vw]",
};

export interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  /** Force a specific mode (ignore breakpoint). Default: auto. */
  forceMode?: Mode;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  forceMode,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const mode: Mode = forceMode ?? (isMobile ? "drawer" : "dialog");
  const Root = mode === "dialog" ? Dialog : Drawer;

  return (
    <ResponsiveDialogContext.Provider value={mode}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>,
) {
  const mode = useResponsiveMode();
  const Trigger = mode === "dialog" ? DialogTrigger : DrawerTrigger;
  return <Trigger {...props} />;
}

export function ResponsiveDialogClose(
  props: React.ComponentProps<typeof DialogClose>,
) {
  const mode = useResponsiveMode();
  const Close = mode === "dialog" ? DialogClose : DrawerClose;
  return <Close {...props} />;
}

export interface ResponsiveDialogContentProps
  extends React.ComponentProps<typeof DialogContent> {
  /** Desktop max-width preset. Default `lg` (matches shadcn default). */
  size?: ResponsiveDialogSize;
  /** class tambahan khusus mode mobile (drawer). */
  drawerClassName?: string;
}

export function ResponsiveDialogContent({
  size = "lg",
  className,
  drawerClassName,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  const mode = useResponsiveMode();
  if (mode === "dialog") {
    return (
      <DialogContent
        // `max-h-[90dvh] overflow-y-auto` makes the desktop dialog
        // behave like the mobile drawer (which already wraps children
        // in an overflow-y-auto div) — long forms inside ResponsiveDialog
        // never need their own inner ScrollArea anymore. Width forced
        // to `w-full` so child sections that want to fill it (form rows,
        // tab strips) actually get the full content area.
        className={cn(
          "flex max-h-[90dvh] w-full flex-col gap-4 overflow-y-auto",
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {children}
      </DialogContent>
    );
  }
  return (
    <DrawerContent
      className={cn("max-h-[92dvh]", drawerClassName)}
      {...(props as React.ComponentProps<typeof DrawerContent>)}
    >
      <DrawerClose
        aria-label="Tutup"
        className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
      </DrawerClose>
      <div className="flex w-full flex-col gap-4 overflow-y-auto px-4 pb-4">
        {children}
      </div>
    </DrawerContent>
  );
}

export function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const mode = useResponsiveMode();
  const Header = mode === "dialog" ? DialogHeader : DrawerHeader;
  return <Header className={cn(className)} {...props} />;
}

export function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const mode = useResponsiveMode();
  const Footer = mode === "dialog" ? DialogFooter : DrawerFooter;
  return <Footer className={cn(className)} {...props} />;
}

export function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle>,
) {
  const mode = useResponsiveMode();
  const Title = mode === "dialog" ? DialogTitle : DrawerTitle;
  return <Title {...props} />;
}

export function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  const mode = useResponsiveMode();
  const Description = mode === "dialog" ? DialogDescription : DrawerDescription;
  return <Description {...props} />;
}

export { useResponsiveMode };
