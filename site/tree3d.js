/* An interactive blossom tree with every photo hanging from it.
   Drag to turn it, pinch or use the buttons to zoom (Ctrl + wheel works too), hover a photo to lift it, tap it to see it large.
   Plain canvas, no libraries. Pauses off screen and drops detail on weak devices. Themed to the pale blush page around it. */
(function () {
  'use strict';
  var PHOTOS = ['01', '02', '03', '03b', '04', '05', '06', '07', '08', '09', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
  var de = document.documentElement;
  // main face (or the person) in each photo, as a fraction of the picture, so every crop keeps faces near the upper third
  var FOCUS = {"11":[0.446,0.426],"12":[0.5,0.58],"13":[0.507,0.518],"14":[0.478,0.182],"15":[0.5,0.33],"16":[0.356,0.477],"17":[0.497,0.51],"19":[0.455,0.35],"04":[0.51,0.364],"03":[0.34,0.42],"03b":[0.477,0.347],"08":[0.404,0.474],"18":[0.615,0.447],"01":[0.576,0.165],"02":[0.478,0.447],"05":[0.5,0.5],"06":[0.342,0.183],"07":[0.5,0.5],"09":[0.421,0.45]};
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rnd(seed) { var a = seed; return function () { a = (a * 16807) % 2147483647; return a / 2147483647; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function build() {
    var R = rnd(31), br = [], blos = [], cards = [], buds = [];
    var trunk = [];
    for (var i = 0; i <= 8; i++) { var t = i / 8; trunk.push([Math.sin(t * 2.4) * .09, t * 1.3, Math.cos(t * 1.8) * .07]); }
    br.push({ p: trunk, w: 15, trunk: true });
    function twig(from, ang, tilt, len, w, depth) {
      var pts = [from], x = from[0], y = from[1], z = from[2], segs = 5;
      for (var s = 1; s <= segs; s++) {
        var u = s / segs, a = ang + (R() - .5) * .55, ti = tilt + (R() - .5) * .35 - u * .38;
        x += Math.cos(a) * Math.cos(ti) * len / segs; z += Math.sin(a) * Math.cos(ti) * len / segs; y += Math.sin(ti) * len / segs;
        pts.push([x, y, z]);
      }
      br.push({ p: pts, w: w });
      var tip = pts[pts.length - 1];
      if (depth > 0) { for (var k = 0; k < 3; k++) { var m = pts[1 + k]; twig(m, ang + (k - 1) * .85 + (R() - .5) * .4, tilt - .05 + R() * .3, len * .6, w * .58, depth - 1); } }
      else { for (var b = 0; b < 24; b++) blos.push([tip[0] + (R() - .5) * .38, tip[1] + (R() - .5) * .3, tip[2] + (R() - .5) * .38, .5 + R() * .75, Math.floor(R() * 3), R() * 6.28]); for (var d = 0; d < 6; d++) buds.push([tip[0] + (R() - .5) * .4, tip[1] + (R() - .5) * .32, tip[2] + (R() - .5) * .4, R()]); }
      for (var q = 1; q < pts.length; q++) { if (R() < .8) blos.push([pts[q][0] + (R() - .5) * .14, pts[q][1] + (R() - .5) * .12, pts[q][2] + (R() - .5) * .14, .45 + R() * .5, Math.floor(R() * 3), R() * 6.28]); }
    }
    var ga = 2.399963;
    for (var n = 0; n < 8; n++) { var base = trunk[4 + (n % 5)]; twig(base, n * ga, .5 + (n % 3) * .13, .9 + R() * .5, 7, 2); }
    var cand = [];
    br.forEach(function (b, bi) { if (bi === 0) return; b.p.forEach(function (pt, pi) { if (pi > 0 && pt[1] > .85 && Math.hypot(pt[0], pt[2]) > .3) cand.push(pt); }); });
    var used = {};
    for (var c = 0; c < PHOTOS.length; c++) {
      var want = c / PHOTOS.length * 6.2832 + (c % 2 ? .15 : -.1), best = null, bs = -9;
      cand.forEach(function (pt, ci) { if (used[ci]) return; var sc = Math.cos(Math.atan2(pt[2], pt[0]) - want) * 2 + Math.hypot(pt[0], pt[2]) * 1.4 - Math.abs(pt[1] - (1.0 + (c % 4) * .14)) * 1.2 + R() * .1; if (sc > bs) { bs = sc; best = ci; } });
      used[best] = 1; var at = cand[best];
      cards.push({ id: PHOTOS[c], at: at, len: .34 + (c % 4) * .1, ph: R() * 6.28, img: null, ok: false, ar: 1, dir: Math.atan2(at[2], at[0]) });
    }
    var fall = []; for (var f = 0; f < 34; f++) fall.push([(R() - .5) * 2.6, R() * 2.4, (R() - .5) * 2.6, .6 + R() * .8, R() * 6.28, .15 + R() * .25]);
    var ground = []; for (var g = 0; g < 46; g++) { var a2 = R() * 6.28, r2 = .12 + R() * 1.1; ground.push([Math.cos(a2) * r2, Math.sin(a2) * r2, R() * 3, .5 + R() * .7]); }
    return { br: br, blos: blos, buds: buds, cards: cards, fall: fall, ground: ground };
  }

  function sprite(col, s) {
    s = s || 80; var cv = document.createElement('canvas'); cv.width = cv.height = s; var x = cv.getContext('2d'); x.translate(s / 2, s / 2);
    for (var i = 0; i < 5; i++) {
      x.save(); x.rotate(i * 1.2566); x.translate(0, -s * .2);
      var g = x.createRadialGradient(0, -s * .08, 1, 0, 0, s * .27); g.addColorStop(0, col[0]); g.addColorStop(.7, col[1]); g.addColorStop(1, col[2]);
      x.fillStyle = g; x.beginPath(); x.moveTo(-s * .03, -s * .24); x.bezierCurveTo(-s * .2, -s * .22, -s * .19, s * .17, 0, s * .2); x.bezierCurveTo(s * .19, s * .17, s * .2, -s * .22, s * .03, -s * .24); x.quadraticCurveTo(0, -s * .19, -s * .03, -s * .24); x.fill();
      x.strokeStyle = 'rgba(190,70,110,.28)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, s * .15); x.lineTo(0, -s * .1); x.stroke(); x.restore();
    }
    x.fillStyle = '#e9a64f'; x.beginPath(); x.arc(0, 0, s * .055, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(214,87,126,.8)'; x.lineWidth = 1; for (var k = 0; k < 7; k++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(k * .9) * s * .1, Math.sin(k * .9) * s * .1); x.stroke(); }
    return cv;
  }

  function init(host) {
    if (host.__t3) return; host.__t3 = 1;
    host.style.background = 'none'; host.style.boxShadow = 'none'; host.style.overflow = 'visible';
    var bg = document.createElement('div'); bg.setAttribute('aria-hidden', 'true');
    bg.style.cssText = 'position:absolute;inset:-6% -8%;pointer-events:none;background:radial-gradient(60% 56% at 50% 46%, rgba(255,246,250,.95) 0%, rgba(247,232,247,.78) 46%, rgba(239,230,250,0) 100%);';
    host.appendChild(bg);
    var cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y;-webkit-mask-image:linear-gradient(180deg,#000 88%,transparent 100%);mask-image:linear-gradient(180deg,#000 88%,transparent 100%);';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'A blossom tree with photos hanging from it. Drag to turn it, tap a photo to see it large.');
    host.appendChild(cv);
    var hint = document.createElement('div'); hint.style.cssText = 'position:absolute;left:0;right:0;top:100%;margin-top:8px;text-align:center;font:italic 500 19px/1 "Cormorant Garamond",serif;color:#b04f78;pointer-events:none;transition:opacity .8s;text-shadow:0 0 12px rgba(255,246,250,.95),0 0 4px rgba(255,246,250,.9);'; hint.textContent = 'drag to turn the tree, tap a photo to see it close'; host.appendChild(hint);
    function btn(txt, label, right, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.style.cssText = 'position:absolute;top:10px;right:' + right + 'px;width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(214,87,126,.55);background:rgba(255,250,252,.8);color:#b4325f;font:500 24px/1 "Cormorant Garamond",serif;cursor:pointer;box-shadow:0 6px 16px -8px rgba(120,40,80,.5);'; b.addEventListener('click', fn); host.appendChild(b); return b; }
    var over = document.createElement('div'); over.style.cssText = 'position:absolute;inset:-4% -6%;display:none;align-items:center;justify-content:center;background:rgba(40,22,52,.78);border-radius:28px;cursor:zoom-out;opacity:0;transition:opacity .5s;z-index:5;'; over.setAttribute('role', 'dialog'); over.setAttribute('aria-label', 'Photo, large'); var big = document.createElement('img'); big.alt = ''; big.style.cssText = 'max-width:88%;max-height:88%;border:10px solid #fffdf9;border-bottom-width:28px;box-shadow:0 30px 80px rgba(0,0,0,.6);transform:scale(.8) rotate(-2deg);transition:transform .7s cubic-bezier(.16,1,.3,1);'; over.appendChild(big); host.appendChild(over);
    function openBig(c) { big.src = 'media/photos/' + c.id + '.jpg'; over.style.display = 'flex'; requestAnimationFrame(function () { over.style.opacity = '1'; big.style.transform = 'scale(1) rotate(0)'; }); }
    function closeBig() { over.style.opacity = '0'; big.style.transform = 'scale(.8) rotate(-2deg)'; setTimeout(function () { over.style.display = 'none'; }, 500); }
    over.addEventListener('click', closeBig); addEventListener('keydown', function (e) { if (e.key === 'Escape' && over.style.display === 'flex') closeBig(); });

    var scene = build(), lite = function () { return de.getAttribute('data-perf') === 'lite'; };
    var sp = [sprite(['#fffafc', '#fbd0df', '#f08fb2']), sprite(['#fff0f5', '#f7b6cd', '#e77fa6']), sprite(['#ffffff', '#f3d3e8', '#d99ac4'])];
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
    function size() { var r = host.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, lite() ? 1 : 1.5); W = Math.max(2, r.width); H = Math.max(2, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); if (window.ResizeObserver) new ResizeObserver(size).observe(host); else addEventListener('resize', size);

    var yaw = .5, pitch = .2, dist = 4.2, tYaw = .5, tPitch = .2, tDist = 4.2, auto = !calm, idle = 0, vis = false, raf = 0, hover = null, pmx = -1, pmy = -1, drag = null, moved = 0, loaded = false;
    function loadImgs() { if (loaded) return; loaded = true; scene.cards.forEach(function (c) { var im = new Image(); im.onload = function () { c.ok = true; c.ar = im.naturalWidth / im.naturalHeight; c.img = im; }; im.src = 'media/photos/' + c.id + '.jpg'; }); }

    btn('+', 'Zoom in', 12, function () { tDist = Math.max(2.3, tDist - .6); });
    btn('−', 'Zoom out', 62, function () { tDist = Math.min(6.4, tDist + .6); });

    // dragging right turns the tree clockwise as seen from above; dragging down tips the top toward you
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: tYaw, pitch: tPitch }; moved = 0; auto = false; idle = 0; cv.style.cursor = 'grabbing'; hint.style.opacity = '0'; try { cv.setPointerCapture(e.pointerId); } catch (x) { } });
    cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); pmx = e.clientX - r.left; pmy = e.clientY - r.top; if (drag) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); tYaw = drag.yaw - dx * .008; tPitch = clamp(drag.pitch - dy * .004, -.1, .6); idle = 0; } });
    function up() { if (!drag) return; var wasTap = moved < 6; drag = null; cv.style.cursor = hover ? 'pointer' : 'grab'; idle = 0; if (wasTap && hover) openBig(hover); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function () { drag = null; });
    cv.addEventListener('pointerleave', function () { pmx = pmy = -1; });
    cv.addEventListener('wheel', function (e) { if (e.ctrlKey || e.metaKey) { e.preventDefault(); tDist = clamp(tDist + e.deltaY * .004, 2.3, 6.4); } }, { passive: false });
    cv.addEventListener('dblclick', function () { tDist = tDist > 3.4 ? 2.6 : 4.2; });
    var pts = {}; cv.addEventListener('touchmove', function (e) { if (e.touches.length === 2) { var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pts.d) tDist = clamp(tDist - (d - pts.d) * .01, 2.3, 6.4); pts.d = d; e.preventDefault(); } }, { passive: false });
    cv.addEventListener('touchend', function () { pts.d = 0; });

    function proj(x, y, z) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp2 = Math.sin(pitch);
      var X = x * cy - z * sy, Z = x * sy + z * cy, Y = y - .75;
      var Y2 = Y * cp - Z * sp2, Z2 = Y * sp2 + Z * cp;
      var k = (H * 1.38) / (Z2 + dist);
      return [W / 2 + X * k, H * .6 - Y2 * k, Z2, k];
    }
    function drawCard(c, it, t, isHover) {
      var k = it.p[3], sq = .62 + .38 * Math.abs(it.face), Wb = .34 * k;
      var arc = clamp(c.ok ? c.ar : .8, .62, 1.5), pad = Wb * .06, iw = Wb - pad * 2, ih = iw / arc, bot = Wb * .2, Hc = pad + ih + bot;
      var lift = isHover ? 1.16 : 1;
      ctx.save(); ctx.translate(it.p[0], it.p[1]); ctx.rotate(Math.sin(t * .0012 + c.ph) * .05); ctx.scale(sq * lift, lift);
      ctx.shadowColor = isHover ? 'rgba(240,100,160,.75)' : 'rgba(92,48,78,.34)'; ctx.shadowBlur = isHover ? 24 : Math.max(6, k * .05); ctx.shadowOffsetY = isHover ? 4 : 3;
      ctx.fillStyle = '#fffdf9'; ctx.fillRect(-Wb / 2, 0, Wb, Hc); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.save(); ctx.beginPath(); ctx.rect(-iw / 2, pad, iw, ih); ctx.clip();
      if (c.ok) { var sar = c.ar, dw, dh, fc = FOCUS[c.id] || [.5, .5]; if (sar > arc) { dh = ih; dw = ih * sar; } else { dw = iw; dh = iw / sar; } var ox = clamp(fc[0] * dw - .5 * iw, 0, Math.max(0, dw - iw)), oy = clamp(fc[1] * dh - .38 * ih, 0, Math.max(0, dh - ih)); ctx.drawImage(c.img, -iw / 2 - ox, pad - oy, dw, dh); }
      else { ctx.fillStyle = '#f9dce7'; ctx.fillRect(-iw / 2, pad, iw, ih); }
      ctx.restore();
      ctx.fillStyle = '#e8b4c8'; ctx.beginPath(); ctx.arc(0, pad + ih + bot * .5, Wb * .018, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(210,150,90,.95)'; ctx.fillRect(-Wb * .035, -Wb * .06, Wb * .07, Wb * .12);
      ctx.restore();
      return { w: Wb * sq * lift, h: Hc * lift };
    }
    function frame(t) {
      raf = 0; if (!vis) return;
      if (lite() && (frame.skip = !frame.skip)) { raf = requestAnimationFrame(frame); return; }
      idle++; if (idle > 240 && !calm) auto = true; if (auto) tYaw -= .0032;
      yaw += (tYaw - yaw) * .12; pitch += (tPitch - pitch) * .12; dist += (tDist - dist) * .12;
      ctx.clearRect(0, 0, W, H);
      var base = proj(0, 0, 0), gk = base[3];
      // soft shadow and fallen petals under the tree
      var sg = ctx.createRadialGradient(base[0], base[1], 4, base[0], base[1], gk * 1.3); sg.addColorStop(0, 'rgba(92,48,78,.26)'); sg.addColorStop(1, 'rgba(92,48,78,0)');
      ctx.save(); ctx.translate(base[0], base[1]); ctx.scale(1, .32); ctx.translate(-base[0], -base[1]); ctx.fillStyle = sg; ctx.fillRect(base[0] - gk * 1.4, base[1] - gk * 1.4, gk * 2.8, gk * 2.8); ctx.restore();
      scene.ground.forEach(function (g) { var q = proj(g[0], 0, g[1]); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(g[2]); ctx.scale(1, .6); ctx.globalAlpha = .8; ctx.fillStyle = '#f6b7cc'; ctx.beginPath(); ctx.ellipse(0, 0, q[3] * .03 * g[3], q[3] * .022 * g[3], 0, 0, 6.2832); ctx.fill(); ctx.restore(); });
      ctx.globalAlpha = 1;
      var items = [];
      scene.br.forEach(function (b) { for (var i = 1; i < b.p.length; i++) { var a = proj.apply(null, b.p[i - 1]), c = proj.apply(null, b.p[i]); items.push({ z: (a[2] + c[2]) / 2, a: a, c: c, w: b.w * (1 - i / b.p.length * .5), tr: b.trunk }); } });
      var maxB = lite() ? Math.floor(scene.blos.length * .45) : scene.blos.length;
      for (var j = 0; j < maxB; j++) { var bl = scene.blos[j], p = proj(bl[0] + Math.sin(t * .0007 + bl[5]) * .009, bl[1] + Math.sin(t * .0009 + bl[5] * 2) * .004, bl[2]); items.push({ z: p[2], f: p, s: bl[3], sp: bl[4], r: bl[5] }); }
      if (!lite()) scene.buds.forEach(function (bd) { var p = proj(bd[0], bd[1], bd[2]); items.push({ z: p[2], bud: p, s: bd[3] }); });
      scene.fall.forEach(function (fl) { var yy = ((fl[1] - t * .00018 * fl[3] * 60 * .016) % 2.4 + 2.4) % 2.4, p = proj(fl[0] + Math.sin(t * .0006 + fl[4]) * .15, yy - .1, fl[2]); items.push({ z: p[2], pet: p, r: fl[4] + t * .001 * fl[3], s: fl[5] }); });
      scene.cards.forEach(function (c) {
        var sw = Math.sin(t * .0012 + c.ph) * .03, top = c.at, a = proj(top[0], top[1], top[2]), p = proj(top[0] + sw, top[1] - c.len, top[2]);
        var cosf = Math.cos(c.dir - yaw - Math.PI / 2);
        items.push({ z: p[2], card: c, a: a, p: p, face: cosf });
      });
      items.sort(function (u, v) { return v.z - u.z; });
      hover = null; var hz = 1e9;
      for (var q = 0; q < items.length; q++) {
        var it = items[q];
        if (it.a && it.c) {
          var wd = Math.max(1, it.w * it.a[3] * .02);
          ctx.lineCap = 'round'; ctx.strokeStyle = it.tr ? '#5a3347' : '#6e4358'; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(it.a[0], it.a[1]); ctx.lineTo(it.c[0], it.c[1]); ctx.stroke();
          
        }
        else if (it.f) { var sz = it.s * it.f[3] * .105; ctx.save(); ctx.translate(it.f[0], it.f[1]); ctx.rotate(it.r); ctx.globalAlpha = clamp(1.25 - (it.z + 1) * .12, .45, 1); ctx.drawImage(sp[it.sp], -sz / 2, -sz / 2, sz, sz); ctx.restore(); ctx.globalAlpha = 1; }
        else if (it.bud) { var bs = (.5 + it.s * .8) * it.bud[3] * .0055; ctx.fillStyle = '#e0709b'; ctx.beginPath(); ctx.arc(it.bud[0], it.bud[1], bs, 0, 6.2832); ctx.fill(); }
        else if (it.pet) { ctx.save(); ctx.translate(it.pet[0], it.pet[1]); ctx.rotate(it.r); ctx.globalAlpha = .8; ctx.fillStyle = '#f8bdd2'; ctx.beginPath(); ctx.ellipse(0, 0, it.pet[3] * .02 * (1 + it.s), it.pet[3] * .011 * (1 + it.s), 0, 0, 6.2832); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; }
        else if (it.card) {
          var c2 = it.card, k2 = it.p[3], sq2 = .62 + .38 * Math.abs(it.face), Wb = .34 * k2, arc = clamp(c2.ok ? c2.ar : .8, .62, 1.5), Hc = Wb * (.06 + (1 - .12) / arc + .2);
          var wz = Wb * sq2, isH = false;
          ctx.strokeStyle = 'rgba(176,100,130,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(it.a[0], it.a[1]); ctx.lineTo(it.p[0], it.p[1]); ctx.stroke();
          if (pmx >= 0 && !drag) { var dx = pmx - it.p[0], dy = pmy - (it.p[1] + Hc * .5); if (Math.abs(dx) < wz * .55 && Math.abs(dy) < Hc * .55 && it.z < hz) { hz = it.z; hover = c2; } }
          drawCard(c2, it, t, hover === c2);
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
