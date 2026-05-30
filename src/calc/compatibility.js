// compatibility.js — 五行の相生・相剋関係と相性診断（機能④）
// 相生：木→火→土→金→水→木 ／ 相剋：木剋土・土剋水・水剋火・火剋金・金剋木（仕様メモ§1）。
import { ELEMENT, STAR_ELEMENT, ELEMENT_NAMES, STAR_NAMES } from './constants.js';

// 各五行が「生む」相手（相生）。
const GENERATES = {
  [ELEMENT.WOOD]: ELEMENT.FIRE,
  [ELEMENT.FIRE]: ELEMENT.EARTH,
  [ELEMENT.EARTH]: ELEMENT.METAL,
  [ELEMENT.METAL]: ELEMENT.WATER,
  [ELEMENT.WATER]: ELEMENT.WOOD,
};

// 各五行が「剋す」相手（相剋）。
const CONQUERS = {
  [ELEMENT.WOOD]: ELEMENT.EARTH,
  [ELEMENT.EARTH]: ELEMENT.WATER,
  [ELEMENT.WATER]: ELEMENT.FIRE,
  [ELEMENT.FIRE]: ELEMENT.METAL,
  [ELEMENT.METAL]: ELEMENT.WOOD,
};

// 自分(mine)の五行から見た相手(other)の五行の関係（気学の気の呼称）。
//   比和（同気）／生気（相手が自分を生む）／退気（自分が相手を生む）
//   殺気（相手が自分を剋す）／死気（自分が相手を剋す）
export function elementRelation(mine, other) {
  if (mine === other) return '比和';
  if (GENERATES[other] === mine) return '生気';
  if (GENERATES[mine] === other) return '退気';
  if (CONQUERS[other] === mine) return '殺気';
  if (CONQUERS[mine] === other) return '死気';
  return '不明'; // 五行は5種で必ずどれかに該当（保険）
}

// 相性診断（機能④）。starA から見た starB との五行関係を返す。
//   比和=安定／相生(生気・退気)=良相性／相剋(殺気・死気)=注意。
export function compatibility(starA, starB) {
  const ea = STAR_ELEMENT[starA];
  const eb = STAR_ELEMENT[starB];
  const rel = elementRelation(ea, eb);
  let kind;
  if (rel === '比和') kind = '比和';
  else if (rel === '生気' || rel === '退気') kind = '相生';
  else kind = '相剋';
  return {
    kind, // 比和 | 相生 | 相剋
    relation: rel, // 比和 | 生気 | 退気 | 殺気 | 死気
    starA: STAR_NAMES[starA],
    starB: STAR_NAMES[starB],
    elementA: ELEMENT_NAMES[ea],
    elementB: ELEMENT_NAMES[eb],
  };
}
