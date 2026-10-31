// 程式繪圖：貓咪、小鳥、花、雲、氣球、泡泡、背景（無外部圖檔）
(function () {
  const TAU = Math.PI * 2;
  const A = CB.art = {};
  const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  function circ(c, x, y, r, f) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = f; c.fill(); }
  function ell(c, x, y, rx, ry, f, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fillStyle = f; c.fill(); }
  A.circ = circ; A.ell = ell;
  A.rr = function (c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  A.emoji = function (c, e, x, y, size) { c.font = `${size}px ${EMOJI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(e, x, y); };
  A.text = function (c, s, x, y, size, color = '#fff', stroke = 'rgba(0,0,0,0.35)', weight = '900') {
    c.font = `${weight} ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (stroke) { c.lineWidth = size / 5; c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
    c.fillStyle = color; c.fillText(s, x, y);
  };
  A.shade = function (hex, amt) {
    if (!hex || hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1, 7), 16); const f = (v) => Math.max(0, Math.min(255, v + amt));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };

  A.cat = function (c, x, y, s, o) {
    const t = o.t || 0; const fur = o.fur || '#ff9f43'; const dark = A.shade(fur, -55);
    c.save(); c.translate(x, y); c.rotate(o.tilt || 0); c.scale(s, s);
    if (!o.noGear) {
      for (const sx of [-28, 28]) {
        const fl = 14 + Math.sin(t * 30 + sx) * 5;
        c.beginPath(); c.moveTo(sx - 9, 50); c.quadraticCurveTo(sx, 50 + fl * 2.4, sx + 9, 50); c.fillStyle = '#ffb300'; c.fill();
        c.beginPath(); c.moveTo(sx - 5, 50); c.quadraticCurveTo(sx, 50 + fl * 1.4, sx + 5, 50); c.fillStyle = '#fff59d'; c.fill();
      }
      c.fillStyle = '#b0bec5'; A.rr(c, -41, -6, 26, 58, 11); c.fill(); A.rr(c, 15, -6, 26, 58, 11); c.fill();
      c.fillStyle = '#ef5350'; A.rr(c, -41, 2, 26, 10, 4); c.fill(); A.rr(c, 15, 2, 26, 10, 4); c.fill();
    }
    c.strokeStyle = fur; c.lineWidth = 11; c.lineCap = 'round';
    c.beginPath(); c.moveTo(16, 42); c.quadraticCurveTo(56, 42 + Math.sin(t * 4) * 8, 46, 6); c.stroke();
    ell(c, 0, 24, 30, 30, fur); ell(c, 0, 31, 18, 20, '#fff3e0');
    ell(c, -15, 53, 11, 7, fur); ell(c, 15, 53, 11, 7, fur);
    if (o.spots) { [[-12, 12], [14, 20], [-6, 36], [10, 40]].forEach(([a, b]) => circ(c, a, b, 4, dark)); }
    c.fillStyle = o.scarf || '#ff5a5a'; A.rr(c, -27, -5, 54, 13, 6); c.fill(); if (!o.noGear) { A.rr(c, 9, 1, 13, 26, 5); c.fill(); }
    for (const m of [-1, 1]) {
      c.beginPath(); c.moveTo(m * 34, -42); c.lineTo(m * 28, -78); c.lineTo(m * 6, -62); c.closePath(); c.fillStyle = fur; c.fill();
      c.beginPath(); c.moveTo(m * 28, -48); c.lineTo(m * 26, -70); c.lineTo(m * 13, -60); c.closePath(); c.fillStyle = '#ffb3c1'; c.fill();
    }
    ell(c, 0, -32, 41, 35, fur);
    c.strokeStyle = dark; c.lineWidth = 4;
    [[-11, -66, -9, -56], [0, -68, 0, -57], [11, -66, 9, -56]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
    ell(c, 0, -19, 19, 12, '#fff3e0');
    circ(c, -15, -34, 6.5, '#2d2d2d'); circ(c, 15, -34, 6.5, '#2d2d2d'); circ(c, -13, -36.5, 2.4, '#fff'); circ(c, 17, -36.5, 2.4, '#fff');
    circ(c, -27, -21, 6, 'rgba(255,120,140,0.5)'); circ(c, 27, -21, 6, 'rgba(255,120,140,0.5)');
    c.beginPath(); c.moveTo(-4.5, -26); c.lineTo(4.5, -26); c.lineTo(0, -21); c.closePath(); c.fillStyle = '#ff6f91'; c.fill();
    if (o.blow) { circ(c, 0, -13, 5.5, '#c2185b'); }
    else { c.strokeStyle = '#5d4037'; c.lineWidth = 2.2; c.beginPath(); c.arc(-4, -19, 4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); c.beginPath(); c.arc(4, -19, 4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    c.strokeStyle = 'rgba(90,60,40,0.6)'; c.lineWidth = 1.6;
    [[-14, -20, -38, -24], [-14, -16, -38, -13], [14, -20, 38, -24], [14, -16, 38, -13]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
    if (!o.noGear) {
      c.fillStyle = '#5d4037'; A.rr(c, -41, -59, 82, 9, 4); c.fill();
      for (const sx of [-15, 15]) { circ(c, sx, -55, 12.5, '#78909c'); circ(c, sx, -55, 9.5, o.goggle || '#4fc3f7'); circ(c, sx - 3.5, -58, 3, 'rgba(255,255,255,0.85)'); }
    }
    if (o.hat && o.hat !== 'none') A.emoji(c, o.hat, 0, -84, 42);
    c.restore();
  };

  A.bear = function (c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 4) * 0.08);
    const k = '#1f1f24';
    ell(c, 0, 30, 34, 34, k); circ(c, -30, -58, 13, k); circ(c, 30, -58, 13, k); circ(c, -30, -58, 6, '#555');
    circ(c, 30, -58, 6, '#555'); ell(c, 0, -30, 40, 36, k);
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-20, 8); c.lineTo(0, 26); c.lineTo(20, 8); c.stroke();
    ell(c, 0, -18, 17, 13, '#c9a27e'); circ(c, 0, -24, 5, '#111');
    circ(c, -15, -38, 5, '#fff'); circ(c, 15, -38, 5, '#fff'); circ(c, -15, -38, 3, '#111'); circ(c, 15, -38, 3, '#111');
    c.strokeStyle = k; c.lineWidth = 12; c.beginPath(); c.moveTo(30, 20); c.lineTo(48, -6 + Math.sin(t * 8) * 10); c.stroke();
    c.restore();
  };

  A.bird = function (c, x, y, r, col, t, dir = 1) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const flap = Math.sin(t * 12) * 0.6, dk = A.shade(col, -40);
    c.beginPath(); c.moveTo(-r * 0.75, 0); c.lineTo(-r * 1.45, -r * 0.45); c.lineTo(-r * 1.35, r * 0.35); c.closePath(); c.fillStyle = dk; c.fill();
    circ(c, 0, 0, r, col); ell(c, r * 0.15, r * 0.38, r * 0.55, r * 0.42, 'rgba(255,255,255,0.6)');
    c.save(); c.translate(-r * 0.15, -r * 0.05); c.rotate(-flap); ell(c, -r * 0.25, -r * 0.1, r * 0.6, r * 0.32, dk); c.restore();
    circ(c, r * 0.42, -r * 0.25, r * 0.17, '#222'); circ(c, r * 0.47, -r * 0.31, r * 0.06, '#fff');
    c.beginPath(); c.moveTo(r * 0.85, -r * 0.12); c.lineTo(r * 1.3, r * 0.05); c.lineTo(r * 0.85, r * 0.2); c.closePath(); c.fillStyle = '#ff9800'; c.fill();
    c.restore();
  };

  A.fish = function (c, x, y, r, col, t, dir = 1) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const w = Math.sin(t * 8) * 0.25, dk = A.shade(col, -40);
    c.save(); c.translate(-r * 0.8, 0); c.rotate(w); c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 0.7, -r * 0.55); c.lineTo(-r * 0.7, r * 0.55); c.closePath(); c.fillStyle = dk; c.fill(); c.restore();
    ell(c, 0, 0, r, r * 0.7, col); ell(c, 0, -r * 0.62, r * 0.4, r * 0.2, dk);
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(-r * 0.1, 0, r * 0.45, -1, 1); c.stroke();
    circ(c, r * 0.5, -r * 0.15, r * 0.16, '#fff'); circ(c, r * 0.53, -r * 0.15, r * 0.09, '#222');
    c.restore();
  };

  A.flower = function (c, x, y, r, col, bloom, t) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#e07a3f'; c.beginPath(); c.moveTo(-r * 0.55, r * 0.95); c.lineTo(r * 0.55, r * 0.95); c.lineTo(r * 0.42, r * 1.55); c.lineTo(-r * 0.42, r * 1.55); c.closePath(); c.fill();
    c.fillStyle = '#c2582a'; A.rr(c, -r * 0.65, r * 0.85, r * 1.3, r * 0.22, 5); c.fill();
    const hx = (1 - bloom) * r * 0.45 + Math.sin(t * 2) * 3, hy = -r * 0.15 + (1 - bloom) * r * 0.45;
    c.strokeStyle = '#43a047'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, r * 0.9); c.quadraticCurveTo(0, r * 0.3, hx, hy); c.stroke();
    ell(c, -r * 0.25, r * 0.5, r * 0.25, r * 0.1, '#66bb6a', -0.5); ell(c, r * 0.25, r * 0.45, r * 0.25, r * 0.1, '#66bb6a', 0.5);
    if (bloom < 0.05) {
      ell(c, hx, hy, r * 0.22, r * 0.32, '#9e9d7a', 0.6);
      c.strokeStyle = '#6d6d55'; c.lineWidth = 2; c.beginPath(); c.arc(hx - 4, hy, 3, 0.2, 2.9); c.stroke(); c.beginPath(); c.arc(hx + 6, hy - 2, 3, 0.2, 2.9); c.stroke();
    } else {
      const pr = r * 0.42 * bloom;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.3; ell(c, hx + Math.cos(a) * pr, hy + Math.sin(a) * pr, pr * 0.75, pr * 0.5, col, a); }
      circ(c, hx, hy, r * 0.24 * bloom + 3, '#ffd54f');
      circ(c, hx - 4, hy - 2, 2.5, '#5d4037'); circ(c, hx + 4, hy - 2, 2.5, '#5d4037');
      c.strokeStyle = '#5d4037'; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy + 1, 4, 0.3, 2.8); c.stroke();
    }
    c.restore();
  };

  A.cloud = function (c, x, y, w, col, face, t = 0) {
    c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath();
    [[-0.3, 0.05, 0.27], [0, -0.13, 0.32], [0.3, 0.03, 0.26], [-0.13, 0.15, 0.25], [0.15, 0.15, 0.25]].forEach(([a, b, rr]) => { c.moveTo(a * w + rr * w, b * w); c.arc(a * w, b * w, rr * w, 0, TAU); });
    c.fill();
    if (face) {
      const ey = -0.02 * w;
      circ(c, -0.12 * w, ey, 0.035 * w, '#333'); circ(c, 0.12 * w, ey, 0.035 * w, '#333');
      c.strokeStyle = '#333'; c.lineWidth = Math.max(2, w * 0.018); c.lineCap = 'round'; c.beginPath();
      if (face === 'happy') { c.arc(0, 0.06 * w, 0.08 * w, 0.15 * Math.PI, 0.85 * Math.PI); circ(c, -0.2 * w, 0.06 * w, 0.04 * w, 'rgba(255,120,150,0.5)'); circ(c, 0.2 * w, 0.06 * w, 0.04 * w, 'rgba(255,120,150,0.5)'); }
      else if (face === 'sad') c.arc(0, 0.14 * w, 0.07 * w, 1.15 * Math.PI, 1.85 * Math.PI);
      else c.arc(0, 0.08 * w, 0.05 * w, 0, TAU);
      c.stroke();
    }
    c.restore();
  };

  A.balloon = function (c, x, y, r, col, label) {
    c.strokeStyle = '#777'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + r);
    c.quadraticCurveTo(x - 10, y + r * 1.5, x, y + r * 2); c.stroke();
    ell(c, x, y, r * 0.86, r, col);
    c.beginPath(); c.moveTo(x - 6, y + r + 6); c.lineTo(x + 6, y + r + 6); c.lineTo(x, y + r - 2); c.closePath(); c.fillStyle = col; c.fill();
    ell(c, x - r * 0.35, y - r * 0.4, r * 0.15, r * 0.25, 'rgba(255,255,255,0.6)', -0.4);
    if (label !== undefined) A.text(c, String(label), x, y + 2, r * 1.05, '#fff', 'rgba(0,0,0,0.3)');
  };

  A.heart = function (c, x, y, r, col) {
    c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, r * 0.35);
    c.bezierCurveTo(-r * 1.2, -r * 0.4, -r * 0.5, -r * 1.2, 0, -r * 0.45);
    c.bezierCurveTo(r * 0.5, -r * 1.2, r * 1.2, -r * 0.4, 0, r * 0.35 + r * 0.55);
    c.closePath(); c.fillStyle = col; c.fill(); c.restore();
  };

  A.star = function (c, x, y, r, col, stroke) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); }
  };

  const RB = ['#ff5252', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#5c6bc0', '#ab47bc'];
  A.RB = RB;
  A.bubble = function (c, x, y, r, col, type, t) {
    const base = col === 'rainbow' ? `hsl(${(t * 220 + x) % 360},90%,65%)` : col;
    c.save();
    if (type === 'heart') {
      c.globalAlpha = 0.55; A.heart(c, x, y, r * 1.1, base); c.globalAlpha = 1;
      c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
    } else {
      c.globalAlpha = 0.3; circ(c, x, y, r, base); c.globalAlpha = 0.95;
      if (type === 'rainbow') { RB.forEach((cc, i) => { c.beginPath(); c.strokeStyle = cc; c.lineWidth = 3.5; c.arc(x, y, r - 1, i / 7 * TAU + t * 3, (i + 1) / 7 * TAU + t * 3); c.stroke(); }); }
      else { c.beginPath(); c.arc(x, y, r, 0, TAU); c.strokeStyle = base; c.lineWidth = 3; c.stroke(); }
      if (type === 'star') { c.globalAlpha = 0.9; A.star(c, x, y, r * 0.55, '#fff59d'); }
    }
    c.globalAlpha = 0.9; ell(c, x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.16, '#fff', -0.6);
    c.restore();
  };

  A.rainbow = function (c, x, y, r, alpha, prog = 1) {
    c.save(); c.globalAlpha = alpha; c.lineWidth = r * 0.075; c.lineCap = 'round';
    RB.forEach((col, i) => { c.beginPath(); c.strokeStyle = col; c.arc(x, y, r - i * r * 0.075, Math.PI, Math.PI + Math.PI * prog); c.stroke(); });
    c.restore();
  };

  A.bg = function (c, scene, t, weather, W, H) {
    const id = scene.id; const g = c.createLinearGradient(0, 0, 0, H);
    let top = scene.sky[0], bot = scene.sky[1];
    if (weather === 'snow') { top = '#a9c4dc'; bot = '#eef4fb'; }
    g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (weather !== 'snow') {
      const sx = W - 110, sy = 150;
      c.save(); c.translate(sx, sy); c.rotate(t * 0.2); c.fillStyle = 'rgba(255,230,120,0.5)';
      for (let i = 0; i < 10; i++) { c.rotate(TAU / 10); c.beginPath(); c.moveTo(-8, 60); c.lineTo(0, 92); c.lineTo(8, 60); c.fill(); }
      c.restore(); circ(c, sx, sy, 52, '#ffe066'); circ(c, sx - 16, sy - 6, 5, '#7a5c00'); circ(c, sx + 16, sy - 6, 5, '#7a5c00');
      c.strokeStyle = '#7a5c00'; c.lineWidth = 3; c.beginPath(); c.arc(sx, sy + 6, 14, 0.2, Math.PI - 0.2); c.stroke();
    }
    if (weather === 'rainbow') A.rainbow(c, W / 2, H * 0.62, W * 0.48, 0.55);
    for (let i = 0; i < 6; i++) {
      const y = ((i * 230 + t * (id === 'sky' ? 55 : 22)) % (H + 240)) - 120, x = (i * 197 + 60) % W;
      A.cloud(c, x, y, 120 + (i % 3) * 30, 'rgba(255,255,255,0.75)');
    }
    if (id === 'garden') {
      ell(c, 150, H + 40, 380, 200, '#7cd36b'); ell(c, 600, H + 70, 360, 210, '#69c25a');
      c.fillStyle = '#c99a6b'; for (let x = 0; x < W; x += 48) { A.rr(c, x + 8, H - 160, 22, 70, 6); c.fill(); }
      c.fillRect(0, H - 140, W, 10); c.fillRect(0, H - 110, W, 10);
      ell(c, W / 2, H + 10, 520, 110, '#8fe07a');
      for (let i = 0; i < 9; i++) { const fx = 40 + i * 80, fy = H - 50 + (i % 2) * 18; circ(c, fx, fy, 9, A.RB[i % 7]); circ(c, fx, fy, 4, '#fff59d'); }
    } else if (id === 'sky') {
      for (let i = 0; i < 3; i++) {
        const y = ((i * 400 + t * 35) % (H + 400)) - 200, x = [140, 560, 330][i];
        ell(c, x, y + 30, 90, 26, '#9b7653'); ell(c, x, y + 20, 95, 24, '#7cd36b');
        c.fillStyle = A.RB[(i * 2) % 7]; c.fillRect(x - 30, y - 24, 40, 40); c.beginPath(); c.moveTo(x - 38, y - 24); c.lineTo(x - 10, y - 50); c.lineTo(x + 18, y - 24); c.fill();
      }
      A.cloud(c, W / 2, H + 20, 900, 'rgba(255,255,255,0.95)');
    } else {
      const sea = H * 0.74; c.fillStyle = '#4fc3f7'; c.fillRect(0, sea, W, H - sea);
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for (let x = -40; x < W + 40; x += 60) { c.beginPath(); c.arc(x + (t * 20) % 60, sea + 4, 16, Math.PI, 0); c.fill(); }
      ell(c, W / 2, H + 30, 560, 150, '#ffe0a3');
      A.emoji(c, '🌴', 70, H - 170, 110); A.emoji(c, '🐚', 600, H - 50, 40); A.emoji(c, '⭐', 470, H - 40, 30);
    }
  };

  A.town = function (c, w, h, prog, t) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8fd8ff'); g.addColorStop(1, '#e9fbff');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (prog >= 1) A.rainbow(c, w / 2, h * 1.05, w * 0.42, 0.85);
    ell(c, w * 0.3, h + 20, w * 0.45, h * 0.45, '#7cd36b'); ell(c, w * 0.75, h + 30, w * 0.45, h * 0.5, '#69c25a');
    const cols = ['#ff7b7b', '#ffb86b', '#ffe066', '#7bd389', '#6fb7ff', '#b38bff'];
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * (w - 80) / 5, bh = 46 + (i % 3) * 14, y = h - 30 - bh;
      c.fillStyle = cols[i]; c.fillRect(x - 26, y, 52, bh);
      c.fillStyle = A.shade(cols[i], -60); c.beginPath(); c.moveTo(x - 34, y); c.lineTo(x, y - 30); c.lineTo(x + 34, y); c.fill();
      c.fillStyle = '#fff8dc'; c.fillRect(x - 12, y + 12, 12, 12); c.fillStyle = '#8d6e63'; c.fillRect(x + 4, y + bh - 22, 12, 22);
    }
    if (prog < 1) A.cloud(c, w * 0.5, 40, 220 * (1 - prog) + 40, 'rgba(110,115,130,0.85)', 'sad');
    else A.cloud(c, w * 0.5, 40, 120, '#fff', 'happy');
  };
})();
