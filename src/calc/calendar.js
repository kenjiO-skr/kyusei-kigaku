// calendar.js — 日付→節年（立春境界）・節月（節入り境界）・60干支日
// 入力 Date は JST の暦日（年月日）として扱う。判定は日付のみで行い時刻は使わない。
// 暦点は calendar-data.js（Phase 2 で天文計算×NAOJ公表値を相互反証して確定）に従う。
import { SOLAR_TERMS, SOLSTICES, SEXAGENARY_ANCHOR, CALENDAR_COVERAGE } from './calendar-data.js';

// Date → { y, m, d }（m は 1〜12）。
function ymd(date) {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}

// (m,d) の前後比較：a<b → -1, a==b → 0, a>b → 1。
function cmpMD(am, ad, bm, bd) {
  if (am !== bm) return am < bm ? -1 : 1;
  if (ad !== bd) return ad < bd ? -1 : 1;
  return 0;
}

// (年,月,日) の前後比較。
function cmpYMD(ay, am, ad, by, bm, bd) {
  if (ay !== by) return ay < by ? -1 : 1;
  return cmpMD(am, ad, bm, bd);
}

function assertCovered(y) {
  const [lo, hi] = CALENDAR_COVERAGE.solarTerms;
  if (y < lo || y > hi) {
    throw new RangeError(`暦データ範囲外: ${y}年（対応 ${lo}–${hi}年）`);
  }
}

// 立春起点の節年。1/1〜立春前日は前年扱い（本命星・年盤の年境界）。
export function solarYearOf(date) {
  const { y, m, d } = ymd(date);
  assertCovered(y);
  const [lm, ld] = SOLAR_TERMS[y][1]; // 立春 = SOLAR_TERMS[y] の index 1（2月）
  return cmpMD(m, d, lm, ld) < 0 ? y - 1 : y;
}

// 節月の十二支（monthIndex 0=寅月 … 11=丑月）→ 十二支番号(0=子)。寅=2 起点。
function branchOfMonthIndex(monthIndex) {
  return (monthIndex + 2) % 12;
}

// 日付→節月。{ solarYear（節年=立春年）, monthIndex（0=寅月…11=丑月）, branch（十二支0=子） }。
// 節入り前は前月扱い。1/1〜立春前日は前年の 子月(10) または 丑月(11)。
export function solarMonthOf(date) {
  const { y, m, d } = ymd(date);
  assertCovered(y);
  const solarYear = solarYearOf(date);

  // 節月境界を昇順に並べる。
  //   monthIndex 0..10 = 立春..大雪（SOLAR_TERMS[solarYear] の index 1..11, 暦年=solarYear）
  //   monthIndex 11   = 小寒（SOLAR_TERMS[solarYear+1] の index 0, 暦年=solarYear+1）
  const bounds = [];
  for (let i = 1; i <= 11; i++) {
    bounds.push({ idx: i - 1, cy: solarYear, m: SOLAR_TERMS[solarYear][i][0], d: SOLAR_TERMS[solarYear][i][1] });
  }
  if (SOLAR_TERMS[solarYear + 1]) {
    bounds.push({ idx: 11, cy: solarYear + 1, m: SOLAR_TERMS[solarYear + 1][0][0], d: SOLAR_TERMS[solarYear + 1][0][1] });
  }

  // date 以下で最も遅い境界の monthIndex を採用。
  let monthIndex = 0;
  for (const b of bounds) {
    if (cmpYMD(b.cy, b.m, b.d, y, m, d) <= 0) monthIndex = b.idx;
    else break;
  }
  return { solarYear, monthIndex, branch: branchOfMonthIndex(monthIndex) };
}

// ユリウス通日（Fliegel–Van Flandern 整数式・正午基準）。日干支計算に使用。
export function jdnOf(date) {
  const { y, m, d } = ymd(date);
  return jdnFromYMD(y, m, d);
}

// (y,m,d) からユリウス通日（整数式）。
function jdnFromYMD(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
    - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// JDN → 60干支番号（0=甲子 … 59=癸亥）。
function sexagenaryFromJDN(jdn) {
  return (((jdn - SEXAGENARY_ANCHOR.jdn) % 60) + 60) % 60;
}

// 60干支日の番号（0=甲子 … 59=癸亥）。基準は calendar-data.js の SEXAGENARY_ANCHOR。
export function sexagenaryDayIndex(date) {
  return sexagenaryFromJDN(jdnOf(date));
}

// 日盤の陰遁陽遁（符頭法）。算出規則の出典・検証ログは docs/calendar-data-source.md。
//   冬至＝陽遁(+1)開始（一白）／夏至＝陰遁(−1)開始（九紫）。切替日は二至に最も近い甲子。
//   九星の閏：前の切替から240日間隔になる回だけ、甲子を30日前倒しして甲午とし
//     （間隔210日）、冬至=七赤／夏至=三碧で開始（切替前後で同星が1日重複）。
//   ※yakumoin の公表日盤（2026通常期・2031冬の閏）と全点一致を確認済み。

// 二至の「最も近い甲子」切替（閏補正前の素の切替）。
function rawSolsticeSwitch(year, isWinter) {
  const [m, d] = isWinter ? SOLSTICES[year].winter : SOLSTICES[year].summer;
  const sJdn = jdnFromYMD(year, m, d);
  const K = sexagenaryFromJDN(sJdn);
  const kasiOffset = K <= 30 ? -K : 60 - K; // 最も近い甲子への符号付き日数
  return { jdn: sJdn + kasiOffset, dir: isWinter ? 1 : -1, startStar: isWinter ? 1 : 9, isWinter };
}

// SOLSTICES 全年の切替日チェーン（昇順）。240日間隔の回を閏として甲午へ補正。モジュール1回構築。
const SWITCH_CHAIN = (() => {
  const years = Object.keys(SOLSTICES).map(Number).sort((a, b) => a - b);
  const chain = [];
  for (const y of years) {
    chain.push(rawSolsticeSwitch(y, false)); // 夏至（陰遁）
    chain.push(rawSolsticeSwitch(y, true)); // 冬至（陽遁）
  }
  chain.sort((a, b) => a.jdn - b.jdn);
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].jdn - chain[i - 1].jdn === 240) {
      chain[i].jdn -= 30; // 甲子→甲午（30日前倒し, 間隔240→210）
      chain[i].startStar = chain[i].isWinter ? 7 : 3;
      chain[i].leap = true;
    }
  }
  return chain;
})();

// 日盤の中宮星と遁（陽遁/陰遁）。date 以下で最も遅い切替日から日数で繰る。
// SOLSTICES の範囲（2025–2035）に依存。最初の切替（2025夏至付近）より前は範囲外。
export function dayBoard(date) {
  const j = jdnOf(date);
  let chosen = null;
  for (const s of SWITCH_CHAIN) {
    if (s.jdn <= j && (!chosen || s.jdn > chosen.jdn)) chosen = s;
  }
  if (!chosen) {
    throw new RangeError('日盤データ範囲外（SOLSTICES 2025–2035 の直近の切替日より前）');
  }
  const offset = j - chosen.jdn;
  const center = (((chosen.startStar - 1 + chosen.dir * offset) % 9) + 9) % 9 + 1;
  return { center, ton: chosen.dir === 1 ? '陽遁' : '陰遁', leap: !!chosen.leap };
}

// 日盤中宮の星（1〜9）。
export function dayBoardCenter(date) {
  return dayBoard(date).center;
}
