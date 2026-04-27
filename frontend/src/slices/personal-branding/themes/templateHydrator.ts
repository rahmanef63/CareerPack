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
  if (!d) return;

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
})();
`;

/** Stringified hydrator for inlining into the iframe srcDoc. */
export const TEMPLATE_HYDRATOR_JS = HYDRATOR_SOURCE;
