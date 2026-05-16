/**
 * Manual-mode block canvas. The manual template ships with a single
 * [data-cp-blocks-mount] slot. We render the user's authored block list
 * into it before identity fills run so the rest of the hydrator sees a
 * stable DOM. Auto-mode pages (v1/v2/v3) have no mount node, so this is
 * a no-op there.
 */
export const HYDRATOR_MANUAL_BLOCKS = String.raw`
var SOCIAL_META = {
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', initial: 'in' },
  instagram: { label: 'Instagram', color: '#E4405F', initial: 'IG' },
  twitter:   { label: 'X',         color: '#0F172A', initial: 'X'  },
  github:    { label: 'GitHub',    color: '#181717', initial: 'GH' },
  youtube:   { label: 'YouTube',   color: '#FF0000', initial: 'YT' },
  tiktok:    { label: 'TikTok',    color: '#000000', initial: 'TT' },
  dribbble:  { label: 'Dribbble',  color: '#EA4C89', initial: 'DR' },
  behance:   { label: 'Behance',   color: '#1769FF', initial: 'BE' },
  facebook:  { label: 'Facebook',  color: '#1877F2', initial: 'f'  },
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', initial: 'WA' },
  email:     { label: 'Email',     color: '#0F172A', initial: '@'  },
  website:   { label: 'Website',   color: '#6366F1', initial: '↗'  }
};

function buildEmbedUrl(provider, id) {
  if (!provider || !id) return null;
  if (provider === 'youtube') return 'https://www.youtube.com/embed/' + encodeURIComponent(String(id));
  if (provider === 'vimeo')   return 'https://player.vimeo.com/video/' + encodeURIComponent(String(id));
  if (provider === 'spotify') {
    var parts = String(id).split('/');
    if (parts.length !== 2) return null;
    return 'https://open.spotify.com/embed/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]);
  }
  if (provider === 'soundcloud') {
    var u = String(id);
    if (!/^https?:\/\//i.test(u)) return null;
    return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u) + '&color=%236366f1&inverse=false&auto_play=false&show_user=true';
  }
  return null;
}

function applyBlockChrome(node, block) {
  if (!node || !block) return;
  if (block.id) node.setAttribute('data-cp-block-id', String(block.id));
  var s = block.style || {};
  if (s.bgVariant && s.bgVariant !== 'none') {
    node.classList.add('cp-blk-wrap-bg-' + s.bgVariant);
  }
  if (s.padding && s.padding !== 'none') {
    node.classList.add('cp-blk-wrap-pad-' + s.padding);
  }
  if (s.textAlign) {
    node.classList.add('cp-blk-wrap-text-' + s.textAlign);
  }
}

function renderBlock(block) {
  if (!block || block.hidden) return null;
  var p = block.payload || {};
  var t = block.type;
  if (t === 'container') {
    var layout = p.layout || 'row';
    var gap = p.gap || 'normal';
    var align = p.align || 'stretch';
    var mobileLayout = p.mobileLayout || 'auto';
    var c = document.createElement('div');
    c.className = [
      'cp-blk-container',
      'cp-blk-container-' + String(layout),
      'cp-blk-container-gap-' + String(gap),
      'cp-blk-container-align-' + String(align)
    ].join(' ');
    if (mobileLayout && mobileLayout !== 'auto') {
      c.classList.add('cp-blk-container-mobile-' + String(mobileLayout));
    }
    var kids = Array.isArray(p.children) ? p.children : [];
    for (var ci = 0; ci < kids.length; ci++) {
      var kid = kids[ci];
      if (!kid || kid.hidden) continue;
      if (kid.type === 'container') continue;
      var kidNode = renderBlock(kid);
      if (kidNode) {
        applyBlockChrome(kidNode, kid);
        c.appendChild(kidNode);
      }
    }
    if (c.children.length === 0) return null;
    applyBlockChrome(c, block);
    return c;
  }
  if (t === 'heading') {
    var size = p.size === 'md' ? 'md' : 'lg';
    var h = document.createElement(size === 'lg' ? 'h2' : 'h3');
    h.className = 'cp-blk-heading-' + size;
    h.textContent = String(p.text || '');
    return h;
  }
  if (t === 'paragraph') {
    var par = document.createElement('p');
    par.className = 'cp-blk-paragraph';
    par.textContent = String(p.text || '');
    return par;
  }
  if (t === 'divider') {
    if (p.style === 'dot') {
      var dot = document.createElement('div');
      dot.className = 'cp-blk-divider-dot';
      dot.textContent = '· · ·';
      return dot;
    }
    var hr = document.createElement('hr');
    hr.className = 'cp-blk-divider-line';
    return hr;
  }
  if (t === 'link') {
    var a = document.createElement('a');
    var variant = p.variant === 'secondary' ? 'secondary' : p.variant === 'ghost' ? 'ghost' : 'primary';
    a.className = 'cp-blk-link cp-blk-link-' + variant;
    a.setAttribute('href', String(p.url || '#'));
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    if (p.emoji) {
      var em = document.createElement('span');
      em.className = 'cp-blk-link-emoji';
      em.textContent = String(p.emoji);
      a.appendChild(em);
    }
    var body = document.createElement('div');
    body.className = 'cp-blk-link-body';
    var label = document.createElement('div');
    label.className = 'cp-blk-link-label';
    label.textContent = String(p.label || '');
    body.appendChild(label);
    if (p.description) {
      var desc = document.createElement('div');
      desc.className = 'cp-blk-link-desc';
      desc.textContent = String(p.description);
      body.appendChild(desc);
    }
    a.appendChild(body);
    var arrow = document.createElement('span');
    arrow.className = 'cp-blk-link-arrow';
    arrow.textContent = '→';
    a.appendChild(arrow);
    return a;
  }
  if (t === 'social') {
    var items = Array.isArray(p.items) ? p.items : [];
    if (items.length === 0) return null;
    var row = document.createElement('div');
    row.className = 'cp-blk-socials';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.platform || !it.url) continue;
      var meta = SOCIAL_META[it.platform];
      if (!meta) continue;
      var link = document.createElement('a');
      link.className = 'cp-blk-social';
      link.setAttribute('href', String(it.url));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      var badge = document.createElement('span');
      badge.className = 'cp-blk-social-icon';
      badge.style.cssText =
        'display:inline-flex;align-items:center;justify-content:center;' +
        'width:18px;height:18px;border-radius:4px;font-size:10px;' +
        'font-weight:700;color:#fff;background:' + meta.color + ';';
      badge.textContent = meta.initial;
      link.appendChild(badge);
      var lbl = document.createElement('span');
      lbl.textContent = meta.label;
      link.appendChild(lbl);
      row.appendChild(link);
    }
    return row.children.length > 0 ? row : null;
  }
  if (t === 'image') {
    var fig = document.createElement('figure');
    fig.className = 'cp-blk-image';
    var img = document.createElement('img');
    img.setAttribute('src', String(p.url || ''));
    img.setAttribute('alt', String(p.alt || ''));
    img.setAttribute('loading', 'lazy');
    if (p.link) {
      var wrap = document.createElement('a');
      wrap.setAttribute('href', String(p.link));
      wrap.setAttribute('target', '_blank');
      wrap.setAttribute('rel', 'noopener noreferrer');
      wrap.appendChild(img);
      fig.appendChild(wrap);
    } else {
      fig.appendChild(img);
    }
    if (p.caption) {
      var cap = document.createElement('figcaption');
      cap.textContent = String(p.caption);
      fig.appendChild(cap);
    }
    return fig;
  }
  if (t === 'embed') {
    var url = buildEmbedUrl(p.provider, p.id);
    if (!url) return null;
    var efig = document.createElement('figure');
    efig.className = 'cp-blk-embed';
    var frame = document.createElement('div');
    frame.className = 'cp-blk-embed-frame cp-blk-embed-' + String(p.provider);
    var ifr = document.createElement('iframe');
    ifr.setAttribute('src', url);
    ifr.setAttribute('loading', 'lazy');
    ifr.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture');
    ifr.setAttribute('allowfullscreen', '');
    ifr.setAttribute('referrerpolicy', 'no-referrer');
    ifr.setAttribute('title', 'Embedded ' + String(p.provider) + ' content');
    frame.appendChild(ifr);
    efig.appendChild(frame);
    if (p.caption) {
      var ecap = document.createElement('figcaption');
      ecap.textContent = String(p.caption);
      efig.appendChild(ecap);
    }
    return efig;
  }
  if (t === 'html') {
    var div = document.createElement('div');
    div.className = 'cp-blk-html';
    div.innerHTML = String(p.content || '');
    return div;
  }
  return null;
}

function renderBlockWithChrome(block) {
  var node = renderBlock(block);
  if (node && block && block.type !== 'container') {
    applyBlockChrome(node, block);
  }
  return node;
}

function renderManualBlocks(blocks) {
  var mount = document.querySelector('[data-cp-blocks-mount]');
  if (!mount) return;
  var empty = mount.querySelector('[data-cp-blocks-empty]');
  var list = Array.isArray(blocks) ? blocks : [];
  var visible = [];
  for (var bi = 0; bi < list.length; bi++) {
    if (list[bi] && !list[bi].hidden) visible.push(list[bi]);
  }
  if (visible.length === 0) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  void empty;
  for (var ri = 0; ri < visible.length; ri++) {
    var node = renderBlockWithChrome(visible[ri]);
    if (node) mount.appendChild(node);
  }
}
renderManualBlocks(d.blocks);
`;
