import { internal } from "../../_generated/api";
import { fetchWithTimeout } from "../../_shared/fetchWithTimeout";
import type { ToolDef } from "../types";

/**
 * MCP tools for the public personal-brand page at careerpack.org/<slug>.
 *
 * The page is one HTML document rendered in a sandboxed iframe. Either it is
 * a built-in template file, or it is the user's own `publicHtml` — this is
 * the CRUD for the latter, so an AI host can author the page directly.
 *
 * The one idea worth understanding before touching this file: AI-authored
 * HTML here is NOT a snapshot. Whatever markup lands in `publicHtml` gets the
 * same `__cp_data` payload and hydrator script spliced into it as a built-in
 * template does, so `data-cp="name"` / `data-cp-list="projects"` markers keep
 * filling from the live CV, portfolio and profile on every visit. A model
 * that inlines the user's project titles as literal text produces a page that
 * silently rots; a model that writes markers produces one that never does.
 * That is the entire reason `branding_data` returns the marker contract next
 * to the data instead of just the data.
 *
 * No publish tool, deliberately — see convex/mcp/data/branding.ts.
 */

/** Ids the theme picker offers, plus the skeleton meant for copying. */
const TEMPLATES = [
  {
    id: "starter",
    label: "Starter",
    style: "Neutral, single-column, light + dark aware. ~19 KB.",
    note: "The one to copy. Small, and it uses every marker the hydrator supports, so nothing in the data goes unrendered.",
  },
  {
    id: "template-v1",
    label: "Purple Glass",
    style: "Glassmorphism, purple gradients, animated hero. ~81 KB.",
    note: "Built-in. Implements about, skills, experience, projects, contact — no education, certifications or languages section, so that data is not shown.",
  },
  {
    id: "template-v2",
    label: "Editorial Cream",
    style: "Warm editorial serif, magazine layout. ~81 KB.",
    note: "Built-in, and the default. Same five sections as template-v1 (no education, certifications, languages) and it fills them from __cp_data with its own inline script instead of markers, so it is the worst one to copy.",
  },
  {
    id: "template-v3",
    label: "Premium Dark",
    style: "Dark, high contrast, sharp type. ~67 KB.",
    note: "Built-in. Implements skills, experience, education, projects, contact — no about, certifications or languages section.",
  },
] as const;

const TEMPLATE_PATH: Record<string, string> = {
  starter: "/personal-branding/templates/starter.html",
  "template-v1": "/personal-branding/templates/v1.html",
  "template-v2": "/personal-branding/templates/v2.html",
  "template-v3": "/personal-branding/templates/v3.html",
};

/**
 * How the hydrator binds data to markup. Returned as data (not baked into a
 * tool description) because a ToolDef description is capped at 1024 chars and
 * the model only needs this at the moment it is actually writing HTML.
 *
 * Mirrors frontend/slices/personal-branding/themes/templateHydrator.ts. If a
 * marker is added there, add it here.
 */
const MARKER_CONTRACT = {
  how_it_works:
    "Your HTML is stored as-is and rendered in a sandboxed iframe. Before render, the page injects <script id=\"__cp_data\" type=\"application/json\"> holding the object under `data` below, then runs a hydrator that fills your markers from it. Write markers, not literal values — the page then follows the user's CV/portfolio as those change.",
  fill: 'data-cp="KEY" — replaces the element\'s text with data for KEY. Add data-cp-mode="src" | "href" | "html" to fill that attribute instead of the text. In src/href mode an empty value HIDES the element, so a missing LinkedIn leaves no dead button; in text mode it just empties it, so put a label and its marker inside the same data-cp-section if the label would read wrong on its own.',
  list: 'data-cp-list="NAME" on a container that holds exactly ONE child marked data-cp-template. The child is cloned per item and filled with the item keys; the original is removed. Long lists are truncated (projects 3, skills 6, experience 2, education 4, certifications 3, languages 6) behind a "see all" the app renders — override with data-cp-list-max="N".',
  section:
    'data-cp-section="NAME" on a wrapper — hidden entirely when has.NAME is false (the user turned that section off, or has no data for it). Use it on every section so an empty page never shows empty headings.',
  empty: 'data-cp-empty="NAME" — shown ONLY when that list is empty.',
  fluff:
    "data-cp-fluff — removed whenever real data is present. For placeholder/demo blocks you want visible only in a template preview.",
  keys: {
    text: [
      "name",
      "headline",
      "target-role",
      "location",
      "bio",
      "summary",
      "contact-email",
    ],
    attribute: [
      "avatar (mode=src)",
      "contact-email-href (mode=href, mailto: added for you)",
      "contact-linkedin (mode=href, and text)",
      "contact-portfolio (mode=href, and text)",
    ],
    lists: {
      skills: ["skill-name"],
      experience: [
        "exp-company",
        "exp-position",
        "exp-period",
        "exp-description",
        'nested data-cp-list="exp-achievements", item key "achievement"',
      ],
      education: [
        "edu-institution",
        "edu-degree",
        "edu-field",
        "edu-period",
        "edu-gpa",
      ],
      projects: [
        "proj-title",
        "proj-description",
        "proj-category",
        "proj-link (mode=href)",
        "proj-cover (emoji)",
        'nested data-cp-list="proj-tech", item key "tech-name"',
      ],
      certifications: ["cert-name", "cert-issuer", "cert-date"],
      languages: ["lang-name", "lang-proficiency"],
    },
    sections: [
      "about",
      "skills",
      "experience",
      "education",
      "certifications",
      "languages",
      "projects",
      "contact",
    ],
  },
  also_injected:
    "Your document MUST contain an <h1> (or an element with data-cp-hero). The availability badge is inserted immediately before it, and the CTA button is SKIPPED ENTIRELY without it. The CTA is appended into .hero-cta or .hero-actions when one exists, otherwise placed right after that heading; give some element class .btn-primary and the CTA copies that class, so it matches your palette instead of a generic fallback. Add data-cp-skip-cta to opt out. If the user set style overrides they arrive as --cp-primary / --cp-font / --cp-radius / --cp-density on :root.",
  constraints:
    "Return ONE complete document (<!doctype html> … </html>). No external requests are guaranteed to work — the page inherits the app's CSP, so inline your CSS and avoid third-party scripts, fonts and images (Unsplash and the app's own origin are allowed). The iframe reports its height automatically.",
} as const;

function appOrigin(): string {
  return (process.env.APP_URL ?? "https://careerpack.org").replace(/\/$/, "");
}

export const brandingTools: ToolDef[] = [
  {
    name: "branding_get",
    description:
      "Read the state of the user's public personal-brand page (careerpack.org/<slug>): whether it is published, its URL, headline, whether search engines may index it, which built-in template it falls back to, and whether the user has custom HTML (with its size). Call this FIRST before writing or replacing page HTML — it tells you whether you would be overwriting work. Set include_html: true to also get the current HTML back, which can be a few hundred KB, so only do that when you intend to edit it rather than rewrite it. Returns null if the user has not completed onboarding. Publishing is not possible from here: if the page is unpublished, tell the user to flip the switch on the Personal Branding page in the app.",
    inputSchema: {
      type: "object",
      properties: {
        include_html: {
          type: "boolean",
          description: "Include the full current HTML. Default false.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "Get branding page",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.branding.getBranding, {
        userId,
        includeHtml: args.include_html === true,
      }),
  },

  {
    name: "branding_data",
    description:
      "Get the live data the public page renders from — identity, bio, skills, experience, education, certifications, languages, projects — TOGETHER with the marker contract that binds it to HTML. Call this before writing any page HTML with branding_set_html. The page is not a snapshot: markup written with data-cp markers keeps filling from the user's CV and portfolio as those change, so read the returned `contract` and use markers instead of pasting the values in as text. It also shows which sections are empty or switched off, so you do not design around data that will never appear.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Get branding data",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) => {
      const data = await ctx.runQuery(
        internal.mcp.data.branding.getBrandingData,
        { userId },
      );
      if (!data) return null;
      return { contract: MARKER_CONTRACT, data };
    },
  },

  {
    name: "branding_templates",
    description:
      "List the built-in page templates, or fetch one's full HTML to use as a starting point. Call with no argument to see what exists; call with template_id to get the markup. Use 'starter' unless the user asks for one of the others by name — it is ~19 KB and demonstrates every marker, while template-v1/v2/v3 are 67-81 KB design-heavy pages that will fill a large part of your context. This is also the fastest way to see a working example of the marker contract before calling branding_set_html.",
    inputSchema: {
      type: "object",
      properties: {
        template_id: {
          type: "string",
          description:
            "One of: starter, template-v1, template-v2, template-v3. Omit to list.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List branding templates",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (_ctx, _userId, args) => {
      const id = args.template_id;
      if (id === undefined) return { templates: TEMPLATES };
      if (typeof id !== "string" || !TEMPLATE_PATH[id]) {
        throw new Error(
          `Template tidak dikenal. Pilih salah satu: ${Object.keys(TEMPLATE_PATH).join(", ")}`,
        );
      }
      const url = `${appOrigin()}${TEMPLATE_PATH[id]}`;
      const res = await fetchWithTimeout(url, { timeoutMs: 15_000 });
      if (!res.ok) {
        throw new Error(`Gagal memuat template ${id} (HTTP ${res.status})`);
      }
      const html = await res.text();
      return { template_id: id, html, chars: html.length };
    },
  },

  {
    name: "branding_set_html",
    description:
      "Replace the HTML of the user's public page with a complete document you wrote. This REPLACES the whole page — there is no partial edit, so read branding_get with include_html when you mean to change one part. Call branding_data first and write data-cp markers, not literal values, or the page freezes at today's CV. Max 250,000 characters, inline the CSS, one document from <!doctype html> to </html>. It cannot publish a page: an unpublished one stays private until the user turns it on in the app. But if the page is ALREADY published this replaces what visitors see within about a minute, and there is no version history — so on a live page (the result tells you, and branding_get says so up front) confirm with the user before overwriting.",
    inputSchema: {
      type: "object",
      properties: {
        html: {
          type: "string",
          description:
            "The complete HTML document. Max 250,000 characters.",
        },
      },
      required: ["html"],
      additionalProperties: false,
    },
    annotations: {
      title: "Set branding page HTML",
      readOnlyHint: false,
      // Overwrites a page the user can see, and there is no version history.
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const html = args.html;
      if (typeof html !== "string" || html.trim().length === 0) {
        throw new Error("Parameter html wajib diisi dengan dokumen HTML.");
      }
      return await ctx.runMutation(internal.mcp.data.branding.setHtml, {
        userId,
        html,
      });
    },
  },

  {
    name: "branding_delete_html",
    description:
      "Delete the user's custom page HTML so the public page falls back to the built-in template they picked. Use when they want to start over or say the custom page is broken. There is no undo and no version history — the HTML is gone. Ask before calling it if you are the one who wrote that HTML in this conversation.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Delete branding page HTML",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runMutation(internal.mcp.data.branding.clearHtml, { userId }),
  },
];
