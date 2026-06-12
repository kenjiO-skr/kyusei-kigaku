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
const DATE_MIN = '1950-02-04';
const DATE_MAX = '2035-12-31';

// 今日の日付を 'YYYY-MM-DD'（ローカル）で返す。input[type=date] の既定値用。
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const state = { tab: 'today', period: 'day', orient: 'south', targetDate: todayISO(), profile: loadProfile() };

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

// ---- 共通パーツ ----
function honmeiBadge(star) {
  return `<span class="badge-honmei">${term('本命星')}：<span class="badge-honmei__star">${STAR_NAMES[star]}</span></span>`;
}
function periodToggle() {
  const opt = [['day', '今日'], ['month', '今月'], ['year', '今年']];
  return `<div class="toggle">${opt
    .map(([v, l]) => `<button data-period="${v}" aria-pressed="${state.period === v}">${l}</button>`)
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
    <input type="date" data-target-date value="${state.targetDate}" min="${DATE_MIN}" max="${DATE_MAX}" aria-label="対象の日付" />
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

// 運勢の多層ブロック（月命・傾斜・五行＝補助的解釈）。layers が無ければ空文字。
function layersBlock(layers) {
  if (!layers) return '';
  const { element, getsumei, keishaLens, divergence } = layers;
  const rows = [];
  if (element.relation) {
    rows.push(`<p>${term('同会')}（${element.relation}）：${element.quality}</p>`);
  } else {
    rows.push(`<p>${term('同会')}：${element.quality}</p>`);
  }
  rows.push(`<p>${term('月命星')}：${getsumei.starName}が${getsumei.palace}に回座／${getsumei.tendency}</p>`);
  if (keishaLens) {
    rows.push(`<p>${term('傾斜')}：${keishaLens.note}</p>`);
  }
  if (divergence.isSplit) {
    rows.push(`<p class="muted">${divergence.note}</p>`);
  }
  rows.push(`<p class="muted">※${term('月命星')}・${term('傾斜')}・${term('同会')}は補助的な読みで、流派により扱いが分かれます。</p>`);
  return `<div class="layers">${rows.join('')}</div>`;
}

// ---- 画面：今日（運勢） ----
function screenToday() {
  const honmei = effectiveHonmei();
  if (honmei == null) return needProfile();
  const p = state.profile;
  const birth = p.birthDate ? { date: parseDateInput(p.birthDate), sex: p.sex } : null;
  const m = boardModel(targetDate(), honmei, state.period, birth);
  if (m.error) return `<div class="card"><p class="empty">${m.error}</p></div>`;

  const pos = m.fortune.isClosed
    ? term('八方塞がり')
    : `${DIR_NAMES[m.fortune.dir]}（${m.fortune.palace}）`;

  return `
    <div class="card">
      <div class="toolbar">${honmeiBadge(honmei)} ${periodToggle()}</div>
      <div class="toolbar">${datePicker()}</div>
      <h2 class="card__title">${m.label}の運勢 ${ratingBadge(m.fortune.rating)}</h2>
      <p>本命星は <b>${pos}</b> に回座しています。</p>
      <div class="tendency">${m.fortune.tendency}</div>
      ${layersBlock(m.fortune.layers)}
    </div>
    <div class="card">
      <h2 class="card__title">${term('吉方位')}</h2>
      <p class="row"><span>吉</span><span class="verdict v-good">${m.goodDirs.join('・') || 'なし'}</span></p>
      <p class="row"><span>凶</span><span class="verdict v-bad">${m.badDirs.join('・') || 'なし'}</span></p>
      ${renderBoard(m, 'south')}
    </div>`;
}

// ---- 画面：方位盤 ----
function screenDirections() {
  const honmei = effectiveHonmei();
  if (honmei == null) return needProfile();
  const m = boardModel(targetDate(), honmei, state.period);
  if (m.error) return `<div class="card"><p class="empty">${m.error}</p></div>`;

  return `
    <div class="card">
      <div class="toolbar">${periodToggle()} ${orientToggle()}</div>
      <div class="toolbar">${datePicker()}</div>
      <h2 class="card__title">${m.label}の方位盤</h2>
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
        <label for="birth">生年月日</label>
        <input type="date" id="birth" value="${p.birthDate}" min="${DATE_MIN}" max="${DATE_MAX}" />
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
        <label for="birthA">あなたの生年月日</label>
        <input type="date" id="birthA" value="${p.birthDate}" min="${DATE_MIN}" max="${DATE_MAX}" />
      </div>
      <div class="field">
        <label for="birthB">お相手の生年月日</label>
        <input type="date" id="birthB" value="" min="${DATE_MIN}" max="${DATE_MAX}" />
      </div>
      <button class="btn" data-action="compat">相性を見る</button>
    </div>
    <div id="compat-result"></div>`;
}

function compatResultHtml(birthA, birthB) {
  const da = parseDateInput(birthA);
  const db = parseDateInput(birthB);
  if (!da || !db) return `<div class="card"><p class="empty">両方の生年月日を入力してください。</p></div>`;
  let model;
  try { model = compatModel(da, db); } catch (e) {
    return `<div class="card"><p class="empty">${e instanceof RangeError ? '対応範囲は1950年〜2035年です。' : '日付を確認してください。'}</p></div>`;
  }
  const text = {
    相生: 'お互いを生かし合える良い相性とされます。',
    比和: '同じ五行で、安心感のある相性とされます。',
    相剋: '刺激し合う関係。距離感を大切にするとよいとされます。',
  }[model.result.kind];
  return `
    <div class="card diag">
      <div class="toolbar" style="justify-content:center;gap:16px">
        <span class="badge-honmei"><span class="badge-honmei__star">${STAR_NAMES[model.a]}</span></span>
        <span style="color:var(--main-deep);font-weight:700">×</span>
        <span class="badge-honmei"><span class="badge-honmei__star">${STAR_NAMES[model.b]}</span></span>
      </div>
      <div class="diag__main">${term(model.result.kind)}</div>
      <p>${text}</p>
      <p class="muted">五行：${model.result.elementA} と ${model.result.elementB}（${model.result.relation}）</p>
    </div>`;
}

function needProfile() {
  return `<div class="card"><p class="empty">「本命」タブで生年月日を設定すると、運勢・方位が表示されます。</p></div>`;
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
    const birthDate = document.getElementById('birth').value;
    const sex = document.querySelector('input[name="sex"]:checked')?.value || 'female';
    const honmei = birthDate ? safeHonmei(birthDate) : state.profile.honmei;
    saveProfile({ ...state.profile, birthDate, sex, honmei: honmei ?? state.profile.honmei });
    render();
    return;
  }

  if (e.target.closest('[data-action="compat"]')) {
    const birthA = document.getElementById('birthA').value;
    const birthB = document.getElementById('birthB').value;
    document.getElementById('compat-result').innerHTML = compatResultHtml(birthA, birthB);
    return;
  }

  // 吹き出し外のクリックで閉じる
  if (!e.target.closest('#tooltip')) hideTip();
});

// 対象日ピッカーの変更（change はクリックでは拾えないため別途委譲）。
// 編集中（フォーカス中）の再描画は input を破棄してキーボード編集・iOSホイール操作を
// 中断させるため、フォーカスが外れてから描画する。
let pendingRender = false;
document.addEventListener('change', (e) => {
  const di = e.target.closest('[data-target-date]');
  if (!di) return;
  state.targetDate = di.value || todayISO();
  if (document.activeElement === di) { pendingRender = true; return; }
  render();
});
document.addEventListener('focusout', (e) => {
  if (pendingRender && e.target.closest('[data-target-date]')) {
    pendingRender = false;
    render();
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
