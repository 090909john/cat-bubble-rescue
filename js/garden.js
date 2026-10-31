// 我的小花園：自己擺放、會慢慢長大
(function () {
  const W = 720, H = 1040, A = CB.art;
  const GD = CB.garden = { drag: null, t: 0 };
  const TOP = 150, BOTTOM = 860; // 可擺放範圍（下方是工具列）
  GD.items = () => CB.data.content.gardenItems;
  GD.unlocked = () => { const dex = CB.store.data.dex; return GD.items().filter((it) => !it.unlock || dex[it.unlock]); };
  GD.add = function (id) {
    const g = CB.store.data.garden; if (g.length >= 40) g.shift();
    const it = { id, x: CB.util.rand(100, W - 100), y: CB.util.rand(TOP + 150, BOTTOM - 60), born: CB.store.data.stats.levels };
    g.push(it); CB.store.save(); CB.audio.click(); return it;
  };
  GD.stage = (it) => { const def = GD.items().find((d) => d.id === it.id); if (!def || !def.plant) return 2; return Math.min(2, CB.store.data.stats.levels - it.born); };
  GD.down = function (p) {
    const g = CB.store.data.garden;
    for (let i = g.length - 1; i >= 0; i--) { const it = g[i]; if (Math.abs(p.x - it.x) < 55 && Math.abs(p.y - it.y) < 55) { GD.drag = { it, dx: it.x - p.x, dy: it.y - p.y }; g.splice(i, 1); g.push(it); return; } }
  };
  GD.move = function (p) { if (!GD.drag) return; GD.drag.it.x = CB.util.clamp(p.x + GD.drag.dx, 40, W - 40); GD.drag.it.y = Math.max(TOP, p.y + GD.drag.dy); };
  GD.up = function () {
    if (!GD.drag) return; const it = GD.drag.it; GD.drag = null;
    if (it.y > BOTTOM) { const g = CB.store.data.garden; g.splice(g.indexOf(it), 1); CB.audio.soft(); }
    else CB.audio.pop();
    CB.store.save();
  };
  GD.draw = function (c, t) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9ad9ff'); g.addColorStop(0.35, '#e6f9ff'); g.addColorStop(0.36, '#9be38a'); g.addColorStop(1, '#6cc95a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    A.circ(c, 620, 90, 46, '#ffe066'); A.cloud(c, 160 + Math.sin(t * 0.3) * 30, 90, 160, 'rgba(255,255,255,0.85)');
    c.fillStyle = '#c99a6b'; for (let x = 0; x < W; x += 48) { A.rr(c, x + 8, 300, 22, 70, 6); c.fill(); } c.fillRect(0, 318, W, 9); c.fillRect(0, 345, W, 9);
    c.fillStyle = '#e8d6a8'; c.beginPath(); c.moveTo(300, 370); c.quadraticCurveTo(200, 650, 360, BOTTOM + 40); c.lineTo(460, BOTTOM + 40); c.quadraticCurveTo(300, 650, 400, 370); c.fill();
    A.ell(c, 560, 640, 90, 40, '#66c6f5'); A.ell(c, 540, 630, 30, 8, 'rgba(255,255,255,0.6)');
    const items = CB.store.data.garden.slice().sort((a, b) => a.y - b.y);
    for (const it of items) {
      const def = GD.items().find((d) => d.id === it.id); if (!def) continue;
      const st = GD.stage(it), bob = Math.sin(t * 2 + it.x) * 3;
      A.ell(c, it.x, it.y + 30, 34, 9, 'rgba(0,0,0,0.12)');
      if (st === 0) A.emoji(c, '🌱', it.x, it.y + 10 + bob, 40);
      else A.emoji(c, def.e, it.x, it.y + bob, st === 1 ? 46 : 66);
      if (st === 2 && def.plant) A.star(c, it.x + 30, it.y - 30, 7 + Math.sin(t * 4 + it.x) * 2, '#fff59d');
      if (GD.drag && GD.drag.it === it) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(it.x, it.y, 48, 0, Math.PI * 2); c.stroke(); }
    }
    A.cat(c, 110, 760 + Math.sin(t * 2) * 8, 0.8, Object.assign(CB.game.catOpts(null), { t }));
  };
})();
