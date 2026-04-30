/**
 * Block-level sanitiser — used at write time in mutations.ts.
 * Returns the cleaned block, or null if the block is invalid (caller
 * drops it from the saved array).
 */

import {
  type Block, type BlockBgVariant, type BlockPadding, type BlockStyle,
  type BlockTextAlign, type BlockType, type ContainerAlign, type ContainerGap,
  type ContainerLayout, type ContainerMobileLayout, type DividerPayload,
  type EmbedProvider, type HeadingPayload, type LinkPayload, type SocialPayload,
  type SocialPlatform,
  ALLOWED_BLOCK_TYPES, ALLOWED_EMBED_PROVIDERS,
  BLOCK_BG_VARIANTS, BLOCK_PADDINGS, BLOCK_TEXT_ALIGNS,
  CONTAINER_ALIGNS, CONTAINER_GAPS, CONTAINER_LAYOUTS, CONTAINER_MOBILE_LAYOUTS,
  MAX_HEADING_LEN, MAX_LABEL_LEN, MAX_TEXT_LEN,
  SOCIAL_PLATFORMS,
} from "./types";
import { parseEmbedUrl, sanitizeHtml, sanitizeUrl, trimSafe } from "./helpers";

const SOCIAL_SET = new Set<SocialPlatform>(
  SOCIAL_PLATFORMS as ReadonlyArray<SocialPlatform>,
);

function sanitizeBlockStyle(raw: unknown): BlockStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const out: BlockStyle = {};
  const bg = trimSafe(r.bgVariant, 20) as BlockBgVariant;
  if (BLOCK_BG_VARIANTS.includes(bg) && bg !== "none") out.bgVariant = bg;
  const pad = trimSafe(r.padding, 10) as BlockPadding;
  if (BLOCK_PADDINGS.includes(pad) && pad !== "none") out.padding = pad;
  const ta = trimSafe(r.textAlign, 10) as BlockTextAlign;
  if (BLOCK_TEXT_ALIGNS.includes(ta)) out.textAlign = ta;
  return Object.keys(out).length > 0 ? out : undefined;
}

const CONTAINER_LAYOUT_SET = new Set<ContainerLayout>(
  CONTAINER_LAYOUTS as ReadonlyArray<ContainerLayout>,
);
const CONTAINER_MOBILE_SET = new Set<ContainerMobileLayout>(
  CONTAINER_MOBILE_LAYOUTS as ReadonlyArray<ContainerMobileLayout>,
);
const CONTAINER_GAP_SET = new Set<ContainerGap>(
  CONTAINER_GAPS as ReadonlyArray<ContainerGap>,
);
const CONTAINER_ALIGN_SET = new Set<ContainerAlign>(
  CONTAINER_ALIGNS as ReadonlyArray<ContainerAlign>,
);

export function sanitizeBlock(raw: unknown, depth: number = 0): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = trimSafe(r.id, 60);
  const typeStr = trimSafe(r.type, 30) as BlockType;
  if (!id || !ALLOWED_BLOCK_TYPES.includes(typeStr)) return null;
  // Containers can't nest. Keeps editor + DOM bounded.
  if (typeStr === "container" && depth > 0) return null;
  const hidden = r.hidden === true;
  const style = sanitizeBlockStyle(r.style);
  const payload = (r.payload && typeof r.payload === "object" ? r.payload : {}) as Record<string, unknown>;

  function attach<B extends Block>(block: B): B {
    return style ? ({ ...block, style } as B) : block;
  }

  switch (typeStr) {
    case "heading": {
      const text = trimSafe(payload.text, MAX_HEADING_LEN);
      if (!text) return null;
      const size: HeadingPayload["size"] =
        payload.size === "md" ? "md" : "lg";
      return attach({ id, type: "heading", hidden, payload: { text, size } });
    }
    case "paragraph": {
      const text = trimSafe(payload.text, MAX_TEXT_LEN);
      if (!text) return null;
      return attach({ id, type: "paragraph", hidden, payload: { text } });
    }
    case "link": {
      const label = trimSafe(payload.label, MAX_LABEL_LEN);
      const url = sanitizeUrl(payload.url);
      if (!label || !url) return null;
      const description = trimSafe(payload.description, 160) || undefined;
      const variant: LinkPayload["variant"] =
        payload.variant === "secondary" ? "secondary" :
        payload.variant === "ghost" ? "ghost" : "primary";
      const emoji = trimSafe(payload.emoji, 8) || undefined;
      return attach({
        id, type: "link", hidden,
        payload: { label, url, description, variant, emoji },
      });
    }
    case "social": {
      const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
      const items: SocialPayload["items"] = [];
      for (const it of itemsRaw) {
        if (!it || typeof it !== "object") continue;
        const platform = trimSafe(
          (it as Record<string, unknown>).platform, 20,
        ) as SocialPlatform;
        const url = sanitizeUrl((it as Record<string, unknown>).url);
        if (!SOCIAL_SET.has(platform) || !url) continue;
        items.push({ platform, url });
        if (items.length >= 12) break;
      }
      if (items.length === 0) return null;
      return attach({ id, type: "social", hidden, payload: { items } });
    }
    case "image": {
      const url = sanitizeUrl(payload.url);
      const alt = trimSafe(payload.alt, 200);
      if (!url) return null;
      const caption = trimSafe(payload.caption, 200) || undefined;
      const link = sanitizeUrl(payload.link) || undefined;
      return attach({
        id, type: "image", hidden,
        payload: { url, alt, caption, link },
      });
    }
    case "embed": {
      // Accept either a raw URL field for parsing, or an already-
      // normalised (provider, id) pair from a previous save.
      const rawUrl = typeof payload.url === "string" ? payload.url : null;
      const provider = trimSafe(payload.provider, 20) as EmbedProvider;
      const id_ = trimSafe(payload.id, 200);
      let provFinal: EmbedProvider | null = null;
      let idFinal = "";
      if (rawUrl) {
        const parsed = parseEmbedUrl(rawUrl);
        if (parsed) {
          provFinal = parsed.provider;
          idFinal = parsed.id;
        }
      }
      if (!provFinal && ALLOWED_EMBED_PROVIDERS.includes(provider) && id_) {
        provFinal = provider;
        idFinal = id_;
      }
      if (!provFinal || !idFinal) return null;
      const caption = trimSafe(payload.caption, 200) || undefined;
      return attach({
        id, type: "embed", hidden,
        payload: { provider: provFinal, id: idFinal, caption },
      });
    }
    case "divider": {
      const dStyle: DividerPayload["style"] =
        payload.style === "dot" ? "dot" : "line";
      return attach({
        id, type: "divider", hidden, payload: { style: dStyle },
      });
    }
    case "html": {
      const content = sanitizeHtml(payload.content);
      if (!content) return null;
      return attach({ id, type: "html", hidden, payload: { content } });
    }
    case "container": {
      const layoutRaw = trimSafe(payload.layout, 16) as ContainerLayout;
      const layout: ContainerLayout = CONTAINER_LAYOUT_SET.has(layoutRaw)
        ? layoutRaw : "row";
      const mobileRaw = trimSafe(payload.mobileLayout, 16) as ContainerMobileLayout;
      const mobileLayout: ContainerMobileLayout =
        CONTAINER_MOBILE_SET.has(mobileRaw) ? mobileRaw : "auto";
      const gapRaw = trimSafe(payload.gap, 10) as ContainerGap;
      const gap: ContainerGap = CONTAINER_GAP_SET.has(gapRaw) ? gapRaw : "normal";
      const alignRaw = trimSafe(payload.align, 10) as ContainerAlign;
      const align: ContainerAlign = CONTAINER_ALIGN_SET.has(alignRaw)
        ? alignRaw : "stretch";
      const childrenRaw = Array.isArray(payload.children) ? payload.children : [];
      const children: Block[] = [];
      const seen = new Set<string>();
      for (const c of childrenRaw.slice(0, 12)) {
        const sb = sanitizeBlock(c, depth + 1);
        if (!sb) continue;
        if (seen.has(sb.id)) continue;
        seen.add(sb.id);
        children.push(sb);
      }
      return attach({
        id, type: "container", hidden,
        payload: { layout, mobileLayout, gap, align, children },
      });
    }
  }
}

export function sanitizeBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  const seenIds = new Set<string>();
  for (const item of raw.slice(0, 60)) {
    const b = sanitizeBlock(item);
    if (!b) continue;
    if (seenIds.has(b.id)) continue;
    seenIds.add(b.id);
    out.push(b);
  }
  return out;
}
