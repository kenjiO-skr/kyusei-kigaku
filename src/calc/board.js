// board.js — 盤配置（飛泊）エンジン
// 飛泊式（全盤共通・不変条件）：配置星 = ((d − 1 + (k − 5)) を9で正の剰余) + 1
//   k=中宮の星, d=後天定位星。年盤・月盤・日盤すべてこの1関数を使い回す（中宮の星が違うだけ）。
// 中宮の星の算出（年家九星・月盤中宮）は honmei.js 側に集約し、本ファイルは配置のみを担う。
import { HOME_STAR_BY_DIR } from './constants.js';

// 飛泊：中宮の星 k と後天定位星 d から、その宮に回座する星(1〜9)を返す。
// JS の % は負を返すため ((n % 9) + 9) % 9 で正の剰余に正規化してから +1。
export function flyStar(centerStar, homeStar) {
  return (((homeStar - 1 + (centerStar - 5)) % 9) + 9) % 9 + 1;
}

// 中宮 centerStar の盤配置を返す。{ center, n, ne, e, se, s, sw, w, nw } → 各方位の回座星。
// HOME_STAR_BY_DIR は中宮(center=5)を含むので center も飛泊で求まる（flyStar(k,5)=k）。
export function placeStars(centerStar) {
  const board = {};
  for (const dir of Object.keys(HOME_STAR_BY_DIR)) {
    board[dir] = flyStar(centerStar, HOME_STAR_BY_DIR[dir]);
  }
  return board;
}

// 指定の星が回座している方位を返す（傾斜診断・本命星の回座位置に使用）。見つからなければ null。
export function dirOfStar(board, star) {
  for (const [dir, s] of Object.entries(board)) {
    if (s === star) return dir;
  }
  return null;
}
