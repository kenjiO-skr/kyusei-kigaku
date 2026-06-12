// 暦計算の検証。オラクル：docs/verification-data.md §3・§4、calendar-data.js。
import { describe, it, expect } from 'vitest';
import { solarYearOf, solarMonthOf, jdnOf, sexagenaryDayIndex } from '../src/calc/calendar.js';
import { SOLAR_TERMS, SOLSTICES, CALENDAR_COVERAGE } from '../src/calc/calendar-data.js';

// JST 暦日として Date を作る（ローカル＝JST 前提）。
const D = (y, m, d) => new Date(y, m - 1, d);

describe('solarYearOf 立春境界', () => {
  it('立春当日以降はその年（1971-02-04 → 1971）', () => {
    expect(solarYearOf(D(1971, 2, 4))).toBe(1971);
    expect(solarYearOf(D(1971, 6, 15))).toBe(1971);
  });

  it('立春前日以前は前年（1971-02-03 / 1971-01-15 → 1970）', () => {
    expect(solarYearOf(D(1971, 2, 3))).toBe(1970);
    expect(solarYearOf(D(1971, 1, 15))).toBe(1970);
  });

  it('立春が2/3の年（2025）：2/3→2025, 2/2→2024', () => {
    expect(solarYearOf(D(2025, 2, 3))).toBe(2025);
    expect(solarYearOf(D(2025, 2, 2))).toBe(2024);
  });

  it('立春が2/5の年（1984）：2/5→1984, 2/4→1983', () => {
    expect(solarYearOf(D(1984, 2, 5))).toBe(1984);
    expect(solarYearOf(D(1984, 2, 4))).toBe(1983);
  });

  it('範囲外は例外', () => {
    expect(() => solarYearOf(D(2040, 1, 1))).toThrow(RangeError);
  });

  it('Invalid Date も RangeError（TypeError に化けない）', () => {
    expect(() => solarYearOf(new Date(NaN))).toThrow(RangeError);
  });
});

describe('暦データ下限の節年欠落域（1950年1月1日〜立春前日）', () => {
  // 節年=1949 となり SOLAR_TERMS に無い。solarYearOf（本命星経路）は動くが、
  // solarMonthOf（月命星経路）は RangeError（TypeError でなく）になること。
  it('solarYearOf は前年を返す（1950-01-15 → 1949）', () => {
    expect(solarYearOf(D(1950, 1, 15))).toBe(1949);
  });

  it('solarMonthOf は RangeError（1950-01-15・立春前日 1950-02-03）', () => {
    expect(() => solarMonthOf(D(1950, 1, 15))).toThrow(RangeError);
    expect(() => solarMonthOf(D(1950, 2, 3))).toThrow(RangeError);
  });

  it('立春当日 1950-02-04 からは正常（寅月）', () => {
    expect(solarMonthOf(D(1950, 2, 4))).toMatchObject({ solarYear: 1950, monthIndex: 0, branch: 2 });
  });
});

describe('§4 立春オラクル全件突合（1950–2035 の86年・手転記テーブルの保証）', () => {
  const FEB3 = new Set([2021, 2025, 2029, 2033]);
  const FEB5 = new Set([1951, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984]);

  it('立春は 2/3 年・2/5 年のリスト該当以外すべて 2/4', () => {
    const [lo, hi] = CALENDAR_COVERAGE.solarTerms;
    for (let y = lo; y <= hi; y++) {
      const expected = FEB3.has(y) ? 3 : FEB5.has(y) ? 5 : 4;
      expect(SOLAR_TERMS[y][1], `${y}年の立春`).toEqual([2, expected]);
    }
  });

  it('二至：夏至は全年 6/21、冬至は 2028・2029・2032・2033 のみ 12/21（他は 12/22）', () => {
    const WINTER21 = new Set([2028, 2029, 2032, 2033]);
    const [lo, hi] = CALENDAR_COVERAGE.solstices;
    for (let y = lo; y <= hi; y++) {
      expect(SOLSTICES[y].summer, `${y}年の夏至`).toEqual([6, 21]);
      expect(SOLSTICES[y].winter, `${y}年の冬至`).toEqual([12, WINTER21.has(y) ? 21 : 22]);
    }
  });
});

describe('solarMonthOf 節月境界（0=寅月 … 11=丑月, branch 0=子）', () => {
  it('立春当日は寅月（2026-02-04）', () => {
    expect(solarMonthOf(D(2026, 2, 4))).toMatchObject({ solarYear: 2026, monthIndex: 0, branch: 2 });
  });

  it('啓蟄当日は卯月（2026-03-05）', () => {
    expect(solarMonthOf(D(2026, 3, 5))).toMatchObject({ solarYear: 2026, monthIndex: 1, branch: 3 });
  });

  it('立春前日は前節年の丑月（2026-02-03 → 2025/丑）', () => {
    expect(solarMonthOf(D(2026, 2, 3))).toMatchObject({ solarYear: 2025, monthIndex: 11, branch: 1 });
  });

  it('小寒以降1月は丑月（2026-01-20 → 2025/丑）', () => {
    expect(solarMonthOf(D(2026, 1, 20))).toMatchObject({ solarYear: 2025, monthIndex: 11, branch: 1 });
  });

  it('大雪〜小寒前の1月初旬は子月（2026-01-03 → 2025/子）', () => {
    // 小寒2026=1/5。1/3 は大雪(2025/12/7)以降・小寒前 ＝ 子月(10)。
    expect(solarMonthOf(D(2026, 1, 3))).toMatchObject({ solarYear: 2025, monthIndex: 10, branch: 0 });
  });
});

describe('60干支日 sexagenaryDayIndex（0=甲子）', () => {
  it('アンカー 2024-01-01 = 甲子(0)', () => {
    expect(sexagenaryDayIndex(D(2024, 1, 1))).toBe(0);
  });

  it('2024-01-02 = 乙丑(1)、翌甲子は60日後（2024-03-01）', () => {
    expect(sexagenaryDayIndex(D(2024, 1, 2))).toBe(1);
    expect(sexagenaryDayIndex(D(2024, 3, 1))).toBe(0);
  });

  it('独立検算 2000-01-01 = 戊午(54)', () => {
    expect(sexagenaryDayIndex(D(2000, 1, 1))).toBe(54);
  });

  it('§4 甲子検算固定点：2024-12-26・2026-02-19・2026-12-16', () => {
    expect(sexagenaryDayIndex(D(2024, 12, 26))).toBe(0);
    expect(sexagenaryDayIndex(D(2026, 2, 19))).toBe(0);
    expect(sexagenaryDayIndex(D(2026, 12, 16))).toBe(0);
  });

  it('jdnOf 既知値（2024-01-01 = 2460311）', () => {
    expect(jdnOf(D(2024, 1, 1))).toBe(2460311);
  });
});
