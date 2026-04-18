"use client";

import * as React from "react";

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
 * API mirror Dialog — cuma prefix `ResponsiveDialog*`. Semua slot
 * pakai Context untuk tau context mana yang aktif supaya header/
 * footer render pattern-aware (centre vs sticky bottom).
 */

type Mode = "dialog" | "drawer";

const ResponsiveDialogContext = React.createContext<Mode>("dialog");

function useResponsiveMode(): Mode {
  return React.useContext(ResponsiveDialogContext);
}

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
  /** class tambahan khusus mode mobile (drawer). */
  drawerClassName?: string;
}

export function ResponsiveDialogContent({
  className,
  drawerClassName,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  const mode = useResponsiveMode();
  if (mode === "dialog") {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }
  return (
    <DrawerContent
      className={cn("max-h-[92vh]", drawerClassName)}
      {...(props as React.ComponentProps<typeof DrawerContent>)}
    >
      <div className="overflow-y-auto px-4 pb-4">{children}</div>
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
