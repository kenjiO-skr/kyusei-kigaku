// 暦計算の検証。オラクル：docs/verification-data.md §3・§4、calendar-data.js。
import { describe, it, expect } from 'vitest';
import { solarYearOf, solarMonthOf, jdnOf, sexagenaryDayIndex } from '../src/calc/calendar.js';

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

  it('jdnOf 既知値（2024-01-01 = 2460311）', () => {
    expect(jdnOf(D(2024, 1, 1))).toBe(2460311);
  });
});
