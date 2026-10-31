// 遊戲核心：拖曳飛行、自動吹泡泡、救援目標、學習規則、大烏雲、驚喜、幫手
(function () {
  const W = 720, H = 1040;
  const { rand, ri, pick, clamp, dist } = CB.util;
  const A = CB.art;
  const COLORS = { red: '#ff4d4d', orange: '#ff9f1c', yellow: '#ffd60a', green: '#2ec27e', blue: '#3a86ff', purple: '#9b5de5', pink: '#ff70a6' };
  const LETTERS = 'ABCDEFGHIJKL'.split(''), ZHUYIN = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐ'.split('');
  const FUR = ['#ff9f43', '#8fa4e8'];
  const G = CB.game = { W, H, COLORS, mode: 'idle', L: null, paused: false, t: 0, k: 1 };
  let canvas, ctx, last = 0;
  const idle = { bubbles: [], t: 0 };

  G.init = function (c) {
    canvas = c; ctx = c.getContext('2d');
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    requestAnimationFrame(loop);
  };
  G.resize = function (sc) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * sc * dpr); canvas.height = Math.round(H * sc * dpr); G.k = canvas.width / W;
  };
  function pos(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function down(e) {
    CB.audio.init(); const p = pos(e);
    if (G.mode === 'garden') { CB.garden.down(p); return; }
    if (G.mode !== 'level' || !G.L || G.paused) return;
    if (p.x > W - 120 && p.y < 120) { CB.ui.pause(); return; }
    G.L.pointer = p; G.L.dragging = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
  function move(e) { const p = pos(e); if (G.mode === 'garden') { CB.garden.move(p); return; } if (G.L && G.L.dragging) G.L.pointer = p; }
  function up() { if (G.mode === 'garden') { CB.garden.up(); return; } if (G.L) G.L.dragging = false; }

  function loop(ts) {
    requestAnimationFrame(loop);
    let dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (CB.fast) dt *= 2.5;
    G.t += dt;
    ctx.setTransform(G.k, 0, 0, G.k, 0, 0);
    if (G.mode === 'level' && G.L) { const L = G.L; if (!G.paused) update(L, dt); if (G.L === L) draw(L); else drawIdle(dt); }
    else if (G.mode === 'garden') CB.garden.draw(ctx, G.t);
    else if (G.mode === 'finale') drawFinale(dt);
    else drawIdle(dt);
    if (CB.main) CB.main.tick(dt);
  }

  // ---------- 關卡設定 ----------
  G.start = function (sid, idx) {
    const scene = CB.data.levels.scenes.find((s) => s.id === sid), def = scene.levels[idx], S = CB.store.data, tier = S.settings.tier;
    const L = {
      scene, def, sid, idx, tier, t: 0, cat: { x: W / 2, y: H - 170, vx: 0, vy: 0, knock: 0, tilt: 0 }, pointer: null, dragging: false,
      bubbles: [], targets: [], obstacles: [], items: [], parts: [], helpers: [], progress: 0, need: 5, rescued: [],
      blowT: 0.6, spawnT: 0.2, itemT: 2, surpriseT: rand(7, 10), surpriseCount: 0, surprise: null, helperT: rand(8, 11), helperSaid: false,
      weather: pick(['sunny', 'sunny', 'snow', 'rainbow']), power: 0, player: 1, contrib: [0, 0], sinceSwitch: 0, two: !!S.twoPlayer,
      done: false, doneT: 0, ended: false, hintT: 0, sayT: 0, boss: null, collected: { stars: 0, fruits: 0 }, wrong: 0, visitor: null, banner: null, snow: [], catBlow: 0
    };
    L.max = [3, 4, 5][tier - 1]; L.speed = [30, 40, 50][tier - 1];
    setupRule(L);
    if (def.type !== 'boss') for (let i = 0; i < [1, 1, 2][tier - 1]; i++) L.obstacles.push(makeObstacle(i));
    for (let i = 0; i < 45; i++) L.snow.push({ x: rand(0, W), y: rand(0, H), s: rand(3, 7), v: rand(30, 70) });
    G.L = L; G.mode = 'level'; G.paused = false;
    L.missionText = missionText(L); L.banner = { text: L.missionText, t: 3.2 };
    CB.audio.say(L.missionText);
    return L;
  };
  function setupRule(L) {
    const d = L.def, tr = L.tier;
    switch (d.type) {
      case 'rescue':
        L.kinds = d.targets; L.need = (d.needs || [5, 6, 8])[tr - 1];
        if (L.kinds.includes('flower')) { L.slots = [[140, 330], [360, 270], [580, 330], [230, 510], [490, 510], [360, 690], [120, 680], [600, 680]].map(([x, y]) => ({ x, y, used: false })); }
        break;
      case 'color': {
        const pal = [['red', 'yellow', 'blue'], ['red', 'yellow', 'blue', 'green'], ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']][tr - 1];
        L.palette = pal; L.color = pick(pal); L.need = [4, 5, 6][tr - 1]; L.colorKind = d.kind || 'bird'; break;
      }
      case 'number': case 'letter': case 'zhuyin': {
        const src = d.type === 'number' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : d.type === 'letter' ? LETTERS : ZHUYIN;
        if (tr === 1) { L.mode = 'find'; L.pool = src.slice(0, 3); L.k = pick(L.pool); L.need = 4; }
        else if (tr === 2) { L.mode = 'order'; L.pool = src.slice(0, 5); L.seq = src.slice(0, 3); L.need = 3; }
        else { L.mode = 'order'; const s = ri(0, 5); L.seq = src.slice(s, s + 5); L.pool = src.slice(0, 10); L.need = 5; }
        break;
      }
      case 'boss':
        L.need = [15, 20, 25][tr - 1];
        L.boss = { x: W / 2, y: 260, w: d.finale ? 360 : 320, vx: 45, fill: 0, stuck: [], trans: 0, puffT: 4, wob: 0 };
        break;
    }
  }
  G.goodVal = (L) => (L.mode === 'find' ? L.k : L.seq ? L.seq[L.progress] : undefined);
  function isGood(L, t) {
    switch (L.def.type) { case 'rescue': return true; case 'color': return t.color === L.color; default: return t.val === G.goodVal(L); }
  }
  G.isGood = isGood;
  const cName = (c) => CB.t('c_' + c);
  function missionText(L) {
    const d = L.def, T = CB.t;
    switch (d.type) {
      case 'rescue': return CB.L(d.mission).replace('{n}', L.need);
      case 'color': return T('m_color', { c: cName(L.color), k: T('k_' + L.colorKind) });
      case 'boss': return T('m_boss');
      default: return L.mode === 'find' ? T(d.type === 'number' ? 'm_find_number' : 'm_find_letter', { v: L.k }) : T('m_order', { s: L.seq.join('、') });
    }
  }
  function makeObstacle(i) { return { x: i ? W + 100 : -100, by: rand(420, 720), y: 0, vx: (i ? -1 : 1) * rand(35, 55), w: 130, t: rand(0, 6), squish: 0 }; }

  function makeTarget(L, good) {
    const d = L.def;
    const t = { x: rand(90, W - 90), y: -70, r: 44, t: rand(0, 9), sway: rand(15, 45), rescued: false, rt: 0, wob: 0, dir: Math.random() < 0.5 ? -1 : 1 };
    switch (d.type) {
      case 'rescue': {
        const k = pick(L.kinds); t.id = k;
        if (k === 'bird') { t.kind = 'bird'; t.hex = pick(Object.values(COLORS)); }
        else if (k === 'flower') {
          const free = L.slots.filter((s) => !s.used); if (!free.length) return null;
          const s = pick(free); s.used = true; t.slot = s; t.kind = 'flower'; t.hex = pick(Object.values(COLORS)); t.x = s.x; t.y = s.y; t.fixed = true; t.r = 48;
        } else { t.kind = 'animal'; t.e = CB.data.content.animals[k].e; t.food = pick(['🍎', '🥕', '🍓', '🐟', '🌰']); }
        break;
      }
      case 'color': {
        t.kind = L.colorKind; t.id = L.colorKind; t.color = good ? L.color : pick(L.palette.filter((c) => c !== L.color)); t.hex = COLORS[t.color]; break;
      }
      default: {
        t.kind = d.type === 'number' ? 'balloon' : 'letter'; const gv = G.goodVal(L);
        t.val = good ? gv : pick(L.pool.filter((x) => x !== gv)); t.hex = pick(Object.values(COLORS)); t.r = t.kind === 'letter' ? 52 : 46;
      }
    }
    t.bx = t.x; return t;
  }
  function spawn(L) {
    if (L.def.type === 'boss') return;
    const alive = L.targets.filter((t) => !t.rescued);
    if (alive.length >= L.max) return;
    const hasGood = alive.some((t) => isGood(L, t));
    const t = makeTarget(L, !hasGood || Math.random() < 0.45); if (!t) return;
    if (!t.fixed) for (let k = 0; k < 8; k++) { if (L.targets.every((o) => o.fixed || Math.abs(o.bx - t.bx) > 120 || o.y > 260)) break; t.bx = t.x = rand(90, W - 90); }
    L.targets.push(t);
  }

  // ---------- 更新 ----------
  function update(L, dt) { const n = CB.fast ? 3 : 1; for (let i = 0; i < n; i++) step(L, dt / n); }
  function step(L, dt) {
    L.t += dt; const c = L.cat;
    if (c.knock > 0) { c.knock -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.93; c.vy *= 0.93; }
    else if (L.pointer) {
      const tx = clamp(L.pointer.x, 50, W - 50), ty = clamp(L.pointer.y - 90, 290, H - 80), k = Math.min(1, dt * 10);
      c.tilt = clamp((tx - c.x) * 0.004, -0.35, 0.35); c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
    }
    c.x = clamp(c.x, 50, W - 50); c.y = clamp(c.y, 290, H - 80); c.tilt *= 0.95; L.catBlow -= dt;
    if (!L.done) {
      L.blowT -= dt; if (L.blowT <= 0) { blow(L); L.blowT = L.power > 0 ? 0.2 : 0.3; }
      L.power = Math.max(0, L.power - dt);
      L.spawnT -= dt; if (L.spawnT <= 0) { spawn(L); L.spawnT = rand(0.7, 1.4); }
      L.itemT -= dt; if (L.itemT <= 0) { L.items.push(makeItem(rand(70, W - 70), -40, Math.random() < 0.6 ? 'star' : 'fruit')); L.itemT = rand(2.5, 4); }
      L.surpriseT -= dt; if (L.surpriseT <= 0 && !L.surprise && L.surpriseCount < 2) { L.surprise = { x: rand(160, W - 160), y: -60, t: 0 }; L.surpriseT = rand(14, 20); }
      L.helperT -= dt; if (L.helperT <= 0) { spawnHelper(L); L.helperT = rand(12, 16); }
    }
    for (const t of L.targets) {
      t.t += dt; t.wob = Math.max(0, t.wob - dt * 3);
      if (t.rescued) { t.rt += dt; if (t.kind !== 'flower') { t.y -= dt * (90 + t.rt * 90); t.x += t.dir * dt * 50; } continue; }
      if (!t.fixed) { t.y += L.speed * dt; t.x = t.bx + Math.sin(t.t * 1.2) * t.sway; }
      if (!L.done && dist(c.x, c.y - 20, t.x, t.y) < t.r + 38) {
        if (isGood(L, t)) rescue(L, t, 'hug'); else if (t.wob <= 0) { t.wob = 1; wrongHint(L); }
      }
    }
    L.targets = L.targets.filter((t) => {
      if (t.rescued) { if (t.kind === 'flower') { if (t.rt > 2.5) { t.slot.used = false; return false; } return true; } return t.y > -160; }
      return t.y < H + 80;
    });
    for (const b of L.bubbles) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt;
      if (b.type === 'star' && !L.done) {
        let best = null, bd = 1e9;
        for (const t of L.targets) if (!t.rescued && isGood(L, t) && t.y < b.y) { const dd = dist(b.x, b.y, t.x, t.y); if (dd < bd) { bd = dd; best = t; } }
        if (best) b.vx = clamp(b.vx + clamp(best.x - b.x, -1, 1) * 900 * dt, -280, 280);
      }
      if (L.done) continue;
      for (const t of L.targets) {
        if (t.rescued) continue;
        if (dist(b.x, b.y, t.x, t.y) < t.r + b.r) {
          if (isGood(L, t)) rescue(L, t, b.type); else { t.wob = 1; wrongHint(L); CB.audio.soft(); }
          b.dead = true; burst(L, b.x, b.y, 6); break;
        }
      }
      if (b.dead) continue;
      const B = L.boss;
      if (B && !L.done) {
        const dx = (b.x - B.x) / (B.w * 0.55), dy = (b.y - B.y) / (B.w * 0.33);
        if (dx * dx + dy * dy < 1) {
          b.dead = true; B.stuck.push({ dx: b.x - B.x, dy: b.y - B.y, col: b.col, r: b.r * 0.9, type: b.type });
          B.fill++; B.wob = 1; L.progress = Math.min(L.need, B.fill); CB.audio.pop();
          if (B.fill % 5 === 0 && B.fill < L.need) praise(L);
          if (B.fill >= L.need) finish(L);
          continue;
        }
      }
      for (const it of L.items) if (!it.got && dist(b.x, b.y, it.x, it.y) < b.r + 30) { collect(L, it); b.dead = true; break; }
      if (!b.dead && L.surprise && dist(b.x, b.y, L.surprise.x, L.surprise.y) < b.r + 60) { b.dead = true; doSurprise(L); }
    }
    L.bubbles = L.bubbles.filter((b) => !b.dead && b.y > -60 && b.y < H + 60 && b.x > -60 && b.x < W + 60);
    for (const it of L.items) {
      it.t += dt; if (it.got) { it.gt += dt; it.y -= 200 * dt; continue; }
      it.y += 70 * dt; it.x += Math.sin(it.t * 2) * 0.6;
      if (dist(c.x, c.y - 10, it.x, it.y) < 62) collect(L, it);
    }
    L.items = L.items.filter((it) => it.y < H + 50 && !(it.got && it.gt > 0.6));
    for (const o of L.obstacles) {
      o.x += o.vx * dt; o.t += dt; o.y = o.by + Math.sin(o.t * 0.8) * 30; o.squish = Math.max(0, o.squish - dt * 2);
      if (o.x < -140) o.x = W + 130; if (o.x > W + 140) o.x = -130;
      if (c.knock <= 0 && !L.done && dist(c.x, c.y, o.x, o.y) < o.w * 0.42 + 34) bounce(L, o);
    }
    if (L.boss) updateBoss(L, dt);
    if (L.surprise) { const s = L.surprise; s.t += dt; s.y += 50 * dt; s.x += Math.sin(s.t * 1.5) * 0.8; if (dist(c.x, c.y, s.x, s.y) < 95) doSurprise(L); else if (s.y > H + 80) L.surprise = null; }
    if (L.visitor) { const v = L.visitor; v.t += dt; v.x += v.vx * dt; if (v.x > W + 120) L.visitor = null; }
    for (const h of L.helpers) { h.t += dt; h.x += h.vx * dt; h.y = h.by + Math.sin(h.t * 3) * 15; h.shotT -= dt; if (h.shotT <= 0 && !L.done) { h.shotT = 0.6; helperShoot(L, h); } }
    L.helpers = L.helpers.filter((h) => h.x > -120 && h.x < W + 120);
    for (const p of L.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.life -= dt; }
    L.parts = L.parts.filter((p) => p.life > 0);
    for (const f of L.snow) { f.y += f.v * dt; f.x += Math.sin(L.t + f.s) * 0.4; if (f.y > H) { f.y = -10; f.x = rand(0, W); } }
    if (L.banner) { L.banner.t -= dt; if (L.banner.t <= 0) L.banner = null; }
    L.hintT -= dt; L.sayT -= dt;
    if (L.done) {
      L.doneT += dt; if (L.boss) L.boss.trans = Math.min(1, L.boss.trans + dt * 0.6);
      if (Math.random() < dt * 5) firework(L);
      if (L.doneT > (L.boss ? 3.2 : 2.2) && !L.ended) { L.ended = true; end(L); }
    }
  }
  function blow(L) {
    const S = CB.store.data.workshop; const c = L.cat;
    const mk = (x, vx, type, col) => L.bubbles.push({ x, y: c.y - 78, vx, vy: -480, r: type === 'rainbow' ? 26 : type === 'heart' ? 21 : 18, type, col, t: 0 });
    if (L.power > 0) { mk(c.x - 24, -40, 'rainbow', 'rainbow'); mk(c.x + 24, 40, 'rainbow', 'rainbow'); }
    else if (S.type === 'double') { mk(c.x - 20, -30, 'normal', S.color); mk(c.x + 20, 30, 'normal', S.color); }
    else mk(c.x, 0, S.type, S.color);
    L.catBlow = 0.15; if (Math.random() < 0.35) CB.audio.blow();
  }
  function praise(L) { if (L.sayT <= 0) { CB.audio.say(CB.t('praise')); L.sayT = 2.2; } }
  function rescue(L, t, how) {
    t.rescued = true; t.rt = 0; L.progress++; L.rescued.push({ id: t.id, kind: t.kind, e: t.e, hex: t.hex, val: t.val });
    CB.audio.rescue(); hearts(L, t.x, t.y);
    const S = CB.store.data; S.stats.rescued++;
    if (t.id && CB.data.content.animals[t.id]) CB.store.addDex(t.id);
    if (L.def.type !== 'rescue') S.stats.correct++;
    L.lastHow = how;
    if (L.two) {
      L.contrib[L.player - 1]++; L.sinceSwitch++;
      if (L.sinceSwitch >= 2 && L.progress < L.need) { L.sinceSwitch = 0; L.player = 3 - L.player; L.banner = { text: CB.t('turn', { p: L.player }), t: 2, p: true }; CB.audio.say(L.banner.text); L.sayT = 2; }
    }
    if (L.progress >= L.need) { finish(L); return; }
    if (L.mode === 'order') { CB.audio.say(CB.t('hint_next', { v: G.goodVal(L) })); L.sayT = 2; } else praise(L);
  }
  function wrongHint(L) {
    L.wrong++;
    if (L.hintT > 0) return; L.hintT = 3.5;
    const T = CB.t; let s;
    if (L.def.type === 'color') s = T('hint_color', { c: cName(L.color) });
    else if (L.mode === 'find') s = T('hint_find', { v: L.k });
    else if (L.mode === 'order') s = T('hint_next', { v: G.goodVal(L) });
    if (s) { CB.audio.say(s); L.banner = { text: s, t: 1.6 }; }
  }
  function finish(L) {
    if (L.done) return; L.done = true; L.doneT = 0; CB.audio.fanfare();
    const s = L.boss ? CB.t('boss_done') : CB.t('level_done'); L.banner = { text: s, t: 3 }; CB.audio.say(s);
    for (let i = 0; i < 4; i++) firework(L);
  }
  function end(L) {
    L.thumb = G.thumb();
    CB.ui.levelDone(L);
  }
  G.thumb = function () {
    try { const o = document.createElement('canvas'); o.width = 180; o.height = 260; o.getContext('2d').drawImage(canvas, 0, 0, 180, 260); return o.toDataURL('image/jpeg', 0.6); } catch (e) { return null; }
  };
  function bounce(L, o) {
    const c = L.cat, a = Math.atan2(c.y - o.y, c.x - o.x);
    c.vx = Math.cos(a) * 420; c.vy = Math.sin(a) * 420 + 60; c.knock = 0.45; o.squish = 1; CB.audio.boing();
    if (L.sayT <= 0) { CB.audio.say(CB.t('oops')); L.sayT = 2.5; }
    L.parts.push({ x: c.x, y: c.y - 60, vx: 0, vy: -40, life: 1, txt: CB.t('oops') });
  }
  function makeItem(x, y, kind) { return { x, y, kind, e: kind === 'star' ? '⭐' : pick(['🍓', '🍎', '🍌', '🍇', '🍊']), t: rand(0, 5), got: false, gt: 0 }; }
  function collect(L, it) {
    it.got = true; it.gt = 0; const S = CB.store.data;
    if (it.kind === 'star') { S.totalStars++; L.collected.stars++; CB.audio.ding(); } else { S.fruits++; L.collected.fruits++; CB.audio.ding(); }
    burst(L, it.x, it.y, 5, '#ffe066');
  }
  function spawnHelper(L) {
    const S = CB.store.data; const ids = Object.keys(S.dex).filter((k) => !CB.data.content.animals[k].visitor);
    if (!ids.length) return; const id = pick(ids), dir = Math.random() < 0.5 ? 1 : -1;
    L.helpers.push({ id, e: CB.data.content.animals[id].e, x: dir > 0 ? -60 : W + 60, by: rand(330, 430), y: 0, vx: dir * 140, t: 0, shotT: 0.4 });
    if (!L.helperSaid) { L.helperSaid = true; const s = CB.t('helper', { n: CB.animalName(id) }); L.banner = { text: s, t: 2.2 }; CB.audio.say(s); L.sayT = 2; if (CB.store.addSticker('helper')) L.newStickers = (L.newStickers || []).concat('helper'); }
  }
  function helperShoot(L, h) {
    let tx, ty;
    if (L.boss) { tx = L.boss.x; ty = L.boss.y; }
    else { const g = L.targets.filter((t) => !t.rescued && isGood(L, t)); if (!g.length) return; const t = pick(g); tx = t.x; ty = t.y; }
    const a = Math.atan2(ty - h.y, tx - h.x);
    L.bubbles.push({ x: h.x, y: h.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 16, type: 'normal', col: '#ffffff', t: 0 });
  }
  function updateBoss(L, dt) {
    const B = L.boss; B.wob = Math.max(0, B.wob - dt * 3);
    if (!L.done) { B.x += B.vx * dt; if (B.x < 220 || B.x > W - 220) B.vx *= -1; B.x = clamp(B.x, 220, W - 220); }
    B.puffT -= dt;
    if (B.puffT <= 0 && !L.done && L.tier > 1 && L.obstacles.length < 2) { B.puffT = rand(6, 9); const o = makeObstacle(L.obstacles.length); o.x = B.x; o.by = B.y + 220; o.w = 100; L.obstacles.push(o); }
  }
  const SURPRISES = ['stars', 'weather', 'visitor', 'power', 'fruit'];
  function doSurprise(L) {
    const s = L.surprise; if (!s) return; L.surprise = null; L.surpriseCount++;
    const S = CB.store.data; const T = CB.t;
    const newSt = (id) => { if (CB.store.addSticker(id)) L.newStickers = (L.newStickers || []).concat(id); };
    newSt('surprise'); CB.audio.magic();
    for (let i = 0; i < 16; i++) L.parts.push({ x: s.x, y: s.y, vx: rand(-200, 200), vy: rand(-200, 200), life: 1, col: pick(A.RB), star: true });
    let kind = G.forceSurprise || (!(S.dex.bear && S.dex.leopardcat) && Math.random() < 0.4 ? 'visitor' : pick(SURPRISES));
    G.forceSurprise = null; let text;
    if (kind === 'stars') { for (let i = 0; i < 6; i++) L.items.push(makeItem(clamp(s.x + rand(-160, 160), 60, W - 60), s.y + rand(-60, 60), 'star')); text = T('starshower'); }
    else if (kind === 'fruit') { for (let i = 0; i < 6; i++) L.items.push(makeItem(clamp(s.x + rand(-160, 160), 60, W - 60), s.y + rand(-60, 60), 'fruit')); text = T('fruitrain'); }
    else if (kind === 'power') { L.power = 8; text = T('power'); }
    else if (kind === 'weather') {
      L.weather = { sunny: 'snow', snow: 'rainbow', rainbow: 'sunny' }[L.weather]; text = T(L.weather === 'rainbow' ? 'rainbowsky' : L.weather);
      if (L.weather === 'snow') newSt('snow'); if (L.weather === 'rainbow') newSt('rainbowsky');
    } else {
      const unmet = ['bear', 'leopardcat'].filter((v) => !S.dex[v]); const id = unmet.length ? pick(unmet) : pick(['bear', 'leopardcat']);
      CB.store.addDex(id); newSt('visitor_' + id);
      L.visitor = { id, x: -90, y: 600, vx: 130, t: 0 }; text = T('visitor', { n: CB.animalName(id) });
      for (let i = 0; i < 3; i++) L.items.push(makeItem(rand(150, W - 150), rand(200, 400), 'star'));
      L.visitorMet = id;
    }
    L.lastSurprise = kind; L.banner = { text, t: 2.6 }; CB.audio.say(text); L.sayT = 2.5;
  }
  function burst(L, x, y, n, col) { for (let i = 0; i < n; i++) L.parts.push({ x, y, vx: rand(-120, 120), vy: rand(-120, 120), life: 0.5, r: rand(3, 6), col: col || 'rgba(255,255,255,0.9)' }); }
  function hearts(L, x, y) { for (let i = 0; i < 6; i++) L.parts.push({ x, y, vx: rand(-90, 90), vy: rand(-180, -60), life: 1.2, heart: true, col: pick(['#ff6b9d', '#ff8fab', '#ffb3c6']) }); }
  function firework(L) { const x = rand(100, W - 100), y = rand(150, 500), col = pick(A.RB); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; L.parts.push({ x, y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, g: 120, life: 1.1, r: 5, col }); } }

  // ---------- 繪圖 ----------
  function catOpts(L) { const S = CB.store.data; return { t: G.t, tilt: L ? L.cat.tilt : 0, blow: L ? L.catBlow > 0 : false, fur: FUR[L && L.two ? L.player - 1 : 0], hat: S.outfit.hat, scarf: S.outfit.scarf, goggle: S.outfit.goggle }; }
  G.catOpts = catOpts;
  function drawTarget(L, t) {
    const x = t.x + Math.sin(t.t * 40) * t.wob * 8, y = t.y, rescueLevel = L.def.type === 'rescue';
    if (!t.rescued && rescueLevel && t.kind !== 'flower') { ctx.save(); ctx.globalAlpha = 0.55; A.cloud(ctx, x, y + 6, t.r * 2.6, '#9aa0ad'); ctx.restore(); }
    switch (t.kind) {
      case 'bird': A.bird(ctx, x, y, t.r * 0.72, t.hex, t.t, t.dir); break;
      case 'fish': ctx.save(); ctx.globalAlpha = 0.35; A.circ(ctx, x, y, t.r, '#bdeeff'); ctx.restore(); A.fish(ctx, x, y, t.r * 0.72, t.hex, t.t, t.dir); break;
      case 'flower': A.flower(ctx, x, y, t.r, t.hex, t.rescued ? Math.min(1, t.rt * 2) : 0, t.t); break;
      case 'animal':
        A.ell(ctx, x, y + 34, 50, 14, '#7cc96b'); A.emoji(ctx, t.e, x, y, 64);
        if (!t.rescued) { A.circ(ctx, x + 40, y - 40, 22, 'rgba(255,255,255,0.9)'); A.emoji(ctx, t.food, x + 40, y - 40, 26); }
        break;
      case 'balloon': A.balloon(ctx, x, y, t.r, t.hex, t.val); break;
      case 'letter': A.cloud(ctx, x, y, t.r * 2.5, t.rescued ? '#fff7b0' : '#ffffff'); A.text(ctx, String(t.val), x, y + 4, 56, t.hex, 'rgba(0,0,0,0.25)'); break;
    }
    if (t.rescued && t.kind !== 'flower') A.heart(ctx, x + 30, y - 40 - t.rt * 20, 12, '#ff6b9d');
  }
  function drawBoss(L) {
    const B = L.boss, s = 1 + Math.sin(B.wob * 10) * 0.03 * B.wob, tr = B.trans;
    ctx.save(); ctx.translate(B.x, B.y); ctx.scale(s, s);
    if (tr > 0) A.rainbow(ctx, 0, 140, B.w * 0.75, tr, tr);
    const g = Math.round(110 + 145 * tr);
    A.cloud(ctx, 0, 0, B.w, `rgb(${g},${g},${Math.round(g + 15 * (1 - tr))})`, tr > 0.5 ? 'happy' : 'sad');
    for (const st of B.stuck) { A.bubble(ctx, st.dx, st.dy, st.r, st.col, st.type === 'heart' ? 'normal' : st.type, G.t); }
    ctx.restore();
    if (tr === 0) { ctx.save(); ctx.globalAlpha = 0.35; for (let i = 0; i < 6; i++) { ctx.fillStyle = '#7d8aa3'; ctx.fillRect(B.x - 120 + i * 48, B.y + 110 + ((G.t * 120 + i * 37) % 60), 4, 18); } ctx.restore(); }
  }
  function draw(L) {
    A.bg(ctx, L.scene, L.t, L.weather, W, H);
    for (const it of L.items) { ctx.save(); if (it.got) ctx.globalAlpha = Math.max(0, 1 - it.gt / 0.6); A.emoji(ctx, it.e, it.x, it.y, it.kind === 'star' ? 46 : 42); ctx.restore(); }
    for (const t of L.targets) drawTarget(L, t);
    if (L.boss) drawBoss(L);
    for (const o of L.obstacles) { ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1 + o.squish * 0.15, 1 - o.squish * 0.15); A.cloud(ctx, 0, 0, o.w, '#8d93a3', 'sleepy'); ctx.restore(); }
    if (L.surprise) { const s = L.surprise; A.cloud(ctx, s.x, s.y, 140, `hsl(${(G.t * 90) % 360},90%,85%)`, 'happy'); A.emoji(ctx, '🎁', s.x, s.y - 50, 40); for (let i = 0; i < 4; i++) A.star(ctx, s.x + Math.cos(G.t * 2 + i * 1.6) * 80, s.y + Math.sin(G.t * 2 + i * 1.6) * 45, 9, '#fff59d'); }
    if (L.visitor) { const v = L.visitor; if (v.id === 'bear') A.bear(ctx, v.x, v.y, 0.9, v.t); else A.cat(ctx, v.x, v.y, 0.75, { t: v.t, fur: '#b8895a', noGear: true, spots: true, scarf: '#b8895a' }); A.text(ctx, CB.animalName(v.id), v.x, v.y - 105, 28, '#fff', 'rgba(0,0,0,0.5)'); A.emoji(ctx, '👋', v.x + 55, v.y - 55, 34); }
    for (const h of L.helpers) { A.emoji(ctx, h.e, h.x, h.y, 54); }
    for (const b of L.bubbles) A.bubble(ctx, b.x, b.y, b.r, b.col, b.type, b.t);
    A.cat(ctx, L.cat.x, L.cat.y, 1, catOpts(L));
    if (L.power > 0) A.rainbow(ctx, L.cat.x, L.cat.y + 30, 80, 0.5);
    for (const p of L.parts) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 2);
      if (p.txt) A.text(ctx, p.txt, p.x, p.y, 34, '#fff', 'rgba(80,80,120,0.6)');
      else if (p.heart) A.heart(ctx, p.x, p.y, 12, p.col);
      else if (p.star) A.star(ctx, p.x, p.y, 10, p.col);
      else A.circ(ctx, p.x, p.y, p.r, p.col);
      ctx.restore();
    }
    if (L.weather === 'snow') for (const f of L.snow) A.circ(ctx, f.x, f.y, f.s, 'rgba(255,255,255,0.9)');
    hud(L);
    if (L.banner) {
      ctx.save(); ctx.globalAlpha = Math.min(1, L.banner.t * 2);
      ctx.font = '900 40px sans-serif'; const w = Math.min(W - 40, Math.max(300, L.banner.text.length * 42 + 60));
      ctx.fillStyle = L.banner.p ? FUR[L.player - 1] : 'rgba(255,255,255,0.92)'; A.rr(ctx, W / 2 - w / 2, 210, w, 90, 45); ctx.fill();
      A.text(ctx, L.banner.text, W / 2, 256, 40, L.banner.p ? '#fff' : '#ff6f3c', L.banner.p ? 'rgba(0,0,0,0.25)' : null);
      ctx.restore();
    }
  }
  function missionIcon(L, x, y, s) {
    const d = L.def;
    switch (d.type) {
      case 'rescue': A.emoji(ctx, d.icon, x, y, 44 * s); break;
      case 'color': if (L.colorKind === 'fish') A.fish(ctx, x, y, 22 * s, COLORS[L.color], G.t); else A.bird(ctx, x, y, 22 * s, COLORS[L.color], G.t); break;
      case 'number': A.balloon(ctx, x, y - 6, 24 * s, '#ff6b6b', G.goodVal(L)); break;
      case 'boss': A.cloud(ctx, x, y, 60 * s, '#8d93a3', 'sad'); break;
      default: A.cloud(ctx, x, y, 66 * s, '#fff'); A.text(ctx, String(G.goodVal(L)), x, y + 2, 30 * s, '#3a86ff', null);
    }
  }
  function hud(L) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; A.rr(ctx, 16, 16, 200, 80, 40); ctx.fill();
    missionIcon(L, 62, 56, 1);
    A.text(ctx, `${Math.min(L.progress, L.need)}/${L.need}`, 152, 58, 38, '#444', null);
    const f = L.progress / L.need * 5;
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; A.rr(ctx, W / 2 - 160, 22, 320, 68, 34); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const x = W / 2 - 120 + i * 60, fill = clamp(f - i, 0, 1);
      A.star(ctx, x, 56, 25, '#e5e5ee', '#c9c9d6');
      if (fill > 0) { A.star(ctx, x, 56, 25 * (0.5 + fill * 0.5), '#ffcf3f', '#f0a500'); }
    }
    A.circ(ctx, W - 58, 56, 40, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = '#ff8c42'; A.rr(ctx, W - 74, 38, 11, 36, 4); ctx.fill(); A.rr(ctx, W - 53, 38, 11, 36, 4); ctx.fill();
    if (L.mode === 'order') {
      L.seq.forEach((v, i) => {
        const x = 50 + i * 62, y = 128, ok = i < L.progress, cur = i === L.progress;
        A.circ(ctx, x, y, cur ? 27 : 24, ok ? '#2ec27e' : cur ? '#ffcf3f' : 'rgba(255,255,255,0.85)');
        A.text(ctx, ok ? '✓' : String(v), x, y + 2, 28, ok ? '#fff' : '#555', null);
      });
    }
    if (L.two) {
      const y = L.mode === 'order' ? 180 : 128;
      ctx.fillStyle = FUR[L.player - 1]; A.rr(ctx, 22, y - 24, 150, 48, 24); ctx.fill();
      A.text(ctx, '🐱 ' + CB.t('p', { p: L.player }), 97, y + 1, 26, '#fff', null);
    }
  }

  function drawIdle(dt) {
    idle.t += dt;
    const scene = CB.data.levels.scenes[0];
    A.bg(ctx, scene, idle.t, 'rainbow', W, H);
    const cx = W / 2 + Math.sin(idle.t * 0.8) * 120, cy = H - 300 + Math.sin(idle.t * 1.7) * 30;
    if (Math.random() < dt * 4) idle.bubbles.push({ x: cx, y: cy - 78, vx: rand(-40, 40), vy: -200, r: rand(14, 26), t: 0 });
    for (const b of idle.bubbles) { b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; A.bubble(ctx, b.x, b.y, b.r, 'rainbow', 'normal', b.t); }
    idle.bubbles = idle.bubbles.filter((b) => b.y > -40);
    A.cat(ctx, cx, cy, 1.25, Object.assign(catOpts(null), { tilt: Math.cos(idle.t * 0.8) * 0.15, blow: true }));
  }
  const fin = { t: 0, parts: [] };
  G.startFinale = function () { G.mode = 'finale'; fin.t = 0; fin.parts = []; };
  function drawFinale(dt) {
    fin.t += dt;
    const scene = CB.data.levels.scenes[2]; A.bg(ctx, scene, fin.t, 'sunny', W, H);
    const p = Math.min(1, fin.t / 2.5);
    A.rainbow(ctx, W / 2, 620, 330, 1, p);
    A.cloud(ctx, W / 2 - 290, 600, 170, '#fff', 'happy'); A.cloud(ctx, W / 2 + 290, 600, 170, '#fff', 'happy');
    const ids = Object.keys(CB.store.data.dex); const list = ids.length ? ids : ['bird', 'flower', 'rabbit'];
    list.slice(0, 10).forEach((id, i) => { const x = 60 + (i % 10) * 66, y = 900 + Math.sin(fin.t * 5 + i) * 14; A.emoji(ctx, CB.data.content.animals[id].e, x, y, 50); });
    A.cat(ctx, W / 2, 760 + Math.sin(fin.t * 2) * 15, 1.3, Object.assign(catOpts(null), { blow: false }));
    if (Math.random() < dt * 10) fin.parts.push({ x: rand(0, W), y: -10, vy: rand(80, 160), col: pick(A.RB), r: rand(5, 9), s: rand(0, 6) });
    for (const q of fin.parts) { q.y += q.vy * dt; q.s += dt * 4; ctx.save(); ctx.translate(q.x + Math.sin(q.s) * 10, q.y); ctx.rotate(q.s); ctx.fillStyle = q.col; ctx.fillRect(-q.r, -q.r / 2, q.r * 2, q.r); ctx.restore(); }
    fin.parts = fin.parts.filter((q) => q.y < H + 20);
  }

  // 除錯：給自動測試讀狀態
  G.snapshot = function () {
    const L = G.L;
    if (!L || G.mode !== 'level') return { mode: G.mode };
    return {
      mode: G.mode, paused: G.paused, id: L.def.id, type: L.def.type, progress: L.progress, need: L.need, done: L.done, ended: L.ended,
      cat: { x: L.cat.x, y: L.cat.y }, mission: L.missionText, goodVal: G.goodVal(L), color: L.color, weather: L.weather, player: L.player, contrib: L.contrib,
      targets: L.targets.filter((t) => !t.rescued).map((t) => ({ x: t.x, y: t.y, good: isGood(L, t), kind: t.kind, val: t.val, color: t.color })),
      boss: L.boss ? { x: L.boss.x, y: L.boss.y, fill: L.boss.fill, trans: L.boss.trans } : null,
      obstacles: L.obstacles.map((o) => ({ x: o.x, y: o.y })), surprise: L.surprise ? { x: L.surprise.x, y: L.surprise.y } : null, visitor: L.visitor && L.visitor.id, helpers: L.helpers.length
    };
  };
})();
