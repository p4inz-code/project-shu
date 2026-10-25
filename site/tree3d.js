/* An interactive blossom tree with every photo hanging from it.
   Drag to turn it, pinch or use the buttons to zoom (Ctrl + wheel works too), hover a photo to lift it, tap it to see it large.
   Plain canvas, no libraries. Pauses off screen and drops detail on weak devices. */
(function () {
  'use strict';
  var PHOTOS = ['01', '02', '05', '06', '07', '09', '11', '12', '13', '14', '15', '16', '17', '19'];
  var de = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rnd(seed) { var a = seed; return function () { a = (a * 16807) % 2147483647; return a / 2147483647; }; }

  function build() {
    var R = rnd(31), br = [], blos = [], cards = [];
    // trunk: a gentle curve from the ground
    var trunk = [];
    for (var i = 0; i <= 7; i++) { var t = i / 7; trunk.push([Math.sin(t * 2.2) * .08, t * 1.25, Math.cos(t * 1.7) * .06]); }
    br.push({ p: trunk, w: 9 });
    function twig(from, ang, tilt, len, w, depth) {
      var pts = [from], x = from[0], y = from[1], z = from[2], segs = 5;
      for (var s = 1; s <= segs; s++) {
        var u = s / segs;
        var a = ang + (R() - .5) * .5, ti = tilt + (R() - .5) * .35 - u * .35;
        x += Math.cos(a) * Math.cos(ti) * len / segs; z += Math.sin(a) * Math.cos(ti) * len / segs; y += Math.sin(ti) * len / segs;
        pts.push([x, y, z]);
      }
      br.push({ p: pts, w: w });
      var tip = pts[pts.length - 1];
      if (depth > 0) { for (var k = 0; k < 2; k++) { var m = pts[2 + k]; twig(m, ang + (k ? .8 : -.8) + (R() - .5) * .4, tilt - .05 + R() * .3, len * .62, w * .6, depth - 1); } }
      else { for (var b = 0; b < 16; b++) blos.push([tip[0] + (R() - .5) * .34, tip[1] + (R() - .5) * .26, tip[2] + (R() - .5) * .34, .5 + R() * .7, Math.floor(R() * 3), R() * 6.28]); }
      for (var q = 1; q < pts.length; q++) { if (R() < .7) blos.push([pts[q][0] + (R() - .5) * .12, pts[q][1] + (R() - .5) * .1, pts[q][2] + (R() - .5) * .12, .45 + R() * .5, Math.floor(R() * 3), R() * 6.28]); }
    }
    var ga = 2.399963;
    for (var n = 0; n < 7; n++) { var base = trunk[4 + (n % 4)]; twig(base, n * ga, .55 + (n % 3) * .12, .85 + R() * .5, 5, 1); }
    // photo cards hang from the lower twigs
    var cand = [];
    br.forEach(function (b, bi) { if (bi === 0) return; b.p.forEach(function (pt, pi) { if (pi > 0 && pt[1] > .85 && Math.hypot(pt[0], pt[2]) > .3) cand.push(pt); }); });
    var used = {};
    for (var c = 0; c < PHOTOS.length; c++) {
      var want = c / PHOTOS.length * 6.2832 + (c % 2 ? .15 : -.1), best = null, bs = -9;
      cand.forEach(function (pt, ci) { if (used[ci]) return; var sc = Math.cos(Math.atan2(pt[2], pt[0]) - want) * 2 - Math.abs(pt[1] - (1.15 + (c % 3) * .12)) * 1.5 + R() * .1; if (sc > bs) { bs = sc; best = ci; } });
      used[best] = 1; var at = cand[best];
      cards.push({ id: PHOTOS[c], at: at, len: .3 + (c % 3) * .09, ph: R() * 6.28, img: null, ok: false, ar: 1, dir: Math.atan2(at[2], at[0]) });
    }
    return { br: br, blos: blos, cards: cards };
  }

  function sprite(col) {
    var s = 72, cv = document.createElement('canvas'); cv.width = cv.height = s; var x = cv.getContext('2d'); x.translate(s / 2, s / 2);
    for (var i = 0; i < 5; i++) { x.save(); x.rotate(i * 1.2566); x.translate(0, -s * .2); var g = x.createRadialGradient(0, -s * .06, 1, 0, 0, s * .26); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, s * .15, s * .22, 0, 0, 6.2832); x.fill(); x.strokeStyle = 'rgba(214,87,126,.35)'; x.lineWidth = 1; x.stroke(); x.restore(); }
    x.fillStyle = '#f0b45e'; x.beginPath(); x.arc(0, 0, s * .06, 0, 6.2832); x.fill();
    return cv;
  }

  function init(host) {
    if (host.__t3) return; host.__t3 = 1;
    var cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y;';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'A blossom tree with photos hanging from it. Drag to turn it, tap a photo to see it large.');
    host.appendChild(cv);
    var hint = document.createElement('div'); hint.style.cssText = 'position:absolute;left:0;right:0;bottom:12px;text-align:center;font:italic 500 18px/1 "Cormorant Garamond",serif;color:#f7c1cf;pointer-events:none;transition:opacity .8s;'; hint.textContent = 'drag to turn the tree, tap a photo to see it close'; host.appendChild(hint);
    function btn(txt, label, right, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.style.cssText = 'position:absolute;top:12px;right:' + right + 'px;width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(247,193,207,.6);background:rgba(27,20,51,.55);color:#f7c1cf;font:500 22px/1 "Cormorant Garamond",serif;cursor:pointer;'; b.addEventListener('click', fn); host.appendChild(b); return b; }
    var over = document.createElement('div'); over.style.cssText = 'position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(8,5,18,.82);cursor:zoom-out;opacity:0;transition:opacity .5s;'; over.setAttribute('role', 'dialog'); over.setAttribute('aria-label', 'Photo, large'); var big = document.createElement('img'); big.alt = ''; big.style.cssText = 'max-width:88%;max-height:88%;border:10px solid #fffdf9;border-bottom-width:26px;box-shadow:0 30px 80px rgba(0,0,0,.7);transform:scale(.8) rotate(-2deg);transition:transform .7s cubic-bezier(.16,1,.3,1);'; over.appendChild(big); host.appendChild(over);
    function openBig(c) { big.src = 'media/photos/' + c.id + '.jpg'; over.style.display = 'flex'; requestAnimationFrame(function () { over.style.opacity = '1'; big.style.transform = 'scale(1) rotate(0)'; }); }
    function closeBig() { over.style.opacity = '0'; big.style.transform = 'scale(.8) rotate(-2deg)'; setTimeout(function () { over.style.display = 'none'; }, 500); }
    over.addEventListener('click', closeBig); addEventListener('keydown', function (e) { if (e.key === 'Escape' && over.style.display === 'flex') closeBig(); });

    var scene = build(), lite = function () { return de.getAttribute('data-perf') === 'lite'; };
    var sp = [sprite(['#fff0f4', '#f7a9c3']), sprite(['#fde4ea', '#f3a2bc']), sprite(['#ffffff', '#e8b6d6'])];
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
    function size() { var r = host.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, lite() ? 1 : 1.5); W = Math.max(2, r.width); H = Math.max(2, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); if (window.ResizeObserver) new ResizeObserver(size).observe(host); else addEventListener('resize', size);
    var stars = []; var sr = rnd(77); for (var i = 0; i < 70; i++) stars.push([sr(), sr() * .8, sr() * 1.4 + .3, sr() * 6]);

    var yaw = .5, pitch = .22, dist = 4.2, tYaw = .5, tPitch = .22, tDist = 4.2, auto = !calm, idle = 0, vis = false, raf = 0, hover = null, pmx = -1, pmy = -1, drag = null, moved = 0, loaded = false;
    function loadImgs() { if (loaded) return; loaded = true; scene.cards.forEach(function (c) { var im = new Image(); im.onload = function () { c.ok = true; c.ar = im.naturalWidth / im.naturalHeight; c.img = im; }; im.src = 'media/photos/' + c.id + '.jpg'; }); }

    btn('+', 'Zoom in', 12, function () { tDist = Math.max(2.3, tDist - .6); });
    btn('−', 'Zoom out', 60, function () { tDist = Math.min(6.4, tDist + .6); });

    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: tYaw, pitch: tPitch }; moved = 0; auto = false; idle = 0; cv.style.cursor = 'grabbing'; hint.style.opacity = '0'; try { cv.setPointerCapture(e.pointerId); } catch (x) { } });
    cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); pmx = e.clientX - r.left; pmy = e.clientY - r.top; if (drag) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); tYaw = drag.yaw + dx * .008; tPitch = Math.max(-.1, Math.min(.6, drag.pitch + dy * .004)); idle = 0; } });
    function up(e) { if (!drag) return; var wasTap = moved < 6; drag = null; cv.style.cursor = hover ? 'pointer' : 'grab'; idle = 0; if (wasTap && hover) openBig(hover); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function () { drag = null; });
    cv.addEventListener('pointerleave', function () { pmx = pmy = -1; });
    cv.addEventListener('wheel', function (e) { if (e.ctrlKey || e.metaKey) { e.preventDefault(); tDist = Math.max(2.3, Math.min(6.4, tDist + e.deltaY * .004)); } }, { passive: false });
    cv.addEventListener('dblclick', function () { tDist = tDist > 3.4 ? 2.6 : 4.2; });
    var pts = {}; cv.addEventListener('touchmove', function (e) { if (e.touches.length === 2) { var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pts.d) tDist = Math.max(2.3, Math.min(6.4, tDist - (d - pts.d) * .01)); pts.d = d; e.preventDefault(); } }, { passive: false });
    cv.addEventListener('touchend', function () { pts.d = 0; });

    function proj(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp2 = Math.sin(pitch);
      var X = x * cy - z * sy, Z = x * sy + z * cy, Y = y - .75;
      var Y2 = Y * cp - Z * sp2, Z2 = Y * sp2 + Z * cp;
      var k = (H * 1.75) / (Z2 + dist);
      return [W / 2 + X * k, H * .8 - Y2 * k, Z2, k];
    }
    function frame(t) {
      raf = 0; if (!vis) return;
      if (lite() && (frame.skip = !frame.skip)) { raf = requestAnimationFrame(frame); return; }
      idle++; if (idle > 240 && !calm) auto = true; if (auto) tYaw += .0032;
      yaw += (tYaw - yaw) * .12; pitch += (tPitch - pitch) * .12; dist += (tDist - dist) * .12;
      ctx.clearRect(0, 0, W, H);
      for (var s = 0; s < stars.length; s++) { var st = stars[s]; ctx.globalAlpha = .35 + .35 * Math.sin(t * .002 + st[3]); ctx.fillStyle = '#fff4d6'; ctx.fillRect(st[0] * W, st[1] * H, st[2], st[2]); }
      ctx.globalAlpha = 1;
      // ground glow
      var g = ctx.createRadialGradient(W / 2, H * .78, 5, W / 2, H * .78, W * .42); g.addColorStop(0, 'rgba(243,169,189,.28)'); g.addColorStop(1, 'rgba(243,169,189,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var items = [];
      scene.br.forEach(function (b) { for (var i = 1; i < b.p.length; i++) { var a = proj.apply(null, b.p[i - 1]), c = proj.apply(null, b.p[i]); items.push({ z: (a[2] + c[2]) / 2, k: 0, a: a, c: c, w: b.w * (1 - i / b.p.length * .5) }); } });
      var maxB = lite() ? Math.floor(scene.blos.length * .45) : scene.blos.length;
      for (var j = 0; j < maxB; j++) { var bl = scene.blos[j], p = proj(bl[0] + Math.sin(t * .0007 + bl[5]) * .008, bl[1], bl[2]); items.push({ z: p[2], f: p, s: bl[3], sp: bl[4], r: bl[5] }); }
      scene.cards.forEach(function (c) {
        var sw = Math.sin(t * .0012 + c.ph) * .03, top = c.at, cx = top[0] + sw, cy = top[1] - c.len, cz = top[2];
        var a = proj(top[0], top[1], top[2]), p = proj(cx, cy, cz);
        var viewDir = Math.atan2(-Math.sin(yaw), Math.cos(yaw)); // facing test: card faces outward from the trunk
        var cosf = Math.cos(c.dir + yaw - Math.PI / 2); // 1 when facing the viewer
        items.push({ z: p[2], card: c, a: a, p: p, face: cosf });
      });
      items.sort(function (u, v) { return v.z - u.z; });
      hover = null; var hz = 1e9;
      for (var q = 0; q < items.length; q++) {
        var it = items[q];
        if (it.a && it.c) { ctx.strokeStyle = 'rgba(92,58,78,.95)'; ctx.lineWidth = Math.max(1, it.w * it.a[3] * .018); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(it.a[0], it.a[1]); ctx.lineTo(it.c[0], it.c[1]); ctx.stroke(); }
        else if (it.f) { var sz = it.s * it.f[3] * .1; ctx.save(); ctx.translate(it.f[0], it.f[1]); ctx.rotate(it.r); ctx.globalAlpha = Math.max(.35, Math.min(1, 1.2 - (it.z + 1) * .12)); ctx.drawImage(sp[it.sp], -sz / 2, -sz / 2, sz, sz); ctx.restore(); ctx.globalAlpha = 1; }
        else if (it.card) {
          var c = it.card, k = it.p[3], wBase = .27 * k, sq = .62 + .38 * Math.abs(it.face), w = wBase * sq, h = wBase * 1.18;
          var isH = false;
          if (pmx >= 0 && !drag) { var dx = pmx - it.p[0], dy = pmy - (it.p[1] + h * .5); if (Math.abs(dx) < w * .6 && Math.abs(dy) < h * .62 && it.z < hz && true) { hz = it.z; hover = c; } }
          var lift = (hover === c) ? 1.18 : 1; w *= lift; h *= lift;
          ctx.strokeStyle = 'rgba(201,137,158,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(it.a[0], it.a[1]); ctx.lineTo(it.p[0], it.p[1]); ctx.stroke();
          ctx.save(); ctx.translate(it.p[0], it.p[1] + h * .5); ctx.rotate(Math.sin(t * .0012 + c.ph) * .05);
          if (hover === c) { ctx.shadowColor = 'rgba(247,193,207,.9)'; ctx.shadowBlur = 22; }
          ctx.fillStyle = '#fffdf9'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0;
          if (c.ok) { var pad = w * .07, iw = w - pad * 2, ih = h * .78 - pad; ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + pad, -h / 2 + pad, iw, ih); ctx.clip(); var ar = iw / ih, sar = c.ar, dw, dh; if (sar > ar) { dh = ih; dw = ih * sar; } else { dw = iw; dh = iw / sar; } ctx.drawImage(c.img, -dw / 2, -h / 2 + pad + ih / 2 - dh / 2, dw, dh); ctx.restore(); }
          else { ctx.fillStyle = '#fbe5ea'; ctx.fillRect(-w / 2 + w * .07, -h / 2 + w * .07, w * .86, h * .72); }
          ctx.globalAlpha = 1; ctx.restore();
        }
      }
      cv.style.cursor = drag ? 'grabbing' : hover ? 'pointer' : 'grab';
      raf = requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { vis = en.isIntersecting; if (vis) { loadImgs(); if (!raf) raf = requestAnimationFrame(frame); } }); }, { rootMargin: '120px' });
    io.observe(host);
  }

  function scan() { var h = document.querySelectorAll('[data-tree3d]'); for (var i = 0; i < h.length; i++) init(h[i]); }
  setInterval(scan, 900); scan();
})();
