/**
 * Decorations + structural tweaks: availability badge, primary CTA
 * button, section reorder, fluff hide-out, empty placeholders.
 * All wrapped in try/catch so a single failure doesn't tank the page.
 */
export const HYDRATOR_PAGE_EXTRAS = String.raw`
// ---- Hero "Available for hire" badge --------------------------
// Inject after the first heading we find so it lands inside the
// hero regardless of template structure. Template-side HTML is
// untouched. Skipped silently when availability is omitted.
try {
  var av = d.availability;
  if (av && av.open) {
    var hero = document.querySelector('h1, [data-cp-hero]');
    if (hero && !document.querySelector('[data-cp-availability-badge]')) {
      var badge = document.createElement('div');
      badge.setAttribute('data-cp-availability-badge', '1');
      badge.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:8px',
        'margin:0 0 14px',
        'padding:6px 12px',
        'border-radius:999px',
        'background:rgba(16,185,129,.12)',
        'color:#059669',
        'font:inherit',
        'font-size:12px',
        'font-weight:600',
        'letter-spacing:.01em',
      ].join(';');
      var dot = document.createElement('span');
      dot.style.cssText =
        'width:8px;height:8px;border-radius:999px;background:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.18);animation:cp-pulse 2s ease-in-out infinite';
      badge.appendChild(dot);
      var label = document.createElement('span');
      label.textContent = av.note ? 'Tersedia · ' + av.note : 'Tersedia untuk direkrut';
      badge.appendChild(label);
      var pulse = document.createElement('style');
      pulse.textContent =
        '@keyframes cp-pulse{0%,100%{opacity:1}50%{opacity:.55}}';
      document.head.appendChild(pulse);
      if (hero.parentNode) hero.parentNode.insertBefore(badge, hero);
    }
  }
} catch (e) {
  try { console.warn('[CareerPack hydrator] availability badge failed', e); } catch (_) {}
}

// ---- Hero primary CTA button ----------------------------------
// Render as a top-of-document fixed-position-friendly button. We
// place it just after the hero headline so it inherits hero text
// colour / typography. Templates can opt out by adding
// [data-cp-skip-cta] to a hero ancestor.
try {
  var ctaData = d.cta;
  var skipCta = document.querySelector('[data-cp-skip-cta]');
  if (ctaData && ctaData.label && ctaData.url && !skipCta) {
    var heroHeader = document.querySelector('h1, [data-cp-hero]');
    if (heroHeader && !document.querySelector('[data-cp-primary-cta]')) {
      var href = ctaData.url;
      if (ctaData.type === 'email' && href.indexOf('mailto:') !== 0) {
        href = 'mailto:' + href;
      }
      var ctaBtn = document.createElement('a');
      ctaBtn.setAttribute('data-cp-primary-cta', ctaData.type);
      ctaBtn.setAttribute('href', href);
      if (ctaData.type === 'download') ctaBtn.setAttribute('download', '');
      if (ctaData.type !== 'email') {
        ctaBtn.setAttribute('target', '_blank');
        ctaBtn.setAttribute('rel', 'noopener noreferrer');
      }
      ctaBtn.textContent = ctaData.label;
      ctaBtn.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:8px',
        'margin:20px 0 0',
        'padding:12px 24px',
        'border-radius:999px',
        // Indigo-500 — readable on both light + dark hero backgrounds
        'background:#6366f1',
        'color:#ffffff',
        'font:inherit',
        'font-weight:600',
        'font-size:14px',
        'line-height:1',
        'text-decoration:none',
        'box-shadow:0 12px 30px -10px rgba(99,102,241,.55)',
        'transition:transform .15s ease, box-shadow .15s ease, background .15s ease',
      ].join(';');
      ctaBtn.addEventListener('mouseenter', function() {
        ctaBtn.style.transform = 'translateY(-1px)';
        ctaBtn.style.background = '#4f46e5';
      });
      ctaBtn.addEventListener('mouseleave', function() {
        ctaBtn.style.transform = '';
        ctaBtn.style.background = '#6366f1';
      });
      var afterTarget = heroHeader.parentNode || document.body;
      if (heroHeader.nextSibling) {
        afterTarget.insertBefore(ctaBtn, heroHeader.nextSibling);
      } else {
        afterTarget.appendChild(ctaBtn);
      }
    }
  }
} catch (e) {
  try { console.warn('[CareerPack hydrator] cta render failed', e); } catch (_) {}
}

// ---- Section reorder ------------------------------------------
// Reorder [data-cp-section] siblings within their shared parent
// based on the user's saved order. Sections not listed keep their
// template-default position. Same DOM scope only.
try {
  var orderList = d.sectionOrder;
  if (orderList && orderList.length) {
    var sections = document.querySelectorAll('[data-cp-section]');
    var groups = {};
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      var parent = sec.parentNode;
      if (!parent) continue;
      var key = parent.tagName + ':' + (parent.id || s);
      if (!groups[key]) groups[key] = { parent: parent, items: [] };
      groups[key].items.push(sec);
    }
    Object.keys(groups).forEach(function(gk) {
      var g = groups[gk];
      var byName = {};
      var unnamed = [];
      for (var k = 0; k < g.items.length; k++) {
        var item = g.items[k];
        var name = item.getAttribute('data-cp-section') || '';
        if (name && !byName[name]) byName[name] = item;
        else unnamed.push(item);
      }
      var orderedItems = [];
      var taken = {};
      for (var oi = 0; oi < orderList.length; oi++) {
        var n = orderList[oi];
        if (byName[n] && !taken[n]) {
          orderedItems.push(byName[n]);
          taken[n] = true;
        }
      }
      for (var lk = 0; lk < g.items.length; lk++) {
        var lname = g.items[lk].getAttribute('data-cp-section') || '';
        if (!lname || !taken[lname]) orderedItems.push(g.items[lk]);
      }
      for (var ai = 0; ai < orderedItems.length; ai++) {
        g.parent.appendChild(orderedItems[ai]);
      }
    });
  }
} catch (e) {
  try { console.warn('[CareerPack hydrator] section reorder failed', e); } catch (_) {}
}

// ---- Fluff sections (no user-data source) ---------------------
// Templates ship with editorial fluff (testimonials, fake metrics,
// process steps, FAQ, blog grids) with no equivalent in CV/profile.
// When real branding data is present we always hide them — otherwise
// the live page shows quotes from people who don't exist + made-up
// stats. Designers can preview them by removing the data-cp-fluff
// attribute (picker thumbnails render WITHOUT __cp_data so fluff
// stays visible there).
var fluffNodes = document.querySelectorAll('[data-cp-fluff]');
for (var f = 0; f < fluffNodes.length; f++) {
  fluffNodes[f].style.display = 'none';
  fluffNodes[f].setAttribute('data-cp-hidden', '1');
}

// ---- Empty placeholders ---------------------------------------
// data-cp-empty="<name>" is inverse: shown ONLY when the section is
// empty. Useful for "Belum ada proyek" hints inside a section the
// designer wants kept visible.
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
`;
