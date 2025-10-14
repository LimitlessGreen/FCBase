#!/usr/bin/env node
import fs from 'fs';
import fsp from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { pipeline } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'src', 'assets', 'images', 'controllers');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const candidates = [
  { id: 'aocoda-h743dual', url: 'https://ardupilot.org/copter/_images/aocoda_h743dual.jpg' },
  { id: 'cuav-7-nano', url: 'https://ardupilot.org/copter/_images/7-nano.jpg' },
  { id: 'cuav-nora', url: 'https://ardupilot.org/copter/_images/nora.png' },
  { id: 'cuav-pixhawk-v6x', url: 'https://ardupilot.org/copter/_images/cuav-pixhawk-v6x.jpg' },
  { id: 'cubepilot-cube-black', url: 'https://ardupilot.org/copter/_images/pixhawk2-overhead.jpg' },
  { id: 'cubepilot-cube-orange-plus', url: 'https://ardupilot.org/copter/_images/Cube_orange_module.jpg' },
  { id: 'holybro-durandal', url: 'https://holybro.com/cdn/shop/products/Durandal-1.jpg?v=1751249914' },
  { id: 'holybro-kakute-h7-v2', url: 'https://holybro.com/cdn/shop/products/11058V2_1.jpg?v=1679456428' },
  { id: 'holybro-pixhawk-4', url: 'https://holybro.com/cdn/shop/files/110321_4.jpg?v=1750816088' },
  { id: 'holybro-pixhawk-4-mini', url: 'https://docs.px4.io/main/assets/pixhawk4mini_iso_1.ROPjkdrL.png' },
  { id: 'holybro-pixhawk-5x', url: 'https://holybro.com/cdn/shop/files/sku11045_4_grande.jpg?v=1723722819' },
  { id: 'holybro-pixhawk-6c', url: 'https://holybro.com/cdn/shop/products/11054Pixhawk6C-Plasticcase_1_grande.jpg?v=1749537511' },
  { id: 'mateksys-f405-wing', url: 'https://www.mateksys.com/wp-content/uploads/2018/04/F405-WING_1-1500x600.jpg' },
  { id: 'mateksys-f765-wing', url: 'https://www.mateksys.com/wp-content/uploads/2019/08/F765-WING_1-1500x600.jpg' },
  { id: 'mateksys-h743-wing', url: 'https://www.mateksys.com/wp-content/uploads/2020/07/H743-WING_1.jpg' },
  { id: 'mro-pixracer-pro', url: 'https://ardupilot.org/copter/_images/pixracer-pro-top.png' },
];

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const idsArg = argv.find((a) => !a.startsWith('--'));
const idsFilter = idsArg ? idsArg.split(',') : null;

const toFetch = candidates.filter((c) => (idsFilter ? idsFilter.includes(c.id) : true));

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const fileStream = fs.createWriteStream(dest);
      pipeline(res, fileStream)
        .then(() => resolve())
        .catch((err) => reject(err));
    });
    req.on('error', reject);
  });
}

(async () => {
  for (const item of toFetch) {
    const parsed = new URL(item.url);
    const ext = path.extname(parsed.pathname) || '.jpg';
    const safeId = item.id.replace(/\//g, '-');
    const filename = `${safeId}${ext}`;
    const dest = path.join(outDir, filename);
    if (existsSync(dest) && !force) {
      console.log(`Skipping ${item.id} (exists): ${dest}`);
      continue;
    }
    try {
      console.log(`Downloading ${item.url} -> ${dest}`);
      await download(item.url, dest);
      console.log(`Saved ${dest}`);
    } catch (err) {
      console.error(`Failed to download ${item.id}:`, err.message);
    }
  }
  console.log('Done');
})();
