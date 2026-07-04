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
  center: '🛡️ 八方塞がりの守りの時期とされます。新しく広げるより、今あるものを整えて力をためたいタイミング。焦らずメンテナンスに徹すると、次の巡りで動きやすくなるそう。',
  n: '❄️ 冬の水のように静かに沈む、内省・充電の時期とされます。表で目立つより、足元をコツコツ固めるのが向くタイミング。ひとりの時間で英気を養うと吉。',
  ne: '⛰️ 変化・転換の節目とされます。片づけ・引き継ぎ・仕切り直しがはかどりやすい時。古いものを手放すほど、新しい流れが入ってきやすいそう。',
  e: '⚡ 発展・活動・始動の勢いがある時期とされます。情報や発言がよく動き、スタートダッシュに向くタイミング。思い立ったら動くと波に乗りやすいそう。',
  se: '🍃 信用と人間関係が整いやすい時期とされます。縁つなぎや交渉、整えごとに向くタイミング。ていねいなやりとりが、のちの大きな信頼につながるそう。',
  s: '🔥 光と影がくっきり出る、名誉・発覚の時期とされます。良いことは評価されやすい一方、隠しごとも露わになりやすいタイミング。オープンでいるほど追い風になるそう。',
  sw: '🌱 地道な努力がものを言う、準備・土台づくりの時期とされます。家庭や生活の基盤を整えるのに向くタイミング。派手さより積み重ねが、のちの実りにつながるそう。',
  w: '💰 金銭・飲食・楽しみごとに縁がある、うるおいの時期とされます。喜び事が増えやすい一方、出費や油断もふくらみやすいタイミング。楽しみつつ財布のひもは意識すると◎。',
  nw: '🌟 目上や公の場と縁が強まり、決断を任されやすい主役の時期とされます。責任ある役割やリーダー役が回ってきやすいタイミング。ここぞは堂々と前へ、ただし気が張るので休息もお忘れなく。',
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
  比和: '🤝 同じ気が重なって、地に足がつく安定の巡りとされます。今いる場所と波長が合い、無理なく力を出しやすい時。いつものペースを大切にすると吉。',
  生気: '🌟 まわりから気を分けてもらえる、追い風の巡りとされます。助けや引き立てを受けやすく、動けば応援がつきやすい時。遠慮せず頼るのも吉。',
  退気: '🔋 気が外へ漏れやすく、出すより充電に向く巡りとされます。がんばりすぎると空回りしがちな時。守りを固めて英気を養うと吉。',
  殺気: '⚠️ 抑えを受けやすく、無理押しが通りにくい巡りとされます。強引に進めるより、いったん様子を見るのが向く時。焦らず時を待つと吉。',
  死気: '🍃 こちらが気を使って消耗しやすい巡りとされます。欲張らず、手元を整えることに力を向けたい時。守りに徹すると消耗を抑えられるそう。',
};

// 本命が中宮（八方塞がり）のとき：同会は取らない。
const ELEMENT_QUALITY_CLOSED = '🛡️ 八方塞がりのため同会は取りません。新規を広げるより、守り・充電に向く時期とされます。';

// 月命星が中宮に回座したときの傾向。
const GETSUMEI_CENTER = '🏠 内面の星が中心に集まり、外向きより内側の充実・足元固めに向く時期とされます。';

// 傾斜（生まれ持った宮）→ 性質の色付け。運勢の多層表示と本命診断の説明で共用。
export const KEISHA_LENS = {
  n: '💧 水の宮（坎）。内省的で粘り強く、静かなところで底力を発揮するタイプとされます。',
  ne: '⛰️ 山の宮（艮）。変化や節目に強く、転換期にこそ本領を出すタイプとされます。',
  e: '⚡ 雷の宮（震）。行動的で発信力があり、勢いに乗って動くタイプとされます。',
  se: '🍃 風の宮（巽）。人との縁や調整を大切にし、信用を積んで進むタイプとされます。',
  s: '🔥 火の宮（離）。情熱的で表現力があり、明暗がはっきり出るタイプとされます。',
  sw: '🌱 地の宮（坤）。受容的で堅実、コツコツ積み上げるタイプとされます。',
  w: '🌸 沢の宮（兌）。社交的で楽しみ上手、言葉で場を和ませるタイプとされます。',
  nw: '🌟 天の宮（乾）。主導的で責任感が強く、決断で人を導くタイプとされます。',
};

// 本命と月命で向きが分かれたときの注記。
const DIVERGENCE_NOTE =
  '🔀 本命（表の運気）と月命（内面・家庭の運気）で向きが分かれています。外向きの動きと内側の整えを切り分けると、読み違えにくいとされます。';

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
