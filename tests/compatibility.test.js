// 五行関係・相性診断の検証。仕様メモ§1の相生/相剋テーブル。
import { describe, it, expect } from 'vitest';
import { elementRelation, compatibility } from '../src/calc/compatibility.js';
import { ELEMENT } from '../src/calc/constants.js';

describe('elementRelation 五行の気', () => {
  const E = ELEMENT;
  it('比和（同気）', () => {
    expect(elementRelation(E.EARTH, E.EARTH)).toBe('比和');
  });
  it('生気（相手が自分を生む）：土から見た火（火生土）', () => {
    expect(elementRelation(E.EARTH, E.FIRE)).toBe('生気');
  });
  it('退気（自分が相手を生む）：土から見た金（土生金）', () => {
    expect(elementRelation(E.EARTH, E.METAL)).toBe('退気');
  });
  it('殺気（相手が自分を剋す）：土から見た木（木剋土）', () => {
    expect(elementRelation(E.EARTH, E.WOOD)).toBe('殺気');
  });
  it('死気（自分が相手を剋す）：土から見た水（土剋水）', () => {
    expect(elementRelation(E.EARTH, E.WATER)).toBe('死気');
  });
});

describe('compatibility 相性診断', () => {
  it('二黒(土)×八白(土)＝比和', () => {
    expect(compatibility(2, 8)).toMatchObject({ kind: '比和', relation: '比和' });
  });
  it('二黒(土)×九紫(火)＝相生（火生土・生気）', () => {
    expect(compatibility(2, 9)).toMatchObject({ kind: '相生', relation: '生気' });
  });
  it('二黒(土)×三碧(木)＝相剋（木剋土・殺気）', () => {
    expect(compatibility(2, 3)).toMatchObject({ kind: '相剋', relation: '殺気' });
  });
  it('一白(水)×二黒(土)＝相剋（土剋水を水側から見て殺気）', () => {
    expect(compatibility(1, 2)).toMatchObject({ kind: '相剋', relation: '殺気' });
  });
});
