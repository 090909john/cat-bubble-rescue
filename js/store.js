// 存檔：每台平板各自用 localStorage
(function () {
  const KEY = 'cbr_save_v1';
  const def = () => ({
    settings: { tier: 1, lang: 'zh', vol: 0.7, voice: true, remind: 15 },
    progress: {}, stickers: [], dex: {}, totalStars: 0, fruits: 0,
    workshop: { type: 'normal', color: 'rainbow' },
    outfit: { hat: 'none', scarf: '#ff5a5a', goggle: '#4fc3f7' },
    garden: [], storySeen: false, highlights: [], thumbs: [], twoPlayer: false,
    stats: { rescued: 0, levels: 0, correct: 0, playMs: 0 }
  });
  const S = CB.store = {
    data: null,
    load() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
      const d = def();
      this.data = Object.assign(d, s || {});
      this.data.settings = Object.assign(def().settings, this.data.settings || {});
      this.data.stats = Object.assign(def().stats, this.data.stats || {});
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
      catch (e) { this.data.thumbs = this.data.thumbs.slice(-2); try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e2) { /* 存不下就算了 */ } }
    },
    reset() { const keepLang = this.data.settings; this.data = def(); this.data.settings = keepLang; this.save(); },
    addSticker(id) { if (!this.data.stickers.includes(id)) { this.data.stickers.push(id); this.save(); return true; } return false; },
    addDex(id) { const first = !this.data.dex[id]; this.data.dex[id] = (this.data.dex[id] || 0) + 1; return first; },
    highlight(text, emoji, thumb) {
      const h = this.data.highlights; h.push({ text, emoji, time: Date.now() });
      if (h.length > 30) h.splice(0, h.length - 30);
      if (thumb) { this.data.thumbs.push({ img: thumb, text, emoji }); if (this.data.thumbs.length > 8) this.data.thumbs.splice(0, this.data.thumbs.length - 8); }
      this.save();
    },
    doneCount() { return Object.keys(this.data.progress).filter((k) => this.data.progress[k].done).length; }
  };
  S.load();
})();
