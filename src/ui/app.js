// app.js — 画面シェル（下タブ4＋4画面）。状態管理・localStorage・用語吹き出し。
// パスは相対のみ。出荷物はバニラJS（ESM）でビルド不要。
import { STAR_NAMES, DIR_NAMES } from '../calc/constants.js';
import { honmeiStar } from '../calc/honmei.js';
import { parseDateInput, formatDateWithWareki } from './format.js';
import { boardModel, diagnose, compatModel, starName, elementName } from './engine.js';
import { renderBoard } from './board-view.js';
import { GLOSSARY, term } from './glossary.js';

const STORAGE_KEY = 'kyusei.profile';
const DEFAULT_PROFILE = { birthDate: '', sex: 'female', honmei: 2 }; // 既定は本人=二黒土星
const DATE_MIN = '1950-02-04';
const DATE_MAX = '2035-12-31';

const state = { tab: 'today', period: 'day', orient: 'south', profile: loadProfile() };

function loadProfile() {
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}
function saveProfile(p) {
  state.profile = p;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* localStorage不可でも続行 */ }
}

// 有効な本命星：生年月日があれば算出、なければ保存値（既定=二黒）。
function effectiveHonmei() {
  const { birthDate, honmei } = state.profile;
  if (birthDate) {
    const d = parseDateInput(birthDate);
    try { return honmeiStar(d); } catch { return honmei ?? null; }
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

// ---- 画面：今日（運勢） ----
function screenToday() {
  const honmei = effectiveHonmei();
  if (honmei == null) return needProfile();
  const m = boardModel(new Date(), honmei, state.period);
  if (m.error) return `<div class="card"><p class="empty">${m.error}</p></div>`;

  const pos = m.fortune.isClosed
    ? term('八方塞がり')
    : `${DIR_NAMES[m.fortune.dir]}（${m.fortune.palace}）`;

  return `
    <div class="card">
      <div class="toolbar">${honmeiBadge(honmei)} ${periodToggle()}</div>
      <h2 class="card__title">${m.label}の運勢</h2>
      <p>本命星は <b>${pos}</b> に回座しています。</p>
      <div class="tendency">${m.fortune.tendency}</div>
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
  const m = boardModel(new Date(), honmei, state.period);
  if (m.error) return `<div class="card"><p class="empty">${m.error}</p></div>`;

  return `
    <div class="card">
      <div class="toolbar">${periodToggle()} ${orientToggle()}</div>
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
          <div class="kv"><span class="kv__k">${term('月命星')}</span><span class="kv__v">${STAR_NAMES[getsumei]}</span></div>
          <div class="kv"><span class="kv__k">${term('傾斜')}宮</span><span class="kv__v">${keisha.palace}（${STAR_NAMES[keisha.star]}）</span></div>
          <div class="kv"><span class="kv__k">五行</span><span class="kv__v">${elementName(honmei)}</span></div>
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
  if (tab) { state.tab = tab.dataset.tab; hideTip(); render(); return; }

  const per = e.target.closest('[data-period]');
  if (per) { state.period = per.dataset.period; render(); return; }

  const ori = e.target.closest('[data-orient]');
  if (ori) { state.orient = ori.dataset.orient; render(); return; }

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

function safeHonmei(birthDate) {
  try { return honmeiStar(parseDateInput(birthDate)); } catch { return null; }
}

render();
