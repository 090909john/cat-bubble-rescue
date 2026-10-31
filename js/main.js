// 啟動：載入 JSON 資料、縮放、服務工作者、遊玩時間提醒、除錯介面
(function () {
  const M = CB.main = { sessionMs: 0 };
  function resize() {
    const W = 720, H = 1040, sc = Math.min(window.innerWidth / W, window.innerHeight / H);
    const app = document.getElementById('app');
    app.style.width = W * sc + 'px'; app.style.height = H * sc + 'px';
    document.documentElement.style.setProperty('--u', sc + 'px');
    CB.game.resize(sc);
    if (CB.ui.screen === 'map') CB.ui.map();
  }
  M.tick = function (dt) {
    const g = CB.game;
    if (g.mode === 'level' && !g.paused && !document.hidden) {
      const ms = dt * 1000 / (CB.fast ? 2.5 : 1);
      CB.store.data.stats.playMs += ms; M.sessionMs += ms;
      const r = CB.store.data.settings.remind;
      if (r > 0 && M.sessionMs >= r * 60000) { M.sessionMs = 0; CB.ui.reminder(r); }
    }
    M.saveT = (M.saveT || 0) + dt; if (M.saveT > 5) { M.saveT = 0; CB.store.save(); }
  };
  async function boot() {
    const [levels, content] = await Promise.all(['data/levels.json', 'data/content.json'].map((u) => fetch(u).then((r) => r.json())));
    CB.data = { levels, content };
    document.documentElement.lang = CB.store.data.settings.lang === 'en' ? 'en' : 'zh-Hant-TW';
    CB.game.init(document.getElementById('game'));
    CB.ui.bind();
    window.addEventListener('resize', resize); resize();
    CB.ui.title();
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => { /* 本機檔案模式沒有 SW */ });
    document.addEventListener('visibilitychange', () => CB.store.save());
    if (CB.debugOn) {
      window.CBDebug = {
        snap: () => Object.assign(CB.game.snapshot(), { screen: CB.ui.screen, modal: CB.ui.modal }),
        store: () => CB.store.data, start: (s, i) => { CB.ui.clear(); CB.ui.closeModal(); return !!CB.game.start(s, i); },
        forceSurprise: (k) => { CB.game.forceSurprise = k; const L = CB.game.L; if (L) { L.surprise = { x: L.cat.x, y: L.cat.y - 250, t: 0 }; } },
        ui: CB.ui, game: CB.game
      };
    }
    window.__ready = true;
  }
  boot().catch((e) => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="position:fixed;top:0;color:red">載入失敗，請重新整理</p>'); });
})();
