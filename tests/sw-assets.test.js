// sw.js の ASSETS リストと実出荷ファイルの突合。
// cache.addAll はアトミックなため、存在しないエントリが1つでもあると install が失敗し
// 更新が無言で止まる。逆に掲載漏れはそのファイルだけ旧版が配信され続ける。
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// sw.js から ASSETS 配列のエントリを抽出する。
function readAssets() {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const block = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
  expect(block, 'sw.js に ASSETS 配列があること').not.toBeNull();
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

// 出荷対象ファイル（リポジトリ実体）を列挙する。
function shippedFiles() {
  const files = ['index.html', 'styles.css', 'manifest.webmanifest'];
  for (const dir of ['src/ui', 'src/calc']) {
    for (const f of readdirSync(join(ROOT, dir))) {
      if (f.endsWith('.js')) files.push(`${dir}/${f}`);
    }
  }
  for (const f of readdirSync(join(ROOT, 'assets'))) {
    if (f.endsWith('.png')) files.push(`assets/${f}`);
  }
  return files;
}

describe('sw.js ASSETS と出荷ファイルの突合', () => {
  const assets = readAssets();

  it("エントリはすべて './' 始まりの相対パス（絶対パス禁止の不変条件）", () => {
    for (const a of assets) {
      expect(a.startsWith('./'), `${a} は './' 始まりであること`).toBe(true);
    }
  });

  it('全エントリが実在する（欠けると addAll 全体が失敗し更新が止まる）', () => {
    for (const a of assets) {
      if (a === './') continue; // ナビゲーションルート
      expect(existsSync(join(ROOT, a.slice(2))), `${a} が存在すること`).toBe(true);
    }
  });

  it('出荷対象（html/css/manifest/src JS/assets PNG）が漏れなく掲載されている', () => {
    const listed = new Set(assets.map((a) => a.replace(/^\.\//, '')));
    for (const f of shippedFiles()) {
      expect(listed.has(f), `${f} が ASSETS に掲載されていること`).toBe(true);
    }
  });
});
