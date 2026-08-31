/**
 * Shared contract for anything that authors HTML for the public
 * personal-brand page (careerpack.org/<slug>): the built-in template ids,
 * where their source files live, and the `data-cp-*` marker grammar the
 * hydrator (`frontend/.../themes/templateHydrator.ts`) fills at render time.
 *
 * Two callers, one copy — same rule as `loadBranding.ts` two rows up. MCP
 * (`convex/mcp/tools/branding.ts`, for an external AI host like ChatGPT) and
 * the in-app generator (`convex/ai/branding.ts`, for CareerPack's own AI
 * chat) both write HTML against this exact contract. If they drifted, one
 * path would teach a model markers the hydrator doesn't fill.
 *
 * Mirrors `frontend/slices/personal-branding/themes/templateHydrator.ts`. If
 * a marker is added there, add it here too.
 */

/** Ids the theme picker offers, plus the skeleton meant for copying. */
export const TEMPLATES = [
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

export const TEMPLATE_PATH: Record<string, string> = {
  starter: "/personal-branding/templates/starter.html",
  "template-v1": "/personal-branding/templates/v1.html",
  "template-v2": "/personal-branding/templates/v2.html",
  "template-v3": "/personal-branding/templates/v3.html",
};

/**
 * How the hydrator binds data to markup. Kept as a data structure (not
 * baked into prose) so both callers can serialize it into whatever shape
 * their model needs — an MCP tool result for ChatGPT, a system-prompt
 * section for the in-app generator.
 */
export const MARKER_CONTRACT = {
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

export function appOrigin(): string {
  return (process.env.APP_URL ?? "https://careerpack.org").replace(/\/$/, "");
}
