# plan.md — 実装チェックリスト

採用流派：A（園田系・標準, ADR-001）／構成：B+／配置：~/GithubDocuments/kyusei-kigaku（kenjiO-skr/kyusei-kigaku）

## Phase 1 足場
- [x] ディレクトリ・git init（main）
- [x] 親モノレポ .gitignore に /kyusei-kigaku/ 追記
- [x] root .gitignore / package.json / CLAUDE.md
- [x] src/calc/CLAUDE.md（ローカル）
- [x] docs: adr-001（流派A）/ verification-data（§5）/ calendar-data-source
- [x] plan.md
- [x] src/calc モジュール骨子（constants 実装＋他stub）
- [x] 初回コミット

## Phase 2 暦エンジン検証（read-only・並列①）
- [x] 立春・節入り・二至・甲子の境界ケースを多年分、独立2手法（A体=天文計算／B体=NAOJ公表値転記）で相互反証 → 全点一致
- [x] 検証済みテーブル＋干支日アンカーを確定 → calendar-data.js / docs に反映（閏は二至を基準にPhase 3で実装・検証）

## Phase 3 コア実装
- [x] constants(宮名追加) / calendar(節年・節月・60干支日) / honmei(本命・月命・傾斜) / board(飛泊・配置)
- [x] テスト：飛泊 全九星中宮 / §5年盤(2026=一白) / 立春境界(1971=二黒, 2/3前年処理) / 節月境界 / 干支日（計33緑）
- [x] 日盤の中宮（二至直近甲子＋陰遁陽遁＋閏）→ Phase 3b 完了。yakumoin公表日盤14点＋2031冬の閏を完全再現（dayboard.test.js）
- [ ] 月命星・傾斜は仕様メモ§2/§3準拠で実装済だが独立数値オラクル未整備＝要確認（一次資料 or 既存サイトと突合）

## Phase 4 吉凶判定
- [x] 凶殺（五黄殺/暗剣殺/破/本命殺/本命的殺/八方塞がり）+ 吉方位（流派A）→ direction.js
- [x] §2（2026年盤・二黒視点）の全8方位を完全再現（direction.test.js, 計53緑）
- [x] fortune(運勢=本命星回座) / compatibility(五行相性)
- 注: A/B/C 並列実装は流派AがADR-001で確定済＋§2オラクル一致のため割愛（単純さ優先）
- 注: 月盤吉凶は同一 judgeDirections に月支・月破を渡せば成立（年盤で検証済）。日盤吉凶は Phase 3b の日盤中宮待ち

## Phase 5 UI
- [x] 4画面（今日=運勢/方位盤/本命星診断/相性）下タブ構成・ふんわりピンクテーマ
- [x] 3×3方位盤・南上/北上切替・配色（吉緑/凶赤/他グレー/本命紫）
- [x] localStorage（生年月日・性別の復元）・レスポンシブ（max-width 480・スマホ前提）
- [x] 専門用語に点線下線＋タップで吹き出し解説（glossary.js）／期間トグル日月年
- [x] Playwright で4画面・両向き・用語吹き出し・相性を実機確認（1971生→二黒/月命七赤/傾斜坎宮、二黒×六白=相生）

## Phase 6 PWA
- [x] manifest.webmanifest（start_url/scope=相対 "./"・テーマ色・アイコン3種）
- [x] service worker（sw.js・キャッシュ優先＋ナビfallback・相対パスで全シェルをprecache）
- [x] アイコン（依存ゼロ生成：花アイコン 192/512/maskable512/apple180）
- [x] index.html に manifest/apple-touch-icon/mobile-web-app-capable/SW登録（相対パス）
- [x] Playwright で SW登録・manifest・**サーバ停止下のオフライン起動**を確認

## Phase 7 公開＋DoD
- [x] vitest 全緑（69件）
- [x] gh auth login（ユーザー操作）→ kenjiO-skr/kyusei-kigaku を public 作成 → push（97c158e/ffbe0bc）
- [x] GitHub Pages 有効化（main/root）→ 本番URLで開通確認（index/manifest/sw/app.js/icon すべて200、SW scope=サブパス）
- [x] §8 完成の定義：1-4・7-8 を自動テスト＋本番確認で充足。5-6 のスマホ実機ホーム追加のみユーザー最終確認推奨
- 公開URL: https://kenjio-skr.github.io/kyusei-kigaku/

## Phase 8 運勢の多層化（本命/月命/傾斜/五行・同会）
- [x] 設計提案＋論点①②③をユーザー確定（①定性併記 ②併記・非合成 ③中庸B）→ ADR-002 に記録
- [x] fortune.js: fortuneLayers 追加（fortuneOf は不変・再利用）。同会＝本命回座宮の定位星との五行
- [x] engine.boardModel(…, birth) で birth 指定時のみ fortune.layers 付与（後方互換）／app.js screenToday に多層表示＋流派差注記
- [x] glossary に「同会」追加／tests/fortune.test.js に多層検証3ケース追加（既存2件は不変）
- [x] vitest 全緑（72件）。direction/§5/§2・吉方位/相性/診断は無改変。SW キャッシュ v3 へバンプ
