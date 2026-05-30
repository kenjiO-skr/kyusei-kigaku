// 運勢（本命星の回座位置）の検証。
import { describe, it, expect } from 'vitest';
import { fortuneOf } from '../src/calc/fortune.js';
import { placeStars } from '../src/calc/board.js';
import { yearStar } from '../src/calc/honmei.js';

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
