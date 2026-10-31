// 共用核心：命名空間、工具函式、多語系
window.CB = window.CB || {};
(function () {
  const q = new URLSearchParams(location.search);
  CB.fast = q.get('fast') === '1';
  CB.debugOn = CB.fast || q.get('debug') === '1';
  CB.util = {
    rand: (a, b) => a + Math.random() * (b - a),
    ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    dist: (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2),
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  };
  CB.lang = () => (CB.store && CB.store.data ? CB.store.data.settings.lang : 'zh');
  CB.t = function (key, params) {
    const tx = CB.data.content.text;
    let s = (tx[CB.lang()] && tx[CB.lang()][key]);
    if (s === undefined) s = tx.zh[key];
    if (s === undefined) return key;
    if (Array.isArray(s)) s = CB.util.pick(s);
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
    return s;
  };
  CB.L = (obj) => (obj ? (obj[CB.lang()] || obj.zh) : '');
  CB.animalName = (id) => { const a = CB.data.content.animals[id]; return a ? (CB.lang() === 'en' ? a.en : a.zh) : id; };
})();
