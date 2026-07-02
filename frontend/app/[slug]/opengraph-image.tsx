import { ImageResponse } from "next/og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

/**
 * Per-user OG image for careerpack.org/<slug>. Rendered server-side
 * via next/og (Satori) whenever the slug's link preview is requested
 * — WhatsApp, LinkedIn, X, Slack, etc. Every share becomes a
 * branded card instead of Next.js's default favicon crop.
 *
 * Satori does NOT support CSS custom properties, `oklch()`, Tailwind
 * classes, or `<Image>` — inline styles with hex values only. Keep
 * the palette hard-coded here; when the marketing brand shifts, edit
 * this one file.
 */

export const runtime = "edge";
export const alt = "Profil publik CareerPack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

// Hard-coded brand palette for OG (Satori can't read --brand).
// Keep in rough sync with tokens in shared/styles/index.css.
const PALETTE = {
  bg: "#fff8ec",        // cream
  bgAccent: "#fef2e0",
  ink: "#1c1917",       // near-black stone
  sub: "#78716c",       // stone-500
  brand: "#1d4ed8",     // sky-700-ish (matches --brand hue)
  brandTint: "#dbeafe",
} as const;

interface PublicProfile {
  slug: string;
  displayName: string;
  headline: string;
  targetRole: string;
  avatarUrl: string | null;
}

async function fetchProfile(slug: string): Promise<PublicProfile | null> {
  if (!CONVEX_URL) return null;
  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    // Same query the /[slug] page uses; returns null for non-existent
    // or disabled profiles so fallback card kicks in naturally.
    const result = await client.query(api.profile.queries.getBySlug, { slug });
    if (!result) return null;
    return {
      slug: result.slug,
      displayName: result.displayName,
      headline: result.headline,
      targetRole: result.targetRole,
      avatarUrl: result.avatarUrl,
    };
  } catch {
    return null;
  }
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await fetchProfile(slug);

  // Unresolved / disabled profile → generic branded fallback so the
  // link preview still looks intentional instead of broken.
  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${PALETTE.bgAccent} 0%, ${PALETTE.bg} 60%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: PALETTE.ink,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: "-0.02em" }}>
            CareerPack
          </div>
          <div style={{ fontSize: 28, color: PALETTE.sub, marginTop: 12 }}>
            Starter pack lengkap untuk kesuksesan karir Anda
          </div>
        </div>
      ),
      size,
    );
  }

  const initials = profile.displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${PALETTE.bgAccent} 0%, ${PALETTE.bg} 60%)`,
          display: "flex",
          flexDirection: "column",
          padding: 80,
          color: PALETTE.ink,
        }}
      >
        {/* Top row — slug URL, subtle brand chip on the right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: PALETTE.sub,
          }}
        >
          <span>careerpack.org/{profile.slug}</span>
          <span
            style={{
              background: PALETTE.brandTint,
              color: PALETTE.brand,
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            CareerPack
          </span>
        </div>

        {/* Middle — name + role pushed to bottom via flex-grow spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Avatar circle — either user's photo or initials fallback */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              width={140}
              height={140}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                border: `4px solid ${PALETTE.brandTint}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: PALETTE.brand,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                fontWeight: 700,
              }}
            >
              {initials || "?"}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {profile.displayName}
            </div>
            {(profile.targetRole || profile.headline) && (
              <div
                style={{
                  fontSize: 32,
                  color: PALETTE.sub,
                  marginTop: 18,
                  lineHeight: 1.3,
                }}
              >
                {profile.targetRole || profile.headline}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
