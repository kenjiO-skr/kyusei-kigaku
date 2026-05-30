// direction.js — 凶殺判定＋吉方位判定（流派A・ADR-001）
// 採用凶殺：五黄殺／暗剣殺／破（歳破・月破・日破）／本命殺／本命的殺／八方塞がり。
//   定位対冲・小児殺・月命殺は不採用（流派A）。
// 吉方位（流派A・本命=二黒＝土）：凶殺非該当のうち
//   生気(火=九紫)・比和(土=二黒/八白) → 吉／退気(金=六白/七赤) → 中立／殺気(木)・死気(水) → 小凶。
import { OPPOSITE_DIR, PALACES, STAR_ELEMENT, BRANCH_DIR, STAR } from './constants.js';
import { dirOfStar } from './board.js';
import { elementRelation } from './compatibility.js';

// その盤の凶殺方位を返す。dir → 該当した凶殺名の配列。
//   board: placeStars の結果, branch: 盤の十二支(0=子, 年盤=歳/月盤=月/日盤=日),
//   honmei: 本命星, breakName: 破の呼称（'歳破'|'月破'|'日破'）。
export function killDirections(board, branch, honmei, breakName = '破') {
  const kills = {};
  const add = (dir, name) => {
    if (!dir || dir === 'center') return; // 中宮は方位判定の対象外
    (kills[dir] ||= []).push(name);
  };

  // 五黄殺＝五黄の回座方位／暗剣殺＝その対冲（中宮が五黄の盤では五黄殺・暗剣殺なし）。
  const goOuDir = dirOfStar(board, STAR.FIVE_YELLOW);
  if (goOuDir && goOuDir !== 'center') {
    add(goOuDir, '五黄殺');
    add(OPPOSITE_DIR[goOuDir], '暗剣殺');
  }

  // 破＝盤の十二支の対冲方位。
  add(OPPOSITE_DIR[BRANCH_DIR[branch]], breakName);

  // 本命殺＝本命星の回座方位／本命的殺＝その対冲。
  //   本命星が中宮 → 八方塞がり（全方位凶）。
  const honmeiDir = dirOfStar(board, honmei);
  if (honmeiDir === 'center') {
    for (const dir of PALACES) add(dir, '八方塞がり');
  } else {
    add(honmeiDir, '本命殺');
    add(OPPOSITE_DIR[honmeiDir], '本命的殺');
  }

  return kills;
}

// 流派Aの五行関係 → 吉凶ランク。
function rankByElement(relation) {
  if (relation === '生気' || relation === '比和') return '吉';
  if (relation === '退気') return '中立';
  return '小凶'; // 殺気・死気
}

// 八方位の最終判定。dir → { verdict, star, relation, kills }。
//   verdict: 吉 | 中立 | 小凶 | 凶（凶殺該当）。中宮は含めない。
export function judgeDirections(board, branch, honmei, breakName = '破') {
  const kills = killDirections(board, branch, honmei, breakName);
  const honmeiElem = STAR_ELEMENT[honmei];
  const result = {};
  for (const dir of PALACES) {
    const star = board[dir];
    const k = kills[dir];
    if (k && k.length) {
      result[dir] = { verdict: '凶', star, relation: null, kills: k };
      continue;
    }
    const relation = elementRelation(honmeiElem, STAR_ELEMENT[star]);
    result[dir] = { verdict: rankByElement(relation), star, relation, kills: [] };
  }
  return result;
}
