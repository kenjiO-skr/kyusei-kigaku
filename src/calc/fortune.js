// fortune.js — 本命星の各盤での回座位置から運勢を読む（機能②）
// 本命星が中宮 → 八方塞がり（守りの時期）。各宮 → 宮ごとの象意。自分用は二黒の回座位置のみで足りる。
// 象意は占術理論（検証可能な事実ではない）。簡潔・断定を避けた傾向表現にとどめる。
import { dirOfStar } from './board.js';
import { DIR_NAMES, PALACE_NAMES } from './constants.js';

// 方位（回座先）→ 運気の傾向（短い象意）。中宮は八方塞がり。
const FORTUNE_TENDENCY = {
  center: '八方塞がり。新規より現状維持・充電に向く守りの時期とされる。',
  n: '停滞・内省・充電の時期とされる。表に出るより足元を固める。',
  ne: '変化・転換の時期とされる。整理や引き継ぎに向くという。',
  e: '発展・活動・始動の時期とされる。情報や発言が動きやすい。',
  se: '信用・人間関係が整いやすい時期とされる。縁や交渉に向くという。',
  s: '名誉・発覚・別離の時期とされる。表面化しやすく公私が露わになりやすい。',
  sw: '地道な努力・準備の時期とされる。家庭や基盤づくりに向くという。',
  w: '金銭・飲食・喜び事の時期とされる。一方で出費や油断にも注意とされる。',
  nw: '目上・公的・決断の時期とされる。責任やリーダー役が回りやすいという。',
};

// 本命星が board のどこに回座するかから運勢傾向を返す。
//   { dir, isClosed（八方塞がり）, dirName, palace, tendency }
export function fortuneOf(honmei, board) {
  const dir = dirOfStar(board, honmei);
  const isClosed = dir === 'center';
  return {
    dir,
    isClosed,
    dirName: DIR_NAMES[dir],
    palace: PALACE_NAMES[dir],
    tendency: FORTUNE_TENDENCY[dir],
  };
}
