/* ShuFX: organic randomness, wind, depth parallax and a procedural pseudo-3D cherry blossom tree.
   Design references: see docs/RESEARCH_AND_PLAN.md. Everything here is original code. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var R = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mix = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  var rgb = function (c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')'; };
  var coarse = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches;
  var reduced = function () { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; };

  /* ---------- quasi-periodic noise: four incommensurate sines with random phases ---------- */
  function makeNoise() {
    var f = [R(.7, 1.3), R(1.9, 2.7), R(3.7, 5.1), R(6.9, 9.7)], a = [1, .55, .3, .15], p = f.map(function () { return R(0, TAU); });
    var norm = 2;
    return function (t) { var v = 0; for (var i = 0; i < 4; i++) v += a[i] * Math.sin(t * f[i] + p[i]); return v / norm; };
  }

  /* ---------- wind: slow noise + randomly timed gusts (Poisson-like) ---------- */
  var windN1 = makeNoise(), windN2 = makeNoise(), gust = { t0: -1e9, dur: 1, str: 0, dir: 1 }, nextGust = performance.now() + R(4000, 12000);
  var wLast = -1, wVal = null;
  function wind(t) {
    if (t === wLast) return wVal;
    if (t > nextGust) { gust = { t0: t, dur: R(1600, 4200), str: R(.6, 2.1), dir: Math.random() < .8 ? 1 : -1 }; nextGust = t + R(5000, 24000); }
    var g = clamp((t - gust.t0) / gust.dur, 0, 1), env = Math.sin(g * Math.PI) * gust.str * gust.dir * (g < 1 ? 1 : 0);
    var s = t * .001;
    wLast = t; wVal = { x: windN1(s * .35) * .8 + env, z: windN2(s * .3) * .5, g: Math.abs(env) }; return wVal;
  }

  /* ---------- per-cycle re-randomised loops (no two cycles alike) ---------- */
  function loopRand(el, spec, base) {
    if (!el.animate) return { cancel: function () {} };
    var dead = false, anim = null, prev = { tx: 0, ty: 0, rot: 0, sc: 1, op: 1 }, first = true;
    function pick(r) { return r ? R(r[0], r[1]) : 0; }
    function frame(s) {
      var o = {};
      if (spec.tx || spec.ty) o.translate = (s.tx).toFixed(2) + 'px ' + (s.ty).toFixed(2) + 'px';
      if (spec.rot) o.rotate = s.rot.toFixed(2) + 'deg';
      if (spec.sc) o.scale = s.sc.toFixed(3);
      if (spec.op) o.opacity = s.op.toFixed(3);
      return o;
    }
    function run() {
      if (dead) return;
      var next = { tx: pick(spec.tx), ty: pick(spec.ty), rot: pick(spec.rot), sc: spec.sc ? pick(spec.sc) : 1, op: spec.op ? pick(spec.op) : 1 };
      var dur = base * R(.6, 1.6);
      anim = el.animate([frame(prev), frame(next)], { duration: dur, easing: 'ease-in-out', fill: 'forwards', delay: first ? -R(0, dur * .9) : 0 });
      first = false; prev = next; anim.onfinish = run;
    }
    run();
    return { cancel: function () { dead = true; if (anim) { anim.onfinish = null; anim.cancel(); } } };
  }

  /* ---------- pointer depth parallax for wrappers marked [data-depth] ---------- */
  function depth(root) {
    var els = Array.prototype.slice.call(root.querySelectorAll('[data-depth]'));
    if (!els.length || coarse) return { destroy: function () {} };
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function step() {
      raf = 0; cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      for (var i = 0; i < els.length; i++) {
        var d = parseFloat(els[i].dataset.depth) || 0;
        els[i].style.transform = 'translate3d(' + (cx * d * -28).toFixed(2) + 'px,' + (cy * d * -18).toFixed(2) + 'px,0)';
      }
      if (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) raf = requestAnimationFrame(step);
    }
    function move(e) { if (reduced()) return; tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; if (!raf) raf = requestAnimationFrame(step); }
    addEventListener('pointermove', move, { passive: true });
    return { destroy: function () { removeEventListener('pointermove', move); } };
  }

  /* ============================== the tree ============================== */
  var BARK = { dark: [82, 64, 72], mid: [120, 98, 106], hi: [176, 148, 156], twig: [142, 92, 98] };

  function petalPath(c, r) {
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(-r * .62, -r * .18, -r * .8, -r * .86, -r * .17, -r);
    c.quadraticCurveTo(0, -r * .84, r * .17, -r);
    c.bezierCurveTo(r * .8, -r * .86, r * .62, -r * .18, 0, 0);
    c.closePath();
  }
  // open: 0 closed bud .. 1 fully open. age: 0 pink .. 1 almost white. haze: 0 near .. 1 far (paler)
  var PAL = [
    [[232, 110, 150], [246, 176, 196], [255, 240, 244]],
    [[238, 140, 168], [250, 200, 214], [255, 246, 248]],
    [[226, 96, 138], [240, 150, 178], [252, 226, 234]],
    [[240, 156, 150], [250, 202, 196], [255, 240, 232]],
    [[214, 120, 170], [238, 178, 210], [252, 236, 246]]
  ];
  function makeFlowerSprite(open, age, haze, seedRot, vi) {
    var S = 96, cv = document.createElement('canvas'); cv.width = cv.height = S; var c = cv.getContext('2d');
    c.translate(S / 2, S / 2);
    var r = S * .46, hz = [247, 226, 234];
    var pal = PAL[(vi || 0) % PAL.length], base = mix(pal[0], hz, haze * .55), mid = mix(pal[1], hz, haze * .5), tip = mix(pal[2], hz, haze * .3);
    base = mix(base, [250, 235, 240], age * .55); mid = mix(mid, [255, 244, 247], age * .6);
    if (open < .25) { // bud: two overlapped teardrops, deep pink
      c.rotate(seedRot);
      for (var b = 0; b < 3; b++) {
        c.save(); c.rotate((b - 1) * .5); var g = c.createLinearGradient(0, 0, 0, -r * .7);
        g.addColorStop(0, rgb(mix([196, 70, 112], hz, haze * .5))); g.addColorStop(1, rgb(mix([240, 150, 176], hz, haze * .5)));
        c.fillStyle = g; c.beginPath(); c.ellipse(0, -r * .32, r * .2, r * .38, 0, 0, TAU); c.fill(); c.restore();
      }
      c.fillStyle = rgb(mix([150, 60, 80], hz, haze * .4)); c.beginPath(); c.arc(0, r * .05, r * .13, 0, TAU); c.fill();
      return cv;
    }
    var sy = lerp(.55, 1, clamp((open - .25) / .75));
    c.rotate(seedRot); c.scale(1, 1);
    for (var i = 0; i < 5; i++) {
      c.save(); c.rotate(i * TAU / 5 + R(-.09, .09)); c.scale(lerp(.55, 1, clamp((open - .2) / .8)) * R(.9, 1.08), 1);
      var pr = r * lerp(.62, 1, open) * R(.92, 1.06);
      var gr = c.createLinearGradient(0, 0, 0, -pr);
      gr.addColorStop(0, rgb(base, .86)); gr.addColorStop(.45, rgb(mid, .74)); gr.addColorStop(1, rgb(tip, .62));
      c.fillStyle = gr; petalPath(c, pr); c.fill();
      c.strokeStyle = 'rgba(214,90,126,' + (.22 * (1 - haze * .6)).toFixed(2) + ')'; c.lineWidth = .8; c.stroke();
      c.strokeStyle = 'rgba(200,70,110,' + (.2 * (1 - age * .6)).toFixed(2) + ')'; c.lineWidth = .7;
      c.beginPath(); c.moveTo(0, -pr * .1); c.lineTo(0, -pr * .62); c.stroke();
      c.restore();
    }
    // dark-pink mark at the base of the petals + stamens + pistil
    var cg = c.createRadialGradient(0, 0, 0, 0, 0, r * .3); cg.addColorStop(0, rgb(mix([196, 52, 98], hz, haze * .4), .95)); cg.addColorStop(1, rgb(mix([226, 100, 140], hz, haze * .4), 0));
    c.fillStyle = cg; c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.fill();
    c.lineCap = 'round';
    for (var k = 0; k < 16; k++) {
      var a = k / 16 * TAU + R(-.2, .2), L = r * R(.32, .5) * open;
      c.strokeStyle = rgb(mix([252, 214, 226], hz, haze * .4), .9); c.lineWidth = .8;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke();
      c.fillStyle = rgb(mix([214, 62, 104], hz, haze * .4)); c.beginPath(); c.arc(Math.cos(a) * L, Math.sin(a) * L, 1.5, 0, TAU); c.fill();
    }
    c.fillStyle = rgb(mix([236, 214, 120], hz, haze * .3)); c.beginPath(); c.arc(0, 0, r * .06, 0, TAU); c.fill();
    return cv;
  }
  function makePetalSprite(haze) {
    var S = 48, cv = document.createElement('canvas'); cv.width = cv.height = S; var c = cv.getContext('2d');
    c.translate(S / 2, S * .8); var r = S * .72, hz = [247, 226, 234];
    var g = c.createLinearGradient(0, 0, 0, -r); g.addColorStop(0, rgb(mix([240, 150, 176], hz, haze * .5))); g.addColorStop(1, rgb(mix([255, 240, 244], hz, haze * .3)));
    c.fillStyle = g; petalPath(c, r); c.fill();
    c.strokeStyle = 'rgba(214,90,126,.25)'; c.lineWidth = .8; c.stroke();
    return cv;
  }

  function tree(canvas, opt) {
    opt = opt || {};
    var ctx = canvas.getContext('2d'), W = 1, H = 1, dpr = 1, U = 1, running = false, visible = false, raf = 0, last = 0, tAcc = 0;
    var quality = coarse ? .62 : 1, slow = 0, bloom = opt.calm ? 1 : 0, bloomT = 0, yaw = 0, pitch = .06, tyaw = 0, tpitch = 0, drag = null, ptr = null, dragYaw = 0;
    var segs = [], flowers = [], anchors = [], petals = [], pile = [], blades = [], lights = [], nodes = [], whisp = [];
    var sprites = null, petalSp = null;
    var yawN = makeNoise(), swayN = makeNoise();
    var D = 760;

    /* ---- generation ---- */
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
    function perp(d) { var a = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; var c = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]]; return norm(c); }
    function rotAround(v, k, ang) { // Rodrigues
      var c = Math.cos(ang), s = Math.sin(ang), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2], x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
      return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
    }
    var queue = [], bid = 0, frameId = 0;
    function branch(p, dir, len, r, dep, order) {
      var id = ++bid;
      var n = Math.max(2, Math.round(len / 30)), cur = p.slice(), d = dir.slice(), droop = .016 + dep * .011;
      for (var i = 0; i < n; i++) {
        var t = i / n, step = len / n;
        d = norm([d[0] + R(-.1, .1), d[1] + R(-.07, .08) - droop, d[2] + R(-.1, .1)]);
        var nx = [cur[0] + d[0] * step, cur[1] + d[1] * step, cur[2] + d[2] * step];
        var ord = order + (i + 1) / n;
        segs.push({ a: cur, b: nx, r0: r * (1 - t * .5), r1: r * (1 - (t + 1 / n) * .5), dep: dep, ord: ord, tick: Math.random(), br: id });
        if (dep >= 2 && Math.random() < .95) anchors.push({ p: nx, dep: dep, ord: ord, w: 1 });
        if (dep < 5 && i >= 1 && Math.random() < (dep === 1 ? .92 : dep === 2 ? .82 : dep === 3 ? .66 : .42)) {
          var side = rotAround(d, perp(d), R(.45, 1.0) * (Math.random() < .5 ? 1 : -1));
          side = rotAround(side, d, R(0, TAU));
          queue.push([nx, norm(side), len * R(.56, .8), r * .58, dep + 1, ord]);
        }
        cur = nx;
      }
      anchors.push({ p: cur, dep: dep, ord: order + 1, w: 2 });
    }
    function build() {
      segs = []; flowers = []; anchors = []; nodes = []; whisp = []; queue = [];
      var SEG_BUDGET = coarse ? 260 : 360, FLOWER_BUDGET = coarse ? 520 : 900;
      var tl = 118, trunkTop = [0, 0, 0];
      var cur = [0, 0, 0], d = norm([R(-.1, .1), 1, R(-.1, .1)]);
      for (var i = 0; i < 3; i++) { d = norm([d[0] + R(-.1, .1), d[1], d[2] + R(-.1, .1)]); var nx = [cur[0] + d[0] * tl / 3, cur[1] + d[1] * tl / 3, cur[2] + d[2] * tl / 3]; segs.push({ a: cur, b: nx, r0: 17 - i * 1.6, r1: 17 - (i + 1) * 1.6, dep: 0, ord: (i + 1) / 3 * .8, tick: Math.random(), br: 0 }); cur = nx; }
      trunkTop = cur;
      // a couple of buttress roots
      for (var rr = 0; rr < 4; rr++) { var az = rr / 4 * TAU + R(-.4, .4); segs.push({ a: [0, 5, 0], b: [Math.cos(az) * 22, 0, Math.sin(az) * 22], r0: 7, r1: 2.2, dep: 0, ord: .1, tick: 1, br: -1 - rr }); }
      var nb = Math.round(R(5, 7));
      for (var b = 0; b < nb; b++) {
        var az2 = b / nb * TAU + R(-.35, .35), el = R(.3, .82);
        var dir = norm([Math.cos(az2) * Math.cos(el), Math.sin(el), Math.sin(az2) * Math.cos(el)]);
        branch(trunkTop, dir, R(175, 235), 9.2, 1, .8);
      }
      { var dl = norm([R(-.18, .18), 1, R(-.18, .18)]); branch(trunkTop, dl, R(150, 195), 8.4, 1, .8); }
      while (queue.length && segs.length < SEG_BUDGET) { var q = queue.shift(); branch(q[0], q[1], q[2], q[3], q[4], q[5]); }
      queue = [];
      var byBr = {}; segs.forEach(function (sg) { (byBr[sg.br] = byBr[sg.br] || []).push(sg); });
      Object.keys(byBr).forEach(function (k) { var a = byBr[k]; a.forEach(function (sg, i) { sg.pv = a[i - 1] || null; sg.nx = a[i + 1] || null; }); });
      // flowers from anchors (subsampled by quality)
      var dens = 1;
      anchors.forEach(function (an) {
        var n = an.w === 2 ? Math.round(R(3, 6)) : Math.round(R(1.5, 3.4));
        n = Math.max(1, Math.round(n * dens));
        for (var k = 0; k < n; k++) {
          flowers.push({
            p: [an.p[0] + R(-10, 10), an.p[1] + R(-8, 9), an.p[2] + R(-10, 10)], sz: R(.8, 1.3), rot: R(0, TAU), sq: R(.55, 1), ph: R(0, TAU),
            delay: clamp(an.ord * .22 + R(0, .5), 0, .98), bud: Math.random() < .035, aged: Math.random() < .2, special: false, vi: Math.floor(R(0, 5)), dep: an.dep
          });
        }
      });
      if (flowers.length > FLOWER_BUDGET) { var keep = FLOWER_BUDGET / flowers.length; flowers = flowers.filter(function () { return Math.random() < keep; }); }
      // choose memory nodes (6) and whisper lights (3) spread across the canopy
      var cand = flowers.map(function (f, i) { return i; }).filter(function (i) { var f = flowers[i]; return f.dep >= 2 && f.p[1] > 120 && f.p[2] < 90; });
      cand.sort(function (a, b) { return flowers[a].p[0] - flowers[b].p[0]; });
      var pickIdx = [];
      for (var q = 0; q < 6 && cand.length; q++) { var lo = Math.floor(q / 6 * cand.length), hi = Math.max(lo + 1, Math.floor((q + 1) / 6 * cand.length)), best = lo; for (var j = lo; j < hi; j++) if (flowers[cand[j]].p[1] > flowers[cand[best]].p[1] - R(0, 40)) best = j; pickIdx.push(cand[best]); }
      pickIdx.forEach(function (i) { flowers[i].special = true; flowers[i].sz = 1.55; flowers[i].delay = .55; flowers[i].bud = false; flowers[i].aged = false; nodes.push(flowers[i]); });
      var rest = anchors.filter(function (a) { return a.dep >= 3; });
      for (var w = 0; w < 3 && rest.length; w++) { var an2 = rest.splice(Math.floor(R(0, rest.length)), 1)[0]; whisp.push({ p: [an2.p[0] + R(-6, 6), an2.p[1] - 8, an2.p[2] + R(-6, 6)], ph: R(0, TAU) }); }
      // foreground blades for depth
      blades = []; for (var bl = 0; bl < 46; bl++) blades.push({ x: R(-330, 330), z: R(-300, -120), h: R(26, 70), bend: R(-14, 14), ph: R(0, TAU), c: Math.random() });
      lights = []; for (var lt = 0; lt < 3; lt++) lights.push({ x: R(-.2, 1.1), w: R(.08, .22), a: R(.05, .13), ph: R(0, TAU), sp: R(.1, .3) });
    }

    /* ---- sprites ---- */
    function buildSprites() {
      sprites = []; petalSp = [];
      for (var h = 0; h < 3; h++) {
        var haze = h * .45, row = { bud: [], half: [], open: [], aged: [] };
        for (var v = 0; v < 5; v++) { row.bud.push(makeFlowerSprite(0, 0, haze, R(0, TAU), v)); row.half.push(makeFlowerSprite(.55, 0, haze, R(0, TAU), v)); row.open.push(makeFlowerSprite(1, 0, haze, R(0, TAU), v)); row.aged.push(makeFlowerSprite(1, 1, haze, R(0, TAU), v)); }
        sprites.push(row); petalSp.push(makePetalSprite(haze));
      }
    }

    /* ---- projection ---- */
    function proj(p, sw, out) {
      var x = p[0] + sw[0], y = p[1], z = p[2] + sw[1];
      var cy = Math.cos(yaw), sy = Math.sin(yaw), x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      var cp = Math.cos(pitch), sp = Math.sin(pitch), y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      var s = D / (D + z2);
      out.x = W / 2 + x1 * s * U; out.y = H * .9 - y1 * s * U; out.s = s; out.z = z2; return out;
    }
    function swayAt(p, t, w) {
      var h = clamp(p[1] / 300, 0, 1.2), amp = Math.pow(h, 1.35) * (4.5 + w.g * 5);
      var ph = Math.sin(t * 1.7 + p[1] * .021 + p[0] * .013) * .35 + swayN(t * .6 + p[0] * .01) * .4;
      return [(w.x + ph) * amp, (w.z + ph * .6) * amp * .6];
    }
    var A = { x: 0, y: 0, s: 1, z: 0 }, B = { x: 0, y: 0, s: 1, z: 0 };

    /* ---- petals (3D flutter/tumble) ---- */
    function spawnPetal(t) {
      if (!flowers.length) return;
      var f = flowers[Math.floor(Math.random() * flowers.length)]; if (f.bud) return;
      petals.push({ p: [f.p[0], f.p[1], f.p[2]], vy: R(14, 34), amp: R(8, 26), fr: R(1.2, 3.1), ph: R(0, TAU), spin: R(-3, 3), rot: R(0, TAU), flip: R(0, TAU), fs: R(1.5, 4.5), cw: R(.6, 1.5), sz: Math.pow(Math.random(), 1.8) * .7 + .55, life: 0 });
    }
    var nextSpawn = 0;

    /* ---- render ---- */
    function frame(now) {
      raf = 0; if (!running || !visible) return;
      var dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
      var tt = now;
      // adaptive quality from frame time
      var ft = (now - (frame.prev || now)); frame.prev = now;
      if (ft > 24) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 50 && quality > .45) { quality -= .12; slow = 0; }
      var calm = opt.calm && opt.calm();
      // scroll-driven bloom
      var rc = canvas.getBoundingClientRect(), vh = innerHeight;
      var target = calm ? 1 : clamp((vh * .95 - rc.top) / (vh * .9), 0, 1);
      bloomT = Math.max(bloomT, target); bloom += (bloomT - bloom) * (calm ? 1 : Math.min(1, dt * 1.1));
      var w = calm ? { x: 0, z: 0, g: 0 } : wind(tt);
      // camera
      tyaw = ptr ? ptr.x * .55 : 0; tpitch = ptr ? -ptr.y * .08 : 0;
      var idle = calm ? 0 : yawN(tt * .00006) * .32;
      var wantYaw = drag ? dragYaw : tyaw + idle;
      yaw += (wantYaw - yaw) * Math.min(1, dt * 3); pitch += ((.05 + tpitch) - pitch) * Math.min(1, dt * 3);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);

      // backdrop glow + light shafts
      var gl = ctx.createRadialGradient(W * .35, H * .22, 0, W * .35, H * .22, W * .7);
      gl.addColorStop(0, 'rgba(255,236,226,.55)'); gl.addColorStop(1, 'rgba(255,236,226,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      if (!calm) lights.forEach(function (L) { var a = L.a * (.6 + .4 * Math.sin(tt * .001 * L.sp + L.ph)); var x = L.x * W + Math.sin(tt * .00011 + L.ph) * 18; var g = ctx.createLinearGradient(x, 0, x + W * .25, H); g.addColorStop(0, 'rgba(255,230,214,' + a + ')'); g.addColorStop(1, 'rgba(255,230,214,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W * L.w, 0); ctx.lineTo(x + W * (L.w + .25), H); ctx.lineTo(x + W * .25, H); ctx.fill(); });

      // ground shadow
      proj([0, 0, 0], [0, 0], A);
      var sg = ctx.createRadialGradient(A.x, A.y, 0, A.x, A.y, 260 * U * A.s);
      sg.addColorStop(0, 'rgba(96,60,78,.22)'); sg.addColorStop(1, 'rgba(96,60,78,0)');
      ctx.save(); ctx.translate(A.x, A.y); ctx.scale(1, .22); ctx.translate(-A.x, -A.y); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(A.x, A.y, 260 * U * A.s, 0, TAU); ctx.fill(); ctx.restore();

      // pile of fallen petals (flat on ground)
      var pp = { x: 0, y: 0, s: 1, z: 0 };
      for (var i = 0; i < pile.length; i++) {
        var q = pile[i]; q.a -= dt * (calm ? 0 : .02); if (q.a <= 0) { pile.splice(i--, 1); continue; }
        proj(q.p, [0, 0], pp); ctx.globalAlpha = clamp(q.a) * .85; ctx.save(); ctx.translate(pp.x, pp.y); ctx.rotate(q.r); ctx.scale(1, .32);
        var ps = 9 * pp.s * U * q.sz; ctx.drawImage(petalSp[1], -ps / 2, -ps * .8, ps, ps); ctx.restore();
      }
      ctx.globalAlpha = 1;

      // draw list: segs + flowers, far to near
      var items = [], drawSeg = [], i2;
      var gAll = bloom * 1.7; frameId++;
      for (i2 = 0; i2 < segs.length; i2++) {
        var sg2 = segs[i2], g = calm ? 1 : clamp((gAll - sg2.ord * .75) / .35, 0, 1); if (g <= 0) continue;
        var sa = swayAt(sg2.a, tt * .001, w), sb = swayAt(sg2.b, tt * .001, w);
        var ax = sg2.a, bx = sg2.b;
        var bp = [ax[0] + (bx[0] - ax[0]) * g, ax[1] + (bx[1] - ax[1]) * g, ax[2] + (bx[2] - ax[2]) * g];
        var pa = proj(ax, sa, { x: 0, y: 0, s: 1, z: 0 }), pb = proj(bp, [lerp(sa[0], sb[0], g), lerp(sa[1], sb[1], g)], { x: 0, y: 0, s: 1, z: 0 });
        sg2.P = { ax: pa.x, ay: pa.y, bx: pb.x, by: pb.y, s0: pa.s, s1: pb.s, g: g, f: frameId };
        items.push({ z: (pa.z + pb.z) / 2, t: 0, a: pa, b: pb, s: sg2, g: g });
      }
      for (i2 = 0; i2 < flowers.length; i2++) {
        var fl = flowers[i2]; if (i2 % 1 === 0 && quality < .9 && !fl.special && (i2 % 10) / 10 > quality) continue;
        var stage = calm ? 1 : clamp((bloom - .22 - fl.delay * .62) / .2, 0, 1); if (stage <= 0) continue;
        var sw = swayAt(fl.p, tt * .001, w), pf = proj(fl.p, sw, { x: 0, y: 0, s: 1, z: 0 });
        items.push({ z: pf.z, t: 1, p: pf, f: fl, st: stage });
      }
      items.sort(function (a, b) { return b.z - a.z; });
      // map for node screen positions
      var nodePos = new Array(nodes.length);
      for (i2 = 0; i2 < items.length; i2++) {
        var it = items[i2];
        if (it.t === 0) {
          var hz = clamp((it.z + 260) / 520, 0, 1), s = it.s, P = s.P, tw = s.dep >= 3, cmain = tw ? BARK.twig : (s.dep >= 2 ? BARK.mid : BARK.dark), cc = mix(cmain, [210, 170, 184], hz * .38);
          var dx = P.bx - P.ax, dy = P.by - P.ay, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, nxx = -uy, nyy = ux;
          var rEnd = s.r0 + (s.r1 - s.r0) * P.g, w0 = Math.max(.7, s.r0 * P.s0 * U * 1.8), w1 = Math.max(.6, rEnd * P.s1 * U * 1.8);
          ctx.fillStyle = rgb(cc); ctx.beginPath();
          ctx.moveTo(P.ax + nxx * w0 / 2, P.ay + nyy * w0 / 2); ctx.lineTo(P.bx + nxx * w1 / 2, P.by + nyy * w1 / 2); ctx.lineTo(P.bx - nxx * w1 / 2, P.by - nyy * w1 / 2); ctx.lineTo(P.ax - nxx * w0 / 2, P.ay - nyy * w0 / 2); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.arc(P.ax, P.ay, w0 / 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(P.bx, P.by, w1 / 2, 0, TAU); ctx.fill();
          if (w0 > 2.6) { ctx.strokeStyle = rgb(mix(BARK.hi, [230, 200, 212], hz * .4), .26); ctx.lineWidth = Math.max(1, (w0 + w1) * .13); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(P.ax + nxx * w0 * .2, P.ay + nyy * w0 * .2); ctx.lineTo(P.bx + nxx * w1 * .2, P.by + nyy * w1 * .2); ctx.stroke(); }
          var wdt = (w0 + w1) / 2;
          if (wdt > 4.2 && s.dep <= 2) { // horizontal lenticels
            ctx.strokeStyle = 'rgba(28,18,24,.42)'; ctx.lineWidth = Math.max(.8, wdt * .06); ctx.lineCap = 'round';
            var kk = 2 + Math.floor(wdt / 6);
            for (var m = 0; m < kk; m++) { var tp = (m + .5) / kk, lx = lerp(P.ax, P.bx, tp), ly = lerp(P.ay, P.by, tp), wl = lerp(w0, w1, tp), ll = wl * (.16 + .1 * ((m * 7 + s.tick * 13) % 3) / 3), off = (((m * 5 + s.tick * 9) % 3) / 3 - .5) * wl * .5; ctx.beginPath(); ctx.moveTo(lx - nxx * ll + ux * off * .2, ly - nyy * ll + uy * off * .2); ctx.lineTo(lx + nxx * ll + ux * off * .2, ly + nyy * ll + uy * off * .2); ctx.stroke(); }
          }
        } else {
          var f = it.f, p = it.p, hb = clamp((it.z + 260) / 520, 0, 1), hi = hb < .33 ? 0 : hb < .66 ? 1 : 2;
          var set = sprites[hi], arr = f.bud ? set.bud : (it.st < .45 ? set.bud : it.st < .85 ? set.half : (f.aged ? set.aged : set.open));
          var sp = arr[f.vi], size = (f.special ? 42 : 30) * f.sz * p.s * U * (.55 + .45 * it.st) * (f.bud ? .6 : 1);
          var face = .72 + .28 * Math.abs(Math.cos(yaw * .8 + f.ph));
          ctx.globalAlpha = clamp(it.st * 1.6) * (1 - hb * .14);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(f.rot + Math.sin(tt * .0007 + f.ph) * .08 * (calm ? 0 : 1)); ctx.scale(face, f.sq);
          if (f.special) { var hg = ctx.createRadialGradient(0, 0, 0, 0, 0, size * .72); hg.addColorStop(0, 'rgba(255,224,232,.32)'); hg.addColorStop(1, 'rgba(255,224,232,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, size * .72, 0, TAU); ctx.fill(); }
          ctx.drawImage(sp, -size / 2, -size / 2, size, size); ctx.restore();
          if (f.special) { var ni = nodes.indexOf(f); if (ni >= 0) nodePos[ni] = p; }
        }
      }
      ctx.globalAlpha = 1;

      // whisper lights
      var wp = new Array(whisp.length);
      whisp.forEach(function (L, i) {
        var sw2 = swayAt(L.p, tt * .001, w), q = proj(L.p, sw2, { x: 0, y: 0, s: 1, z: 0 }), tw = .55 + .45 * Math.sin(tt * .002 + L.ph) * Math.sin(tt * .0013 + L.ph * 2);
        var r = 16 * q.s * U; var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); g.addColorStop(0, 'rgba(255,226,170,' + (.9 * tw * clamp(bloom * 2 - .8)) + ')'); g.addColorStop(1, 'rgba(255,200,130,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill(); wp[i] = q;
      });

      // falling petals
      if (!calm && bloom > .6) {
        if (tt > nextSpawn && petals.length < 70 * quality) { spawnPetal(tt); nextSpawn = tt + (-Math.log(Math.random() + .01)) * (260 / (.5 + w.g)) ; }
        for (var pi = 0; pi < petals.length; pi++) {
          var pt = petals[pi]; pt.life += dt;
          pt.p[1] -= pt.vy * dt; pt.p[0] += (w.x * 26 * pt.cw + Math.sin(pt.life * pt.fr + pt.ph) * pt.amp * .6) * dt; pt.p[2] += (w.z * 14 + Math.cos(pt.life * pt.fr * .8 + pt.ph) * pt.amp * .4) * dt;
          pt.rot += pt.spin * dt; pt.flip += pt.fs * dt;
          if (pt.p[1] <= 0) { pt.p[1] = 0; if (pile.length < 140) pile.push({ p: [pt.p[0], 0, pt.p[2]], r: R(0, TAU), a: 1, sz: pt.sz }); petals.splice(pi--, 1); continue; }
          var pr2 = proj(pt.p, [0, 0], { x: 0, y: 0, s: 1, z: 0 }), hb2 = clamp((pr2.z + 260) / 520, 0, 1), sps = petalSp[hb2 < .33 ? 0 : hb2 < .66 ? 1 : 2], sz = 15 * pt.sz * pr2.s * U;
          ctx.save(); ctx.translate(pr2.x, pr2.y); ctx.rotate(pt.rot); ctx.scale(Math.abs(Math.cos(pt.flip)) * .8 + .2, 1); ctx.globalAlpha = .95 - hb2 * .15; ctx.drawImage(sps, -sz / 2, -sz * .8, sz, sz); ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      // foreground blades (depth in front)
      var bs = { x: 0, y: 0, s: 1, z: 0 };
      blades.forEach(function (b) {
        proj([b.x, 0, b.z], [0, 0], bs); var sway = (calm ? 0 : (w.x * 6 + Math.sin(tt * .0015 + b.ph) * 3)) * bs.s;
        var hh = b.h * bs.s * U; ctx.strokeStyle = b.c < .5 ? 'rgba(255,196,214,.28)' : 'rgba(216,150,176,.24)'; ctx.lineWidth = 2.2 * bs.s * U; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bs.x, bs.y); ctx.quadraticCurveTo(bs.x + b.bend * bs.s + sway * .5, bs.y - hh * .55, bs.x + b.bend * 1.4 * bs.s + sway, bs.y - hh); ctx.stroke();
      });

      // report node positions (% of canvas)
      if (opt.onNodes) {
        var out = nodePos.map(function (p) { return p ? [p.x / W * 100, p.y / H * 100] : null; });
        var out2 = wp.map(function (p) { return p ? [p.x / W * 100, p.y / H * 100] : null; });
        opt.onNodes(out, out2);
      }
      if (calm) { running = false; return; }
      raf = requestAnimationFrame(frame);
    }

    function kick() { if (!running) { running = true; last = performance.now(); } if (!raf && visible) raf = requestAnimationFrame(frame); }
    function resize() {
      var r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      U = Math.min(W / 700, H / 470) * 1.2;
      if (visible) { running = true; kick(); }
    }
    build(); buildSprites();
    var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; if (ro) ro.observe(canvas); resize();
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { running = true; kick(); } }, { rootMargin: '120px' }); io.observe(canvas);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) { running = true; last = performance.now(); frame.prev = 0; kick(); } });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); ptr = { x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 };
      if (drag && e.pointerType !== 'mouse') { dragYaw = drag.yaw + (e.clientX - drag.x) / r.width * 1.6; }
      kick();
    }, { passive: true });
    canvas.addEventListener('pointerleave', function () { ptr = null; kick(); });
    canvas.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; drag = { x: e.clientX, yaw: yaw }; dragYaw = yaw; }, { passive: true });
    addEventListener('pointerup', function () { drag = null; }, { passive: true });
    return { kick: kick, rebuild: function () { petals = []; pile = []; build(); kick(); }, nodeCount: function () { return nodes.length; }, stats: function () { return { flowers: flowers.length, segs: segs.length, quality: quality, petals: petals.length, pile: pile.length, nodes: nodes.length, whisp: whisp.length }; } };
  }

  /* ---------- moon: one lit lunar surface (maria, craters, limb darkening), re-lit for any phase ---------- */
  var moonD = null, moonCache = {}, STEP = .14;
  function moonBase(S) {
    var seedv = Math.random() * 1000, G = 96, grid = new Float32Array(G * G); for (var i = 0; i < grid.length; i++) grid[i] = Math.random();
    function vn(x, y) { x = ((x % G) + G) % G; y = ((y % G) + G) % G; var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), x1 = (xi + 1) % G, y1 = (yi + 1) % G; return lerp(lerp(grid[yi * G + xi], grid[yi * G + x1], u), lerp(grid[y1 * G + xi], grid[y1 * G + x1], u), v); }
    function fbm(x, y) { var a = .5, f = 1, s = 0; for (var o = 0; o < 5; o++) { s += a * vn(x * f + seedv, y * f + seedv * .7); f *= 2.03; a *= .5; } return s; }
    var H = new Float32Array(S * S), craters = [];
    for (var c = 0; c < 56; c++) { var rr = Math.pow(Math.random(), 2.8) * .085 + .01, a2 = Math.random() * TAU, d = Math.sqrt(Math.random()) * .92; craters.push({ x: .5 + Math.cos(a2) * d * .5, y: .5 + Math.sin(a2) * d * .5, r: rr, depth: R(.5, 1) }); }
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) H[y * S + x] = fbm(x / S * 5, y / S * 5) * .35;
    craters.forEach(function (k) {
      var cx = k.x * S, cy = k.y * S, r = k.r * S, x0 = Math.max(0, Math.floor(cx - r * 1.6)), x1 = Math.min(S - 1, Math.ceil(cx + r * 1.6)), y0 = Math.max(0, Math.floor(cy - r * 1.6)), y1 = Math.min(S - 1, Math.ceil(cy + r * 1.6));
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var dd = Math.hypot(x - cx, y - cy) / r; if (dd < 1) H[y * S + x] -= (1 - dd * dd) * .3 * k.depth; var rim = Math.exp(-Math.pow((dd - 1.02) / .16, 2)); H[y * S + x] += rim * .11 * k.depth; }
    });
    var n = S * S, d = { S: S, Nx: new Float32Array(n), Ny: new Float32Array(n), Nz: new Float32Array(n), Al: new Float32Array(n), Lb: new Float32Array(n), Ed: new Float32Array(n) };
    for (var y2 = 0; y2 < S; y2++) for (var x2 = 0; x2 < S; x2++) {
      var o = y2 * S + x2, px = (x2 + .5) / S * 2 - 1, py = (y2 + .5) / S * 2 - 1, r2 = px * px + py * py;
      if (r2 >= 1.02) continue;
      var nz = Math.sqrt(Math.max(0, 1 - r2)), xm = Math.max(1, Math.min(S - 2, x2)), ym = Math.max(1, Math.min(S - 2, y2));
      var gx = (H[ym * S + xm + 1] - H[ym * S + xm - 1]) * 2.0, gy = (H[(ym + 1) * S + xm] - H[(ym - 1) * S + xm]) * 2.0;
      var nx = px - gx, ny = py - gy, nzz = nz + .0001, nl = Math.hypot(nx, ny, nzz);
      d.Nx[o] = nx / nl; d.Ny[o] = ny / nl; d.Nz[o] = nzz / nl;
      var mar = fbm(x2 / S * 2.2 + 9, y2 / S * 2.2 + 3), maria = clamp((mar - .46) * 4.2);
      d.Al[o] = lerp(.98, .62, maria) * (.92 + H[o] * .16); d.Lb[o] = .62 + .38 * Math.pow(nz, .45); d.Ed[o] = clamp((1.02 - Math.sqrt(r2)) * S * .5);
    }
    return d;
  }
  function moonFrame(key) {
    if (moonCache[key]) return moonCache[key];
    if (!moonD) moonD = moonBase(320);
    var d = moonD, S = d.S, phi = key * STEP, L0 = -Math.sin(phi) * .98, L1 = -Math.sin(phi) * .1, L2 = Math.cos(phi), ll = Math.hypot(L0, L1, L2); L0 /= ll; L1 /= ll; L2 /= ll;
    var cv = document.createElement('canvas'); cv.width = cv.height = S; var cx = cv.getContext('2d'), img = cx.createImageData(S, S), earth = .028;
    for (var o = 0; o < S * S; o++) {
      var e = d.Ed[o]; if (e <= 0) continue;
      var lam = d.Nx[o] * L0 + d.Ny[o] * L1 + d.Nz[o] * L2, lit = clamp((lam + .05) / .4); lit = lit * lit * (3 - 2 * lit);
      var shade = .22 + .88 * Math.max(lam, 0), v = d.Al[o] * d.Lb[o] * (earth + (1 - earth) * lit * shade), i = o * 4;
      img.data[i] = clamp(v * 1.02) * 255; img.data[i + 1] = clamp(v * .97) * 255; img.data[i + 2] = clamp(v * 1.04 + (1 - lit) * .02) * 255; img.data[i + 3] = e * 255;
    }
    cx.putImageData(img, 0, 0);
    var keys = Object.keys(moonCache); if (keys.length > 46) moonCache = {};
    moonCache[key] = cv; return cv;
  }
  function moonDraw(canvas, phi) {
    var c = canvas.__c || (canvas.__c = canvas.getContext('2d')); phi = ((phi % TAU) + TAU) % TAU;
    var u = phi / STEP, i0 = Math.floor(u), f = u - i0;
    c.clearRect(0, 0, 320, 320); c.globalAlpha = 1; c.drawImage(moonFrame(i0), 0, 0);
    if (f > .03) { c.globalAlpha = f; c.drawImage(moonFrame(i0 + 1), 0, 0); c.globalAlpha = 1; }
    canvas.__phi = phi;
    var lit = (1 + Math.cos(phi)) / 2, par = canvas.parentElement;
    if (par) par.querySelectorAll('[data-keep]').forEach(function (el) { el.style.visibility = lit > .72 ? 'visible' : 'hidden'; });
  }
  function moon(canvas) { canvas.width = canvas.height = 320; moonDraw(canvas, canvas.__phi || 0); }
  function moonTo(canvas, to, ms) {
    cancelAnimationFrame(canvas.__raf);
    var from = canvas.__phi || 0; if (to < from - 3.2) from -= TAU; // wrap forward through the dark
    if (!ms || reduced()) { moonDraw(canvas, to); return; }
    var t0 = performance.now();
    (function step(t) { var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; moonDraw(canvas, from + (to - from) * e); if (k < 1) canvas.__raf = requestAnimationFrame(step); })(t0);
  }

  /* ---------- painted blossom-tree backdrop, drawn once per size (far / mid / near layers) ---------- */
  function forest(cv, opt) {
    var ctx = cv.getContext('2d'), seedN = opt.layer === 'far' ? 8 : opt.layer === 'mid' ? 5 : 3;
    var night = opt.mode === 'night';
    var P = {
      far: { trunk: night ? [46, 36, 84] : [212, 176, 196], a: night ? .36 : .42, hmin: .2, hmax: .32, d: 4, dot: .8 },
      mid: { trunk: night ? [34, 26, 68] : [190, 148, 172], a: night ? .5 : .55, hmin: .3, hmax: .44, d: 5, dot: 1.1 },
      near: { trunk: night ? [22, 16, 46] : [166, 118, 146], a: night ? .8 : .72, hmin: .44, hmax: .62, d: 5, dot: 1.5 }
    }[opt.layer];
    var cols = night ? [[150, 112, 190], [196, 142, 204], [132, 122, 214], [220, 172, 226]] : [[252, 204, 220], [255, 234, 240], [247, 174, 200], [255, 246, 248]];
    var gauss = function () { return (Math.random() + Math.random() + Math.random() - 1.5) / .75; };
    function draw() {
      var W = Math.max(2, cv.clientWidth), H = Math.max(2, cv.clientHeight), dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var t = P.trunk, A = P.a * (W < 600 ? .62 : 1), HK = W < 600 ? .7 : 1;
      function cloud(x, y, r) {
        var n = Math.floor(r * r * .055 * P.dot) + 10;
        for (var i = 0; i < n; i++) { var c = cols[Math.floor(Math.random() * cols.length)], a = R(.14, .55) * A, sz = R(1, 3.3) * P.dot; ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(x + gauss() * r * .5, y + gauss() * r * .42, sz, sz * R(.7, 1), R(0, TAU), 0, TAU); ctx.fill(); }
        var g = ctx.createRadialGradient(x, y, 0, x, y, r); var c0 = cols[0]; g.addColorStop(0, 'rgba(' + c0[0] + ',' + c0[1] + ',' + c0[2] + ',' + (.16 * A).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + c0[0] + ',' + c0[1] + ',' + c0[2] + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      function branch(x, y, ang, len, w, dep) {
        var x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len, cx = x + Math.sin(ang + R(-.25, .25)) * len * .5, cy = y - Math.cos(ang + R(-.25, .25)) * len * .5;
        ctx.strokeStyle = 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + A + ')'; ctx.lineWidth = Math.max(.8, w); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
        if (dep >= P.d - 1 || len < 10) { cloud(x2, y2, Math.max(11, len * 1.25)); return; }
        var kids = dep < 2 ? 3 : 2;
        for (var k = 0; k < kids; k++) branch(x2, y2, ang + R(-.85, .85) * (k === 0 ? .5 : 1), len * R(.62, .8), w * .66, dep + 1);
        if (dep >= 2 && Math.random() < .45) cloud(x2, y2, len * .9);
      }
      for (var i = 0; i < seedN; i++) {
        var x = (i + R(.1, .9)) / seedN * W, th = H * R(P.hmin, P.hmax) * HK, tw = Math.max(2.5, th * .035);
        branch(x, H + 4, R(-.12, .12), th * .32, tw, 0);
      }
    }
    draw();
    if (typeof ResizeObserver === 'function') { var last = [cv.clientWidth, cv.clientHeight], ro = new ResizeObserver(function () { var w = cv.clientWidth, h = cv.clientHeight; if (Math.abs(w - last[0]) > 6 || Math.abs(h - last[1]) > 6) { last = [w, h]; draw(); } }); ro.observe(cv); }
  }

  window.ShuFX = { moon: moon, moonTo: moonTo, forest: forest, R: R, clamp: clamp, makeNoise: makeNoise, wind: wind, loopRand: loopRand, depth: depth, tree: tree, coarse: coarse, reduced: reduced };
})();
