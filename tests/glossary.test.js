// 診断結果の説明テーブルの網羅性検証（表示時の undefined 露出防止）。
import { describe, it, expect } from 'vitest';
import { STAR_DESCRIPTIONS, ELEMENT_DESCRIPTIONS } from '../src/ui/glossary.js';
import { KEISHA_LENS } from '../src/calc/fortune.js';
import { PALACES } from '../src/calc/constants.js';

const isText = (v) => typeof v === 'string' && v.length > 0;

describe('診断結果の説明テーブル', () => {
  it('STAR_DESCRIPTIONS は九星 1..9 を網羅し全値が非空文字列', () => {
    for (let star = 1; star <= 9; star++) {
      expect(isText(STAR_DESCRIPTIONS[star]), `${star} の説明`).toBe(true);
    }
  });

  it('ELEMENT_DESCRIPTIONS は五行（木火土金水）を網羅し全値が非空文字列', () => {
    for (const el of ['木', '火', '土', '金', '水']) {
      expect(isText(ELEMENT_DESCRIPTIONS[el]), `${el} の説明`).toBe(true);
    }
  });

  it('KEISHA_LENS は八方位（傾斜宮の全候補）を網羅し全値が非空文字列', () => {
    for (const dir of PALACES) {
      expect(isText(KEISHA_LENS[dir]), `${dir} の説明`).toBe(true);
    }
  });
});
