// 音效：WebAudio 合成；語音：Web Speech（zh-TW / en-US）
(function () {
  const A = CB.audio = {
    ctx: null, master: null, music: null,
    init() {
      try {
        if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC(); this.master = this.ctx.createGain();
        this.master.gain.value = CB.store.data.settings.vol; this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    },
    setVol(v) { if (this.master) this.master.gain.value = v; },
    tone(f, d = 0.15, type = 'sine', v = 0.3, when = 0, slide = 0) {
      const c = this.ctx; if (!c || CB.store.data.settings.vol <= 0) return;
      const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.05);
    },
    blow() { this.tone(520 + Math.random() * 200, 0.09, 'sine', 0.04, 0, 300); },
    pop() { this.tone(900, 0.09, 'triangle', 0.15, 0, -600); },
    rescue() { [0, 4, 7, 12].forEach((n, i) => this.tone(523 * 2 ** (n / 12), 0.25, 'sine', 0.22, i * 0.07)); },
    boing() { this.tone(180, 0.4, 'sine', 0.3, 0, 260); },
    ding() { this.tone(1318, 0.3, 'triangle', 0.15); this.tone(1760, 0.3, 'sine', 0.1, 0.06); },
    soft() { this.tone(330, 0.18, 'sine', 0.12, 0, -60); },
    click() { this.tone(660, 0.07, 'triangle', 0.12); },
    magic() { [0, 3, 7, 10, 14, 19].forEach((n, i) => this.tone(660 * 2 ** (n / 12), 0.3, 'sine', 0.12, i * 0.06)); },
    fanfare() { [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => this.tone(392 * 2 ** (n / 12), 0.32, 'triangle', 0.16, i * 0.13)); },
    startMusic() {
      if (this.music || !this.ctx) return;
      const notes = [0, 2, 4, 7, 9, 12, 9, 7, 4, 2]; let i = 0;
      this.music = setInterval(() => { if (document.hidden) return; const n = notes[i++ % notes.length]; this.tone(262 * 2 ** (n / 12), 0.5, 'sine', 0.035); if (i % 4 === 0) this.tone(131, 0.8, 'sine', 0.03); }, 420);
    },
    say(text, force) {
      const st = CB.store.data.settings;
      if ((!st.voice && !force) || !('speechSynthesis' in window) || !text) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, ''));
        u.lang = st.lang === 'en' ? 'en-US' : 'zh-TW'; u.rate = 0.9; u.pitch = 1.3; u.volume = Math.max(0.1, st.vol);
        const vs = speechSynthesis.getVoices();
        const v = st.lang === 'en' ? (vs.find((x) => /en[-_]US/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang))) : (vs.find(x=>/zh[-_]TW/i.test(x.lang)&&!/yue|canton|hong ?kong/i.test(x.name))||vs.find(x=>/cmn|zh[-_](CN|Hans|Hant-TW)|mandarin|普通話|國語/i.test(x.lang+' '+x.name)&&!/HK|yue|canton/i.test(x.lang+' '+x.name))||null);
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) { /* 沒有語音就略過 */ }
    }
  };
})();
