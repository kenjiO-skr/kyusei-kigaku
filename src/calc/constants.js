// constants.js — 九星・五行・後天定位・方位・十二支の定数テーブル
// 出典：仕様メモ §1。マジックナンバー直書きを避け、全モジュールはここを参照する。

// 九星番号 1..9（1=一白 … 9=九紫）
export const STAR = {
  ONE_WHITE: 1, // 一白水星
  TWO_BLACK: 2, // 二黒土星
  THREE_JADE: 3, // 三碧木星
  FOUR_GREEN: 4, // 四緑木星
  FIVE_YELLOW: 5, // 五黄土星
  SIX_WHITE: 6, // 六白金星
  SEVEN_RED: 7, // 七赤金星
  EIGHT_WHITE: 8, // 八白土星
  NINE_PURPLE: 9, // 九紫火星
};

// 九星名（番号→表示名）
export const STAR_NAMES = {
  1: '一白水星',
  2: '二黒土星',
  3: '三碧木星',
  4: '四緑木星',
  5: '五黄土星',
  6: '六白金星',
  7: '七赤金星',
  8: '八白土星',
  9: '九紫火星',
};

// 五行
export const ELEMENT = {
  WATER: 'water', // 水
  EARTH: 'earth', // 土
  WOOD: 'wood', // 木
  METAL: 'metal', // 金
  FIRE: 'fire', // 火
};

export const ELEMENT_NAMES = {
  water: '水',
  earth: '土',
  wood: '木',
  metal: '金',
  fire: '火',
};

// 九星 → 五行
export const STAR_ELEMENT = {
  1: ELEMENT.WATER, // 一白=水
  2: ELEMENT.EARTH, // 二黒=土
  3: ELEMENT.WOOD, // 三碧=木
  4: ELEMENT.WOOD, // 四緑=木
  5: ELEMENT.EARTH, // 五黄=土
  6: ELEMENT.METAL, // 六白=金
  7: ELEMENT.METAL, // 七赤=金
  8: ELEMENT.EARTH, // 八白=土
  9: ELEMENT.FIRE, // 九紫=火
};

// 八方位＋中央（キーは 'center' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'）
export const DIR_NAMES = {
  center: '中宮',
  n: '北',
  ne: '北東',
  e: '東',
  se: '南東',
  s: '南',
  sw: '南西',
  w: '西',
  nw: '北西',
};

// 八方位の対冲（真反対）。破・暗剣殺・本命的殺で使用。
export const OPPOSITE_DIR = {
  n: 's',
  s: 'n',
  e: 'w',
  w: 'e',
  ne: 'sw',
  sw: 'ne',
  se: 'nw',
  nw: 'se',
};

// 後天定位盤：方位 → その方位を定位とする九星（定位星 d）。中宮=五黄。
// 洛書（縦横斜めの和=15）：SE4 S9 SW2 / E3 中5 W7 / NE8 N1 NW6
export const HOME_STAR_BY_DIR = {
  center: 5,
  n: 1,
  ne: 8,
  e: 3,
  se: 4,
  s: 9,
  sw: 2,
  w: 7,
  nw: 6,
};

// 方位 → 後天定位の宮名（傾斜診断の表示に使用。仕様メモ§1）。
export const PALACE_NAMES = {
  center: '中宮',
  n: '坎宮',
  ne: '艮宮',
  e: '震宮',
  se: '巽宮',
  s: '離宮',
  sw: '坤宮',
  w: '兌宮',
  nw: '乾宮',
};

// 九星 → 後天定位の方位（HOME_STAR_BY_DIR の逆引き）
export const HOME_DIR_BY_STAR = {
  1: 'n',
  2: 'sw',
  3: 'e',
  4: 'se',
  5: 'center',
  6: 'nw',
  7: 'w',
  8: 'ne',
  9: 's',
};

// 飛泊の対象となる八宮（中宮を除く）。盤配置の反復に使う。
export const PALACES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

// 十二支 → 方位（仕様メモ §4）。番号は 0=子 … 11=亥。
// 丑寅=北東、辰巳=南東、未申=南西、戌亥=北西に同居。
export const BRANCH_DIR = {
  0: 'n', // 子=北
  1: 'ne', // 丑=北東
  2: 'ne', // 寅=北東
  3: 'e', // 卯=東
  4: 'se', // 辰=南東
  5: 'se', // 巳=南東
  6: 's', // 午=南
  7: 'sw', // 未=南西
  8: 'sw', // 申=南西
  9: 'w', // 酉=西
  10: 'nw', // 戌=北西
  11: 'nw', // 亥=北西
};
