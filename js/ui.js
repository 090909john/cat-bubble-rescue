// 介面畫面：標題、故事、地圖、工坊、打扮、花園、貼紙簿、圖鑑、給爸媽看、設定、暫停、數數看、結算、終章
(function () {
  const U = CB.ui = { screen: 'title' };
  const T = (k, p) => CB.t(k, p), esc = CB.util.esc;
  const $ = (s) => document.querySelector(s);
  const ui = () => document.getElementById('ui');
  const S = () => CB.store.data;
  function show(name, html, cls = '') { U.screen = name; ui().innerHTML = `<div class="screen ${cls}" id="screen-${name}">${html}</div>`; }
  function modal(name, html) { closeModal(); const m = document.createElement('div'); m.className = 'modal-bg'; m.id = 'modal-' + name; m.innerHTML = `<div class="modal">${html}</div>`; ui().appendChild(m); U.modal = name; return m; }
  function closeModal() { document.querySelectorAll('.modal-bg').forEach((m) => m.remove()); U.modal = null; }
  U.closeModal = closeModal;
  const gear = () => `<button class="gear" data-longpress="settings" aria-label="settings">⚙️<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/></svg></button>`;
  U.toast = function (msg) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; ui().appendChild(d); setTimeout(() => d.remove(), 2200); };

  // ---------- 標題 ----------
  U.title = function () {
    CB.game.mode = 'idle'; CB.game.L = null;
    show('title', `<div class="title-wrap"><h1>${T('title1')}</h1><h2>${T('title2')}</h2></div>
      <button class="big-btn start pulse" data-act="start" id="btn-start">${T('start')}</button>${gear()}`);
  };
  // ---------- 故事開場 ----------
  U.story = function (i = 0) {
    const st = CB.data.content.story; const s = st[i];
    show('story', `<div class="card story-card"><div class="story-art">${s.e}</div><p class="story-text">${esc(CB.L(s))}</p>
      <div class="dots">${st.map((_, j) => `<span class="${j === i ? 'on' : ''}"></span>`).join('')}</div></div>
      <div class="row"><button class="btn ghost" data-act="storyEnd">${T('skip')}</button>
      <button class="big-btn" data-act="storyNext" data-i="${i + 1}" id="btn-story-next">${i + 1 < st.length ? T('next') : T('go')}</button></div>`, 'center');
    CB.audio.say(CB.L(s));
  };
  // ---------- 地圖 ----------
  U.map = function () {
    CB.game.mode = 'idle'; CB.game.L = null; closeModal();
    const d = S(); const done = CB.store.doneCount(), total = 15, pct = Math.round(done / total * 100);
    const next = findNext();
    const rows = CB.data.levels.scenes.map((sc) => `<div class="scene-row" style="background:${sc.row}"><div class="scene-name">${sc.icon} ${esc(CB.L(sc.name))}</div><div class="nodes">${sc.levels.map((lv, i) => {
      const ok = d.progress[lv.id] && d.progress[lv.id].done; const isNext = next && next.id === lv.id;
      return `<button class="node ${ok ? 'done' : ''} ${isNext ? 'next' : ''} ${lv.type === 'boss' ? 'boss' : ''}" data-act="play" data-s="${sc.id}" data-i="${i}" data-id="${lv.id}"><span class="ni">${lv.icon}</span><span class="nl">${esc(CB.L(lv.name))}</span>${ok ? '<span class="ok">⭐</span>' : ''}</button>`;
    }).join('')}</div></div>`).join('');
    show('map', `<div class="town-box"><canvas id="town" width="680" height="190"></canvas><div class="town-label">${T('town', { p: pct })}</div></div>
      <div class="scenes">${rows}</div>
      <div class="nav">
        <button class="navb" data-act="workshop">🫧<span>${T('nav_workshop')}</span></button>
        <button class="navb" data-act="dress">🐱<span>${T('nav_dress')}</span></button>
        <button class="navb" data-act="garden" id="btn-garden">🌷<span>${T('nav_garden')}</span></button>
        <button class="navb" data-act="stickers" id="btn-stickers">📒<span>${T('nav_stickers')}</span></button>
        <button class="navb" data-act="dex" id="btn-dex">📖<span>${T('nav_dex')}</span></button>
        <button class="navb" data-act="parents" id="btn-parents">👨‍👩‍👧<span>${T('nav_parents')}</span></button>
      </div>
      <button class="two ${d.twoPlayer ? 'on' : ''}" data-act="two" id="btn-two">👫 ${d.twoPlayer ? T('two_on') : T('two_off')}</button>${gear()}`);
    const cv = $('#town'); const c = cv.getContext('2d'); c.filter = `saturate(${0.15 + 0.85 * done / total})`;
    CB.art.town(c, 680, 190, done / total, 0);
  };
  function findNext() { const d = S(); for (const sc of CB.data.levels.scenes) for (const lv of sc.levels) if (!(d.progress[lv.id] && d.progress[lv.id].done)) return lv; return null; }
  // ---------- 預覽小畫布 ----------
  function preview(sel, mode) {
    const cv = $(sel); if (!cv) return; const c = cv.getContext('2d'); const bubbles = []; let t = 0, lastTs = 0;
    function fr(ts) {
      if (!document.body.contains(cv)) return; requestAnimationFrame(fr);
      const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0); lastTs = ts; t += dt;
      c.setTransform(1, 0, 0, 1, 0, 0); const gr = c.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, '#bfe9ff'); gr.addColorStop(1, '#fff'); c.fillStyle = gr; c.fillRect(0, 0, cv.width, cv.height);
      const cx = cv.width / 2, cy = cv.height - 110; const w = S().workshop;
      if (mode === 'bubbles' && Math.random() < dt * 3) {
        const mk = (x, vx, type, col) => bubbles.push({ x, y: cy - 78, vx, vy: -160, r: type === 'rainbow' ? 26 : 18, type, col, t: 0 });
        if (w.type === 'double') { mk(cx - 20, -20, 'normal', w.color); mk(cx + 20, 20, 'normal', w.color); } else mk(cx, 0, w.type, w.color);
      }
      for (const b of bubbles) { b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; CB.art.bubble(c, b.x, b.y, b.r, b.col, b.type, b.t); }
      while (bubbles.length && bubbles[0].y < -30) bubbles.shift();
      CB.art.cat(c, cx, cy + Math.sin(t * 2) * 6, 1.1, Object.assign(CB.game.catOpts(null), { t, blow: mode === 'bubbles' }));
    }
    requestAnimationFrame(fr);
  }
  // ---------- 泡泡工坊 ----------
  U.workshop = function (first) {
    const w = S().workshop, C = CB.data.content;
    show('workshop', `<h2 class="hd">🫧 ${T('workshop_title')}</h2><canvas id="pv" width="420" height="330"></canvas>
      <div class="label">${T('type')}</div><div class="choices">${C.bubbleTypes.map((b) => `<button class="choice ${w.type === b.id ? 'sel' : ''}" data-act="btype" data-v="${b.id}"><span class="ce">${b.e}</span><span>${T('bt_' + b.id)}</span></button>`).join('')}</div>
      <div class="label">${T('color')}</div><div class="choices">${C.bubbleColors.map((col) => `<button class="sw ${w.color === col ? 'sel' : ''}" data-act="bcolor" data-v="${col}" style="background:${col === 'rainbow' ? 'conic-gradient(red,orange,yellow,green,blue,purple,red)' : col}"></button>`).join('')}</div>
      <button class="big-btn" data-act="${first ? 'mapGo' : 'map'}" id="btn-ws-done">${first ? T('go') : T('back')}</button>`, 'scroll');
    preview('#pv', 'bubbles');
    if (first !== 'quiet') CB.audio.say(T('workshop_say'));
    U._wsFirst = first;
  };
  // ---------- 打扮貓咪 ----------
  U.dress = function (quiet) {
    const o = S().outfit, C = CB.data.content;
    show('dress', `<h2 class="hd">🐱 ${T('dress_title')}</h2><canvas id="pv" width="420" height="330"></canvas>
      <div class="label">${T('hat')}</div><div class="choices">${C.hats.map((h) => `<button class="choice sq ${o.hat === h ? 'sel' : ''}" data-act="hat" data-v="${h}"><span class="ce">${h === 'none' ? '🚫' : h}</span></button>`).join('')}</div>
      <div class="label">${T('scarf')}</div><div class="choices">${C.scarves.map((v) => `<button class="sw ${o.scarf === v ? 'sel' : ''}" data-act="scarf" data-v="${v}" style="background:${v}"></button>`).join('')}</div>
      <div class="label">${T('goggle')}</div><div class="choices">${C.goggles.map((v) => `<button class="sw ${o.goggle === v ? 'sel' : ''}" data-act="goggle" data-v="${v}" style="background:${v}"></button>`).join('')}</div>
      <button class="big-btn" data-act="map">${T('back')}</button>`, 'scroll');
    preview('#pv', 'still');
    if (!quiet) CB.audio.say(T('dress_say'));
  };
  // ---------- 花園 ----------
  U.garden = function () {
    CB.game.mode = 'garden';
    const items = CB.garden.unlocked();
    show('garden', `<div class="gbar"><button class="btn" data-act="map">${T('back')}</button><div class="gtitle">🌷 ${T('garden_title')}</div></div>
      <div class="ghint">${T('garden_hint')}</div>
      <div class="palette">${items.map((it) => `<button class="pal" data-act="gadd" data-v="${it.id}">${it.e}</button>`).join('')}</div>`, 'garden');
    CB.audio.say(T('garden_say'));
    if (S().garden.length && CB.store.addSticker('garden')) U.toast('🏡 ' + T('new_sticker'));
  };
  // ---------- 貼紙簿 ----------
  U.stickers = function () {
    const d = S();
    show('stickers', `<h2 class="hd">📒 ${T('stickers_title')}</h2><div class="totals">⭐ ${d.totalStars} &nbsp; 🍓 ${d.fruits} &nbsp; 📒 ${d.stickers.length}/${CB.data.content.stickers.length}</div>
      <div class="sgrid">${CB.data.content.stickers.map((s) => { const own = d.stickers.includes(s.id); return `<div class="sticker ${own ? 'own' : ''}">${own ? s.e : '?'}</div>`; }).join('')}</div>
      <button class="big-btn" data-act="map">${T('back')}</button>`, 'scroll');
  };
  // ---------- 圖鑑 ----------
  U.dex = function () {
    const d = S(), an = CB.data.content.animals;
    show('dex', `<h2 class="hd">📖 ${T('dex_title')}</h2><div class="dgrid">${Object.keys(an).map((id) => { const a = an[id], own = d.dex[id];
      return `<button class="dexc ${own ? 'own' : ''} ${a.visitor ? 'vis' : ''}" data-act="dexcard" data-v="${id}"><span class="de">${own ? a.e : '❔'}</span><span class="dn">${own ? esc(CB.animalName(id)) : T('unknown')}</span>${own ? `<span class="dc">×${own}</span>` : ''}</button>`; }).join('')}</div>
      <button class="big-btn" data-act="map">${T('back')}</button>`, 'scroll');
  };
  U.dexCard = function (id) {
    const a = CB.data.content.animals[id]; if (!S().dex[id]) { CB.audio.say(T('unknown')); return; }
    const fact = CB.lang() === 'en' ? a.fen : a.fzh; const name = CB.animalName(id);
    modal('dex', `<div class="bigemoji">${a.e}</div><h2>${esc(name)}</h2><p>${esc(fact)}</p><button class="big-btn" data-act="closeModal">${T('ok')}</button>`);
    CB.audio.say(name + '。' + fact);
  };
  // ---------- 給爸媽看 ----------
  U.parents = function () {
    const d = S(); const st = d.stats;
    const hl = d.highlights.slice().reverse().slice(0, 12).map((h) => `<li><span>${h.emoji}</span> ${esc(h.text)} <small>${new Date(h.time).toLocaleString(CB.lang() === 'en' ? 'en-US' : 'zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></li>`).join('');
    show('parents', `<h2 class="hd">👨‍👩‍👧 ${T('parents_title')}</h2>
      <div class="stats">
        <div><b>${CB.store.doneCount()}/15</b>${T('st_levels')}</div><div><b>${st.rescued}</b>${T('st_rescued')}</div>
        <div><b>${st.correct}</b>${T('st_correct')}</div><div><b>${d.totalStars}</b>${T('st_stars')}</div>
        <div><b>${Object.keys(d.dex).length}</b>${T('st_friends')}</div><div><b>${T('minutes', { n: Math.round(st.playMs / 60000) })}</b>${T('st_time')}</div>
      </div>
      <div class="thumbs">${d.thumbs.slice().reverse().map((th) => `<figure><img src="${th.img}" alt=""><figcaption>${th.emoji} ${esc(th.text)}</figcaption></figure>`).join('')}</div>
      ${d.thumbs.length ? `<button class="big-btn" data-act="replay" id="btn-replay">${T('play_highlights')}</button>` : `<p class="muted">${T('no_highlights')}</p>`}
      <div class="label">${T('highlights')}</div><ul class="hl">${hl}</ul>
      <button class="big-btn" data-act="map">${T('back')}</button>`, 'scroll');
  };
  U.replay = function () {
    const th = S().thumbs.slice(); if (!th.length) return; let i = 0;
    const m = modal('replay', `<div class="replay"><img id="rp-img" alt=""><div id="rp-cap"></div><div class="dots" id="rp-dots"></div></div><button class="big-btn" data-act="closeModal">${T('ok')}</button>`);
    function stepR() {
      if (!document.body.contains(m)) return;
      const x = th[i % th.length]; $('#rp-img').src = x.img; $('#rp-cap').textContent = x.emoji + ' ' + x.text;
      $('#rp-dots').innerHTML = th.map((_, j) => `<span class="${j === i % th.length ? 'on' : ''}"></span>`).join('');
      CB.audio.say(x.text); i++; if (i < th.length * 2) setTimeout(stepR, CB.fast ? 600 : 2600);
    }
    stepR();
  };
  // ---------- 設定 ----------
  U.settings = function () {
    const s = S().settings; const was = CB.game.paused; CB.game.paused = true; U._setWasPaused = was;
    const opt = (act, v, cur, label) => `<button class="opt ${String(cur) === String(v) ? 'sel' : ''}" data-act="${act}" data-v="${v}">${label}</button>`;
    modal('settings', `<h2>⚙️ ${T('settings_title')}</h2>
      <div class="set"><div class="sl">${T('difficulty')}</div><div class="opts">${[1, 2, 3].map((v) => opt('tier', v, s.tier, T('tier' + v))).join('')}</div></div>
      <div class="set"><div class="sl">${T('language')}</div><div class="opts">${opt('lang', 'zh', s.lang, '中文')}${opt('lang', 'en', s.lang, 'English')}</div></div>
      <div class="set"><div class="sl">${T('volume')}</div><input type="range" min="0" max="1" step="0.1" value="${s.vol}" id="vol"></div>
      <div class="set"><div class="sl">${T('voice')}</div><div class="opts">${opt('voice', 'true', s.voice, T('on'))}${opt('voice', 'false', s.voice, T('off'))}</div></div>
      <div class="set"><div class="sl">${T('remind')}</div><div class="opts">${[0, 10, 15, 20, 30].map((v) => opt('remind', v, s.remind, v ? T('minutes', { n: v }) : T('remind_off'))).join('')}</div></div>
      <button class="btn danger" data-act="reset">${T('reset')}</button>
      <button class="big-btn" data-act="closeSettings" id="btn-settings-close">${T('close')}</button>`);
    $('#vol').addEventListener('input', (e) => { s.vol = +e.target.value; CB.audio.setVol(s.vol); CB.store.save(); });
  };
  // ---------- 暫停 ----------
  U.pause = function () {
    if (!CB.game.L) return; CB.game.paused = true;
    modal('pause', `<h2>☕ ${T('pause_title')}</h2><button class="big-btn" data-act="resume" id="btn-resume">${T('resume')}</button>
      <button class="big-btn alt" data-act="restart">${T('restart')}</button><button class="big-btn alt" data-act="map">${T('to_map')}</button>${gear()}`);
  };
  // ---------- 遊玩時間提醒 ----------
  U.reminder = function (n) {
    if (CB.game.mode === 'level') CB.game.paused = true;
    modal('remind', `<div class="bigemoji">👀💧</div><h2>${T('remind_title')}</h2><p>${T('remind_text', { n })}</p><button class="big-btn" data-act="remindOk">${T('ok')}</button>`);
    CB.audio.say(T('remind_title'));
  };
  // ---------- 關卡結束 ----------
  U.levelDone = function (L) {
    const d = S(); const id = L.def.id;
    const first = !(d.progress[id] && d.progress[id].done);
    d.progress[id] = { done: true, plays: ((d.progress[id] && d.progress[id].plays) || 0) + 1 };
    d.stats.levels++;
    const newSt = (L.newStickers || []).slice();
    if (CB.store.addSticker(id)) newSt.push(id);
    if (L.two && CB.store.addSticker('twoplayer')) newSt.push('twoplayer');
    const lname = CB.L(L.def.name);
    CB.store.highlight(T('hl_level', { n: lname }), L.def.sticker, L.thumb);
    if (L.visitorMet) CB.store.highlight(T('hl_visitor', { n: CB.animalName(L.visitorMet) }), CB.data.content.animals[L.visitorMet].e);
    if (L.def.finale) CB.store.highlight(T('hl_finale'), '🌈');
    CB.store.save();
    U._last = { L, newSt, first };
    if (L.def.count) U.quiz(L); else if (L.def.finale) U.finale(); else U.complete();
  };
  U.quiz = function (L) {
    const n = L.rescued.length; const set = new Set([n]);
    while (set.size < 3) { const v = n + CB.util.pick([-2, -1, 1, 2]); if (v >= 1 && v <= 10) set.add(v); }
    const opts = CB.util.shuffle([...set]); const word = CB.L(L.def.word);
    const icons = L.rescued.map((r) => `<span class="qi">${r.e || CB.data.content.animals[r.id].e}</span>`).join('');
    modal('quiz', `<h2>${T('quiz_q', { k: word })}</h2><div class="qicons">${icons}</div>
      <div class="qopts">${opts.map((v) => `<button class="qopt" data-act="quizAns" data-v="${v}" data-n="${n}">${v}</button>`).join('')}</div>`);
    CB.audio.say(T('quiz_q', { k: word }));
  };
  U.complete = function () {
    const { L, newSt } = U._last; const C = CB.data.content;
    CB.game.mode = 'idle'; CB.game.L = null;
    const friendId = (L.rescued.find((r) => r.id && C.animals[r.id]) || {}).id;
    const friendE = L.boss ? '🌈' : friendId ? C.animals[friendId].e : L.def.icon;
    const st = newSt.map((id) => (C.stickers.find((s) => s.id === id) || {}).e).filter(Boolean);
    show('complete', `<div class="card"><div class="bigemoji bounce">${friendE}</div><h2>${T('level_done')}</h2>
      <div class="stars5">⭐⭐⭐⭐⭐</div><p class="speech">「${T('thanks')}」</p>
      ${L.two ? `<p>${T('two_result', { a: L.contrib[0], b: L.contrib[1] })}</p>` : ''}
      ${st.length ? `<div class="newst">${T('new_sticker')} <span>${st.join(' ')}</span></div>` : ''}
      <p class="town-up">🏘️ ${T('town_up')} ${T('town', { p: Math.round(CB.store.doneCount() / 15 * 100) })}</p></div>
      <div class="row wrap"><button class="big-btn" data-act="nextLevel" id="btn-next">${T('btn_next')}</button>
      <button class="big-btn alt" data-act="garden">${T('btn_garden')}</button><button class="big-btn alt" data-act="map" id="btn-map">${T('btn_map')}</button></div>`, 'center');
    CB.audio.say(T('thanks'));
  };
  U.finale = function () {
    CB.game.startFinale();
    show('finale', `<div class="finale-title">${T('finale_title')}</div><div class="spacer"></div>
      <button class="big-btn" data-act="finaleDone" id="btn-finale">${T('continue')}</button>`, 'finale');
    CB.audio.fanfare(); CB.audio.say(T('finale_say'));
  };

  // ---------- 事件 ----------
  const actions = {
    start() {
      CB.audio.init(); CB.audio.startMusic();
      if (!S().storySeen) U.story(0); else U.map();
    },
    storyNext(el) { const i = +el.dataset.i; if (i < CB.data.content.story.length) U.story(i); else actions.storyEnd(); },
    storyEnd() { S().storySeen = true; CB.store.save(); U.workshop(true); },
    mapGo() { U.map(); },
    map() { closeModal(); CB.game.paused = false; U.map(); },
    workshop() { U.workshop(false); }, dress() { U.dress(); }, garden() { closeModal(); U.garden(); },
    stickers() { U.stickers(); }, dex() { U.dex(); }, parents() { U.parents(); }, replay() { U.replay(); },
    dexcard(el) { U.dexCard(el.dataset.v); },
    btype(el) { S().workshop.type = el.dataset.v; CB.store.save(); U.workshop(U._wsFirst ? true : 'quiet'); },
    bcolor(el) { S().workshop.color = el.dataset.v; CB.store.save(); U.workshop(U._wsFirst ? true : 'quiet'); },
    hat(el) { S().outfit.hat = el.dataset.v; CB.store.save(); U.dress(true); },
    scarf(el) { S().outfit.scarf = el.dataset.v; CB.store.save(); U.dress(true); },
    goggle(el) { S().outfit.goggle = el.dataset.v; CB.store.save(); U.dress(true); },
    gadd(el) { CB.garden.add(el.dataset.v); },
    two() { S().twoPlayer = !S().twoPlayer; CB.store.save(); U.map(); if (S().twoPlayer) CB.audio.say(T('two_say')); },
    play(el) { U.clear(); CB.game.start(el.dataset.s, +el.dataset.i); },
    resume() { closeModal(); CB.game.paused = false; },
    restart() { closeModal(); const L = CB.game.L; U.clear(); CB.game.start(L.sid, L.idx); },
    closeModal() { closeModal(); },
    tier(el) { S().settings.tier = +el.dataset.v; CB.store.save(); U.settings(); },
    lang(el) { S().settings.lang = el.dataset.v; CB.store.save(); document.documentElement.lang = el.dataset.v === 'en' ? 'en' : 'zh-Hant-TW'; U.refresh(); U.settings(); },
    voice(el) { S().settings.voice = el.dataset.v === 'true'; CB.store.save(); U.settings(); },
    remind(el) { S().settings.remind = +el.dataset.v; CB.store.save(); CB.main.sessionMs = 0; U.settings(); },
    reset() { if (window.confirm(T('reset_confirm'))) { CB.store.reset(); closeModal(); U.title(); } },
    closeSettings() { closeModal(); CB.game.paused = !!U._setWasPaused && CB.game.mode === 'level'; if (CB.game.paused && CB.game.L) U.pause(); },
    remindOk() { closeModal(); CB.game.paused = false; },
    quizAns(el) {
      const v = +el.dataset.v, n = +el.dataset.n;
      if (v === n) { el.classList.add('right'); CB.audio.rescue(); CB.audio.say(T('quiz_ok', { n })); S().stats.correct++; CB.store.save(); setTimeout(() => { closeModal(); if (U._last.L.def.finale) U.finale(); else U.complete(); }, CB.fast ? 300 : 1400); }
      else { el.classList.add('no'); CB.audio.soft(); CB.audio.say(T('quiz_retry')); document.querySelectorAll('.qi').forEach((q, i) => setTimeout(() => q.classList.add('pop'), i * 250)); }
    },
    nextLevel() {
      const { L } = U._last; const scs = CB.data.levels.scenes; let si = scs.indexOf(L.scene), li = L.idx + 1;
      if (li >= L.scene.levels.length) { si++; li = 0; }
      if (si >= scs.length) { U.map(); return; }
      U.clear(); CB.game.start(scs[si].id, li);
    },
    finaleDone() { CB.game.mode = 'idle'; U.complete(); }
  };
  U.actions = actions;
  U.clear = () => { ui().innerHTML = ''; U.screen = 'game'; };
  U.refresh = function () { const sc = U.screen; if (sc === 'title') U.title(); else if (sc === 'map') U.map(); else if (U[sc] && sc !== 'game' && sc !== 'complete' && sc !== 'finale' && sc !== 'story') U[sc](sc === 'workshop' ? 'quiet' : true); };

  U.bind = function () {
    const root = ui();
    root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]'); if (!el) return;
      CB.audio.init(); CB.audio.click();
      const f = actions[el.dataset.act]; if (f) f(el);
    });
    // 大人設定：長按 3 秒
    let lp = null;
    const cancel = () => { if (lp) { clearTimeout(lp.timer); lp.el.classList.remove('pressing'); if (!lp.fired && Date.now() - lp.start < 2900) U.toast(T('adult_hint')); lp = null; } };
    root.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('[data-longpress]'); if (!el) return; e.preventDefault();
      el.classList.add('pressing');
      lp = { el, start: Date.now(), fired: false, timer: setTimeout(() => { lp.fired = true; el.classList.remove('pressing'); CB.audio.init(); CB.audio.magic(); U.settings(); }, 3000) };
    });
    root.addEventListener('pointerup', cancel); root.addEventListener('pointercancel', cancel); root.addEventListener('pointerleave', cancel);
  };
})();
