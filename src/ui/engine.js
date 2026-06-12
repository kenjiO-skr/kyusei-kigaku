// engine.js — 計算エンジン(src/calc)を画面用のビューモデルに変換する層。
// calc は純関数のまま保ち、UI都合の組み立てはここに集約する。
import { STAR_ELEMENT, ELEMENT_NAMES, DIR_NAMES, PALACES } from '../calc/constants.js';
import { solarYearOf, solarMonthOf, sexagenaryDayIndex, dayBoard } from '../calc/calendar.js';
import { yearStar, honmeiStar, getsumeiStar, monthBoardCenter, keishaPalace } from '../calc/honmei.js';
import { placeStars } from '../calc/board.js';
import { judgeDirections } from '../calc/direction.js';
import { fortuneOf, fortuneLayers } from '../calc/fortune.js';
import { compatibility } from '../calc/compatibility.js';

export function elementName(star) {
  return ELEMENT_NAMES[STAR_ELEMENT[star]];
}

// 本命星診断（本命・月命・傾斜）。birthDate 必須、sex は傾斜の中宮特例に使用。
export function diagnose(birthDate, sex) {
  const honmei = honmeiStar(birthDate);
  const getsumei = getsumeiStar(birthDate);
  const keisha = keishaPalace(honmei, getsumei, sex);
  return { honmei, getsumei, keisha };
}

// 盤のビューモデル。period: 'day' | 'month' | 'year'。範囲外は { error } を返す。
// birth = { date: Date, sex } を渡すと運勢に多層（月命/傾斜/五行）を付与する（後方互換）。
export function boardModel(date, honmei, period, birth = null) {
  try {
    let center;
    let branch;
    let breakName;
    let label;
    let ton = null;
    if (period === 'year') {
      const sy = solarYearOf(date);
      center = yearStar(sy);
      branch = (((sy - 4) % 12) + 12) % 12;
      breakName = '歳破';
      label = `${sy}年（年盤）`;
    } else if (period === 'month') {
      const sm = solarMonthOf(date);
      center = monthBoardCenter(sm.solarYear, sm.monthIndex);
      branch = sm.branch;
      breakName = '月破';
      label = `${date.getMonth() + 1}月（月盤）`;
    } else {
      const db = dayBoard(date);
      center = db.center;
      ton = db.ton;
      branch = sexagenaryDayIndex(date) % 12;
      breakName = '日破';
      label = `${date.getMonth() + 1}月${date.getDate()}日（日盤）`;
    }
    const board = placeStars(center);
    const judged = judgeDirections(board, branch, honmei, breakName);
    let fortune = fortuneOf(honmei, board);
    if (birth && birth.date) {
      const getsumei = getsumeiStar(birth.date);
      const keisha = keishaPalace(honmei, getsumei, birth.sex);
      fortune = { ...fortune, layers: fortuneLayers(honmei, getsumei, keisha, board) };
    }
    const goodDirs = PALACES.filter((d) => judged[d].verdict === '吉').map((d) => DIR_NAMES[d]);
    const badDirs = PALACES.filter((d) => judged[d].verdict === '凶').map((d) => DIR_NAMES[d]);
    return { center, board, judged, fortune, breakName, ton, label, goodDirs, badDirs };
  } catch (e) {
    return { error: e instanceof RangeError ? e.message : String(e) };
  }
}

// 相性（本命星どうし）。
export function compatModel(birthA, birthB) {
  const a = honmeiStar(birthA);
  const b = honmeiStar(birthB);
  return { a, b, result: compatibility(a, b) };
}
