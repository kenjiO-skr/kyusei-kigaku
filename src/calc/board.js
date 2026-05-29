// board.js — 各盤の中宮算出＋飛泊（盤配置）
// 飛泊式（全盤共通・不変条件）：配置星 = ((d − 1 + (k − 5)) を9で正の剰余) + 1
// k=中宮の星, d=後天定位星。JSの % は負を返すため正の剰余に正規化する。
//
// TODO(Phase 3): placeStars(centerStar) を実装。constants の HOME_STAR_BY_DIR / PALACES を使用。
//   - 年盤/月盤/日盤の中宮算出（calendar.js の節月・干支に依存）
//   - tests/board.test.js で全九星中宮の配置と §5（k=1）を検証
