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
  /**
   * A server-rendered, semantic version of the same profile, shown until the
   * template HTML arrives — and left in place permanently if it never does.
   *
   * This is what makes the public profile page indexable. The template renders
   * in a `srcDoc` iframe sandboxed WITHOUT `allow-same-origin` (see the message
   * handler above), which is a deliberate trust boundary and must stay one: the
   * template is 80 KB of third-party-shaped HTML+CSS+JS that has no business in
   * this origin. But an opaque-origin iframe is not indexable content, and it
   * is fetched client-side on top of that — so careerpack.org/<slug> was
   * shipping a document with zero `<h1>` and 64 characters of text, while
   * `sitemap.ts` listed it and `page.tsx` attached Person JSON-LD to it.
   *
   * Passing the real profile in here is not cloaking: it is the same
   * information the template shows, it is what a visitor actually sees until
   * the template loads, and it is what everyone sees if the fetch fails.
   */
  fallback?: React.ReactNode;
}

export function TemplateLayout({
  templateKey, templateUrl, displayName, branding,
  enableFloatingNav = false, fallback,
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

  // usePreviewBranding returns a NEW branding object on every keystroke.
  // Debounce it so the iframe srcDoc (below) only rebuilds when typing
  // pauses (~300ms) instead of blank-flashing a full reload per character.
  const [debouncedBranding, setDebouncedBranding] = useState(branding);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBranding(branding), 300);
    return () => clearTimeout(t);
  }, [branding]);

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
      // Pin to OUR iframe only. The template runs in a sandboxed
      // srcDoc without allow-same-origin, so its origin is the opaque
      // string "null" and the only trustworthy discriminator is the
      // source window handle. Reject anything we can't match to the
      // current iframe's contentWindow (covers the pre-mount window ===
      // null gap and any other frame on the page). Also require the
      // opaque "null" origin so a same-origin frame can't impersonate
      // it even with a stolen window reference.
      const iframeWin = iframeRef.current?.contentWindow ?? null;
      if (!iframeWin || event.source !== iframeWin) return;
      if (event.origin !== "null") return;
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

  // Reset height + floating-nav ONLY on an actual template swap — not on
  // every branding keystroke (that nulled the height and collapsed the
  // iframe to the fallback, causing the tall→short jump). Branding edits
  // keep the last height; the iframe re-posts cp-resize after it reloads.
  useEffect(() => {
    setIframeHeight(null);
    setFloatingNavItems([]);
  }, [templateKey]);

  function gotoSection(id: string) {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: "cp-goto", id }, "*");
  }

  // Inject branding payload + hydrator so the iframe can replace mock
  // copy with the user's real data and hide empty sections.
  const hydratedHtml = useMemo(() => {
    if (!html) return html;
    return injectBrandingIntoHtml(html, debouncedBranding);
  }, [html, debouncedBranding]);

  return (
    <div className="relative w-full" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* The skeleton is still right for editor previews, which pass no
          fallback. The public page passes one, so a visitor sees the actual
          profile immediately instead of a shimmer — and keeps seeing it if the
          template never loads, rather than an error card where their page
          should be. */}
      {!html && (fallback ?? (!error && <TemplateSkeleton />))}
      {error && !fallback && (
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
          // Key on templateKey only. Including identity.name here forced a
          // full iframe remount every time the user typed their name; srcDoc
          // updates already reload content when the debounced branding lands.
          key={templateKey}
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
