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
 */

const HYDRATOR_SOURCE = String.raw`
(function() {
  function read() {
    var el = document.getElementById('__cp_data');
    if (!el) return null;
    try { return JSON.parse(el.textContent || 'null'); } catch (e) { return null; }
  }
  var d = read();
  if (!d) {
    try { console.warn('[CareerPack hydrator] no __cp_data, skipping'); } catch (e) {}
    return;
  }
  try {
    console.log('[CareerPack hydrator] running', {
      name: (d.identity && d.identity.name) || '',
      headline: (d.identity && d.identity.headline) || '',
      has: d.has || {}
    });
  } catch (e) {}

  function setText(el, val) {
    if (val === undefined || val === null) val = '';
    el.textContent = String(val);
  }
  function setAttr(el, name, val) {
    if (val === undefined || val === null || val === '') {
      el.removeAttribute(name);
      return;
    }
    el.setAttribute(name, String(val));
  }
  function fill(scope, key, val) {
    var nodes = scope.querySelectorAll('[data-cp="' + key + '"]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var mode = n.getAttribute('data-cp-mode') || 'text';
      if (mode === 'src')      setAttr(n, 'src', val);
      else if (mode === 'href') setAttr(n, 'href', val);
      else if (mode === 'html') n.innerHTML = val ? String(val) : '';
      else                      setText(n, val);
    }
  }

  function hideSection(name, hide) {
    var nodes = document.querySelectorAll('[data-cp-section="' + name + '"]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.display = hide ? 'none' : '';
      if (hide) nodes[i].setAttribute('data-cp-hidden', '1');
    }
  }

  function renderList(name, items, fillItem) {
    var containers = document.querySelectorAll('[data-cp-list="' + name + '"]');
    for (var i = 0; i < containers.length; i++) {
      var c = containers[i];
      var tpl = c.querySelector('[data-cp-template]');
      if (!tpl) continue;
      // Remove any siblings that aren't the template — those are mock
      // content the designer baked in for the picker preview.
      var children = Array.prototype.slice.call(c.children);
      for (var j = 0; j < children.length; j++) {
        if (children[j] !== tpl) c.removeChild(children[j]);
      }
      tpl.style.display = 'none';
      if (!items || items.length === 0) continue;
      for (var k = 0; k < items.length; k++) {
        var node = tpl.cloneNode(true);
        node.removeAttribute('data-cp-template');
        node.style.display = '';
        try { fillItem(node, items[k], k); } catch (e) { /* skip */ }
        c.appendChild(node);
      }
    }
  }

  // ---- Identity ---------------------------------------------------
  var id = d.identity || {};
  fill(document, 'name', id.name);
  fill(document, 'headline', id.headline);
  fill(document, 'target-role', id.targetRole);
  fill(document, 'location', id.location);
  fill(document, 'avatar', id.avatarUrl);

  var ct = id.contact || {};
  fill(document, 'contact-email', ct.email);
  fill(document, 'contact-email-href', ct.email ? 'mailto:' + ct.email : '');
  fill(document, 'contact-linkedin', ct.linkedin);
  fill(document, 'contact-portfolio', ct.portfolio);

  if (!id.avatarUrl) {
    var avatars = document.querySelectorAll('[data-cp="avatar"]');
    for (var ai = 0; ai < avatars.length; ai++) {
      var av = avatars[ai];
      // Hide avatar el entirely when no upload — fallback initials are
      // template-specific so we don't try to inject them here.
      var wrap = av.closest('[data-cp-avatar-wrap]') || av;
      wrap.style.display = 'none';
    }
  }

  // ---- About ------------------------------------------------------
  fill(document, 'bio', (d.about && d.about.bio) || '');
  fill(document, 'summary', (d.about && d.about.summary) || '');

  // ---- Skills (chips) --------------------------------------------
  renderList('skills', d.skills || [], function(node, name) {
    fill(node, 'skill-name', name);
  });

  // ---- Experience -------------------------------------------------
  renderList('experience', d.experience || [], function(node, item) {
    fill(node, 'exp-company', item.company);
    fill(node, 'exp-position', item.position);
    var period;
    if (item.current) period = item.startDate + ' — Sekarang';
    else if (item.startDate && item.endDate) period = item.startDate + ' — ' + item.endDate;
    else period = item.startDate || item.endDate || '';
    fill(node, 'exp-period', period);
    fill(node, 'exp-description', item.description);
    var achList = node.querySelector('[data-cp-list="exp-achievements"]');
    if (achList) {
      var aTpl = achList.querySelector('[data-cp-template]');
      var children = Array.prototype.slice.call(achList.children);
      for (var i = 0; i < children.length; i++) {
        if (children[i] !== aTpl) achList.removeChild(children[i]);
      }
      if (aTpl) aTpl.style.display = 'none';
      var achs = item.achievements || [];
      for (var ai = 0; ai < achs.length; ai++) {
        if (!aTpl) {
          var li = document.createElement('li');
          li.textContent = achs[ai];
          achList.appendChild(li);
        } else {
          var n = aTpl.cloneNode(true);
          n.removeAttribute('data-cp-template');
          n.style.display = '';
          fill(n, 'achievement', achs[ai]);
          if (n.getAttribute('data-cp') === 'achievement') {
            n.textContent = achs[ai];
          }
          achList.appendChild(n);
        }
      }
    }
  });

  // ---- Education -------------------------------------------------
  renderList('education', d.education || [], function(node, item) {
    fill(node, 'edu-institution', item.institution);
    fill(node, 'edu-degree', item.degree);
    fill(node, 'edu-field', item.field);
    var period;
    if (item.startDate && item.endDate) period = item.startDate + ' — ' + item.endDate;
    else period = item.startDate || item.endDate || '';
    fill(node, 'edu-period', period);
    fill(node, 'edu-gpa', item.gpa);
  });

  // ---- Projects --------------------------------------------------
  renderList('projects', d.projects || [], function(node, item) {
    fill(node, 'proj-title', item.title);
    fill(node, 'proj-description', item.description);
    fill(node, 'proj-category', item.category);
    fill(node, 'proj-cover', item.coverEmoji || '');
    fill(node, 'proj-link', item.link || '');
    var techList = node.querySelector('[data-cp-list="proj-tech"]');
    if (techList) {
      var tTpl = techList.querySelector('[data-cp-template]');
      var children = Array.prototype.slice.call(techList.children);
      for (var i = 0; i < children.length; i++) {
        if (children[i] !== tTpl) techList.removeChild(children[i]);
      }
      if (tTpl) tTpl.style.display = 'none';
      var techs = item.techStack || [];
      for (var ti = 0; ti < techs.length; ti++) {
        var n;
        if (tTpl) {
          n = tTpl.cloneNode(true);
          n.removeAttribute('data-cp-template');
          n.style.display = '';
          fill(n, 'tech-name', techs[ti]);
          if (n.getAttribute('data-cp') === 'tech-name') n.textContent = techs[ti];
        } else {
          n = document.createElement('span');
          n.textContent = techs[ti];
        }
        techList.appendChild(n);
      }
    }
  });

  // ---- Certifications --------------------------------------------
  renderList('certifications', d.certifications || [], function(node, item) {
    fill(node, 'cert-name', item.name);
    fill(node, 'cert-issuer', item.issuer);
    fill(node, 'cert-date', item.date);
  });

  // ---- Languages -------------------------------------------------
  renderList('languages', d.languages || [], function(node, item) {
    fill(node, 'lang-name', item.language);
    fill(node, 'lang-proficiency', item.proficiency);
  });

  // ---- Force reveal animations active --------------------------
  // Templates wrap content in .reveal / .js-reveal which start at
  // opacity:0 and fade in only after IntersectionObserver fires
  // .is-visible / .in-view. In a sandboxed srcdoc iframe the IO
  // races against the iframe's initial 0x0 size and frequently
  // never fires, leaving the hero stuck invisible — even though
  // the hydrator filled the text. Force the visible state here
  // (and inject a CSS override) so real-data renders are
  // bullet-proof. Mock previews in the picker still animate.
  try {
    var revealEls = document.querySelectorAll('.reveal, .js-reveal, .stagger');
    for (var ri = 0; ri < revealEls.length; ri++) {
      revealEls[ri].classList.add('is-visible', 'in-view');
    }
    var styleOverride = document.createElement('style');
    styleOverride.setAttribute('data-cp-style', 'reveal-override');
    styleOverride.textContent =
      '.reveal, .js-reveal, .stagger, .motion-ready .js-reveal {' +
        'opacity: 1 !important;' +
        'transform: none !important;' +
        'filter: none !important;' +
      '}';
    document.head.appendChild(styleOverride);
  } catch (e) {
    try { console.warn('[CareerPack hydrator] reveal override failed', e); } catch (_) {}
  }

  // ---- Section visibility ---------------------------------------
  var has = d.has || {};
  hideSection('about', !has.about);
  hideSection('skills', !has.skills);
  hideSection('experience', !has.experience);
  hideSection('education', !has.education);
  hideSection('projects', !has.projects);
  hideSection('certifications', !has.certifications);
  hideSection('languages', !has.languages);
  hideSection('contact', !has.contact);

  // ---- Fluff sections (no user-data source) ---------------------
  // Templates ship with editorial fluff (testimonials, fake metrics,
  // process steps, FAQ, blog grids) that have no equivalent in
  // CV/profile. When real branding data is present we always hide
  // them — otherwise the live page shows quotes from people who
  // don't exist + made-up stats that confuse the visitor.
  // Designers can still preview them by removing the data-cp-fluff
  // attribute (the picker thumbnails render WITHOUT __cp_data so
  // fluff stays visible there).
  var fluffNodes = document.querySelectorAll('[data-cp-fluff]');
  for (var f = 0; f < fluffNodes.length; f++) {
    fluffNodes[f].style.display = 'none';
    fluffNodes[f].setAttribute('data-cp-hidden', '1');
  }

  // ---- Empty placeholders ---------------------------------------
  // data-cp-empty="<name>" elements are inverse: shown ONLY when the
  // section is empty. Useful for "Belum ada proyek" hints inside a
  // section the designer wants kept visible.
  var emptyMap = {
    about: !has.about, skills: !has.skills, experience: !has.experience,
    education: !has.education, projects: !has.projects,
    certifications: !has.certifications, languages: !has.languages,
    contact: !has.contact
  };
  Object.keys(emptyMap).forEach(function(k) {
    var nodes = document.querySelectorAll('[data-cp-empty="' + k + '"]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.display = emptyMap[k] ? '' : 'none';
    }
  });

  // ---- Show-more truncation ------------------------------------
  // Long card lists (10+ projects, 15+ skills) overwhelm the public
  // page. Cap visible items at the threshold + append a "Lihat
  // semua" button that postMessages the parent to open a Radix
  // ResponsiveDialog with the FULL list. We can't render the modal
  // inside the iframe — position:fixed pins to the iframe's
  // viewport which scrolls with the parent (since the iframe is
  // auto-resized to its content height), so the modal would scroll
  // off-screen.
  function truncateList(container, listName, max) {
    if (max <= 0 || max >= 99) return 0;
    // Direct children only — skip the data-cp-template node which
    // renderList keeps as a hidden source.
    var kids = container.children;
    var visible = [];
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.hasAttribute && k.hasAttribute('data-cp-template')) continue;
      if (k.style && k.style.display === 'none') continue;
      visible.push(k);
    }
    if (visible.length <= max) return 0;
    var hidden = 0;
    for (var j = max; j < visible.length; j++) {
      visible[j].style.display = 'none';
      visible[j].setAttribute('data-cp-truncated', '1');
      hidden += 1;
    }
    return hidden;
  }

  function appendShowMoreButton(anchor, listName, totalCount) {
    if (anchor.querySelector(':scope > [data-cp-show-more]')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-cp-show-more', listName);
    btn.textContent = 'Lihat semua (' + totalCount + ')';
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:6px',
      'margin:18px auto 0',
      'padding:10px 20px',
      'border-radius:999px',
      'border:1px solid currentColor',
      'background:transparent',
      'color:inherit',
      'font:inherit',
      'font-weight:600',
      'font-size:13px',
      'cursor:pointer',
      'opacity:.85',
      'transition:opacity .15s ease, transform .15s ease',
    ].join(';');
    btn.addEventListener('mouseenter', function() {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.opacity = '.85';
      btn.style.transform = '';
    });
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      try {
        window.parent.postMessage(
          { type: 'cp-show-more', list: listName, total: totalCount },
          '*'
        );
      } catch (err) {}
    });
    // Wrap in a centred row for any flex/grid container so the
    // button always lands on its own line.
    var row = document.createElement('div');
    row.setAttribute('data-cp-show-more-row', '1');
    row.style.cssText =
      'display:flex;justify-content:center;flex-basis:100%;width:100%;grid-column:1 / -1;';
    row.appendChild(btn);
    anchor.parentNode.insertBefore(row, anchor.nextSibling);
  }

  // Per-list threshold defaults. Override per-list with
  // data-cp-list-max="<N>" on the container. Tuned tight — the
  // public page should feel curated, not exhaustive. Users can dive
  // into the dialog to see everything.
  var TRUNCATE_DEFAULTS = {
    projects: 3,
    skills: 6,
    experience: 2,
    education: 4,
    certifications: 3,
    languages: 6,
  };
  // Sub-lists that live INSIDE a parent list-item (e.g. proj-tech in
  // each project clone, exp-achievements in each experience clone).
  // Never truncate these — they're inline detail, not a list-of-cards.
  var SUBLIST_NAMES = {
    'proj-tech': true,
    'exp-achievements': true,
  };
  function thresholdFor(container, listName) {
    var attr = container.getAttribute('data-cp-list-max');
    if (attr) {
      var n = parseInt(attr, 10);
      if (!isNaN(n)) return n;
    }
    if (Object.prototype.hasOwnProperty.call(TRUNCATE_DEFAULTS, listName)) {
      return TRUNCATE_DEFAULTS[listName];
    }
    return 0; // unknown list → don't truncate
  }
  // Skip lists nested INSIDE another data-cp-list (proj-tech inside
  // a project clone, exp-achievements inside an experience clone)
  // OR inside a data-cp-template (the original hidden source node).
  function isNestedInListOrTemplate(el) {
    var p = el.parentElement;
    while (p) {
      if (p.hasAttribute) {
        if (p.hasAttribute('data-cp-template')) return true;
        if (p.hasAttribute('data-cp-list')) return true;
      }
      p = p.parentElement;
    }
    return false;
  }

  // Pass 1 — data-cp-list containers (v1, v3, partial v2).
  try {
    var listContainers = document.querySelectorAll('[data-cp-list]');
    for (var li = 0; li < listContainers.length; li++) {
      var c = listContainers[li];
      if (isNestedInListOrTemplate(c)) continue;
      var name = c.getAttribute('data-cp-list') || '';
      if (SUBLIST_NAMES[name]) continue;
      var max = thresholdFor(c, name);
      if (max <= 0) continue;
      var visibleCount = 0;
      for (var ci = 0; ci < c.children.length; ci++) {
        var ch = c.children[ci];
        if (ch.hasAttribute && ch.hasAttribute('data-cp-template')) continue;
        visibleCount += 1;
      }
      var hiddenAfter = truncateList(c, name, max);
      if (hiddenAfter > 0) appendShowMoreButton(c, name, visibleCount);
    }
  } catch (passErr) {
    try { console.warn('[CareerPack hydrator] truncate pass1 failed', passErr); } catch (_) {}
  }

  // Pass 2 — v2's mount-id pattern (its own inline JS fills these
  // via innerHTML reads from cp.* directly, so they don't carry
  // data-cp-list markers).
  try {
    var V2_MOUNTS = [
      { id: 'skillsMount', name: 'skills' },
      { id: 'experienceMount', name: 'experience' },
      { id: 'casesMount', name: 'projects' },
      { id: 'deckMount', name: 'projects' },
    ];
    for (var mi = 0; mi < V2_MOUNTS.length; mi++) {
      var mount = document.getElementById(V2_MOUNTS[mi].id);
      if (!mount) continue;
      var mountName = V2_MOUNTS[mi].name;
      var mountMax = thresholdFor(mount, mountName);
      if (mountMax <= 0) continue;
      var totalKids = mount.children.length;
      if (totalKids <= mountMax) continue;
      var hiddenMount = truncateList(mount, mountName, mountMax);
      if (hiddenMount > 0) appendShowMoreButton(mount, mountName, totalKids);
    }
  } catch (passErr2) {
    try { console.warn('[CareerPack hydrator] truncate pass2 failed', passErr2); } catch (_) {}
  }
})();
`;

/**
 * Anchor + resize helper — runs in BOTH mock and hydrated iframes so
 * the picker preview thumbnails behave correctly too. Intentionally
 * separate from the data hydrator (which is gated on __cp_data).
 *
 * - Anchor nav (#about): in a sandboxed about:srcdoc without
 *   `allow-same-origin`, navigating to a hash treats the URL as
 *   cross-document and can fail with SecurityError ("sad face"
 *   iframe). Intercept clicks and scrollIntoView the target by ID.
 * - Auto-resize: postMessages the document height to the parent so
 *   the parent can size the iframe to its content (avoids the
 *   "viewport-clipped iframe, only hero visible" UX bug).
 */
const IFRAME_HELPERS_SOURCE = String.raw`
(function() {
  // ---- Anchor nav (D4) -----------------------------------------
  document.addEventListener('click', function(e) {
    var t = e.target;
    while (t && t !== document.body && t.tagName !== 'A') t = t.parentNode;
    if (!t || t.tagName !== 'A') return;
    var href = t.getAttribute('href') || '';
    if (href.charAt(0) !== '#' || href.length < 2) return;
    var id = href.slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      target.scrollIntoView();
    }
  }, true);

  // ---- Auto-resize via postMessage (D1, D10) -------------------
  function postSize() {
    try {
      var h = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      );
      window.parent.postMessage({ type: 'cp-resize', h: h }, '*');
    } catch (e) {}
  }
  if (document.readyState === 'complete') {
    postSize();
  } else {
    window.addEventListener('load', postSize);
  }
  // Re-post on viewport changes so responsive layouts update.
  window.addEventListener('resize', postSize);
  if (typeof ResizeObserver !== 'undefined' && document.body) {
    try {
      var ro = new ResizeObserver(function() { postSize(); });
      ro.observe(document.body);
    } catch (e) {}
  }
  // Fallback periodic ping for first 5s in case observers miss something.
  var pings = 0;
  var iv = setInterval(function() {
    postSize();
    pings += 1;
    if (pings > 10) clearInterval(iv);
  }, 500);
})();
`;

/** Stringified hydrator for inlining into the iframe srcDoc. */
export const TEMPLATE_HYDRATOR_JS = HYDRATOR_SOURCE;

/** Always-injected helpers (anchor nav + auto-resize). Independent of
 *  whether the parent passed real branding data — needed even for
 *  mock-content "see template" mode so the iframe still resizes. */
export const TEMPLATE_IFRAME_HELPERS_JS = IFRAME_HELPERS_SOURCE;
