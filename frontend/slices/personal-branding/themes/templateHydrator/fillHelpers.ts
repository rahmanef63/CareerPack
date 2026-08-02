/**
 * DOM fill primitives. `fill(scope, key, val)` walks every
 * `[data-cp="<key>"]` inside `scope` and writes `val` according to the
 * node's optional `data-cp-mode` (`text` default, `src`, `href`, `html`).
 * `renderList(name, items, fillItem)` clones the `[data-cp-template]`
 * inside each `[data-cp-list="<name>"]` container for each item.
 */
export const HYDRATOR_FILL_HELPERS = String.raw`
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
    // Strip designer mock siblings — only the data-cp-template clones
    // should populate the list.
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
`;
