// format.js — 表示用の整形ヘルパ（和暦併記・日付パース）。

// 西暦→令和年（令和元年=2019）。
function reiwa(y) {
  return y - 2018;
}

// 2026年5月30日（令和8年5月30日）の形式。
export function formatDateWithWareki(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const r = reiwa(y);
  const wa = r === 1 ? '令和元年' : `令和${r}年`;
  return `${y}年${m}月${d}日（${wa}${m}月${d}日）`;
}

// 'YYYY-MM-DD' → ローカル(JST)の Date。input[type=date] の値用。
export function parseDateInput(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
