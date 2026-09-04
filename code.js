figma.showUI(__html__, { width: 720, height: 540, title: 'LAYER 2 MAML' });

const CFG = { mFilePath: 'assets/', alias: 'alias', layerFormat: 'png', layerTypeface: 0 };

// ponytail: edit json instead of js — keep config.json in sync
const COLORS = {
  tag: '#ff79c6', attr: '#50fa7b', value: '#f1fa8c',
  comment: '#6272a4', text: '#f8f8f2', bracket: '#ff79c6'
};

const N = '\n', T = '\t', XS = '<', XE = ' />', G = '>';

function ba(a, v) { return ' ' + a + '="' + v + '"'; }
function c2h(c) { const h = c.toString(16); return h.length === 1 ? '0' + h : h; }
function r2h(r, g, b) { return '#' + c2h(r) + c2h(g) + c2h(b); }
function randStr(len) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  while (r.length < len) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

// ---- XML → highlighted HTML (no external lib) ----
function e(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function findTagEnd(s, start) {
  let q = null;
  for (let j = start + 1; j < s.length; j++) {
    if (q) { if (s[j] === q) q = null; }
    else if (s[j] === '"' || s[j] === "'") q = s[j];
    else if (s[j] === '>') return j;
  }
  return s.length - 1;
}
function hlTag(t, c) {
  let r = `<span style="color:${c.bracket}">&lt;</span>`, i = 1;
  if (t[i] === '/') { r += `<span style="color:${c.bracket}">/</span>`; i++; }
  let m = t.slice(i).match(/^[\w:-]+/);
  if (m) { r += `<span style="color:${c.tag}">${e(m[0])}</span>`; i += m[0].length; }
  while (i < t.length) {
    let sp = t.slice(i).match(/^\s+/);
    if (sp) { r += sp[0]; i += sp[0].length; }
    if (i >= t.length) break;
    if (t[i] === '/' || t[i] === '>') {
      if (t[i] === '/') r += `<span style="color:${c.bracket}">/</span>`;
      else r += `<span style="color:${c.bracket}">&gt;</span>`;
      i++; continue;
    }
    let an = t.slice(i).match(/^[\w:-]+/);
    if (!an) { r += e(t[i]); i++; continue; }
    r += `<span style="color:${c.attr}">${e(an[0])}</span>`; i += an[0].length;
    let eq = t.slice(i).match(/^\s*=\s*/);
    if (eq) {
      r += eq[0]; i += eq[0].length;
      let q = t[i];
      if (q === '"' || q === "'") {
        let ve = t.indexOf(q, i + 1);
        if (ve < 0) ve = t.length;
        r += `<span style="color:${c.value}">${e(t.slice(i, ve + 1))}</span>`;
        i = ve + 1;
      }
    }
  }
  return r;
}
function xmlToHtml(xml) {
  const c = COLORS;
  let r = '', i = 0;
  while (i < xml.length) {
    if (xml.slice(i, i + 4) === '<!--') {
      let j = xml.indexOf('-->', i + 4);
      if (j < 0) j = xml.length - 3;
      r += `<span style="color:${c.comment}">${e(xml.slice(i, j + 3))}</span>`;
      i = j + 3; continue;
    }
    if (xml[i] === '<') {
      let j = findTagEnd(xml, i);
      r += hlTag(xml.slice(i, j + 1), c);
      i = j + 1; continue;
    }
    let j = xml.indexOf('<', i + 1);
    if (j < 0) j = xml.length;
    r += `<span style="color:${c.text}">${e(xml.slice(i, j))}</span>`;
    i = j;
  }
  return r;
}

function getFill(node) {
  const f = 'fills' in node ? node.fills : null;
  if (f && f.length && f[0].type === 'SOLID')
    return r2h(Math.round(f[0].color.r * 255), Math.round(f[0].color.g * 255), Math.round(f[0].color.b * 255));
  return null;
}

function getStroke(node) {
  const s = 'strokes' in node ? node.strokes : null;
  if (s && s.length && s[0].type === 'SOLID' && node.strokeWeight > 0)
    return { w: node.strokeWeight, c: r2h(Math.round(s[0].color.r * 255), Math.round(s[0].color.g * 255), Math.round(s[0].color.b * 255)) };
  return null;
}

// ponytail: walks up to nearest FRAME ancestor, returns relative position
function getFrameRel(node) {
  const abs = node.absoluteTransform;
  let p = node.parent;
  while (p && p.type !== 'FRAME' && p.type !== 'PAGE') p = p.parent;
  if (p && p.type === 'FRAME') {
    const fa = p.absoluteTransform;
    return { x: abs[0][2] - fa[0][2], y: abs[1][2] - fa[1][2] };
  }
  return { x: abs[0][2], y: abs[1][2] };
}

let imgQueue = [];

async function processSelection() {
  const sel = figma.currentPage.selection;
  if (!sel.length) { figma.ui.postMessage({ type: 'xml', xml: '', count: 0, imgCount: 0 }); return; }

  const fonts = new Set();
  for (const node of sel)
    if (node.type === 'TEXT' && node.fontName !== figma.mixed) fonts.add(JSON.stringify(node.fontName));
  for (const f of fonts) { try { await figma.loadFontAsync(JSON.parse(f)); } catch (e) {} }

  const up = CFG.layerTypeface === 1 ? 'click' : 'up';
  const _h = CFG.layerTypeface === 1 ? 'h' : '_h';
  let parts = [];
  imgQueue = [];

  for (const node of sel) {
    let name = node.name.replace('sp-', 'sp_').replace(/[<>]/g, '');
    const rname = randStr(8);
    const op = 'opacity' in node ? node.opacity : 1;
    const alpha = op >= 1 ? '' : ba('alpha', Math.round(op * 255).toString());
    const alias = ba(CFG.alias, name);
    const rel = getFrameRel(node);
    let w = Math.round(node.width), h = Math.round(node.height);
    if (w % 2) w++; if (h % 2) h++;
    let cx = Math.round(rel.x + w / 2), cy = Math.round(rel.y + h / 2);
    let tag = '';

    const isText = node.type === 'TEXT' || name.startsWith('.t') || name.startsWith('文本') || name.startsWith('Text');
    const isRect = node.type === 'RECTANGLE' && (name.startsWith('矩形') || name.startsWith('圆角矩形') || name.startsWith('Rectangle'));
    const isBtn = name.startsWith('.b') || name.startsWith('按钮') || name.startsWith('Button');
    const isArc = node.type === 'ELLIPSE' && (name.startsWith('.arc') || name.startsWith('椭圆') || name.startsWith('Arc'));

    // --- Text ---
    if (isText) {
      let size = 0, col = '#000000', align = 'left', text = '', fontA = '', textA = '';
      if (node.type === 'TEXT') {
        size = Math.round(node.fontSize !== figma.mixed ? node.fontSize : h);
        if (node.fills && node.fills.length && node.fills[0].type === 'SOLID')
          col = r2h(Math.round(node.fills[0].color.r * 255), Math.round(node.fills[0].color.g * 255), Math.round(node.fills[0].color.b * 255));
        const ah = node.textAlignHorizontal;
        if (ah === 'LEFT') { align = 'left'; cx = Math.round(rel.x); }
        else if (ah === 'RIGHT') { align = 'right'; cx = Math.round(rel.x + w); }
        else { align = 'center'; cx = Math.round(rel.x + w / 2); }
        text = node.characters;
        if (node.fontName !== figma.mixed) {
          const ff = node.fontName.family, fl = ff.toLowerCase();
          if (fl.startsWith('milanprovf')) fontA = ba('fontFamily', 'mipro-' + fl.replace('milanprovf-', ''));
          else if (fl.startsWith('misans')) fontA = ba('fontFamily', 'mipro-' + fl.replace('misans-', ''));
          else if (fl.startsWith('oplussa')) fontA = ba('fontPath', 'etc/' + ff + '.ttf');
          else if (fl.startsWith('pingfangsc')) fontA = ba('fontFamily', 'mipro-' + fl.replace('pingfangsc-', ''));
          else { fontA = ba('fontPath', 'etc/' + ff + '.ttf'); textA = ba('paras', '#') + ' ' + ba('format', text); }
          if (CFG.layerTypeface === 1 || CFG.layerTypeface === 3)
            fontA = fontA.replace('fontPath', 'typeface').replace('fontFamily', 'typeface').replace('etc/', '');
          else if (CFG.layerTypeface === 2) {
            const m = fontA.match(/etc\/HanyiVarvivo-(.+?)"/);
            fontA = m ? ba('textWeight', m[1]) : fontA.replace('fontPath', 'typeface').replace('fontFamily', 'typeface');
          }
        } else { fontA = ''; textA = ba('text', text); }
      } else {
        size = Math.floor(h + 2); text = name.slice(3); textA = ba('text', text);
      }
      if (!size) size = Math.floor(h + 2);
      w = Math.round(node.width); h = Math.round(node.height);
      if (w % 2) w++; if (h % 2) h++;

      tag = T + XS + 'Text'
        + ba('_width', w) + ba('_height', h) + ba(_h, size + '*1.25')
        + ba('x', cx) + ba('y', cy) + ba('align', align) + ba('alignV', 'center')
        + ba('color', col) + ba('size', size)
        + (textA || ba('textExp', text)) + fontA + alpha + alias + XE;
      parts.push(tag);
    }

    // --- Rectangle ---
    else if (isRect) {
      const st = getStroke(node);
      let cr = null;
      if ('cornerRadius' in node && node.cornerRadius !== figma.mixed && node.cornerRadius > 0)
        cr = Math.round(node.cornerRadius) + ',' + Math.round(node.cornerRadius);
      tag = T + XS + 'Rectangle'
        + ba('x', cx) + ba('y', cy) + ba('align', 'center') + ba('alignV', 'center')
        + ba('w', w) + ba('h', h) + ba('fillColor', getFill(node) || '#000000')
        + alpha + alias + (cr ? ba('cornerRadius', cr) : '')
        + (st ? ba('strokeColor', st.c) + ba('weight', st.w) : '') + XE;
      parts.push(tag);
    }

    // --- Arc ---
    else if (isArc) {
      const st = getStroke(node);
      const arc = '-' + (st ? st.w : 0) + '/2';
      tag = T + XS + 'Arc'
        + ba('x', cx) + ba('y', cy)
        + ba('w', w + arc) + ba('h', h + arc)
        + ba('fillColor', getFill(node) || '#000000')
        + ba('startAngle', '-90') + ba('sweep', '360') + ba('close', 'false')
        + (st ? ba('strokeColor', st.c) + ba('weight', st.w) : '')
        + ba('cap', 'round') + alpha + alias + XE;
      parts.push(tag);
    }

    // --- Button ---
    else if (isBtn) {
      tag = T + XS + 'Button'
        + ba('x', Math.round(rel.x)) + ba('y', Math.round(rel.y))
        + ba('w', w) + ba('h', h) + ba('visibility', '1') + alias + G
        + N + T + T + '<Triggers>'
        + N + T + T + T + '<Trigger action="' + up + '" >'
        + N + T + T + T + T + N + T + T + T + '</Trigger>'
        + N + T + T + '</Triggers>' + N + T + '</Button>';
      parts.push(tag);
    }

    // --- Image ---
    else {
      const realName = true;
      const jpgR = name.startsWith('bz') || name.startsWith('bs') || name.startsWith('bm');
      const global = name.startsWith('..');
      const fn = jpgR || realName ? name : global ? name.slice(2) : rname;
      const isJpg = CFG.layerFormat === 'jpg' || jpgR;
      const suf = isJpg ? '.jpg' : '.png';

      imgQueue.push({ node, fn, suf, fmt: isJpg ? 'JPG' : 'PNG' });

      tag = T + XS + 'Image'
        + ba('x', cx) + ba('y', cy) + ba('align', 'center') + ba('alignV', 'center')
        + ba('src', CFG.mFilePath + fn + suf)
        + ba('w', w) + ba('h', h)
        + ba('pivotX', w + '/2') + ba('pivotY', h + '/2') + ba('rotation', '0')
        + alias + XE;
      parts.push(tag);
    }
  }

  const xml = parts.join(N);
  const html = xmlToHtml(xml);
  figma.ui.postMessage({ type: 'xml', xml, html, count: sel.length, imgCount: imgQueue.length });

  if (imgQueue.length > 0) {
    await new Promise(r => setTimeout(r, 0));
    await exportImages();
  }
}

async function exportImages() {
  const queue = [...imgQueue];
  const imgs = [];
  for (const q of queue) {
    try {
      const fileP = q.node.exportAsync({ format: q.fmt });
      const svgP = q.node.width <= 100 && q.node.height <= 100
        ? q.node.exportAsync({ format: 'SVG' }) : Promise.resolve(null);
      const [fileBytes, svgBytes] = await Promise.all([fileP, svgP]);
      imgs.push({ name: q.fn + q.suf, data: Array.from(fileBytes), svg: svgBytes ? Array.from(svgBytes) : null });
    } catch (e) {
      imgs.push({ name: q.fn + q.suf, error: e.message });
    }
  }
  figma.ui.postMessage({ type: 'images', images: imgs });
}

processSelection().catch(e => { figma.notify('Error: ' + e.message); });

figma.on('selectionchange', () => {
  processSelection().catch(e => { figma.notify('Error: ' + e.message); });
});

figma.ui.onmessage = (msg) => {
  if (msg.type === 'close') figma.closePlugin();
  if (msg.type === 'exportImages') exportImages().catch(e => { figma.notify('Export error: ' + e.message); });
};
