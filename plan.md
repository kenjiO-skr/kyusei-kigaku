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
- [ ] 立春・節入り・二至・甲子・閏の境界ケースを多年分、独立2エージェントで相互反証
- [ ] 検証済みテーブル＋干支日アンカーを確定 → calendar-data.js / docs に反映

## Phase 3 コア実装
- [ ] constants / calendar / honmei(本命・月命・傾斜) / board(中宮+飛泊)
- [ ] テスト：飛泊 全九星中宮 / §5年盤 / 立春境界(1971=二黒, 2月初旬前年処理)

## Phase 4 吉凶判定（並列②）
- [ ] 凶殺（五黄殺/暗剣殺/破/本命殺/本命的殺/八方塞がり）+ 吉方位（流派A）
- [ ] A/B/C 並列実装で差分洗い出し → A が §5 一致を確認
- [ ] fortune(運勢) / compatibility(相性)

## Phase 5 UI
- [ ] 4画面（ダッシュボード/方位盤/本命星診断/相性）
- [ ] 3×3方位盤・南上/北上切替・配色（吉緑/凶赤/他グレー/本命紫）
- [ ] localStorage（本命星・設定の復元）・レスポンシブ

## Phase 6 PWA
- [ ] manifest + service worker（start_url/scope/登録パス/アセット を相対・サブパス前提）

## Phase 7 公開＋DoD
- [ ] vitest 全緑
- [ ] gh auth login（ユーザー操作）→ kenjiO-skr/kyusei-kigaku 作成 → push
- [ ] GitHub Pages 有効化 → PC・スマホで開通確認
- [ ] §8 完成の定義 8項目チェック
