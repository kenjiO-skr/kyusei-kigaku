// fortune.js — 本命星の各盤での回座位置から運勢を読む（機能②）
// 本命星が中宮 → 八方塞がり（守りの時期）。各宮 → 宮ごとの象意。自分用は二黒の回座位置のみで足りる。
// 象意は占術理論（検証可能な事実ではない）。簡潔・断定を避けた傾向表現にとどめる。
import { dirOfStar } from './board.js';
import {
  DIR_NAMES,
  PALACE_NAMES,
  STAR_ELEMENT,
  ELEMENT_NAMES,
  STAR_NAMES,
  HOME_STAR_BY_DIR,
} from './constants.js';
import { elementRelation } from './compatibility.js';

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

// 総合運勢（流派準拠4段階）。同会（回座宮の定位星との五行関係）から導出。
//   生気・比和=吉／退気=平／殺気・死気=小凶／八方塞がり=守り（ADR-001 の方位判定と同じ尺度）。
const RATING_BY_RELATION = { 生気: '吉', 比和: '吉', 退気: '平', 殺気: '小凶', 死気: '小凶' };

// 本命星が board のどこに回座するかから運勢傾向を返す。
//   { dir, isClosed（八方塞がり）, dirName, palace, tendency, rating }
export function fortuneOf(honmei, board) {
  const dir = dirOfStar(board, honmei);
  const isClosed = dir === 'center';
  const rating = isClosed
    ? '守り'
    : RATING_BY_RELATION[elementRelation(STAR_ELEMENT[honmei], STAR_ELEMENT[HOME_STAR_BY_DIR[dir]])];
  return {
    dir,
    isClosed,
    dirName: DIR_NAMES[dir],
    palace: PALACE_NAMES[dir],
    tendency: FORTUNE_TENDENCY[dir],
    rating,
  };
}

// === 運勢多層化（本命/月命/傾斜/五行・同会） ==========================
// 中庸B：本命=主／月命=補助線／傾斜=色付け／五行=質。いずれも補助的解釈で流派差あり。
// 比率合成はせず定性併記する（割れは明示し単一判定を出さない）。

// 五行関係 → 運気の向き（定性）。
const POLARITY = { 比和: '上向き', 生気: '上向き', 退気: '横ばい', 殺気: '下向き', 死気: '下向き' };

// 五行関係 → 同会の質（断定を避けた傾向表現）。
const ELEMENT_QUALITY = {
  比和: '同じ気が重なり、地に足がついて安定しやすい時期とされる。',
  生気: '気を分けてもらい、後押しや助けを受けやすい時期とされる。',
  退気: '気が外へ漏れやすく、出すより守り・充電に向く時期とされる。',
  殺気: '抑えを受けやすく、無理押しを避けて様子を見たい時期とされる。',
  死気: 'こちらが気を使い消耗しやすく、欲張らず整える時期とされる。',
};

// 本命が中宮（八方塞がり）のとき：同会は取らない。
const ELEMENT_QUALITY_CLOSED = '八方塞がりのため同会は取らず、新規より守り・充電に向く時期とされる。';

// 月命星が中宮に回座したときの傾向。
const GETSUMEI_CENTER = '内面の星が中心に集まり、外より内側の充実・足元固めに向く時期とされる。';

// 傾斜（生まれ持った宮）→ 性質の色付け。運勢の多層表示と本命診断の説明で共用。
export const KEISHA_LENS = {
  n: '水の宮（坎）。内省的で粘り強く、静かに底力を出すタイプとされる。',
  ne: '山の宮（艮）。変化・節目に強く、転換期にこそ力を発揮するタイプとされる。',
  e: '雷の宮（震）。行動的で発信力があり、勢いで動くタイプとされる。',
  se: '風の宮（巽）。人との縁・調整を大切にし、信用を積んで進むタイプとされる。',
  s: '火の宮（離）。情熱的で表現力があり、明暗がはっきり出やすいタイプとされる。',
  sw: '地の宮（坤）。受容的で堅実、地道に積み上げるタイプとされる。',
  w: '沢の宮（兌）。社交的で楽しみ上手、言葉で場を和ませるタイプとされる。',
  nw: '天の宮（乾）。主導的で責任感が強く、決断で人を導くタイプとされる。',
};

// 本命と月命で向きが分かれたときの注記。
const DIVERGENCE_NOTE =
  '本命（表の運気）と月命（内面・家庭の運気）で向きが分かれています。外向きの動きと内側の整えを切り分けると読み違えにくいとされます。';

// 同会（本命の回座宮の定位星との五行関係）を返す。生年月日を必要とせず星単独で取れる。
//   { honmeiElement, doukaiStar, doukaiStarName, doukaiElement, relation, quality }
//   中宮（八方塞がり）のときは同会を取らず relation=null。
export function doukaiOf(honmei, board) {
  const dir = dirOfStar(board, honmei);
  const honmeiElement = ELEMENT_NAMES[STAR_ELEMENT[honmei]];
  if (dir === 'center') {
    return {
      honmeiElement,
      doukaiStar: null,
      doukaiStarName: null,
      doukaiElement: null,
      relation: null,
      quality: ELEMENT_QUALITY_CLOSED,
    };
  }
  const doukaiStar = HOME_STAR_BY_DIR[dir];
  const relation = elementRelation(STAR_ELEMENT[honmei], STAR_ELEMENT[doukaiStar]);
  return {
    honmeiElement,
    doukaiStar,
    doukaiStarName: STAR_NAMES[doukaiStar],
    doukaiElement: ELEMENT_NAMES[STAR_ELEMENT[doukaiStar]],
    relation,
    quality: ELEMENT_QUALITY[relation],
  };
}

// 多層運勢を返す。honmei,getsumei: 1..9 ／ keisha: keishaPalace の戻り（null 可）／ board: placeStars の結果。
//   { basePolarity, getsumei, keishaLens, element, divergence }
export function fortuneLayers(honmei, getsumei, keisha, board) {
  const dir = dirOfStar(board, honmei);

  // 五行（本命の同会）。本命が中宮なら同会は取らず守り。
  const element = doukaiOf(honmei, board);
  const basePolarity = dir === 'center' ? '守り' : POLARITY[element.relation];

  // 月命層。
  const gdir = dirOfStar(board, getsumei);
  const isCenter = gdir === 'center';
  const tendency = isCenter ? GETSUMEI_CENTER : FORTUNE_TENDENCY[gdir];
  const polarity = isCenter
    ? '守り'
    : POLARITY[elementRelation(STAR_ELEMENT[getsumei], STAR_ELEMENT[HOME_STAR_BY_DIR[gdir]])];
  const getsumeiLayer = {
    star: getsumei,
    starName: STAR_NAMES[getsumei],
    dir: gdir,
    isCenter,
    dirName: DIR_NAMES[gdir],
    palace: PALACE_NAMES[gdir],
    tendency,
    polarity,
  };

  // 傾斜（色付け）。
  const keishaLens = keisha
    ? { palace: keisha.palace, starName: keisha.starName, note: KEISHA_LENS[keisha.dir] }
    : null;

  // 割れ判定（上向きと下向きが本命・月命で分かれたとき）。
  const isSplit =
    (basePolarity === '上向き' && getsumeiLayer.polarity === '下向き') ||
    (basePolarity === '下向き' && getsumeiLayer.polarity === '上向き');
  const divergence = { isSplit, note: isSplit ? DIVERGENCE_NOTE : null };

  return {
    basePolarity,
    getsumei: getsumeiLayer,
    keishaLens,
    element,
    divergence,
  };
}
