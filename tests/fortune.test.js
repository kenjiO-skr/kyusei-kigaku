// 運勢（本命星の回座位置）の検証。
import { describe, it, expect } from 'vitest';
import { fortuneOf, fortuneLayers, doukaiOf } from '../src/calc/fortune.js';
import { placeStars } from '../src/calc/board.js';
import { yearStar, keishaPalace } from '../src/calc/honmei.js';

describe('fortuneOf 本命星の回座', () => {
  it('2026年盤で二黒は北西に回座（§2）', () => {
    const board = placeStars(yearStar(2026)); // 一白中宮
    const f = fortuneOf(2, board);
    expect(f.dir).toBe('nw');
    expect(f.isClosed).toBe(false);
    expect(f.dirName).toBe('北西');
    expect(typeof f.tendency).toBe('string');
  });

  it('本命星が中宮の盤は八方塞がり', () => {
    const board = placeStars(2); // 二黒中宮
    const f = fortuneOf(2, board);
    expect(f.dir).toBe('center');
    expect(f.isClosed).toBe(true);
  });
});

describe('fortuneOf 総合運勢 rating（流派準拠4段階・本命=二黒）', () => {
  it('生気・比和 → 吉', () => {
    expect(fortuneOf(2, placeStars(7)).rating).toBe('吉'); // 二黒は南（離宮）＝同会九紫(火)・生気
    expect(fortuneOf(2, placeStars(8)).rating).toBe('吉'); // 二黒は北東（艮宮）＝同会八白(土)・比和
  });

  it('退気 → 平', () => {
    expect(fortuneOf(2, placeStars(yearStar(2026))).rating).toBe('平'); // 北西＝同会六白(金)・退気
  });

  it('殺気・死気 → 小凶', () => {
    expect(fortuneOf(2, placeStars(4)).rating).toBe('小凶'); // 二黒は東（震宮）＝同会三碧(木)・殺気
    expect(fortuneOf(2, placeStars(6)).rating).toBe('小凶'); // 二黒は北（坎宮）＝同会一白(水)・死気
  });

  it('八方塞がり → 守り', () => {
    expect(fortuneOf(2, placeStars(2)).rating).toBe('守り');
  });
});

describe('doukaiOf 同会（星単独・生年月日不要）', () => {
  it('2026年盤で二黒は北西＝同会六白(金)・退気', () => {
    const board = placeStars(yearStar(2026)); // 一白中宮
    const d = doukaiOf(2, board);
    expect(d.doukaiStar).toBe(6);
    expect(d.relation).toBe('退気');
  });

  it('他星（五黄）も同会を取れる', () => {
    const board = placeStars(yearStar(2026)); // 一白中宮：五黄は南に回座
    const d = doukaiOf(5, board);
    expect(d.doukaiStar).toBe(9); // 南の定位星=九紫
    expect(d.relation).toBe('生気'); // 火が土に生気
  });

  it('本命が中宮なら同会を取らず relation=null', () => {
    const d = doukaiOf(2, placeStars(2)); // 二黒中宮
    expect(d.doukaiStar).toBe(null);
    expect(d.relation).toBe(null);
  });
});

describe('fortuneLayers 多層運勢', () => {
  it('1971生(二黒/月命七赤)×2026年盤：本命=退気・月命=上向き・非割れ', () => {
    const board = placeStars(yearStar(2026)); // 一白中宮
    const keisha = keishaPalace(2, 7, 'female');
    const L = fortuneLayers(2, 7, keisha, board);
    expect(L.element.doukaiStar).toBe(6); // 北西の定位星=六白
    expect(L.element.relation).toBe('退気');
    expect(L.basePolarity).toBe('横ばい');
    expect(L.getsumei.dir).toBe('sw'); // 七赤は南西
    expect(L.getsumei.polarity).toBe('上向き'); // 金が土に生気
    expect(L.divergence.isSplit).toBe(false);
  });

  it('六白中宮で本命=下向き・月命=上向き：割れを検出', () => {
    const board = placeStars(6);
    const keisha = keishaPalace(2, 4, 'female');
    const L = fortuneLayers(2, 4, keisha, board);
    expect(L.basePolarity).toBe('下向き'); // 二黒が北→同会一白(水)→死気
    expect(L.getsumei.dir).toBe('e'); // 四緑は東
    expect(L.getsumei.polarity).toBe('上向き'); // 四緑が東で比和
    expect(L.divergence.isSplit).toBe(true);
    expect(typeof L.divergence.note).toBe('string');
  });

  it('本命が中宮なら同会を取らず守り', () => {
    const board = placeStars(2); // 二黒中宮
    const L = fortuneLayers(2, 7, null, board);
    expect(L.basePolarity).toBe('守り');
    expect(L.element.doukaiStar).toBe(null);
    expect(L.element.relation).toBe(null);
    expect(L.keishaLens).toBe(null);
  });
});
