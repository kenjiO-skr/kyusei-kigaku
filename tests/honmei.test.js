// 本命星・月命星・傾斜宮の検証。
// オラクル：本命星 1971=二黒（verification-data.md §3）。月命星・傾斜は仕様メモ§2/§3の算出法に基づく
// 方法検証（独立な数値オラクルは未整備＝要確認）。
import { describe, it, expect } from 'vitest';
import { yearStar, honmeiStar, getsumeiStar, monthBoardCenter, keishaPalace } from '../src/calc/honmei.js';

const D = (y, m, d) => new Date(y, m - 1, d);

describe('yearStar / honmeiStar 本命星', () => {
  it('回帰固定：1971 → 二黒(2)', () => {
    expect(yearStar(1971)).toBe(2);
    expect(honmeiStar(D(1971, 6, 15))).toBe(2);
  });

  it('既知の年家九星', () => {
    expect(yearStar(2026)).toBe(1); // 一白
    expect(yearStar(2000)).toBe(9); // 九紫
    expect(yearStar(1985)).toBe(6); // 六白
    expect(yearStar(1950)).toBe(5); // 五黄
  });

  it('立春前は前年の本命星（1971-02-03 → 1970生=三碧(3)）', () => {
    expect(honmeiStar(D(1971, 2, 3))).toBe(3);
    expect(honmeiStar(D(1971, 2, 4))).toBe(2);
  });

  it('立春2/3年の境界（2025）', () => {
    expect(honmeiStar(D(2025, 2, 3))).toBe(2); // 2025生=二黒
    expect(honmeiStar(D(2025, 2, 2))).toBe(3); // 2024生=三碧
  });
});

describe('monthBoardCenter / getsumeiStar 月命星（仕様メモ§3）', () => {
  it('寅月の中宮基準：子午卯酉=八白 / 辰戌丑未=五黄 / 寅申巳亥=二黒', () => {
    // 2026=午年（子午卯酉）→ 寅月 八白
    expect(monthBoardCenter(2026, 0)).toBe(8);
    // 1971=亥年（寅申巳亥）→ 寅月 二黒
    expect(monthBoardCenter(1971, 0)).toBe(2);
    // 2024=辰年（辰戌丑未）→ 寅月 五黄
    expect(monthBoardCenter(2024, 0)).toBe(5);
  });

  it('陰遁(−1)/月で繰る（2026・午年）', () => {
    expect(monthBoardCenter(2026, 0)).toBe(8); // 寅
    expect(monthBoardCenter(2026, 1)).toBe(7); // 卯
    expect(monthBoardCenter(2026, 2)).toBe(6); // 辰
    expect(monthBoardCenter(2026, 8)).toBe(9); // 戌（8→…→1→9 と循環）
  });

  it('getsumeiStar は生まれ節月の月盤中宮', () => {
    expect(getsumeiStar(D(2026, 2, 10))).toBe(8); // 寅月
    expect(getsumeiStar(D(2026, 3, 10))).toBe(7); // 卯月（啓蟄3/5以降）
  });
});

describe('keishaPalace 傾斜宮（本命星を中宮に置き月命星の回座宮）', () => {
  // 本命=二黒の盤 placeStars(2): center2,n7,ne5,e9,se1,s6,sw8,w4,nw3
  it('月命=一白 → 南東(巽宮)', () => {
    expect(keishaPalace(2, 1, 'male')).toMatchObject({ dir: 'se', palace: '巽宮', star: 4 });
  });

  it('月命=九紫 → 東(震宮)', () => {
    expect(keishaPalace(2, 9, 'male')).toMatchObject({ dir: 'e', palace: '震宮', star: 3 });
  });

  it('中宮特例（月命=本命=二黒）：男性=兌宮 / 女性=乾宮', () => {
    expect(keishaPalace(2, 2, 'male')).toMatchObject({ dir: 'w', palace: '兌宮' });
    expect(keishaPalace(2, 2, 'female')).toMatchObject({ dir: 'nw', palace: '乾宮' });
  });
});
