/**
 * Anchor + resize helper — runs in BOTH mock and hydrated iframes so
 * picker preview thumbnails behave correctly too. Intentionally
 * separate from the data hydrator (gated on __cp_data).
 *
 * - Anchor nav (#about): in a sandboxed about:srcdoc without
 *   `allow-same-origin`, navigating to a hash treats the URL as
 *   cross-document and can fail with SecurityError ("sad face"
 *   iframe). Intercept clicks and scrollIntoView the target by ID.
 * - Auto-resize: postMessages document height to the parent so the
 *   parent can size the iframe to its content (avoids
 *   "viewport-clipped iframe, only hero visible" UX bug).
 */
export const TEMPLATE_IFRAME_HELPERS_JS = String.raw`
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

  // ---- Floating mobile nav extraction --------------------------
  // Auto templates ship a .floating-nav (.bottom-tabs / .tabbar /
  // .bottom-nav) styled with position:fixed. Inside a content-sized
  // iframe, position:fixed pins to the iframe BOX (= full document
  // height), not the viewport — so the "fixed bottom nav" ends up
  // glued to the very end of the page. We hide it in-iframe and
  // postMessage items to the parent which renders an actual
  // viewport-fixed nav outside the iframe.
  try {
    var fnav = document.querySelector('.floating-nav');
    if (fnav) {
      var items = [];
      var anchors = fnav.querySelectorAll('a[href^="#"]');
      for (var fi = 0; fi < anchors.length; fi++) {
        var fa = anchors[fi];
        var fhref = fa.getAttribute('href') || '';
        if (fhref.length < 2) continue;
        var label = (fa.getAttribute('aria-label') || fa.textContent || '').trim();
        if (!label) continue;
        label = label.replace(/\s+/g, ' ').slice(0, 18);
        var svgEl = fa.querySelector('svg');
        var iconHtml = svgEl ? svgEl.outerHTML : '';
        items.push({ id: fhref.slice(1), label: label, iconHtml: iconHtml });
        if (items.length >= 6) break;
      }
      // Hide unconditionally — even on desktop the broken position is
      // jarring and the templates' desktop nav already lives in
      // .site-header.
      fnav.style.cssText += ';display:none !important';
      if (items.length > 0) {
        try {
          window.parent.postMessage(
            { type: 'cp-floating-nav', items: items },
            '*',
          );
        } catch (e) {}
      }
    }
  } catch (e) {}

  // ---- cp-goto from parent → scroll-to ------------------------
  // Parent's floating-nav buttons postMessage here when tapped. We
  // resolve the element, measure its top in iframe doc coords, and
  // bounce it back to the parent so the parent can scroll its own
  // viewport (the iframe doesn't scroll internally because it's sized
  // to content height).
  window.addEventListener('message', function(ev) {
    var data = ev && ev.data;
    if (!data || data.type !== 'cp-goto' || typeof data.id !== 'string') return;
    var el = document.getElementById(data.id);
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var y = rect.top + (window.scrollY || window.pageYOffset || 0);
    try {
      window.parent.postMessage(
        { type: 'cp-anchor-y', id: data.id, y: y },
        '*',
      );
    } catch (e) {}
  });

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
