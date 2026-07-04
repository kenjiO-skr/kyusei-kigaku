// app.js — 画面シェル（下タブ4＋4画面）。状態管理・localStorage・用語吹き出し。
// パスは相対のみ。出荷物はバニラJS（ESM）でビルド不要。
import { STAR_NAMES, DIR_NAMES } from '../calc/constants.js';
import { honmeiStar } from '../calc/honmei.js';
import { parseDateInput, formatDateWithWareki } from './format.js';
import { boardModel, diagnose, compatModel, elementName } from './engine.js';
import { renderBoard } from './board-view.js';
import { GLOSSARY, term, STAR_DESCRIPTIONS, ELEMENT_DESCRIPTIONS } from './glossary.js';
import { KEISHA_LENS } from '../calc/fortune.js';

const STORAGE_KEY = 'kyusei.profile';
const DEFAULT_PROFILE = { birthDate: '', sex: 'female', honmei: 2 }; // 既定は本人=二黒土星
const YEAR_MIN = 1950; // 暦データの対応範囲（calendar-data.js）
const YEAR_MAX = 2035;

// 今日の日付を 'YYYY-MM-DD'（ローカル）で返す。対象日の既定値用。
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// viewStar: 今日の運勢で表示する九星。null＝本人の星（effectiveHonmei）。1..9 で他星に切替。
// browseAnyway: 未設定のまま「あとで」を選んだときの一時フラグ（非永続）。
const state = { tab: 'today', period: 'day', orient: 'south', targetDate: todayISO(), viewStar: null, profile: loadProfile(), browseAnyway: false };

function loadProfile() {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    raw = {};
  }
  const p = { ...DEFAULT_PROFILE, ...raw };
  // localStorage は信頼境界の外：値域を検証し、不正値は既定値へ戻す（innerHTML に流すため）。
  if (typeof p.birthDate !== 'string' || (p.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate))) {
    p.birthDate = DEFAULT_PROFILE.birthDate;
  }
  if (!Number.isInteger(p.honmei) || p.honmei < 1 || p.honmei > 9) p.honmei = DEFAULT_PROFILE.honmei;
  if (p.sex !== 'female' && p.sex !== 'male') p.sex = DEFAULT_PROFILE.sex;
  return p;
}
function saveProfile(p) {
  state.profile = p;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* localStorage不可でも続行 */ }
}

// 有効な本命星：生年月日があれば算出、なければ保存値（既定=二黒）。
// 生年月日があるのに算出できない（範囲外等）場合は null を返し、
// 既定星の運勢を黙って表示しない（needProfile 表示に誘導）。
function effectiveHonmei() {
  const { birthDate, honmei } = state.profile;
  if (birthDate) {
    const d = parseDateInput(birthDate);
    try { return honmeiStar(d); } catch { return null; }
  }
  return honmei ?? 2;
}

// セットアップ済みか：生年月日が保存されているかどうかで判定する（既定 honmei では判定しない）。
function isSetUp() {
  return !!state.profile.birthDate;
}

// ---- 日付セレクト（年・月・日） ----
// input[type=date] は iOS で「年月ホイール→日タップ」の2段階になるため、
// 年・月・日を最初から横に並べたセレクトで直接選べるようにする。

// その年月の月末日。年か月が未選択(0)のときは 31（選択肢を狭めない）。
function daysInMonth(y, m) {
  return y && m ? new Date(y, m, 0).getDate() : 31;
}

// セレクトの option 列。sel が未選択(0)のときだけ先頭にプレースホルダを付ける。
function rangeOptions(from, to, sel) {
  let html = sel ? '' : '<option value="" selected>--</option>';
  for (let v = from; v <= to; v++) {
    html += `<option value="${v}"${v === sel ? ' selected' : ''}>${v}</option>`;
  }
  return html;
}

// 年・月・日のセレクト一式。iso は 'YYYY-MM-DD' または ''（全欄プレースホルダ）。
function dateSelects(field, iso) {
  const [y, m, d] = iso ? iso.split('-').map(Number) : [0, 0, 0];
  return `<span class="date-sel" data-date-field="${field}">
    <select data-date-part="y" aria-label="年">${rangeOptions(YEAR_MIN, YEAR_MAX, y)}</select><span class="date-sel__unit">年</span>
    <select data-date-part="m" aria-label="月">${rangeOptions(1, 12, m)}</select><span class="date-sel__unit">月</span>
    <select data-date-part="d" aria-label="日">${rangeOptions(1, daysInMonth(y, m), d)}</select><span class="date-sel__unit">日</span>
  </span>`;
}

// セレクト一式から 'YYYY-MM-DD' を組み立てる。未選択が残れば ''。
function readDateSelects(el) {
  const part = (p) => Number(el.querySelector(`[data-date-part="${p}"]`).value);
  const y = part('y');
  const m = part('m');
  const d = part('d');
  if (!y || !m || !d) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// 年・月の変更に合わせて日の選択肢を月末日まで再構築（選択中の日はクランプ）。
// これにより 2/31 のような不正日付は入力経路に存在しない。
function syncDayOptions(el) {
  const daySel = el.querySelector('[data-date-part="d"]');
  const y = Number(el.querySelector('[data-date-part="y"]').value);
  const m = Number(el.querySelector('[data-date-part="m"]').value);
  const max = daysInMonth(y, m);
  const cur = Math.min(Number(daySel.value) || 0, max);
  daySel.innerHTML = rangeOptions(1, max, cur);
}

// ---- 共通パーツ ----
function periodToggle() {
  const opt = [['day', '今日'], ['month', '今月'], ['year', '今年']];
  return `<div class="toggle">${opt
    .map(([v, l]) => `<button data-period="${v}" aria-pressed="${state.period === v}">${l}</button>`)
    .join('')}</div>`;
}
// 今日の運勢を見る九星の切替。current=表示中の星／selfStar=本人の星（紫の目印用）。
// ラベルは省スペースのため短縮表記（例：二黒）。フル名はバッジ・本文で補う。
function starSelector(current, selfStar) {
  return `<div class="star-select">${[1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((s) => `<button data-view-star="${s}" aria-pressed="${s === current}"${s === selfStar ? ' data-self="1"' : ''}>${STAR_NAMES[s].slice(0, 2)}</button>`)
    .join('')}</div>`;
}
function orientToggle() {
  const opt = [['south', '南上'], ['north', '北上']];
  return `<div class="toggle">${opt
    .map(([v, l]) => `<button data-orient="${v}" aria-pressed="${state.orient === v}">${l}</button>`)
    .join('')}</div>`;
}
// 対象日ピッカー＋「今日」リセット。選択日を起点に盤を表示する。
function datePicker() {
  const isToday = state.targetDate === todayISO();
  return `<div class="date-pick">
    ${dateSelects('target', state.targetDate)}
    <button data-action="reset-date"${isToday ? ' disabled' : ''}>今日</button>
  </div>`;
}
// 現在の対象日（Date）。クリア時などは今日にフォールバック。
function targetDate() {
  return parseDateInput(state.targetDate) || new Date();
}

// 総合運勢バッジ（4段階）。配色規約：吉=緑系／守り（凶殺=八方塞がり）=赤系／平・小凶=グレー系。
function ratingBadge(rating) {
  if (!rating) return '';
  const cls = { 吉: 'good', 平: 'neutral', 小凶: 'neutral', 守り: 'bad' }[rating] || 'neutral';
  return `<span class="rating rating--${cls}">${rating}</span>`;
}

// 運勢の補助解釈ブロック。同会（五行）は星単独で取れるため常時表示。
// 月命・傾斜・割れは生年月日固有のため layers があるとき（＝本人の星）だけ表示。
function insightBlock(doukai, layers) {
  const rows = [];
  if (doukai.relation) {
    rows.push(`<p>${term('同会')}（${doukai.relation}）：${doukai.quality}</p>`);
  } else {
    rows.push(`<p>${term('同会')}：${doukai.quality}</p>`);
  }
  if (layers) {
    const { getsumei, keishaLens, divergence } = layers;
    rows.push(`<p>${term('月命星')}：${getsumei.starName}が${getsumei.palace}に回座／${getsumei.tendency}</p>`);
    if (keishaLens) {
      rows.push(`<p>${term('傾斜')}：${keishaLens.note}</p>`);
    }
    if (divergence.isSplit) {
      rows.push(`<p class="muted">${divergence.note}</p>`);
    }
    rows.push(`<p class="muted">※${term('月命星')}・${term('傾斜')}・${term('同会')}は補助的な読みで、流派により扱いが分かれます。</p>`);
  } else {
    rows.push(`<p class="muted">※${term('同会')}は補助的な読みで、流派により扱いが分かれます。</p>`);
  }
  return `<div class="layers">${rows.join('')}</div>`;
}

// 吉方位の4段階サマリー（吉／中立／小凶／凶）。今日タブ・方位タブで共用し表記を揃える。
function dirSummary(m) {
  return `
      <p class="row"><span>吉</span><span class="verdict v-good">${m.goodDirs.join('・') || 'なし'}</span></p>
      <p class="row"><span>中立</span><span class="verdict v-neutral">${m.neutralDirs.join('・') || 'なし'}</span></p>
      <p class="row"><span>小凶</span><span class="verdict v-neutral">${m.smallBadDirs.length ? `${m.smallBadDirs.join('・')} ↘` : 'なし'}</span></p>
      <p class="row"><span>凶</span><span class="verdict v-bad">${m.badDirs.join('・') || 'なし'}</span></p>`;
}

// ---- 画面：今日（運勢） ----
function screenToday() {
  if (!isSetUp() && !state.browseAnyway) return welcomeCard();
  const selfHonmei = effectiveHonmei();
  if (selfHonmei == null) return needProfile();
  const viewStar = state.viewStar ?? selfHonmei; // null＝本人の星
  // 未設定でのブラウズ中は誰の星も「本人」扱いしない（本命星バッジ・主語・月命/傾斜を出さない）。
  const isSelf = isSetUp() && viewStar === selfHonmei;
  const p = state.profile;
  // 月命・傾斜は本人の生年月日固有のため、本人の星のときだけ birth を渡す。
  const birth = isSelf && p.birthDate ? { date: parseDateInput(p.birthDate), sex: p.sex } : null;
  const m = boardModel(targetDate(), viewStar, state.period, birth);
  // セットアップ済みのときだけ本人星を渡す（未設定でのブラウズ中は紫マークを出さない）。
  const markStar = isSetUp() ? selfHonmei : null;
  // 範囲外等のエラー時もツールバーは残し、星・日付を選び直せるようにする。
  if (m.error) {
    return `
    <div class="card">
      <div class="toolbar">${starSelector(viewStar, markStar)}</div>
      <div class="toolbar">${periodToggle()}</div>
      <div class="toolbar">${datePicker()}</div>
      <p class="empty">${m.error}</p>
    </div>`;
  }

  const pos = m.fortune.isClosed
    ? term('八方塞がり')
    : `${DIR_NAMES[m.fortune.dir]}（${m.fortune.palace}）`;
  // 主語：本人の星なら「本命星」、他星なら星名。
  const subject = isSelf ? term('本命星') : STAR_NAMES[viewStar];

  return `
    <div class="card">
      <div class="toolbar">${starSelector(viewStar, markStar)}</div>
      <div class="toolbar">${periodToggle()}</div>
      <div class="toolbar">${datePicker()}</div>
      <h2 class="card__title">${STAR_NAMES[viewStar]}・${m.label}の運勢 ${ratingBadge(m.fortune.rating)}</h2>
      <p>${subject}は <b>${pos}</b> に回座しています。</p>
      <div class="tendency">${m.fortune.tendency}</div>
      ${insightBlock(m.fortune.doukai, m.fortune.layers)}
    </div>
    <div class="card">
      <h2 class="card__title">${term('吉方位')}</h2>
      ${dirSummary(m)}
      <p class="muted" style="margin-top:8px">方位盤（南上／北上の切替・中宮）は「方位」タブで見られます。</p>
    </div>`;
}

// ---- 画面：方位盤 ----
function screenDirections() {
  if (!isSetUp() && !state.browseAnyway) return welcomeCard();
  const selfHonmei = effectiveHonmei();
  if (selfHonmei == null) return needProfile();
  const viewStar = state.viewStar ?? selfHonmei; // null＝本人の星（今日タブと状態を共有）
  const markStar = isSetUp() ? selfHonmei : null; // 未設定でのブラウズ中は紫マークを出さない
  // 方位の吉凶は本命殺など星ごとに変わるため、選択中の星で盤を計算する。
  const m = boardModel(targetDate(), viewStar, state.period);
  // 範囲外等のエラー時もツールバーは残し、星・日付を選び直せるようにする。
  if (m.error) {
    return `
    <div class="card">
      <div class="toolbar">${starSelector(viewStar, markStar)}</div>
      <div class="toolbar">${periodToggle()} ${orientToggle()}</div>
      <div class="toolbar">${datePicker()}</div>
      <p class="empty">${m.error}</p>
    </div>`;
  }

  return `
    <div class="card">
      <div class="toolbar">${starSelector(viewStar, markStar)}</div>
      <div class="toolbar">${periodToggle()} ${orientToggle()}</div>
      <div class="toolbar">${datePicker()}</div>
      <h2 class="card__title">${STAR_NAMES[viewStar]}・${m.label}の方位盤</h2>
      ${dirSummary(m)}
      ${renderBoard(m, state.orient)}
      <p class="muted" style="margin-top:10px">中宮：${STAR_NAMES[m.center]}${m.ton ? `（${m.ton}）` : ''}</p>
    </div>`;
}

// ---- 画面：本命星診断 ----
function screenHonmei() {
  const p = state.profile;
  let result = '';
  if (p.birthDate) {
    const d = parseDateInput(p.birthDate);
    try {
      const { honmei, getsumei, keisha } = diagnose(d, p.sex);
      result = `
        <div class="card diag">
          <h2 class="card__title">診断結果</h2>
          ${term('本命星')}
          <div class="diag__main">${STAR_NAMES[honmei]}</div>
          <p class="kv__desc">${STAR_DESCRIPTIONS[honmei]}</p>
          <div class="kv-block">
            <div class="kv"><span class="kv__k">${term('月命星')}</span><span class="kv__v">${STAR_NAMES[getsumei]}</span></div>
            <p class="kv__desc">内面や若い頃の傾向を表すとされる星。${STAR_DESCRIPTIONS[getsumei]}</p>
          </div>
          <div class="kv-block">
            <div class="kv"><span class="kv__k">${term('傾斜')}宮</span><span class="kv__v">${keisha.palace}（${STAR_NAMES[keisha.star]}）</span></div>
            <p class="kv__desc">${KEISHA_LENS[keisha.dir]}</p>
          </div>
          <div class="kv-block">
            <div class="kv"><span class="kv__k">五行</span><span class="kv__v">${elementName(honmei)}</span></div>
            <p class="kv__desc">${ELEMENT_DESCRIPTIONS[elementName(honmei)]}</p>
          </div>
        </div>`;
    } catch (e) {
      result = `<div class="card"><p class="empty">${e instanceof RangeError ? '対応範囲は1950年〜2035年です。' : '日付を確認してください。'}</p></div>`;
    }
  }
  return `
    <div class="card">
      <h2 class="card__title">あなたの星を調べる</h2>
      <div class="field">
        <label>生年月日</label>
        ${dateSelects('birth', p.birthDate)}
      </div>
      <div class="field">
        <label>性別（${term('傾斜')}の特例判定に使用）</label>
        <div class="seg">
          <label><input type="radio" name="sex" value="female" ${p.sex === 'female' ? 'checked' : ''}/> 女性</label>
          <label><input type="radio" name="sex" value="male" ${p.sex === 'male' ? 'checked' : ''}/> 男性</label>
        </div>
      </div>
      <button class="btn" data-action="save-profile">この内容で診断・保存</button>
      <p class="muted" style="margin-top:8px">生年月日は端末内（localStorage）にのみ保存され、外部に送信されません。</p>
    </div>
    ${result}`;
}

// ---- 画面：相性 ----
function screenCompat() {
  const p = state.profile;
  return `
    <div class="card">
      <h2 class="card__title">${term('相性')}診断</h2>
      <div class="field">
        <label>あなたの生年月日</label>
        ${dateSelects('birthA', p.birthDate)}
      </div>
      <div class="field">
        <label>お相手の生年月日</label>
        ${dateSelects('birthB', '')}
      </div>
      <button class="btn" data-action="compat">相性を見る</button>
    </div>
    <div id="compat-result"></div>`;
}

// 相性の総評（関係の種類ごと）。ポップ・断定回避。
const COMPAT_KIND_TEXT = {
  相生: '✨ お互いを生かし合える良い相性とされます。「与える側・もらう側」の役割が自然と決まりやすいので、感謝を言葉にすると長続きするそう。',
  比和: '🌿 同じ気どうしで、安心感のある相性とされます。気楽な半面なあなあになりやすいので、ときどき新しい刺激を入れると新鮮さが続くそう。',
  相剋: '🔥 刺激し合い、成長を促す関係とされます。ぶつかりやすい半面、違いを認めて距離感を大切にすると、いい緊張感のある関係になるそう。',
};

// 「self から見た other」の方向性を一言で（relation は self 視点の気）。
function compatDirLine(relation, self, other) {
  return {
    生気: `💞 ${self}は${other}から力や元気をもらい、伸ばしてもらいやすい側とされます。`,
    退気: `🤲 ${self}は${other}を後押し・お世話する側になりやすいとされます。`,
    殺気: `⚡ ${self}は${other}から刺激や指摘を受けやすく、良い意味で背筋が伸びるとされます。`,
    死気: `🍃 ${self}は${other}に気を配り、ややエネルギーを使いやすいとされます。`,
  }[relation] || '';
}

function compatResultHtml(birthA, birthB) {
  const da = parseDateInput(birthA);
  const db = parseDateInput(birthB);
  if (!da || !db) return `<div class="card"><p class="empty">両方の生年月日を入力してください。</p></div>`;
  let model;
  try { model = compatModel(da, db); } catch (e) {
    return `<div class="card"><p class="empty">${e instanceof RangeError ? '対応範囲は1950年〜2035年です。' : '日付を確認してください。'}</p></div>`;
  }
  const r = model.result; // あなた(A)→お相手(B)の関係
  const rev = model.reverse; // お相手(B)→あなた(A)の関係
  // 比和は両者同じ気なので1文にまとめ、それ以外は与える/もらう等の方向を両視点で示す。
  const dirBlock = r.kind === '比和'
    ? '<p>🤝 あなたとお相手は似た気どうし、肩の力を抜いて自然体でいられるとされます。</p>'
    : `<p>${compatDirLine(r.relation, 'あなた', 'お相手')}</p>
       <p>${compatDirLine(rev.relation, 'お相手', 'あなた')}</p>`;
  return `
    <div class="card diag">
      <div class="toolbar" style="justify-content:center;gap:16px">
        <span class="badge-honmei"><span class="badge-honmei__star">${STAR_NAMES[model.a]}</span></span>
        <span style="color:var(--main-deep);font-weight:700">×</span>
        <span class="badge-honmei"><span class="badge-honmei__star">${STAR_NAMES[model.b]}</span></span>
      </div>
      <div class="diag__main">${term(r.kind)}</div>
      <p>${COMPAT_KIND_TEXT[r.kind]}</p>
      ${dirBlock}
      <p class="muted">五行：あなた ${r.elementA}／お相手 ${r.elementB}（あなたから見て${term(r.relation)}）</p>
    </div>`;
}

function needProfile() {
  return `<div class="card"><p class="empty">「本命」タブで生年月日を設定すると、運勢・方位が表示されます。</p></div>`;
}

// ---- 画面：初回オンボーディング（未設定ユーザー向け） ----
function welcomeCard() {
  const p = state.profile;
  return `
    <div class="card">
      <h2 class="card__title">ようこそ</h2>
      <p>九星気学にもとづく占いです。まず生年月日を設定すると、あなたの本命星の運勢・吉方位が表示されます。</p>
      <div class="field">
        <label>生年月日</label>
        ${dateSelects('birth', '')}
      </div>
      <div class="field">
        <label>性別（${term('傾斜')}の特例判定に使用）</label>
        <div class="seg">
          <label><input type="radio" name="sex" value="female" ${p.sex === 'female' ? 'checked' : ''}/> 女性</label>
          <label><input type="radio" name="sex" value="male" ${p.sex === 'male' ? 'checked' : ''}/> 男性</label>
        </div>
      </div>
      <button class="btn" data-action="save-profile">設定して始める</button>
      <button class="btn btn--sub" style="margin-top:8px" data-action="browse-anyway">あとで（星を選んで見る）</button>
      <p class="muted" style="margin-top:8px">生年月日は端末内（localStorage）にのみ保存され、外部に送信されません。</p>
    </div>`;
}

// ---- シェル ----
const SCREENS = { today: screenToday, directions: screenDirections, honmei: screenHonmei, compat: screenCompat };

function header() {
  return `<header class="head">
    <h1 class="head__title">きゅうせい占い</h1>
    <p class="head__date">${formatDateWithWareki(new Date())}</p>
  </header>`;
}
function tabbar() {
  const tabs = [
    ['today', '🌸', '今日'],
    ['directions', '🧭', '方位'],
    ['honmei', '⭐', '本命'],
    ['compat', '💞', '相性'],
  ];
  return `<nav class="tabbar">${tabs
    .map(([v, ico, l]) => `<button data-tab="${v}" aria-pressed="${state.tab === v}"><span class="ico">${ico}</span>${l}</button>`)
    .join('')}</nav>`;
}
function footer() {
  return `<p class="foot">※九星気学にもとづく内容です。占いとしてお楽しみください。</p>`;
}

function render() {
  hideTip(); // 表示内容が変わるため、開いていた用語吹き出しは閉じる
  document.getElementById('app').innerHTML = header() + SCREENS[state.tab]() + footer() + tabbar();
}

// ---- 用語吹き出し ----
function showTip(key) {
  const desc = GLOSSARY[key];
  if (!desc) return;
  document.getElementById('tooltip-term').textContent = key;
  document.getElementById('tooltip-desc').textContent = desc;
  document.getElementById('tooltip').hidden = false;
}
function hideTip() {
  const t = document.getElementById('tooltip');
  if (t) t.hidden = true;
}

// ---- イベント（委譲） ----
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { state.tab = tab.dataset.tab; render(); return; }

  const vs = e.target.closest('[data-view-star]');
  if (vs) { state.viewStar = Number(vs.dataset.viewStar); render(); return; }

  const per = e.target.closest('[data-period]');
  if (per) { state.period = per.dataset.period; render(); return; }

  const ori = e.target.closest('[data-orient]');
  if (ori) { state.orient = ori.dataset.orient; render(); return; }

  if (e.target.closest('[data-action="reset-date"]')) {
    state.targetDate = todayISO();
    render();
    return;
  }

  const t = e.target.closest('.term');
  if (t) { showTip(t.dataset.term); return; }

  if (e.target.closest('[data-action="close-tip"]')) { hideTip(); return; }

  if (e.target.closest('[data-action="save-profile"]')) {
    const birthDate = readDateSelects(document.querySelector('[data-date-field="birth"]'));
    const sex = document.querySelector('input[name="sex"]:checked')?.value || 'female';
    const honmei = birthDate ? safeHonmei(birthDate) : state.profile.honmei;
    saveProfile({ ...state.profile, birthDate, sex, honmei: honmei ?? state.profile.honmei });
    state.viewStar = null; // 診断し直したら今日の運勢を本人の星に戻す
    state.browseAnyway = false; // 設定完了したのでブラウズフラグは解除
    render();
    return;
  }

  if (e.target.closest('[data-action="browse-anyway"]')) {
    state.browseAnyway = true;
    render();
    return;
  }

  if (e.target.closest('[data-action="compat"]')) {
    const birthA = readDateSelects(document.querySelector('[data-date-field="birthA"]'));
    const birthB = readDateSelects(document.querySelector('[data-date-field="birthB"]'));
    document.getElementById('compat-result').innerHTML = compatResultHtml(birthA, birthB);
    return;
  }

  // 吹き出し外のクリックで閉じる
  if (!e.target.closest('#tooltip')) hideTip();
});

// 日付セレクトの変更（change はクリック委譲では拾えないため別途委譲）。
// 日の選択肢を年月に同期し、対象日が完全な日付になったら盤を再描画する。
// セレクトは選択した瞬間に確定して閉じるため、再描画で操作が中断することはない。
document.addEventListener('change', (e) => {
  const sel = e.target.closest('[data-date-part]');
  if (!sel) return;
  const field = sel.closest('[data-date-field]');
  syncDayOptions(field);
  if (field.dataset.dateField === 'target') {
    const iso = readDateSelects(field);
    if (iso) { state.targetDate = iso; render(); }
  }
});

// 日付を跨いで開き続けたとき、復帰時に「今日」を追従させる（盤とヘッダーの食い違い防止）。
let renderedToday = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const now = todayISO();
  if (now === renderedToday) return;
  if (state.targetDate === renderedToday) state.targetDate = now; // 旧「今日」を見ていた場合のみ追従
  renderedToday = now;
  render();
});

function safeHonmei(birthDate) {
  try { return honmeiStar(parseDateInput(birthDate)); } catch { return null; }
}

render();
