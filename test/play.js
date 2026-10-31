// 自動試玩：puppeteer-core 驅動真正的拖曳操作
const puppeteer = require('/workspace/lt-tools/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8931/';
const OUT = __dirname + '/../screenshots/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('•', ...a);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.setViewport({ width: 820, height: 1180, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('requestfailed', (r) => errs.push('reqfail ' + r.url()));
  await p.goto(BASE + '?fast=1', { waitUntil: 'networkidle0' });
  await p.waitForFunction('window.__ready');
  await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle0' }); await p.waitForFunction('window.__ready');
  await sleep(600); await p.screenshot({ path: OUT + '01-title.png' });
  const snap = () => p.evaluate(() => CBDebug.snap());
  const click = async (sel) => { await p.waitForSelector(sel, { visible: true }); await p.click(sel); await sleep(150); };
  const box = await p.evaluate(() => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 720 }; });
  const toPx = (x, y) => [box.x + x * box.s, box.y + y * box.s];

  // 開場 → 故事 → 工坊 → 地圖
  await click('#btn-start');
  for (let i = 0; i < 4; i++) { if (i === 1) await p.screenshot({ path: OUT + '02-story.png' }); await click('#btn-story-next'); }
  await sleep(300); await p.screenshot({ path: OUT + '03-workshop.png' });
  await click('[data-act="btype"][data-v="rainbow"]');
  await click('[data-act="bcolor"][data-v="#ff8fc8"]');
  await click('#btn-ws-done');
  await sleep(200); await p.screenshot({ path: OUT + '04-map.png' });

  async function longPressGear() {
    const g = await p.$('.gear'); const bb = await g.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await sleep(1000);
    const early = await p.evaluate(() => CB.ui.modal); await sleep(2300); await p.mouse.up(); await sleep(200);
    return { early, after: await p.evaluate(() => CB.ui.modal) };
  }

  const stats = {};
  async function playLevel(sid, idx, opts = {}) {
    await p.evaluate(() => CB.ui.map());
    const sel = `.node[data-s="${sid}"][data-i="${idx}"]`; await click(sel);
    let s = await snap(); const id = s.id; const t0 = Date.now(); let shot = false, wrongTried = false, mouseDown = false, maxP = 0;
    log('start', id, s.type, JSON.stringify(s.mission));
    while (Date.now() - t0 < 150000) {
      s = await snap();
      if (s.modal === 'remind') { await click('[data-act="remindOk"]'); continue; }
      if (s.modal === 'quiz') {
        if (mouseDown) { await p.mouse.up(); mouseDown = false; }
        await sleep(200); if (opts.shotQuiz) await p.screenshot({ path: OUT + opts.shotQuiz });
        const n = await p.$eval('.qopt', (e) => e.dataset.n);
        if (!wrongTried) { wrongTried = true; const w = await p.$(`.qopt:not([data-v="${n}"])`); await w.click(); await sleep(200); }
        await click(`.qopt[data-v="${n}"]`); await sleep(800); continue;
      }
      if (s.screen === 'finale') { if (mouseDown) { await p.mouse.up(); mouseDown = false; } await sleep(1800); await p.screenshot({ path: OUT + '08-finale-rainbow.png' }); await click('#btn-finale'); continue; }
      if (s.screen === 'complete') break;
      if (s.mode !== 'level') { await sleep(100); continue; }
      maxP = Math.max(maxP, s.progress);
      if (opts.hook) await opts.hook(s);
      if (!shot && opts.shot) {
        const vis = s.boss ? (s.progress >= 4 ? 9 : 0) : s.targets.filter((t) => t.y > 180 && t.y < 760).length;
        if (vis >= 2 || s.progress >= 2) { shot = true; await p.screenshot({ path: OUT + opts.shot }); }
        else if (!s.boss) { await sleep(150); continue; }
      }
      let tx, ty;
      if (s.boss) { tx = s.boss.x; ty = s.boss.y + 380; }
      else {
        const g = s.targets.filter((t) => t.good && t.y > 40 && t.y < 980).sort((a, b) => b.y - a.y)[0];
        if (g) { tx = g.x; ty = Math.min(g.y + 230, 960); if (g.y > 700) ty = g.y + 40; } else { tx = 360; ty = 900; }
      }
      const [px, py] = toPx(tx, Math.min(ty + 90, 1035));
      if (!mouseDown) { const [sx, sy] = toPx(360, 980); await p.mouse.move(sx, sy); await p.mouse.down(); mouseDown = true; }
      await p.mouse.move(px, py, { steps: 2 });
      await sleep(60);
    }
    if (mouseDown) await p.mouse.up();
    const ok = (await snap()).screen === 'complete';
    stats[id] = { ok, secs: Math.round((Date.now() - t0) / 1000), maxP };
    log('end', id, ok ? 'COMPLETE' : 'TIMEOUT', stats[id]);
    if (opts.shotDone) { await sleep(300); await p.screenshot({ path: OUT + opts.shotDone }); }
    return ok;
  }

  // 花園：基本救援（數數看）
  await playLevel('garden', 0, { shot: '05-gameplay-hud.png', shotQuiz: '06-counting-quiz.png', shotDone: '07-level-complete.png' });
  await playLevel('garden', 1, { shot: '05b-flowers.png' });
  await playLevel('garden', 2, { shot: '05c-color-level.png' });
  // 暫停按鈕
  await p.evaluate(() => CB.ui.map()); await click('.node[data-s="garden"][data-i="3"]'); await sleep(400);
  { const [x, y] = toPx(662, 56); await p.mouse.click(x, y); await sleep(300); const s = await snap(); log('pause modal:', s.modal, 'paused:', s.paused); stats.pause = s.modal === 'pause' && s.paused; await p.screenshot({ path: OUT + '09b-pause.png' }); await click('#btn-resume'); }
  // 驚喜：神秘訪客（台灣黑熊）
  await sleep(300); await p.evaluate(() => CBDebug.forceSurprise('visitor')); await sleep(1500);
  { const s = await snap(); log('visitor:', s.visitor); stats.visitor = !!s.visitor; await p.screenshot({ path: OUT + '10-mystery-visitor.png' }); }
  await p.evaluate(() => CBDebug.forceSurprise('weather')); await sleep(1200); log('weather now', (await snap()).weather);
  await playLevel('garden', 3);
  await playLevel('garden', 4, { shot: '11-boss-cloud.png' });
  // 學習關卡：難度 2（順序）
  await p.evaluate(() => CB.ui.map());
  const lp = await longPressGear(); log('long press early/after:', lp); stats.longPress = lp.early === null && lp.after === 'settings';
  await sleep(200); await p.screenshot({ path: OUT + '12-settings.png' });
  await click('[data-act="tier"][data-v="2"]'); await click('#btn-settings-close');
  await playLevel('sky', 1, { shot: '13-learning-number.png' });
  await playLevel('sky', 2, { shot: '14-learning-letters.png' });
  // 難度 3
  await p.evaluate(() => CB.ui.map()); await longPressGear(); await click('[data-act="tier"][data-v="3"]'); await click('#btn-settings-close');
  await playLevel('sky', 3, { shot: '15-learning-zhuyin.png' });
  // 難度 1 + 雙人輪流
  await p.evaluate(() => CB.ui.map()); await longPressGear(); await click('[data-act="tier"][data-v="1"]'); await click('#btn-settings-close');
  await click('#btn-two');
  let switched = false;
  await playLevel('beach', 1, { shot: '16-two-player-fish.png', hook: async (s) => { if (s.player === 2) switched = true; } });
  stats.twoPlayerSwitch = switched; await click('#btn-map'); await click('#btn-two');
  await playLevel('beach', 0, { shot: '17-beach.png' });
  await playLevel('sky', 4);
  await playLevel('beach', 4, { shot: '18-finale-boss.png' });
  await playLevel('beach', 3, { shot: '18b-zhuyin-find-tier1.png' });
  await playLevel('sky', 2, { shot: '18c-letter-find-tier1.png' });
  // 英文切換
  await p.evaluate(() => CB.ui.map()); await longPressGear(); await click('[data-act="lang"][data-v="en"]'); await sleep(200); await p.screenshot({ path: OUT + '19-settings-en.png' });
  await click('[data-act="lang"][data-v="zh"]'); await click('#btn-settings-close');
  // 貼紙簿、圖鑑、花園、爸媽
  await click('#btn-stickers'); await sleep(200); await p.screenshot({ path: OUT + '20-sticker-book.png' });
  await click('[data-act="map"]'); await click('#btn-dex'); await sleep(200); await p.screenshot({ path: OUT + '21-encyclopedia.png' });
  await click('.dexc.vis.own'); await sleep(300); await p.screenshot({ path: OUT + '22-dex-card.png' }); await click('[data-act="closeModal"]');
  await click('[data-act="map"]'); await click('#btn-garden');
  for (const id of ['tulip', 'sunflower', 'tree', 'bird', 'rabbit', 'bear', 'mushroom', 'daisy']) { const e = await p.$(`.pal[data-v="${id}"]`); if (e) { await e.click(); await sleep(80); } }
  { const it = await p.evaluate(() => CB.store.data.garden[CB.store.data.garden.length - 1]); const [x, y] = toPx(it.x, it.y); const [x2, y2] = toPx(360, 600); await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x2, y2, { steps: 8 }); await p.mouse.up(); const n = await p.evaluate(() => CB.store.data.garden.find((g) => Math.abs(g.x - 360) < 2 && Math.abs(g.y - 600) < 2)); stats.gardenDrag = !!n; }
  await sleep(300); await p.screenshot({ path: OUT + '23-garden.png' });
  await click('[data-act="map"]'); await click('#btn-parents'); await sleep(200); await p.screenshot({ path: OUT + '24-parents.png' });
  await click('#btn-replay'); await sleep(400); await p.screenshot({ path: OUT + '25-highlight-replay.png' }); await click('[data-act="closeModal"]');
  await click('[data-act="map"]'); await sleep(300); await p.screenshot({ path: OUT + '26-map-after.png' });
  // 重新整理後存檔仍在
  const before = await p.evaluate(() => JSON.stringify({ st: CB.store.data.stickers.length, pr: Object.keys(CB.store.data.progress).length, g: CB.store.data.garden.length, dex: Object.keys(CB.store.data.dex).length, o: CB.store.data.workshop }));
  await p.reload({ waitUntil: 'networkidle0' }); await p.waitForFunction('window.__ready');
  const after = await p.evaluate(() => JSON.stringify({ st: CB.store.data.stickers.length, pr: Object.keys(CB.store.data.progress).length, g: CB.store.data.garden.length, dex: Object.keys(CB.store.data.dex).length, o: CB.store.data.workshop }));
  stats.persist = before === after; log('persist', before, after);
  // 離線
  const swOk = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  await sleep(500); await p.reload({ waitUntil: 'networkidle0' });
  const ctrl = await p.evaluate(() => !!navigator.serviceWorker.controller);
  await p.setOfflineMode(true);
  await p.reload({ waitUntil: 'load' }); await p.waitForFunction('window.__ready', { timeout: 8000 });
  await click('#btn-start'); await sleep(300);
  stats.offline = (await p.evaluate(() => CB.ui.screen)) === 'map'; stats.sw = swOk && ctrl;
  await p.setOfflineMode(false);
  log('STATS', JSON.stringify(stats, null, 1));
  const realErrs = errs.filter((e) => !(stats.offline && /ERR_INTERNET_DISCONNECTED/.test(e)));
  log('console errors:', realErrs.length, realErrs.slice(0, 10));
  await b.close();
})();
