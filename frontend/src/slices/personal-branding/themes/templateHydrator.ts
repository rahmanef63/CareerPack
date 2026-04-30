/**
 * Hydrator JS that runs INSIDE the iframe — kept as a string so it can
 * be inlined into the iframe srcDoc. No imports / no React; this
 * executes against `window.__careerpack` (the parent injects it as a
 * <script id="__cp_data" type="application/json">) and walks the DOM.
 *
 * Conventions baked into the templates (see
 * `frontend/public/personal-branding/templates/v*.html`):
 *
 *  - `data-cp="<key>"` on a single element → fill text content.
 *  - `data-cp="<key>" data-cp-mode="src|href|html"` → fill attribute.
 *  - `data-cp-section="<name>"` on a section element → hide when
 *    `branding.has[name]` is false.
 *  - `data-cp-list="<name>"` on a container → clone the child with
 *    `data-cp-template` for each item; the renderer fills slots
 *    inside that cloned subtree, then removes the template node.
 *  - `data-cp-empty="<name>"` on an element → only shown when the
 *    section is empty (e.g. "no projects yet" placeholder).
 *
 *  Slot keys used:
 *    name, headline, target-role, location, avatar (mode=src),
 *    bio, summary,
 *    contact-email (text), contact-email-href (href, mailto: prefix
 *      auto-applied), contact-linkedin (href + text),
 *      contact-portfolio (href + text),
 *    skills (list, item slot=skill-name),
 *    experience (list, item slots=exp-company, exp-position,
 *      exp-period, exp-description, plus list=exp-achievements),
 *    education (list, item slots=edu-institution, edu-degree,
 *      edu-field, edu-period),
 *    projects (list, item slots=proj-title, proj-description,
 *      proj-link (href), proj-cover (text/emoji), proj-tech (list)),
 *    certifications (list, item slots=cert-name, cert-issuer,
 *      cert-date),
 *    languages (list, item slots=lang-name, lang-proficiency).
 *
 * Implementation lives in templateHydrator/*.ts — each fragment exports
 * a string that ends up concatenated into a single IIFE. All fragments
 * share scope (notably `var d`, `var has`, `function fill`, …) so order
 * matters: preamble → style → manualBlocks → fillHelpers → identityFills
 * → pageExtras → truncate.
 */

import { HYDRATOR_PREAMBLE } from "./templateHydrator/preamble";
import { HYDRATOR_STYLE } from "./templateHydrator/style";
import { HYDRATOR_MANUAL_BLOCKS } from "./templateHydrator/manualBlocks";
import { HYDRATOR_FILL_HELPERS } from "./templateHydrator/fillHelpers";
import { HYDRATOR_IDENTITY_FILLS } from "./templateHydrator/identityFills";
import { HYDRATOR_PAGE_EXTRAS } from "./templateHydrator/pageExtras";
import { HYDRATOR_TRUNCATE } from "./templateHydrator/truncate";
import { TEMPLATE_IFRAME_HELPERS_JS } from "./templateHydrator/iframeHelpers";

/** Stringified hydrator for inlining into the iframe srcDoc. */
export const TEMPLATE_HYDRATOR_JS =
  "(function(){" +
  HYDRATOR_PREAMBLE +
  HYDRATOR_STYLE +
  HYDRATOR_MANUAL_BLOCKS +
  HYDRATOR_FILL_HELPERS +
  HYDRATOR_IDENTITY_FILLS +
  HYDRATOR_PAGE_EXTRAS +
  HYDRATOR_TRUNCATE +
  "})();";

/** Always-injected helpers (anchor nav + auto-resize). Independent of
 *  whether the parent passed real branding data — needed even for
 *  mock-content "see template" mode so the iframe still resizes. */
export { TEMPLATE_IFRAME_HELPERS_JS };
