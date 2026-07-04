// compatModel の相性2層（本命／月命）配線の検証。
// 五行相性そのものは compatibility.test.js が担保するため、ここは配線（正しい星ペアに
// 正しい向きで適用されているか）に絞る。占術値のハードコードはしない。
import { describe, it, expect } from 'vitest';
import { compatModel } from '../src/ui/engine.js';
import { honmeiStar, getsumeiStar } from '../src/calc/honmei.js';
import { compatibility } from '../src/calc/compatibility.js';
import { parseDateInput } from '../src/ui/format.js';

const da = parseDateInput('1971-05-10');
const db = parseDateInput('1966-05-10');

describe('compatModel の相性2層', () => {
  it('本命：result はあなた→お相手、reverse はお相手→あなた', () => {
    const m = compatModel(da, db);
    expect(m.a).toBe(honmeiStar(da));
    expect(m.b).toBe(honmeiStar(db));
    expect(m.result).toEqual(compatibility(honmeiStar(da), honmeiStar(db)));
    expect(m.reverse).toEqual(compatibility(honmeiStar(db), honmeiStar(da)));
  });

  it('月命：月命星ペアに同じ五行相性ロジックを両視点で適用', () => {
    const g = compatModel(da, db).getsumei;
    expect(g.a).toBe(getsumeiStar(da));
    expect(g.b).toBe(getsumeiStar(db));
    expect(g.result).toEqual(compatibility(getsumeiStar(da), getsumeiStar(db)));
    expect(g.reverse).toEqual(compatibility(getsumeiStar(db), getsumeiStar(da)));
  });

  it('result と reverse は鏡の関係（相生なら生気↔退気）', () => {
    const m = compatModel(da, db);
    const mirror = { 生気: '退気', 退気: '生気', 殺気: '死気', 死気: '殺気', 比和: '比和' };
    expect(m.reverse.relation).toBe(mirror[m.result.relation]);
    expect(m.getsumei.reverse.relation).toBe(mirror[m.getsumei.result.relation]);
  });
});
