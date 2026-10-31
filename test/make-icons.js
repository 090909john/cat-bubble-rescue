// 用遊戲的繪圖函式產生 PWA 圖示
const puppeteer = require('/workspace/lt-tools/node_modules/puppeteer-core');
const fs = require('fs');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('http://localhost:8931/index.html');
  await p.waitForFunction('window.__ready');
  for (const n of [192, 512]) {
    const data = await p.evaluate((n) => {
      const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); const s = n / 256;
      x.scale(s, s); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#8fd8ff'); g.addColorStop(1, '#fff3c4'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      CB.art.rainbow(x, 128, 230, 120, 0.8);
      CB.art.bubble(x, 60, 60, 22, 'rainbow', 'rainbow', 1); CB.art.bubble(x, 200, 80, 16, '#7fd8ff', 'normal', 1);
      CB.art.cat(x, 128, 150, 1.25, { t: 0.3, blow: true });
      return c.toDataURL('image/png').split(',')[1];
    }, n);
    fs.writeFileSync(`icons/icon-${n}.png`, Buffer.from(data, 'base64'));
  }
  await b.close();
})();
