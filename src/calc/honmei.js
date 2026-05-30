// honmei.js — 本命星・月命星・傾斜宮
// 算出ロジックの正は「九星気学アプリ_仕様メモ」§2・§3（流派A=園田系標準, ADR-001）。
//   本命星：西暦各桁和→1桁化→(11−その数)→1桁化。立春起点（1/1〜立春前日は前年）。1971=二黒。
//   月命星：生まれ節月の月盤中宮。寅月起点は年の十二支3分類、陰遁(−1)/月。
//   傾斜宮：本命星を中宮に置いた盤で月命星が回座する宮（中宮特例は要確認）。
import { solarYearOf, solarMonthOf } from './calendar.js';
import { placeStars, dirOfStar } from './board.js';
import { HOME_STAR_BY_DIR, PALACE_NAMES, DIR_NAMES, STAR_NAMES } from './constants.js';

// 数字根：1桁になるまで各桁を加算。
function digitalRoot(n) {
  while (n > 9) {
    let s = 0;
    while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
    n = s;
  }
  return n;
}

// 年家九星（その年生まれの本命星＝年盤の中宮星）。引数は節年（立春年）。
// 11 − digitalRoot(year) を 1〜9 に正規化（11−s が 10 になるのは s=1 のときのみ → 一白）。
export function yearStar(solarYear) {
  const s = digitalRoot(solarYear);
  return ((10 - s) % 9) + 1;
}

// 本命星（立春起点）。1971 → 二黒(2)。
export function honmeiStar(birthDate) {
  return yearStar(solarYearOf(birthDate));
}

// 年の十二支（0=子）→ 寅月(月盤の最初の節月)の中宮基準星（仕様メモ§3）。
//   子・午・卯・酉 → 八白 / 辰・戌・丑・未 → 五黄 / 寅・申・巳・亥 → 二黒
function monthBaseStar(yearBranch) {
  if ([0, 6, 3, 9].includes(yearBranch)) return 8; // 子午卯酉
  if ([4, 10, 1, 7].includes(yearBranch)) return 5; // 辰戌丑未
  return 2; // 寅申巳亥（2,8,5,11）
}

// 月盤の中宮星。節年 solarYear・節月 monthIndex(0=寅月…11=丑月)。寅月基準から陰遁(−1)/月。
export function monthBoardCenter(solarYear, monthIndex) {
  const yearBranch = (((solarYear - 4) % 12) + 12) % 12;
  const base = monthBaseStar(yearBranch);
  return (((base - 1 - monthIndex) % 9) + 9) % 9 + 1;
}

// 月命星 = 生まれ節月の月盤中宮。
export function getsumeiStar(birthDate) {
  const { solarYear, monthIndex } = solarMonthOf(birthDate);
  return monthBoardCenter(solarYear, monthIndex);
}

// 傾斜宮：本命星を中宮に置いた盤で月命星が回座する方位＝傾斜宮（園田系）。
//   月命星＝本命星（中宮回座）の特例：男性=兌宮(西)／女性=乾宮(北西)。
//   ※特例の男女割当は流派差あり＝要確認（仕様メモ§2）。
// 戻り値: { dir, star（その方位の後天定位星）, palace（宮名）, dirName }
export function keishaPalace(honmei, getsumei, sex /* 'male' | 'female' */) {
  const board = placeStars(honmei);
  let dir = dirOfStar(board, getsumei);
  if (dir === 'center') {
    dir = sex === 'female' ? 'nw' : 'w';
  }
  const star = HOME_STAR_BY_DIR[dir];
  return { dir, star, palace: PALACE_NAMES[dir], dirName: DIR_NAMES[dir], starName: STAR_NAMES[star] };
}
