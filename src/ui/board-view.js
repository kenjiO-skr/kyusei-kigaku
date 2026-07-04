// board-view.js — 3×3 方位盤の描画。南上デフォルト＋北上切替（CLAUDE.md 不変条件§7）。
// 配色は規約固定：吉=緑／凶=赤／小凶・中立=グレー／本命星セル=紫枠。
import { STAR_NAMES, DIR_NAMES } from '../calc/constants.js';
import { term } from './glossary.js';

// セルの並び（行優先 3×3）。
const LAYOUT = {
  south: ['se', 's', 'sw', 'e', 'center', 'w', 'ne', 'n', 'nw'], // 南上（下が北）
  north: ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'], // 北上
};

// 判定 → セル/バッジのクラス。
function verdictClass(verdict) {
  if (verdict === '吉') return { cell: 'cell--good', badge: 'v-good' };
  if (verdict === '凶') return { cell: 'cell--bad', badge: 'v-bad' };
  return { cell: 'cell--neutral', badge: 'v-neutral' }; // 小凶・中立
}

function cellHtml(dir, model) {
  if (dir === 'center') {
    return `<div class="cell cell--center">
      <span class="cell__dir">中宮</span>
      <span class="cell__star">${STAR_NAMES[model.center]}</span>
    </div>`;
  }
  const j = model.judged[dir];
  const cls = verdictClass(j.verdict);
  const isHonmei = model.fortune.dir === dir;
  const kills = j.kills.length
    ? `<span class="cell__kill">${j.kills.map((k) => term(k)).join(' ')}</span>`
    : '';
  // 中立と小凶は配色規約(§6)で同じグレー。色以外の手がかりとして小凶に下向きマークを添える。
  const mark = j.verdict === '小凶' ? '<span class="cell__mark" aria-hidden="true">↘</span>' : '';
  return `<div class="cell ${cls.cell}${isHonmei ? ' cell--honmei' : ''}">
    ${isHonmei ? '<span class="cell__honmei-tag">本命</span>' : ''}
    <span class="cell__dir">${DIR_NAMES[dir]}</span>
    <span class="cell__star">${STAR_NAMES[j.star]}</span>
    <span class="cell__verdict ${cls.badge}">${j.verdict}${mark}</span>
    ${kills}
  </div>`;
}

// 方位盤の HTML を返す。orientation: 'south' | 'north'。
export function renderBoard(model, orientation) {
  const layout = LAYOUT[orientation] || LAYOUT.south;
  const cells = layout.map((dir) => cellHtml(dir, model)).join('');
  const topLabel = orientation === 'south' ? '上が南／下が北' : '上が北／下が南';
  return `
    <div class="compass">▲ ${topLabel}</div>
    <div class="board">${cells}</div>
    <div class="legend">
      <span class="lg-good">吉</span>
      <span class="lg-neutral">中立</span>
      <span class="lg-neutral">小凶 ↘</span>
      <span class="lg-bad">凶</span>
      <span class="lg-honmei">本命星の位置</span>
    </div>`;
}

export { LAYOUT };
