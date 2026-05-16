/**
 * Hydrator preamble — boots `var d` from the embedded JSON payload and
 * bails (with a warn) when the page wasn't seeded with data. All later
 * fragments rely on `d` being in scope.
 */
export const HYDRATOR_PREAMBLE = String.raw`
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
`;
