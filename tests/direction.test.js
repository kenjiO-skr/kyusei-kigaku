// 吉凶方位判定の検証。黄金オラクル：docs/verification-data.md §2（2026年盤・二黒視点の全方位）。
import { describe, it, expect } from 'vitest';
import { killDirections, judgeDirections } from '../src/calc/direction.js';
import { placeStars } from '../src/calc/board.js';
import { yearStar } from '../src/calc/honmei.js';
import { STAR } from '../src/calc/constants.js';
import { boardModel } from '../src/ui/engine.js';

// 2026年＝丙午年（午=南, branch 6）。年盤中宮=一白。本命星=二黒(2)。
const board2026 = placeStars(yearStar(2026)); // 一白中宮
const HONMEI = 2; // 二黒
const BRANCH_UMA = 6; // 午

describe('§2 凶殺方位（2026年盤・二黒視点）', () => {
  const kills = killDirections(board2026, BRANCH_UMA, HONMEI, '歳破');

  it('南=五黄殺（五黄の回座方位）', () => {
    expect(kills.s).toContain('五黄殺');
  });
  it('北=暗剣殺（五黄=南の対冲）＋歳破（午=南の対冲=子=北）', () => {
    expect(kills.n).toContain('暗剣殺');
    expect(kills.n).toContain('歳破');
  });
  it('北西=本命殺（本命星=二黒の回座方位）', () => {
    expect(kills.nw).toContain('本命殺');
  });
  it('南東=本命的殺（本命殺=北西の対冲）', () => {
    expect(kills.se).toContain('本命的殺');
  });
  it('凶殺は北・南・北西・南東のみ（他方位に凶殺なし）', () => {
    expect(Object.keys(kills).sort()).toEqual(['n', 'nw', 's', 'se'].sort());
  });
});

describe('§2 八方位の最終判定（2026年盤・二黒視点）', () => {
  const judged = judgeDirections(board2026, BRANCH_UMA, HONMEI, '歳破');

  it('§2 表どおりの吉凶', () => {
    const verdicts = Object.fromEntries(
      Object.entries(judged).map(([dir, v]) => [dir, v.verdict])
    );
    expect(verdicts).toEqual({
      n: '凶', // 暗剣殺＋歳破
      ne: '小凶', // 四緑=木 殺気
      e: '吉', // 八白=土 比和
      se: '凶', // 本命的殺
      s: '凶', // 五黄殺
      sw: '中立', // 七赤=金 退気
      w: '小凶', // 三碧=木 殺気
      nw: '凶', // 本命殺
    });
  });

  it('東は八白(土)で比和→吉, 南西は七赤(金)で退気→中立', () => {
    expect(judged.e).toMatchObject({ star: 8, relation: '比和', verdict: '吉' });
    expect(judged.sw).toMatchObject({ star: 7, relation: '退気', verdict: '中立' });
  });
});

describe('死気→小凶（rankByElement の else 経路）', () => {
  it('七赤中宮盤・子年・本命二黒：北東の一白（水）は死気で小凶', () => {
    // 七赤中宮(k=7)の飛泊：北東(d=8)=一白。凶殺は 東=五黄殺/西=暗剣殺/南=歳破・本命殺/北=本命的殺
    // → 北東は凶殺非該当。二黒(土)→一白(水)は土剋水＝死気 → 小凶。
    const judged = judgeDirections(placeStars(7), 0 /* 子 */, 2, '歳破');
    expect(judged.ne).toMatchObject({ star: 1, relation: '死気', verdict: '小凶' });
  });
});

describe('月破・日破の end-to-end（盤の十二支の導出込み）', () => {
  it('日破：2026-02-19＝甲子（子の日）→ 日破は南', () => {
    const m = boardModel(new Date(2026, 1, 19), 2, 'day');
    expect(m.error).toBeUndefined();
    expect(m.judged.s.kills).toContain('日破');
  });

  it('月破：2026年寅月（2026-02-19）→ 月破は南西（寅=北東の対冲）', () => {
    const m = boardModel(new Date(2026, 1, 19), 2, 'month');
    expect(m.error).toBeUndefined();
    expect(m.judged.sw.kills).toContain('月破');
  });
});

describe('凶殺の特殊系', () => {
  it('八方塞がり：本命星が中宮の盤は全八方位が凶', () => {
    // 二黒中宮の盤で本命=二黒 → 八方塞がり
    const board = placeStars(STAR.TWO_BLACK);
    const kills = killDirections(board, 0 /* 子 */, STAR.TWO_BLACK);
    for (const dir of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
      expect(kills[dir]).toContain('八方塞がり');
    }
  });

  it('五黄中宮の盤には五黄殺・暗剣殺がない', () => {
    const board = placeStars(STAR.FIVE_YELLOW);
    const kills = killDirections(board, 0, STAR.TWO_BLACK);
    const all = Object.values(kills).flat();
    expect(all).not.toContain('五黄殺');
    expect(all).not.toContain('暗剣殺');
  });
});
