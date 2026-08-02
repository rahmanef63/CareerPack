/**
 * Apply the user's "Style" prefs (color/font/radius/density) as CSS
 * custom properties on documentElement + a universal-selector override
 * layer so even templates that don't yet reference the vars still pick
 * up primary/radius/font visually.
 */
export const HYDRATOR_STYLE = String.raw`
function applyStyle(style) {
  if (!style || typeof style !== 'object') return;
  var root = document.documentElement;
  var css = ':root {';
  if (style.primary) {
    root.style.setProperty('--cp-primary', style.primary);
    css += ' --cp-primary: ' + style.primary + ';';
  }
  var radiusMap = { none: '0', sm: '4px', md: '10px', lg: '16px', full: '999px' };
  if (style.radius && radiusMap[style.radius]) {
    root.style.setProperty('--cp-radius', radiusMap[style.radius]);
    css += ' --cp-radius: ' + radiusMap[style.radius] + ';';
  }
  var fontMap = {
    sans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    serif: '"Playfair Display", "Source Serif Pro", Georgia, serif',
    mono: '"JetBrains Mono", "Fira Code", Menlo, Consolas, monospace'
  };
  if (style.font && fontMap[style.font]) {
    root.style.setProperty('--cp-font', fontMap[style.font]);
    css += ' --cp-font: ' + fontMap[style.font] + ';';
  }
  var densityMap = { compact: '0.7', normal: '1', spacious: '1.35' };
  if (style.density && densityMap[style.density]) {
    root.style.setProperty('--cp-density', densityMap[style.density]);
    css += ' --cp-density: ' + densityMap[style.density] + ';';
  }
  css += ' }';
  if (style.font) {
    css += ' body, html { font-family: var(--cp-font, inherit) !important; }';
  }
  if (style.radius) {
    css += ' button, .btn, [data-cp-btn], a.btn, .card, [data-cp-rounded], [data-cp-section] .card, [data-cp-section] .badge { border-radius: var(--cp-radius) !important; }';
  }
  if (style.primary) {
    css += ' [data-cp-primary], button[data-cp-primary], a[data-cp-primary], .cp-cta { background-color: var(--cp-primary) !important; border-color: var(--cp-primary) !important; }';
    css += ' [data-cp-color="primary"], a[data-cp="contact-linkedin"], a[data-cp="contact-portfolio"] { color: var(--cp-primary) !important; }';
  }
  if (style.density) {
    css += ' [data-cp-section] { padding-top: calc(var(--cp-density, 1) * 1.25rem) !important; padding-bottom: calc(var(--cp-density, 1) * 1.25rem) !important; }';
  }
  var tag = document.getElementById('cp-user-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'cp-user-style';
    (document.head || document.documentElement).appendChild(tag);
  }
  tag.textContent = css;
}
applyStyle(d.style);
`;
