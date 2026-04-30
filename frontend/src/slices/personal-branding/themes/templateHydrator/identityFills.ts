/**
 * Pump user data into template slots. Identity → contact → skills →
 * experience → education → projects → certifications → languages, then
 * force any reveal animations to finished state and apply
 * section-visibility flags.
 */
export const HYDRATOR_IDENTITY_FILLS = String.raw`
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
`;
