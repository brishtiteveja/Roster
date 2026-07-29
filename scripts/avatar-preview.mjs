// Render candidate DiceBear styles side by side and screenshot for review.
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';
import { createAvatar } from '@dicebear/core';
import { lorelei, micah, adventurer, notionists, personas } from '@dicebear/collection';

const GRADIENTS = [
  ['e9b44c', 'c67b3d'], ['86b8a1', '4e7e7a'], ['8a9be0', '5563a8'],
  ['d98a7b', 'a8566b'], ['c9a8e0', '7e5aa8'], ['7bc5d9', '3d7e8f'],
];
const seeds = ['Maya', 'Theo', 'Priya', 'Sam', 'Lena', 'Noah'];
const styles = { lorelei, micah, adventurer, notionists, personas };

let html = `<body style="background:#171B2E;font-family:sans-serif;color:#ECE7DD;padding:20px">`;
for (const [name, style] of Object.entries(styles)) {
  html += `<h3 style="margin:14px 0 6px">${name}</h3><div style="display:flex;gap:10px">`;
  seeds.forEach((s, i) => {
    const svg = createAvatar(style, {
      seed: s, size: 110,
      backgroundColor: GRADIENTS[i % GRADIENTS.length],
      backgroundType: ['gradientLinear'],
    }).toString();
    html += `<div style="border-radius:16px;overflow:hidden;line-height:0">${svg}</div>`;
  });
  html += `</div>`;
}
html += `</body>`;

const out = path.resolve('scripts/shots');
fs.mkdirSync(out, { recursive: true });
const f = path.join(out, 'preview.html');
fs.writeFileSync(f, html);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 820, height: 1160 }, deviceScaleFactor: 2 });
await page.goto('file://' + f);
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'avatar-styles.png'), fullPage: true });
await browser.close();
console.log('done');
