// 日盤（陰遁陽遁＋閏）の検証。
// オラクル：yakumoin.info の公表日盤（/daily/direction/date/YYYYMMDD）＋ nobml 計算例。
// 検証ログ・出典は docs/calendar-data-source.md、確定データは docs/verification-data.md §4。
import { describe, it, expect } from 'vitest';
import { dayBoard, dayBoardCenter } from '../src/calc/calendar.js';

const D = (y, m, d) => new Date(y, m - 1, d);

describe('日盤 通常期（陽遁・陰遁）', () => {
  // 中宮の星番号（1=一白 … 9=九紫）
  const cases = [
    [2026, 2, 4, 1, '陽遁'], // 一白（2025冬至起点の陽遁）
    [2026, 6, 21, 7, '陰遁'], // 七赤（2026夏至起点の陰遁）
    [2028, 8, 15, 4, '陰遁'], // 四緑
    [2030, 7, 1, 3, '陰遁'], // 三碧
    [2035, 3, 10, 4, '陽遁'], // 四緑
  ];
  it.each(cases)('%i-%i-%i は %i', (y, m, d, center) => {
    expect(dayBoardCenter(D(y, m, d))).toBe(center);
  });
});

describe('日盤 九星の閏（2031年冬・甲午→七赤・陽遁）', () => {
  // yakumoin 公表値による連続列。12-19 と 12-20 で七赤が2日連続（閏の重複）。
  const seq = [
    [2031, 12, 19, 7], // 七赤（陰遁の最終日）
    [2031, 12, 20, 7], // 七赤（甲午で陽遁開始＝重複）
    [2031, 12, 22, 9], // 九紫
    [2031, 12, 23, 1], // 一白
    [2031, 12, 31, 9], // 九紫
    [2032, 1, 12, 3], // 三碧
    [2032, 1, 18, 9], // 九紫
    [2032, 1, 19, 1], // 一白
    [2032, 1, 20, 2], // 二黒
  ];
  it.each(seq)('%i-%i-%i は %i', (y, m, d, center) => {
    expect(dayBoardCenter(D(y, m, d))).toBe(center);
  });

  it('閏の重複：12/19 と 12/20 が同じ七赤、12/20 から陽遁', () => {
    expect(dayBoardCenter(D(2031, 12, 19))).toBe(7);
    const sw = dayBoard(D(2031, 12, 20));
    expect(sw.center).toBe(7);
    expect(sw.ton).toBe('陽遁');
    expect(sw.leap).toBe(true);
  });
});

describe('日盤 範囲外', () => {
  it('最初の切替より前は例外', () => {
    expect(() => dayBoardCenter(D(2025, 1, 1))).toThrow(RangeError);
  });
});
