/**
 * Show-more truncation. Long card lists (10+ projects, 15+ skills)
 * overwhelm the public page. Cap visible items at the per-list
 * threshold + append a "Lihat semua" button that postMessages the
 * parent to open a Radix ResponsiveDialog with the FULL list. We can't
 * render the modal inside the iframe — position:fixed pins to the
 * iframe's viewport which scrolls with the parent (since the iframe is
 * auto-resized to its content height), so the modal would scroll
 * off-screen.
 */
export const HYDRATOR_TRUNCATE = String.raw`
function truncateList(container, listName, max) {
  if (max <= 0 || max >= 99) return 0;
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
  var row = document.createElement('div');
  row.setAttribute('data-cp-show-more-row', '1');
  row.style.cssText =
    'display:flex;justify-content:center;flex-basis:100%;width:100%;grid-column:1 / -1;';
  row.appendChild(btn);
  anchor.parentNode.insertBefore(row, anchor.nextSibling);
}

// Per-list defaults. Override per-list with data-cp-list-max="<N>" on
// the container. Tuned tight — public page should feel curated, not
// exhaustive. Users dive into the dialog to see everything.
var TRUNCATE_DEFAULTS = {
  projects: 3,
  skills: 6,
  experience: 2,
  education: 4,
  certifications: 3,
  languages: 6,
};
// Sub-lists that live INSIDE a parent list-item (proj-tech in each
// project clone, exp-achievements in each experience clone). Never
// truncate these — they're inline detail, not list-of-cards.
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
  return 0;
}
// Skip lists nested inside another data-cp-list (proj-tech inside a
// project clone, exp-achievements inside an experience clone) OR
// inside a data-cp-template (the original hidden source node).
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

// Pass 2 — v2's mount-id pattern (its own inline JS fills these via
// innerHTML reads from cp.* directly, so they don't carry data-cp-list
// markers).
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
`;
