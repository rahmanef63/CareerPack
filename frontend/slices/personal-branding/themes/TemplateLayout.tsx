"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BrandingShowMoreDialog,
  type ShowMoreList,
} from "../components/BrandingShowMoreDialog";
import { injectBrandingIntoHtml } from "./inject";
import {
  type BrandingPayload, type FloatingNavItem,
  VALID_SHOW_MORE_LISTS,
} from "./types";
import { TemplateSkeleton } from "./TemplateSkeleton";
import { FloatingMobileNav } from "./FloatingMobileNav";

/** In-memory cache shared across re-mounts so switching templates
 *  doesn't re-fetch ones already seen this session. Keyed by stable
 *  template id (v1/v2/v3/manual). */
const TEMPLATE_HTML_CACHE = new Map<string, string>();

interface Props {
  templateKey: string;
  templateUrl: string;
  displayName: string;
  branding?: BrandingPayload;
  enableFloatingNav?: boolean;
}

export function TemplateLayout({
  templateKey, templateUrl, displayName, branding,
  enableFloatingNav = false,
}: Props) {
  const url = templateUrl;
  const [html, setHtml] = useState<string | null>(
    () => TEMPLATE_HTML_CACHE.get(templateKey) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  // Iframe content height reported by the inner postMessage. Falls
  // back to a viewport-clamp until the first message arrives.
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);
  const [showMoreList, setShowMoreList] = useState<ShowMoreList | null>(null);
  const [floatingNavItems, setFloatingNavItems] = useState<FloatingNavItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const cached = TEMPLATE_HTML_CACHE.get(templateKey);
    if (cached) {
      setHtml(cached);
      setError(null);
      return;
    }
    setHtml(null);
    setError(null);
    fetch(url, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        TEMPLATE_HTML_CACHE.set(templateKey, text);
        setHtml(text);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Gagal memuat template");
      });
    return () => {
      cancelled = true;
    };
  }, [templateKey, url]);

  // Listen for postMessages from the iframe.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as
        | {
            type?: string;
            h?: number;
            list?: string;
            items?: FloatingNavItem[];
            id?: string;
            y?: number;
          }
        | null;
      if (!data || typeof data.type !== "string") return;
      if (
        iframeRef.current &&
        event.source !== iframeRef.current.contentWindow
      ) {
        return;
      }
      if (data.type === "cp-resize" && typeof data.h === "number") {
        const clamped = Math.max(400, Math.min(20000, Math.round(data.h)));
        setIframeHeight((prev) => (prev === clamped ? prev : clamped));
        return;
      }
      if (data.type === "cp-show-more" && typeof data.list === "string") {
        const listName = data.list as ShowMoreList;
        if (VALID_SHOW_MORE_LISTS.has(listName)) {
          setShowMoreList(listName);
        }
        return;
      }
      if (data.type === "cp-floating-nav" && Array.isArray(data.items)) {
        setFloatingNavItems(data.items.slice(0, 6));
        return;
      }
      if (data.type === "cp-anchor-y" && typeof data.y === "number") {
        const iframeEl = iframeRef.current;
        if (iframeEl) {
          const rect = iframeEl.getBoundingClientRect();
          const parentY = rect.top + window.scrollY + data.y - 16;
          window.scrollTo({ top: parentY, behavior: "smooth" });
        }
        return;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Reset height + floating-nav when template/branding key changes.
  useEffect(() => {
    setIframeHeight(null);
    setFloatingNavItems([]);
  }, [templateKey, branding]);

  function gotoSection(id: string) {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: "cp-goto", id }, "*");
  }

  // Inject branding payload + hydrator so the iframe can replace mock
  // copy with the user's real data and hide empty sections.
  const hydratedHtml = useMemo(() => {
    if (!html) return html;
    return injectBrandingIntoHtml(html, branding);
  }, [html, branding]);

  return (
    <div className="relative w-full" style={{ minHeight: "calc(100vh - 64px)" }}>
      {!html && !error && <TemplateSkeleton />}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
            <p className="font-semibold text-destructive">Template gagal dimuat</p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">URL: {url}</p>
          </div>
        </div>
      )}
      {hydratedHtml && (
        <iframe
          ref={iframeRef}
          key={`${templateKey}:${branding?.identity.name ?? ""}`}
          srcDoc={hydratedHtml}
          title={`Template ${templateKey} untuk ${displayName}`}
          loading="eager"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          className="block w-full border-0 bg-background"
          style={{
            height: iframeHeight ? `${iframeHeight}px` : "calc(100vh - 64px)",
          }}
        />
      )}
      <BrandingShowMoreDialog
        branding={branding}
        listName={showMoreList}
        onClose={() => setShowMoreList(null)}
      />
      {enableFloatingNav && floatingNavItems.length > 0 && (
        <FloatingMobileNav items={floatingNavItems} onSelect={gotoSection} />
      )}
    </div>
  );
}
