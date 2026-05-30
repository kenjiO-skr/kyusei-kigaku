// 飛泊（盤配置）の検証。オラクル：docs/verification-data.md §1・§2。
import { describe, it, expect } from 'vitest';
import { flyStar, placeStars, dirOfStar } from '../src/calc/board.js';
import { yearStar } from '../src/calc/honmei.js';
import { HOME_STAR_BY_DIR } from '../src/calc/constants.js';

describe('飛泊式 flyStar', () => {
  it('中宮(d=5)は常に k を返す（flyStar(k,5)=k）', () => {
    for (let k = 1; k <= 9; k++) expect(flyStar(k, 5)).toBe(k);
  });

  it('五黄中宮(k=5)は後天定位盤そのもの（配置星=定位星）', () => {
    for (const [dir, d] of Object.entries(HOME_STAR_BY_DIR)) {
      expect(flyStar(5, d)).toBe(d);
    }
  });
});

describe('placeStars 全九星中宮', () => {
  it('どの中宮でも 1〜9 が各1回ずつ（全単射）', () => {
    for (let k = 1; k <= 9; k++) {
      const stars = Object.values(placeStars(k)).sort((a, b) => a - b);
      expect(stars).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it('中宮には必ず k が入る', () => {
    for (let k = 1; k <= 9; k++) expect(placeStars(k).center).toBe(k);
  });

  // §1 後天定位盤（五黄中宮）
  it('§1 五黄中宮の配置', () => {
    expect(placeStars(5)).toEqual({
      center: 5, n: 1, ne: 8, e: 3, se: 4, s: 9, sw: 2, w: 7, nw: 6,
    });
  });

  // §1 一白中宮（k=1）— verification-data.md の代表例
  it('§1 一白中宮(k=1)の配置', () => {
    expect(placeStars(1)).toEqual({
      center: 1, n: 6, ne: 4, e: 8, se: 9, s: 5, sw: 7, w: 3, nw: 2,
    });
  });
});

describe('§2 2026年・年盤（一白中宮）', () => {
  it('2026年の年盤中宮は一白', () => {
    expect(yearStar(2026)).toBe(1);
  });

  it('§2 の盤どおりに回座する', () => {
    const board = placeStars(yearStar(2026));
    expect(board).toEqual({
      center: 1, // 中宮 一白
      n: 6, // 北 六白
      ne: 4, // 北東 四緑
      e: 8, // 東 八白
      se: 9, // 南東 九紫
      s: 5, // 南 五黄
      sw: 7, // 南西 七赤
      w: 3, // 西 三碧
      nw: 2, // 北西 二黒
    });
  });

  it('本命星=二黒(2)は北西に回座する（§2）', () => {
    const board = placeStars(yearStar(2026));
    expect(dirOfStar(board, 2)).toBe('nw');
  });
});
