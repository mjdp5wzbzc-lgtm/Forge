/* ==========================================================================
   Forge — application (interface, persistance, synchronisation)
   ========================================================================== */
(function () {
'use strict';
const D = window.FORGE_DATA, E = window.FORGE_ENGINE, B = window.FORGE_BODY;
const { MUSCLES, GROUPS, EXERCISES, EXERCISE_LIST, EQUIPMENT, EQUIP_ITEMS } = D;
const DAY = E.DAY;

// ---------------------------------------------------------------- utilitaires
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v, d) => v == null || isNaN(v) ? '–' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 });
const fdate = (ts, o) => new Date(ts).toLocaleDateString('fr-FR', o || { day: 'numeric', month: 'short' });
const fday = ts => new Date(ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const ftime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const fmin = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`;
const isoDay = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 8).getTime(); };
const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 9l7-1.5L19 9M12 7.5v6M9 21l3-7.5 3 7.5"/>',
  chart: '<path d="M4 19h16M6 15l4-4 3 3 5-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 3 2.5 3-1-3 0-6 0-8z"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  alert: '<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7"/>',
  run: '<circle cx="14" cy="4.5" r="2"/><path d="M5 21l4-6 3 2 1-5 4 3 2-2M9 10l3-3 3 1"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  pain: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  skip: '<path d="M5 5l9 7-9 7zM18 5v14"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  logo: '<path d="M5 9h3v6H5zM16 9h3v6h-3zM8 12h8M2 10.5v3M22 10.5v3"/>'
};
const icon = (n, cls) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="${cls || ''}" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const EQ_ICON = { barbell: 'dumbbell', dumbbell: 'dumbbell', machine: 'bolt', cable: 'swap', bodyweight: 'body' };

// ---------------------------------------------------------------- état
const KEY = 'forge.v1';
let S = null;           // état persistant
const UI = {            // état d'interface (non persisté)
  tab: 'home', sub: { train: 'session', progress: 'lifts', profile: 'profile' },
  sel: new Set(), view: 'front', heat: 'volume', libFilter: { q: '', group: '', eq: '' },
  progEx: null, coachA: null, coachBusy: false, charts: {}
};

function freshState() {
  return {
    v: 1, profile: E.defaultProfile(), settings: { targets: {}, favorites: [], excluded: [], cardio: null },
    workouts: [], bodyLogs: [], nutritionLogs: [], cardioLogs: [], checkins: [], painFlags: [], photos: [],
    plan: null, active: null, deleted: [], demoLoaded: false, pristine: true, createdAt: Date.now(), updatedAt: Date.now()
  };
}

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

function loadLocal() {
  const raw = lsGet(KEY);
  if (!raw) return null;
  try { return Object.assign(freshState(), JSON.parse(raw)); } catch (e) { return null; }
}

// ---------------------------------------------------------------- synchronisation
// Stockage principal : base de données claude.ai, privée à chaque utilisateur
// (data/users/<id>/). Secours : stockage local du navigateur.
const Sync = {
  db: null, col: null, status: 'local', queue: Promise.resolve(), lastMain: '', lastW: {}, dirtyW: new Set(), delW: new Set(), photoQ: [], delP: new Set(), timer: null,
  async connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { this.setStatus('local'); return; }
    try {
      const [db, user] = await Promise.all([cl.use('db'), cl.use('user')]);
      if (!db || !user) { this.setStatus('local'); return; }
      const id = await user.id();
      if (!id) { this.setStatus('local'); return; }
      this.db = db; this.col = db.collection('data/users/' + id);
      this.setStatus('busy');
      await this.pull();
      this.setStatus('cloud');
    } catch (e) { console.warn('sync', e); this.setStatus('local'); }
  },
  setStatus(s) { this.status = s; const el = $('#sync'); if (el) el.outerHTML = syncBadge(); },
  mainDoc() {
    const o = Object.assign({}, S);
    o.workoutIds = S.workouts.map(w => w.id);
    delete o.workouts; delete o.photos;
    o.photoMeta = (S.photos || []).map(p => ({ id: p.id, date: p.date, demo: p.demo || false }));
    return o;
  },
  async pull() {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000));
    const snap = await Promise.race([this.col.get(), timeout]);
    const docs = {}; snap.docs.forEach(d => docs[d.id] = d.data());
    const remote = docs.state;
    const deleted = new Set([...(S.deleted || []), ...((remote && remote.deleted) || [])]);
    if (remote && S.pristine) {
      // Appareil neuf : on reprend intégralement les données du compte
      const fresh = freshState();
      Object.keys(remote).forEach(k => { if (k !== 'workoutIds' && k !== 'photoMeta') fresh[k] = remote[k]; });
      fresh.workouts = Object.keys(docs).filter(k => k.startsWith('w_')).map(k => docs[k]).filter(w => !deleted.has(w.id)).sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0));
      fresh.photos = Object.keys(docs).filter(k => k.startsWith('p_')).map(k => docs[k]).filter(p => !deleted.has(p.id)).sort((a, b) => a.date - b.date);
      fresh.pristine = false;
      S = fresh;
      saveLocal(); render();
      this.lastMain = JSON.stringify(this.mainDoc());
      return;
    }
    if (remote) {
      const remoteW = Object.keys(docs).filter(k => k.startsWith('w_')).map(k => docs[k]);
      const byId = {}; S.workouts.forEach(w => byId[w.id] = w);
      remoteW.forEach(w => { if (!byId[w.id] || (w.updatedAt || 0) > (byId[w.id].updatedAt || 0)) byId[w.id] = w; });
      const localNewer = (S.updatedAt || 0) > (remote.updatedAt || 0);
      if (!localNewer) {
        const keep = { workouts: S.workouts, photos: S.photos };
        Object.keys(remote).forEach(k => { if (k !== 'workoutIds' && k !== 'photoMeta') S[k] = remote[k]; });
        S.workouts = keep.workouts; S.photos = keep.photos;
      }
      S.deleted = Array.from(deleted);
      S.workouts = Object.values(byId).filter(w => !deleted.has(w.id)).sort((a, b) => (a.finishedAt || a.startedAt || 0) - (b.finishedAt || b.startedAt || 0));
      // Photos
      const ph = {}; (S.photos || []).forEach(p => ph[p.id] = p);
      Object.keys(docs).filter(k => k.startsWith('p_')).forEach(k => { const p = docs[k]; if (!deleted.has(p.id)) ph[p.id] = p; });
      S.photos = Object.values(ph).filter(p => !deleted.has(p.id)).sort((a, b) => a.date - b.date);
      // Ce que le cloud n'a pas encore
      S.workouts.forEach(w => { if (!docs['w_' + w.id]) this.dirtyW.add(w.id); });
      S.photos.forEach(p => { if (!docs['p_' + p.id]) this.photoQ.push(p.id); });
      deleted.forEach(id => { if (docs['w_' + id]) this.delW.add(id); if (docs['p_' + id]) this.delP.add(id); });
      saveLocal();
      render();
      if (localNewer || this.dirtyW.size || this.photoQ.length || this.delW.size) this.flush(true);
      else this.lastMain = JSON.stringify(this.mainDoc());
    } else {
      // Premier lancement connecté : on envoie tout
      S.workouts.forEach(w => this.dirtyW.add(w.id));
      (S.photos || []).forEach(p => this.photoQ.push(p.id));
      this.flush(true);
    }
  },
  schedule() { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 1200); },
  flush(force) {
    if (!this.col) return;
    this.queue = this.queue.then(async () => {
      try {
        this.setStatus('busy');
        const main = this.mainDoc();
        const ms = JSON.stringify(main);
        if (force || ms !== this.lastMain) { await this.col.doc('state').set(JSON.parse(ms)); this.lastMain = ms; }
        for (const id of Array.from(this.dirtyW)) {
          const w = S.workouts.find(x => x.id === id);
          this.dirtyW.delete(id);
          if (w) await this.col.doc('w_' + id).set(JSON.parse(JSON.stringify(w)));
        }
        for (const id of Array.from(this.delW)) { this.delW.delete(id); await this.col.doc('w_' + id).delete(); }
        while (this.photoQ.length) {
          const id = this.photoQ.shift(); const p = (S.photos || []).find(x => x.id === id);
          if (p && p.data) await this.col.doc('p_' + id).set({ id: p.id, date: p.date, data: p.data, demo: !!p.demo });
        }
        for (const id of Array.from(this.delP)) { this.delP.delete(id); await this.col.doc('p_' + id).delete(); }
        this.setStatus('cloud');
      } catch (e) {
        console.warn('flush', e);
        this.setStatus('local');
        toast('Synchronisation impossible pour le moment : vos données restent enregistrées sur cet appareil.');
      }
    });
  }
};

function syncBadge() {
  const s = Sync.status;
  const t = s === 'cloud' ? 'Synchronisé' : s === 'busy' ? 'Synchronisation…' : 'Sur cet appareil';
  const title = s === 'cloud' ? 'Vos données sont enregistrées dans votre espace privé claude.ai et sur cet appareil.' : 'Données enregistrées dans le navigateur de cet appareil.';
  return `<span id="sync" class="sync ${s}" title="${esc(title)}"><i></i>${t}</span>`;
}

function saveLocal() {
  const copy = Object.assign({}, S);
  // Les photos sont stockées à part pour ne pas saturer la clé principale
  copy.photos = (S.photos || []).map(p => ({ id: p.id, date: p.date, demo: p.demo }));
  lsSet(KEY, JSON.stringify(copy));
  (S.photos || []).forEach(p => { if (p.data) lsSet('forge.photo.' + p.id, p.data); });
}

// Toute modification passe par commit() : sauvegarde automatique locale + cloud
function commit(opts) {
  opts = opts || {};
  S.updatedAt = Date.now();
  S.pristine = false;
  if (opts.workout) { const w = S.workouts.find(x => x.id === opts.workout); if (w) w.updatedAt = Date.now(); Sync.dirtyW.add(opts.workout); }
  if (opts.photo) Sync.photoQ.push(opts.photo);
  saveLocal();
  Sync.schedule();
  if (opts.render !== false) render();
}

// ---------------------------------------------------------------- toasts & feuilles
let toastT;
function toast(msg) {
  const el = $('#toast');
  el.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`;
  clearTimeout(toastT); toastT = setTimeout(() => el.innerHTML = '', 3200);
}
let sheetOnClose = null;
function openSheet(html, onClose) {
  $('#sheet').innerHTML = `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  sheetOnClose = onClose || null;
  const f = $('#sheet .sheet [autofocus]'); if (f) f.focus();
}
function closeSheet() { $('#sheet').innerHTML = ''; const cb = sheetOnClose; sheetOnClose = null; if (cb) cb(); }
const sheetHead = (title, sub) => `<div class="sheet-h"><div><h2>${title}</h2>${sub ? `<p class="muted small" style="margin-top:4px">${sub}</p>` : ''}</div><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${icon('x')}</button></div>`;

// ---------------------------------------------------------------- navigation
const TABS = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'train', label: 'Entraînement', icon: 'dumbbell' },
  { id: 'muscles', label: 'Muscles', icon: 'body' },
  { id: 'progress', label: 'Progression', icon: 'chart' },
  { id: 'profile', label: 'Profil', icon: 'user' }
];
function renderNav() {
  $('#nav').innerHTML = TABS.map(t => `<button data-act="tab" data-tab="${t.id}" ${UI.tab === t.id ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.label}</span></button>`).join('');
}
function go(tab, sub) {
  UI.tab = tab; if (sub) UI.sub[tab] = sub;
  try { if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab); } catch (e) { /* ignore */ }
  render(); window.scrollTo(0, 0);
}

const VIEWS = {};
function render() {
  renderNav();
  const v = VIEWS[UI.tab] || VIEWS.home;
  UI.charts = {};
  const now = Date.now();
  const ae = document.activeElement, fid = ae && ae.id && $('#main').contains(ae) ? ae.id : null;
  const caret = fid && typeof ae.selectionStart === 'number' ? ae.selectionStart : null;
  $('#main').innerHTML = topbar() + demoBanner() + v(now);
  drawCharts();
  AFTER.splice(0).forEach(f => f());
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch (e) { /* type sans sélection */ } } }
  renderLive();
}
function topbar() {
  return `<div class="topbar"><div class="brand"><div class="brand-mark">${icon('logo')}</div><span class="brand-name">FORGE</span></div>${syncBadge()}</div>`;
}
function demoBanner() {
  const hasDemo = S.workouts.some(w => w.demo) || S.bodyLogs.some(b => b.demo);
  if (!hasDemo) return '';
  return `<div class="banner"><span>Les séances et pesées affichées sont des <b>données d'exemple</b> pour découvrir l'application. Effacez-les avant d'enregistrer les vôtres.</span><button class="btn sm" data-act="clear-demo">Effacer les exemples</button></div>`;
}

// ---------------------------------------------------------------- graphiques SVG
let chartSeq = 0;
function chartSlot(spec, h) {
  const id = 'c' + (chartSeq++);
  UI.charts[id] = spec;
  return `<div class="chart" id="${id}" style="min-height:${h || 180}px"></div>`;
}
function drawCharts() {
  Object.keys(UI.charts).forEach(id => { const el = document.getElementById(id); if (el) drawLine(el, UI.charts[id]); });
}
window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(drawCharts, 150); });

function niceTicks(min, max, n) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, step0 = span / (n || 4);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || step0;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const t = []; for (let v = lo; v <= hi + step / 2; v += step) t.push(Math.round(v * 1000) / 1000);
  return { lo, hi, ticks: t };
}
// spec : { series: [{ pts:[{x,y}], color, area, dash, label }], h, yFmt, goal, empty }
function drawLine(el, spec) {
  const all = spec.series.flatMap(s => s.pts);
  if (all.length < 2) { el.innerHTML = `<div class="chart-empty">${esc(spec.empty || 'Pas encore assez de données pour tracer une courbe.')}</div>`; return; }
  const W = Math.max(260, el.clientWidth), H = spec.h || 180;
  const pad = { l: 40, r: 14, t: 12, b: 24 };
  const xs = all.map(p => p.x), ys = all.map(p => p.y).concat(spec.goal != null ? [spec.goal] : []);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const yt = niceTicks(Math.min(...ys), Math.max(...ys), 4);
  const X = x => pad.l + (x1 === x0 ? 0.5 : (x - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = y => pad.t + (1 - (y - yt.lo) / (yt.hi - yt.lo)) * (H - pad.t - pad.b);
  let g = '';
  yt.ticks.forEach(v => { g += `<line class="grid-l" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pad.l - 7}" y="${Y(v) + 4}" text-anchor="end">${esc((spec.yFmt || fmt)(v))}</text>`; });
  // Axe X : 3 à 4 dates
  const nx = Math.min(4, Math.max(2, Math.floor(W / 120)));
  for (let i = 0; i < nx; i++) {
    const x = x0 + (x1 - x0) * i / (nx - 1);
    g += `<text x="${X(x)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === nx - 1 ? 'end' : 'middle'}">${esc(fdate(x))}</text>`;
  }
  if (spec.goal != null) g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(spec.goal)}" y2="${Y(spec.goal)}" stroke="var(--good)" stroke-dasharray="4 4" stroke-width="1.3"/><text x="${W - pad.r}" y="${Y(spec.goal) - 5}" text-anchor="end" style="fill:var(--good)">objectif ${esc(fmt(spec.goal))}</text>`;
  spec.series.forEach((s, si) => {
    const pts = s.pts.slice().sort((a, b) => a.x - b.x);
    if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
    const col = s.color || 'var(--accent)';
    if (s.area) {
      g += `<defs><linearGradient id="${el.id}g${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>`;
      g += `<path d="${d} L${X(pts[pts.length - 1].x)} ${H - pad.b} L${X(pts[0].x)} ${H - pad.b} Z" fill="url(#${el.id}g${si})"/>`;
    }
    g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${s.width || 2.2}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="3 4"' : ''}/>`;
    if (s.dots !== false) pts.forEach((p, i) => { g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${i === pts.length - 1 ? 4.2 : 2.6}" fill="${i === pts.length - 1 ? col : 'var(--surface)'}" stroke="${col}" stroke-width="1.6"><title>${esc(fdate(p.x))} : ${esc((spec.yFmt || fmt)(p.y))}</title></circle>`; });
  });
  let legend = '';
  if (spec.series.length > 1) legend = `<div class="legend" style="margin-top:6px">${spec.series.filter(s => s.label).map(s => `<span><i style="background:${s.color || 'var(--accent)'}"></i>${esc(s.label)}</span>`).join('')}</div>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>${legend}`;
}

// ---------------------------------------------------------------- composants partagés
function volRows(groups, vol, tg) {
  return groups.map(g => {
    const t = tg[g], v = vol[g] || 0;
    const scale = Math.max(t.max * 1.25, v, 4);
    const st = E.groupStatus(v, t);
    return `<div class="vol-row"><span class="vol-name">${esc(GROUPS[g].name)}</span>
      <div class="vol-track" title="Cible ${t.min}-${t.max}"><div class="vol-band" style="left:${t.min / scale * 100}%;width:${(t.max - t.min) / scale * 100}%"></div><div class="vol-fill ${st}" style="width:${Math.min(100, v / scale * 100)}%"></div></div>
      <span class="vol-num">${fmt(v)}<span>/${t.min}-${t.max}</span></span></div>`;
  }).join('');
}
const STATUS_TXT = { low: 'En retard', near: 'Presque', ok: 'Dans la cible', over: 'Trop de volume', off: 'Non programmé' };
const STATUS_CHIP = { low: 'warn', near: 'acc', ok: 'good', over: 'bad', off: '' };

function ring(pct, color, label, sub) {
  const r = 40, c = 2 * Math.PI * r;
  return `<div class="ring"><svg viewBox="0 0 92 92"><circle cx="46" cy="46" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="8"/><circle cx="46" cy="46" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * pct / 100} ${c}"/></svg><div class="lbl"><div><b>${label}</b>${sub ? `<div class="xs muted">${sub}</div>` : ''}</div></div></div>`;
}

function bodyPair(opts) {
  return `<div class="bodies">${B.svg('front')}${B.svg('back')}</div>`;
}
// Applique les classes d'état sur les muscles d'un conteneur
function paintBody(container, fn) {
  $$('.bd-m', container).forEach(p => { const m = p.dataset.m; p.setAttribute('class', 'bd-m ' + (fn(m) || '')); });
}
function miniBody(ex) {
  setTimeout(() => {
    $$('.mini-body[data-ex="' + ex.id + '"]').forEach(el => paintBody(el, m => { const w = ex.m[m]; return w >= 1 ? 'p1' : w >= 0.5 ? 'p2' : w > 0 ? 'p3' : ''; }));
  });
  return `<div class="mini-body" data-ex="${ex.id}" aria-label="Muscles sollicités">${B.svg('front')}${B.svg('back')}</div>`;
}

function exBadge(ex) { return `<div class="eq-badge" title="${esc(EQUIPMENT[ex.eq])}">${icon(EQ_ICON[ex.eq])}</div>`; }
function musclesTxt(ex, minW) {
  return Object.keys(ex.m).filter(m => ex.m[m] >= (minW || 0) && ex.m[m] < 1).sort((a, b) => ex.m[b] - ex.m[a]).map(m => MUSCLES[m].name).join(', ');
}
function primaryTxt(ex) { return Object.keys(ex.m).filter(m => ex.m[m] === 1).map(m => MUSCLES[m].name).join(', '); }

// (suite dans les fichiers suivants : même portée)

// ---------------------------------------------------------------- salles
const ITEM_STATE_TXT = { yes: 'disponible', pref: 'préférée', no: 'absente' };
function gymSelect(id) {
  const gs = E.ensureGyms(S), g = E.activeGym(S);
  return `<select class="input" id="${id}" data-input="gym-sel" aria-label="Salle">${gs.map(x => `<option value="${x.id}" ${x.id === g.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
}
// Puce à 3 états : disponible → préférée → absente
function itemChip(item, extra) {
  const st = E.itemState(S, item);
  const cls = st === 'pref' ? 'acc' : st === 'no' ? 'item-no' : 'item-yes';
  const mark = st === 'pref' ? '★ ' : st === 'no' ? '' : '✓ ';
  return `<button class="chip ${cls}" data-act="gym-item" data-item="${item}" title="${esc(EQUIP_ITEMS[item].name)} : ${ITEM_STATE_TXT[st]} (toucher pour changer)" aria-label="${esc(EQUIP_ITEMS[item].name)}, ${ITEM_STATE_TXT[st]}">${mark}${esc(EQUIP_ITEMS[item].name)}${extra ? ` <span class="muted">${extra}</span>` : ''}</button>`;
}
function needTxt(ex) {
  return (ex.need || []).map(r => Array.isArray(r) ? r.map(i => EQUIP_ITEMS[i].name).join(' ou ') : EQUIP_ITEMS[r].name).join(' + ') || 'Aucun matériel';
}

// =====================================================================
// ACCUEIL
// =====================================================================
VIEWS.home = function (now) {
  const p = S.profile;
  const ck = E.latestCheckin(S, now);
  const rec = E.recommend(S, now, ck);
  const wk = E.weekSummary(S, now);
  const vol = E.rolling7(S, now).group;
  const tg = E.targets(S);
  const nd = E.need(S, now, ck);
  const kg = E.currentWeight(S);
  const tr = E.weightTrend(S, now);
  const recMap = E.recovery(S, now, ck);
  const upperGroups = Object.keys(GROUPS).filter(g => GROUPS[g].region !== 'legs' || !p.noLegs);
  const avgRec = Math.round(upperGroups.filter(g => GROUPS[g].region === 'upper').map(g => E.groupRecovery(recMap, g)).reduce((a, b) => a + b, 0) / upperGroups.filter(g => GROUPS[g].region === 'upper').length);
  const ready = E.readiness(ck);
  const lifts = E.liftTrends(S, now, 4);
  const hello = new Date(now).getHours() < 12 ? 'Bonjour' : new Date(now).getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  // ----- héros : séance du jour
  let hero;
  if (S.active) {
    const done = S.active.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const tot = S.active.exercises.reduce((a, e) => a + e.sets.length, 0);
    hero = `<div class="card hero fade-in"><p class="eyebrow">Séance en cours</p><h1 style="margin:6px 0 4px">${esc(S.active.title)}</h1>
      <p class="muted">${done}/${tot} séries validées · démarrée à ${new Date(S.active.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      <div class="row" style="margin-top:14px"><button class="btn primary" data-act="open-live">${icon('play')}Reprendre</button></div></div>`;
  } else {
    hero = `<div class="card hero fade-in"><p class="eyebrow">${esc(fday(now))} · séance recommandée</p>
      <h1 style="margin:6px 0 8px">${esc(rec.template.name)}</h1>
      ${rec.lightDay ? `<div class="notice warn" style="margin-bottom:10px">${icon('alert')}<span>${esc(rec.lightDay)}</span></div>` : ''}
      <ul class="small" style="margin:0;padding-left:18px;color:var(--fg-2)">${rec.reasons.slice(0, 4).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="row" style="margin-top:14px"><button class="btn primary" data-act="auto-session">${icon('sparkle')}Générer cette séance</button>
      <button class="btn" data-act="tab" data-tab="muscles">${icon('body')}Choisir mes muscles</button></div></div>`;
  }

  // ----- tuiles
  const wDelta = tr && tr.perWeek != null ? `<span class="${tr.perWeek <= 0 ? 'up' : 'down'}">${tr.perWeek > 0 ? '+' : ''}${fmt(tr.perWeek)} kg</span> vs moyenne sem. préc.` : 'Ajoutez des pesées régulières';
  const tDelta = wk.prevTonnage ? Math.round((wk.tonnage - wk.prevTonnage) / wk.prevTonnage * 100) : null;
  const tiles = `<div class="grid g4 section">
    <div class="card stat"><p class="eyebrow">Poids</p><div class="v" style="margin-top:8px">${fmt(kg)}<small>kg</small></div><div class="d">Objectif ${fmt(p.targetWeight)} kg · ${wDelta}</div></div>
    <div class="card stat"><p class="eyebrow">Séances</p><div class="v" style="margin-top:8px">${wk.sessions}<small>/ ${p.freqMin}-${p.freqMax}</small></div><div class="d">cette semaine · ${wk.sets} séries${wk.cardioCount ? ` · ${wk.cardioCount} cardio` : ''}</div></div>
    <div class="card stat"><p class="eyebrow">Volume</p><div class="v" style="margin-top:8px">${fmt(wk.tonnage / 1000, 1)}<small>t</small></div><div class="d">${wk.prevTonnage ? `semaine dernière : ${fmt(wk.prevTonnage / 1000, 1)} t` : 'charge totale déplacée'}${tDelta != null && wk.sessions >= wk.prevSessions ? ` · <span class="${tDelta >= 0 ? 'up' : 'down'}">${tDelta >= 0 ? '+' : ''}${tDelta} %</span>` : ''}</div></div>
    <div class="card stat"><p class="eyebrow">Temps · énergie</p><div class="v" style="margin-top:8px">${fmin(wk.minutes)}</div><div class="d">~${fmt(wk.kcal, 0)} kcal estimées</div></div>
  </div>`;

  // ----- récupération
  const lag = upperGroups.filter(g => nd[g].status === 'low' || nd[g].status === 'near');
  const okG = upperGroups.filter(g => nd[g].status === 'ok' && nd[g].done > 0);
  const over = upperGroups.filter(g => nd[g].status === 'over');
  const recCol = avgRec >= 80 ? 'var(--good)' : avgRec >= 55 ? 'var(--warn)' : 'var(--bad)';
  const recovery = `<div class="card"><div class="card-h"><h3>Récupération</h3><button class="btn sm" data-act="checkin">${ck ? 'Refaire le bilan' : 'Bilan du jour'}</button></div>
    <div class="row" style="gap:16px;flex-wrap:nowrap">${ring(avgRec, recCol, avgRec + '%', 'haut')}
      <div class="stack" style="gap:6px;min-width:0"><p><b>${esc(ready.label)}</b>${ck ? ` · forme ${ready.score}/100` : ''}</p><p class="small muted">${esc(ready.advice)}</p></div></div>
    <div class="stack" style="margin-top:14px;gap:8px">
      ${lag.length ? `<div><p class="label" style="margin-bottom:6px">En retard</p><div class="mchips">${lag.map(g => `<span class="chip warn">${esc(GROUPS[g].name)} ${fmt(nd[g].done)}/${nd[g].target.min}</span>`).join('')}</div></div>` : ''}
      ${over.length ? `<div><p class="label" style="margin-bottom:6px">Trop de volume</p><div class="mchips">${over.map(g => `<span class="chip bad">${esc(GROUPS[g].name)} ${fmt(nd[g].done)}/${nd[g].target.max}</span>`).join('')}</div></div>` : ''}
      ${okG.length ? `<div><p class="label" style="margin-bottom:6px">Suffisamment entraînés</p><div class="mchips">${okG.map(g => `<span class="chip good">${esc(GROUPS[g].name)}</span>`).join('')}</div></div>` : ''}
    </div>
    ${lag.length ? `<button class="btn sm block" style="margin-top:12px" data-act="select-lagging-go">Cibler les muscles en retard</button>` : ''}</div>`;

  // ----- courbe de poids
  const logs = S.bodyLogs.filter(l => l.weight).sort((a, b) => a.date - b.date).filter(l => l.date > now - 120 * DAY);
  const avg7 = logs.map(l => { const w = logs.filter(o => o.date <= l.date && o.date > l.date - 7 * DAY); return { x: l.date, y: Math.round(w.reduce((a, o) => a + o.weight, 0) / w.length * 10) / 10 }; });
  const weightCard = `<div class="card"><div class="card-h"><h3>Évolution du poids</h3><button class="btn sm" data-act="add-weight">${icon('plus')}Pesée</button></div>
    ${chartSlot({ series: [{ pts: logs.map(l => ({ x: l.date, y: l.weight })), color: 'var(--muted)', width: 1.4, label: 'Pesées' }, { pts: avg7, color: 'var(--accent)', area: true, dots: false, label: 'Moyenne 7 jours' }], goal: p.targetWeight, h: 190, yFmt: v => fmt(v), empty: 'Ajoutez au moins deux pesées pour voir la courbe.' }, 210)}
    <p class="xs muted" style="margin-top:6px">Le poids fluctue chaque jour (eau, sel, glucides) : fiez-vous à la moyenne sur 7 jours et au tour de taille.</p></div>`;

  // ----- séries par groupe
  const shownGroups = Object.keys(GROUPS).filter(g => tg[g].max > 0 || vol[g] > 0).sort((a, b) => GROUPS[a].order - GROUPS[b].order);
  const volCard = `<div class="card"><div class="card-h"><h3>Séries par groupe · 7 jours</h3><button class="btn sm ghost" data-act="tab" data-tab="muscles">Détail</button></div>
    ${volRows(shownGroups, vol, tg)}
    <div class="legend" style="margin-top:8px"><span><i style="background:var(--warn)"></i>en retard</span><span><i style="background:var(--good)"></i>dans la cible</span><span><i style="background:var(--bad)"></i>au-delà</span><span><i style="background:rgba(255,255,255,.12)"></i>zone cible</span></div></div>`;

  // ----- progression des charges
  const liftsCard = `<div class="card"><div class="card-h"><h3>Progression des charges</h3><button class="btn sm ghost" data-act="tab" data-tab="progress">Tout voir</button></div>
    ${lifts.length ? `<div class="list">${lifts.map(l => `<button class="li" data-act="prog-ex" data-ex="${l.exId}"><div class="li-main"><div class="li-title">${esc(l.name)}</div><div class="xs muted">1RM estimé ${fmt(l.first)} → ${fmt(l.last)} kg · ${l.points.length} séances</div></div><span class="chip ${l.pct > 1 ? 'good' : l.pct < -1 ? 'bad' : ''}">${l.pct > 0 ? '+' : ''}${fmt(l.pct)} %</span></button>`).join('')}</div>` : '<p class="muted small">Les tendances apparaissent dès qu\'un exercice a été fait deux fois.</p>'}</div>`;

  // ----- résumé de semaine
  const strengths = okG.map(g => GROUPS[g].name);
  const summary = `<div class="card"><h3 style="margin-bottom:8px">Résumé de la semaine</h3><p class="small" style="color:var(--fg-2)">
    ${wk.sessions ? `${wk.sessions} séance${wk.sessions > 1 ? 's' : ''} de musculation (objectif ${p.freqMin} à ${p.freqMax}), ${wk.sets} séries, ${fmt(wk.tonnage, 0)} kg déplacés` : 'Aucune séance de musculation depuis lundi'}${wk.cardioCount ? `, ${wk.cardioCount} séance${wk.cardioCount > 1 ? 's' : ''} de cardio (${wk.cardioMinutes} min)` : ''}.
    ${wk.minutes ? `Temps total : ${fmin(wk.minutes)}, dépense estimée ~${fmt(wk.kcal, 0)} kcal.` : ''}
    ${strengths.length ? `Dans la cible : ${esc(strengths.join(', '))}.` : ''}
    ${lag.length ? `À rattraper : ${esc(lag.map(g => `${GROUPS[g].name} (${fmt(nd[g].done)}/${nd[g].target.min})`).join(', '))}.` : ''}
    ${over.length ? `Volume élevé sur ${esc(over.map(g => GROUPS[g].name).join(', '))} : inutile d'en rajouter.` : ''}</p></div>`;

  return `<p class="muted small" style="margin-bottom:10px">${hello}${p.name ? ' ' + esc(p.name) : ''}</p>` + hero + tiles +
    `<div class="grid md-2 section">${recovery}${weightCard}</div>` +
    `<div class="grid md-2 section">${volCard}<div class="stack">${liftsCard}${summary}</div></div>` +
    `<div class="section">${coachCard()}</div>`;
};

// =====================================================================
// COACH
// =====================================================================
const QUESTIONS = ['Quel muscle devrais-je travailler aujourd\'hui ?', 'Ai-je suffisamment récupéré des pectoraux ?', 'Combien de séries de biceps ai-je réalisées cette semaine ?',
  'Est-ce que je progresse au développé couché ?', 'Dois-je augmenter mes charges ?', 'Quel groupe musculaire est en retard ?', 'Quelle séance est la plus pertinente aujourd\'hui ?'];
function coachCard() {
  const a = UI.coachA;
  return `<div class="card"><div class="card-h"><h3>Demander au coach</h3><span class="xs muted">répond à partir de votre historique</span></div>
    <div class="qchips">${QUESTIONS.map(q => `<button class="chip" data-act="ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <form class="coach-q" data-form="coach" style="margin-top:10px"><input class="input" id="coach-in" name="q" placeholder="Posez votre question…" autocomplete="off"><button class="btn primary" ${UI.coachBusy ? 'disabled' : ''}>Demander</button></form>
    ${a ? `<div class="coach-a" aria-live="polite">${a.q ? `<b>${esc(a.q)}</b>\n` : ''}${esc(a.text)}${a.muscles && a.muscles.length ? '' : ''}</div>
      ${a.muscles && a.muscles.length ? `<button class="btn sm" style="margin-top:8px" data-act="coach-select">Sélectionner ces muscles</button>` : ''}` : ''}</div>`;
}

async function ask(q) {
  q = (q || '').trim(); if (!q) return;
  const now = Date.now();
  const a = E.answer(S, q, now);
  if (a) { UI.coachA = Object.assign({ q }, a); render(); return; }
  // Question libre : on interroge Claude avec un résumé de l'historique réel, si disponible
  UI.coachBusy = true; UI.coachA = { q, text: 'Réflexion en cours…' }; render();
  let sample = null;
  try { sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { sample = null; }
  if (!sample) {
    UI.coachBusy = false;
    UI.coachA = { q, text: "Je réponds hors ligne aux questions sur : le muscle ou la séance à faire aujourd'hui, la récupération d'un muscle, le nombre de séries, la progression sur un exercice, l'augmentation des charges, les groupes en retard, la nutrition et le poids. Reformulez avec l'un de ces sujets." };
    render(); return;
  }
  try {
    const prompt = `Tu es un coach de musculation spécialisé en hypertrophie et recomposition corporelle. Réponds en français, en 6 phrases maximum, de façon concrète et personnalisée, uniquement à partir des données ci-dessous. Si les données ne suffisent pas, dis-le. N'invente aucun chiffre. Ne pose pas de diagnostic médical : en cas de douleur, conseille d'arrêter l'exercice et de consulter un professionnel.\n\nDONNÉES DE L'UTILISATEUR :\n${E.contextSummary(S, now)}\n\nQUESTION : ${q}`;
    const r = await sample(prompt, { modelTier: 'default', onText: ({ text }) => { UI.coachA = { q, text }; const el = $('.coach-a'); if (el) el.textContent = q + '\n' + text; } });
    UI.coachA = { q, text: r.text };
  } catch (e) {
    UI.coachA = { q, text: e && e.code === 'not_granted' ? "La question libre nécessite d'autoriser l'accès à Claude pour cette page. Les questions prédéfinies fonctionnent sans." : "Le coach en ligne n'a pas répondu. Les questions prédéfinies (boutons ci-dessus) fonctionnent toujours, sans connexion." };
  }
  UI.coachBusy = false; render();
}

// =====================================================================
// BILAN DE FORME
// =====================================================================
const CK_FIELDS = [
  { k: 'sleep', t: 'Qualité du sommeil', lo: 'Très mauvaise', hi: 'Excellente' },
  { k: 'energy', t: 'Niveau d\'énergie', lo: 'Épuisé', hi: 'Plein d\'énergie' },
  { k: 'fatigue', t: 'Fatigue musculaire', lo: 'Aucune', hi: 'Très forte' },
  { k: 'soreness', t: 'Courbatures', lo: 'Aucune', hi: 'Très fortes' },
  { k: 'motivation', t: 'Motivation', lo: 'Faible', hi: 'Très forte' }
];
const UPPER_MUSCLES = Object.keys(MUSCLES).filter(m => MUSCLES[m].region !== 'legs');
let ckDraft = null, ckThen = null;
function openCheckin(then) {
  const prev = E.latestCheckin(S, Date.now());
  ckDraft = prev ? JSON.parse(JSON.stringify(prev)) : { sleep: 3, energy: 3, fatigue: 2, soreness: 2, motivation: 4, soreMuscles: [], painMuscles: [], painNote: '' };
  ckThen = then || null;
  renderCheckin();
}
function renderCheckin() {
  const d = ckDraft;
  const ms = UPPER_MUSCLES.concat(S.profile.noLegs ? [] : ['quads', 'hamstrings', 'glutes', 'calves']);
  openSheet(sheetHead('Bilan du jour', '30 secondes pour adapter la séance à votre forme réelle.') +
    `<div class="stack" style="gap:16px">` +
    CK_FIELDS.map(f => `<div><p class="label" style="margin-bottom:6px">${f.t}</p><div class="scale">${[1, 2, 3, 4, 5].map(v => `<button data-act="ck-set" data-k="${f.k}" data-v="${v}" aria-pressed="${d[f.k] === v}">${v}</button>`).join('')}</div><div class="scale-l"><span>${f.lo}</span><span>${f.hi}</span></div></div>`).join('') +
    `<div><p class="label" style="margin-bottom:6px">Muscles courbaturés (facultatif)</p><div class="mchips">${ms.map(m => `<button class="chip" data-act="ck-sore" data-m="${m}" aria-pressed="${d.soreMuscles.includes(m)}">${esc(MUSCLES[m].short)}</button>`).join('')}</div></div>
    <div><p class="label" style="margin-bottom:6px">Douleur inhabituelle (articulation, douleur aiguë, irradiante…)</p><div class="mchips">${ms.map(m => `<button class="chip" data-act="ck-pain" data-m="${m}" aria-pressed="${d.painMuscles.includes(m)}">${esc(MUSCLES[m].short)}</button>`).join('')}</div>
      <p class="xs muted" style="margin-top:6px">Une courbature est diffuse, apparaît 24 à 48 h après l'effort et diminue en bougeant. Une douleur vive, localisée ou articulaire n'est pas une courbature : la zone sera exclue de la séance.</p></div>
    ${d.painMuscles.length ? `<div class="notice bad">${icon('alert')}<span>Zone douloureuse exclue de la séance. Si la douleur persiste plus de quelques jours, s'aggrave ou s'accompagne de gonflement, d'engourdissement ou de perte de force, consultez un médecin ou un kinésithérapeute.</span></div>` : ''}
    <button class="btn primary block" data-act="ck-save">${ckThen ? 'Enregistrer et générer la séance' : 'Enregistrer le bilan'}</button></div>`);
}
function saveCheckin() {
  const c = Object.assign({}, ckDraft, { id: E.uid(), date: Date.now() });
  S.checkins = (S.checkins || []).filter(x => Date.now() - x.date < 90 * DAY);
  S.checkins.push(c);
  const then = ckThen; ckThen = null;
  closeSheet(); commit({ render: false });
  const r = E.readiness(c);
  toast(`Bilan enregistré : forme ${r.score}/100`);
  if (then) then(c); else render();
}

// =====================================================================
// MUSCLES : silhouette interactive
// =====================================================================
const AFTER = [];
const SEL_GROUPS_UPPER = ['pec_upper', 'pec_mid', 'pec_lower', 'lats', 'traps', 'rhomboids', 'delt_front', 'delt_side', 'delt_rear', 'biceps', 'triceps', 'forearms'];
const SEL_OTHERS = ['abs', 'obliques', 'lower_back', 'quads', 'hamstrings', 'glutes', 'calves'];

VIEWS.muscles = function (now) {
  const ck = E.latestCheckin(S, now);
  const vol = E.rolling7(S, now), cw = E.calendarWeek(S, now);
  const tg = E.targets(S);
  const rec = E.recovery(S, now, ck);
  const sel = UI.sel;
  const p = S.profile;

  AFTER.push(() => {
    paintBody($('#body-sel'), m => {
      const g = MUSCLES[m].group;
      let c = sel.has(m) ? 'sel ' : '';
      if (MUSCLES[m].region === 'legs' && p.noLegs && !sel.has(m)) c += 'off ';
      if (UI.heat === 'volume') c += 'h-' + E.groupStatus(vol.group[g], tg[g]);
      if (UI.heat === 'recovery') { const r = rec[m]; c += r >= 80 ? 'r-ok' : r >= 55 ? 'r-mid' : 'r-low'; }
      return c;
    });
    $$('#body-sel .bd-m').forEach(el => { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', MUSCLES[el.dataset.m].name); el.setAttribute('aria-pressed', sel.has(el.dataset.m)); });
  });

  const chip = m => `<button class="chip" data-act="toggle-m" data-m="${m}" aria-pressed="${sel.has(m)}">${esc(MUSCLES[m].name)}</button>`;
  const allPecs = ['pec_upper', 'pec_mid', 'pec_lower'].every(m => sel.has(m));
  const focus = UI.focusM;
  const focusCard = focus ? (() => {
    const g = MUSCLES[focus].group, t = tg[g], st = E.groupStatus(vol.group[g], t), r = rec[focus], rl = E.recoveryLabel(r);
    return `<div class="card fade-in"><div class="spread"><h3>${esc(MUSCLES[focus].name)}</h3><span class="chip ${STATUS_CHIP[st]}">${STATUS_TXT[st]}</span></div>
      <div class="grid g3" style="margin-top:12px"><div class="stat"><p class="eyebrow">7 jours</p><div class="v" style="font-size:24px">${fmt(vol.muscle[focus])}</div><div class="d">séries pondérées</div></div>
      <div class="stat"><p class="eyebrow">Groupe</p><div class="v" style="font-size:24px">${fmt(vol.group[g])}<small>/${t.min}-${t.max}</small></div><div class="d">${esc(GROUPS[g].name)}</div></div>
      <div class="stat"><p class="eyebrow">Récup.</p><div class="v" style="font-size:24px">${r}<small>%</small></div><div class="d">${rl.text}</div></div></div></div>`;
  })() : '';

  const groupsShown = Object.keys(GROUPS).filter(g => !(GROUPS[g].region === 'legs' && p.noLegs && !vol.group[g])).sort((a, b) => GROUPS[a].order - GROUPS[b].order);

  return `<div class="spread" style="margin-bottom:12px"><h1>Muscles</h1><span class="chip acc">${sel.size} sélectionné${sel.size > 1 ? 's' : ''}</span></div>
  <div class="grid md-2">
    <div class="card">
      <div class="tabs" role="tablist" aria-label="Coloration">${[['volume', 'Volume 7 j'], ['recovery', 'Récupération'], ['none', 'Aucune']].map(([k, l]) => `<button role="tab" aria-selected="${UI.heat === k}" data-act="heat" data-k="${k}">${l}</button>`).join('')}</div>
      <div id="body-sel">${bodyPair()}</div>
      <div class="legend" style="justify-content:center;margin-top:8px">${UI.heat === 'volume' ? '<span><i style="background:var(--warn)"></i>en retard</span><span><i style="background:rgba(143,180,255,.7)"></i>presque</span><span><i style="background:var(--good)"></i>dans la cible</span><span><i style="background:var(--bad)"></i>trop</span>' : UI.heat === 'recovery' ? '<span><i style="background:var(--good)"></i>récupéré</span><span><i style="background:var(--warn)"></i>partiel</span><span><i style="background:var(--bad)"></i>fatigué</span>' : ''}<span><i style="background:var(--accent)"></i>sélectionné</span></div>
    </div>
    <div class="stack">
      <div class="card">
        <div class="row" style="margin-bottom:12px">
          <button class="btn sm" data-act="sel-upper">Tout le haut du corps</button>
          <button class="btn sm" data-act="sel-lagging">Muscles en retard</button>
          ${sel.size ? '<button class="btn sm ghost" data-act="sel-clear">Effacer</button>' : ''}
        </div>
        <p class="eyebrow" style="margin-bottom:8px">Haut du corps</p>
        <div class="mchips"><button class="chip" data-act="toggle-pecs" aria-pressed="${allPecs}">Pectoraux (tous)</button>${SEL_GROUPS_UPPER.map(chip).join('')}</div>
        <p class="eyebrow" style="margin:14px 0 8px">Autres</p>
        <div class="mchips">${SEL_OTHERS.map(chip).join('')}</div>
        ${p.noLegs ? '<p class="xs muted" style="margin-top:8px">Jambes non programmées selon votre profil : elles restent sélectionnables si vous le souhaitez.</p>' : ''}
        <div class="grid g2" style="margin-top:16px">
          <button class="btn primary" data-act="custom-session" ${sel.size ? '' : 'disabled'}>${icon('dumbbell')}Séance personnalisée</button>
          <button class="btn" data-act="auto-session">${icon('sparkle')}Séance automatique</button>
        </div>
      </div>
      ${focusCard}
    </div>
  </div>
  ${sel.size ? gymForSelection(sel) : ''}
  <div class="section card"><div class="card-h"><h3>Volume hebdomadaire par groupe</h3><button class="btn sm ghost" data-act="tab-sub" data-tab="profile" data-sub="targets">Modifier les cibles</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Groupe</th><th>7 j glissants</th><th>Depuis lundi</th><th>Cible</th><th>Récup.</th><th>État</th></tr></thead><tbody>
    ${groupsShown.map(g => { const st = E.groupStatus(vol.group[g], tg[g]); const r = E.groupRecovery(rec, g); return `<tr><td><b>${esc(GROUPS[g].name)}</b></td><td class="num">${fmt(vol.group[g])}</td><td class="num">${fmt(cw.group[g])}</td><td class="num">${tg[g].max ? tg[g].min + '-' + tg[g].max : '—'}</td><td class="num" style="color:${r >= 80 ? 'var(--good)' : r >= 55 ? 'var(--warn)' : 'var(--bad)'}">${r} %</td><td><span class="chip ${STATUS_CHIP[st]}">${STATUS_TXT[st]}</span></td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="xs muted" style="margin-top:8px">Séries « dures » pondérées : une série compte 1 pour le muscle principal, 0,5 pour un muscle secondaire (ex. triceps au développé couché) et 0,25 pour un muscle peu sollicité.</p></div>`;
};

function selectLagging() {
  const nd = E.need(S, Date.now());
  UI.sel.clear();
  Object.keys(nd).filter(g => (nd[g].status === 'low' || nd[g].status === 'near') && !(GROUPS[g].region === 'legs' && S.profile.noLegs) && nd[g].recovery >= 55)
    .forEach(g => GROUPS[g].muscles.forEach(m => UI.sel.add(m)));
  if (!UI.sel.size) toast('Aucun groupe en retard et récupéré pour le moment.');
}

// =====================================================================
// GÉNÉRATION
// =====================================================================
function withCheckin(fn) {
  const ck = E.latestCheckin(S, Date.now());
  if (ck) fn(ck); else openCheckin(fn);
}
function buildPlan(muscles, opts) {
  opts = opts || {};
  const now = Date.now();
  const plan = E.generate(S, { muscles, now, auto: opts.auto, title: opts.title, checkin: E.latestCheckin(S, now) });
  if (plan.error) {
    const alts = plan.alternatives || [];
    openSheet(sheetHead('Pas de séance à générer') + `<div class="stack"><p>${esc(plan.error)}</p>
      ${(plan.warnings || []).map(w => `<div class="notice warn">${icon('alert')}<span>${esc(w)}</span></div>`).join('')}
      ${alts.length ? `<p class="label">Groupes pertinents aujourd'hui</p><div class="stack">${alts.map(a => `<button class="btn" data-act="gen-groups" data-groups="${a.g}">${esc(a.name)} · ${fmt(a.done)}/${a.target.min}-${a.target.max} séries, récup. ${a.recovery} %</button>`).join('')}</div>` : '<p class="muted">Une séance de cardio léger ou une journée de repos est la meilleure option aujourd\'hui.</p>'}</div>`);
    return;
  }
  if (opts.template) plan.template = opts.template;
  S.plan = plan;
  commit({ render: false });
  go('train', 'session');
}
function autoSession() {
  withCheckin(ck => {
    const r = E.recommend(S, Date.now(), ck);
    if (!r.muscles.length) { toast(r.lightDay || 'Aucun groupe disponible aujourd\'hui.'); return; }
    buildPlan(r.muscles, { auto: true, title: r.template.name, template: r.template.id });
  });
}
function customSession() {
  if (!UI.sel.size) return;
  withCheckin(() => buildPlan(Array.from(UI.sel)));
}

// Prescription d'un exercice ajouté à la main ou remplacé
function prescribe(exId, n, group) {
  const ex = EXERCISES[exId];
  const ready = E.readiness(E.latestCheckin(S, Date.now()));
  const sc = E.scheme(S, ex, ready);
  const pr = E.progression(S, ex, { now: Date.now(), reps: sc.reps, rir: sc.rir, ready });
  const sets = [];
  for (let i = 0; i < n; i++) sets.push({ targetReps: pr.reps, targetRir: sc.rir, load: pr.load, reps: '', rir: '', done: false });
  return { uid: E.uid(), exId, group: group || ex.primaryGroup, repRange: sc.reps, rir: sc.rir, rest: sc.rest, tempo: sc.tempo, progression: { kind: pr.kind, why: pr.why }, warmup: null, sets };
}

// =====================================================================
// ENTRAÎNEMENT
// =====================================================================
VIEWS.train = function (now) {
  const sub = UI.sub.train;
  const tabs = `<div class="tabs" role="tablist">${[['session', 'Séance'], ['library', 'Exercices'], ['cardio', 'Cardio']].map(([k, l]) => `<button role="tab" aria-selected="${sub === k}" data-act="sub" data-tab="train" data-sub="${k}">${l}</button>`).join('')}</div>`;
  const body = sub === 'library' ? libraryView() : sub === 'cardio' ? cardioView(now) : sessionView(now);
  return `<h1 style="margin-bottom:12px">Entraînement</h1>` + tabs + body;
};

const KIND_TXT = { increase: 'Progression', hold: 'Consolidation', reduce: 'Allègement', estimate: 'Charge estimée' };

function sessionView(now) {
  if (S.active) {
    return `<div class="card hero"><p class="eyebrow">Séance en cours</p><h2 style="margin:6px 0">${esc(S.active.title)}</h2><button class="btn primary" data-act="open-live">${icon('play')}Reprendre la séance</button></div>`;
  }
  const plan = S.plan;
  if (!plan) {
    const rec = E.recommend(S, now);
    const recent = S.workouts.filter(w => w.finishedAt).slice(-4).reverse();
    return `<div class="card hero"><p class="eyebrow">Recommandation du jour</p><h2 style="margin:6px 0">${esc(rec.template.name)}</h2>
        <p class="small muted">${esc(rec.reasons.slice(0, 2).join(' · '))}</p>
        <div class="row" style="margin-top:12px"><button class="btn primary" data-act="auto-session">${icon('sparkle')}Séance automatique</button><button class="btn" data-act="tab" data-tab="muscles">${icon('body')}Choisir mes muscles</button></div></div>
      <div class="section"><p class="eyebrow" style="margin-bottom:8px">Séances types</p><div class="grid g2">
        ${E.TEMPLATES.filter(t => !(t.legs && S.profile.noLegs)).map(t => `<button class="btn" style="justify-content:flex-start;text-align:left" data-act="template" data-t="${t.id}">${esc(t.name)}</button>`).join('')}
        <button class="btn ghost" style="justify-content:flex-start" data-act="empty-session">${icon('plus')}Séance libre (vide)</button></div></div>
      ${recent.length ? `<div class="section card"><div class="card-h"><h3>Dernières séances</h3><button class="btn sm ghost" data-act="sub" data-tab="progress" data-sub="history">Historique</button></div><div class="list">${recent.map(historyItem).join('')}</div></div>` : ''}`;
  }
  const gi = plan.groupInfo || {};
  const totalSets = plan.exercises.reduce((a, e) => a + e.sets.length, 0);
  const exHtml = plan.exercises.map((e, i) => {
    const ex = EXERCISES[e.exId];
    const s0 = e.sets[0] || {};
    return `<div class="plan-ex fade-in" style="animation-delay:${i * 40}ms">
      <div class="spread" style="align-items:flex-start"><button class="row" style="background:none;border:0;padding:0;text-align:left;flex-wrap:nowrap;min-width:0" data-act="ex-detail" data-ex="${ex.id}">${exBadge(ex)}<div style="min-width:0"><div class="li-title">${i + 1}. ${esc(ex.name)}</div><div class="xs muted">${esc(GROUPS[e.group] ? GROUPS[e.group].name : '')} · ${esc(EQUIPMENT[ex.eq])}</div></div></button>
        <div class="row" style="flex-wrap:nowrap;gap:6px"><button class="icon-btn" title="Remplacer" aria-label="Remplacer" data-act="plan-swap" data-uid="${e.uid}">${icon('swap')}</button><button class="icon-btn" title="Supprimer" aria-label="Supprimer" data-act="plan-del" data-uid="${e.uid}">${icon('trash')}</button></div></div>
      <div class="pres"><span><b>${e.sets.length}</b> séries</span><span><b>${s0.targetReps}</b> reps <span class="muted">(${e.repRange[0]}-${e.repRange[1]})</span></span><span><b>${esc(E.loadStr(ex, s0.load))}</b></span><span>RIR <b>${e.rir}</b></span><span>repos <b>${ftime(e.rest)}</b></span><span>tempo <b>${esc(e.tempo)}</b></span></div>
      <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm" data-act="plan-sets" data-uid="${e.uid}" data-d="-1" aria-label="Retirer une série">${icon('minus')}</button><button class="btn sm" data-act="plan-sets" data-uid="${e.uid}" data-d="1" aria-label="Ajouter une série">${icon('plus')}</button>
        ${i > 0 ? `<button class="btn sm ghost" data-act="plan-move" data-uid="${e.uid}" data-d="-1">Monter</button>` : ''}</div>
      <div class="why"><span class="kind ${e.progression.kind}">${KIND_TXT[e.progression.kind] || ''}</span> · ${esc(e.progression.why)}${e.warmup ? `<br><span class="muted">${esc(e.warmup)}</span>` : ''}</div>
    </div>`;
  }).join('');
  const why = Object.keys(gi).map(g => `<li><b>${esc(GROUPS[g].name)}</b> → ${gi[g].planned} séries prévues. <span class="muted">${esc(gi[g].why.join(' ; '))}.</span></li>`).join('');
  return `<div class="card hero"><div class="spread" style="align-items:flex-start"><div><p class="eyebrow">${plan.auto ? 'Séance automatique' : 'Séance personnalisée'} · prête</p><h2 style="margin:6px 0">${esc(plan.title || 'Séance libre')}</h2>
      <p class="small muted">${plan.exercises.length} exercices · ${totalSets} séries · ~${plan.estMinutes || Math.round(6 + totalSets * 2.6)} min</p></div></div>
      <div class="row" style="margin-top:10px;flex-wrap:nowrap"><span class="label" style="white-space:nowrap">Salle</span>${gymSelect('gym-sel-p')}</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-act="start" ${plan.exercises.length ? '' : 'disabled'}>${icon('play')}Démarrer</button><button class="btn" data-act="regen">Régénérer</button><button class="btn ghost danger" data-act="plan-cancel">Abandonner</button></div></div>
    ${(plan.notes || []).length ? `<div class="notice acc section">${icon('info')}<span>${(plan.notes || []).map(esc).join('<br>')}</span></div>` : ''}
    ${(plan.warnings || []).map(w => `<div class="notice warn" style="margin-top:10px">${icon('alert')}<span>${esc(w)}</span></div>`).join('')}
    ${why ? `<details class="card section"><summary style="cursor:pointer;font-weight:600">Pourquoi ce volume ?</summary><ul class="small" style="margin:10px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:6px">${why}</ul></details>` : ''}
    <div class="section">${exHtml || '<p class="muted">Aucun exercice pour l\'instant.</p>'}</div>
    <button class="btn block section" data-act="plan-add">${icon('plus')}Ajouter un exercice</button>`;
}

function historyItem(w) {
  const st = E.workoutStats(w, E.currentWeight(S));
  return `<button class="li" data-act="history" data-id="${w.id}"><div class="li-main"><div class="li-title">${esc(w.title || 'Séance')}</div><div class="xs muted">${esc(fday(w.finishedAt))} · ${st.sets} séries · ${fmt(st.tonnage, 0)} kg · ${st.minutes} min</div></div>${icon('chev')}</button>`;
}

// ----- sélecteur d'exercice (ajout / remplacement)
let pickCtx = null;
function openPicker(ctx) {
  pickCtx = Object.assign({ q: '', group: '' }, ctx);
  renderPicker();
}
function renderPicker() {
  const c = pickCtx;
  let list;
  if (c.mode === 'swap') {
    list = E.alternatives(S, c.exId, { avoidMuscles: c.avoid || [], exclude: c.exclude || [] });
  } else {
    const q = E.norm(c.q);
    list = EXERCISE_LIST.filter(ex => (!c.group || ex.primaryGroup === c.group) && (!q || E.norm(ex.name).includes(q)) && E.exAvailable(S, ex));
  }
  const title = c.mode === 'swap' ? `Remplacer « ${EXERCISES[c.exId].name} »` : 'Ajouter un exercice';
  openSheet(sheetHead(title, c.mode === 'swap' ? 'Exercices ciblant le même groupe, du plus proche au plus différent.' : '') +
    (c.mode !== 'swap' ? `<div class="grid g2" style="margin-bottom:10px"><input class="input" id="pick-q" data-input="pick-q" placeholder="Rechercher" value="${esc(c.q)}"><select class="input" id="pick-g" data-input="pick-g"><option value="">Tous les groupes</option>${Object.keys(GROUPS).map(g => `<option value="${g}" ${c.group === g ? 'selected' : ''}>${esc(GROUPS[g].name)}</option>`).join('')}</select></div>` : '') +
    `<div class="list" id="pick-list">${list.slice(0, 40).map(ex => `<button class="li" data-act="pick" data-ex="${ex.id}">${exBadge(ex)}<div class="li-main"><div class="li-title">${esc(ex.name)}</div><div class="xs muted">${esc(primaryTxt(ex))} · ${esc(EQUIPMENT[ex.eq])}</div></div>${icon('plus')}</button>`).join('') || '<p class="muted">Aucun exercice correspondant.</p>'}</div>`);
}
function onPick(exId) {
  const c = pickCtx; pickCtx = null;
  closeSheet();
  if (c.target === 'plan') {
    if (c.mode === 'swap') {
      const i = S.plan.exercises.findIndex(e => e.uid === c.uid);
      const old = S.plan.exercises[i];
      const ne = prescribe(exId, old.sets.length, old.group);
      ne.uid = old.uid; S.plan.exercises[i] = ne;
    } else S.plan.exercises.push(prescribe(exId, 3));
    commit();
  } else if (c.target === 'live') liveOnPick(c, exId);
}

// ----- fiche exercice
function openExercise(exId) {
  const ex = EXERCISES[exId];
  const perf = E.performances(S, exId);
  const bw = E.currentWeight(S);
  const fav = (S.settings.favorites || []).includes(exId), exc = (S.settings.excluded || []).includes(exId);
  const last = perf[0];
  openSheet(sheetHead(esc(ex.name), `${esc(EQUIPMENT[ex.eq])} · ${ex.type === 'compound' ? 'polyarticulaire' : 'isolation'}`) +
    `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:14px">${miniBody(ex)}<div class="stack" style="gap:8px;min-width:0">
      <div><p class="label">Muscle principal</p><p><b>${esc(primaryTxt(ex))}</b></p></div>
      ${musclesTxt(ex) ? `<div><p class="label">Muscles secondaires</p><p class="small">${esc(musclesTxt(ex))}</p></div>` : ''}
      <div class="pres" style="margin:0"><span><b>${ex.sets[0]}-${ex.sets[1]}</b> séries</span><span><b>${ex.reps[0]}-${ex.reps[1]}</b> reps</span><span>repos <b>${ftime(ex.rest)}</b></span></div></div></div>
    <div class="stack" style="margin-top:14px">
      <p>${esc(ex.desc)}</p>
      <div><p class="label">Position de départ</p><p class="small">${esc(ex.setup)}</p></div>
      <div><p class="label">Exécution</p><p class="small">${esc(ex.exec)}</p></div>
      <div><p class="label">Erreurs à éviter</p><ul class="small" style="margin:4px 0 0;padding-left:18px">${ex.mistakes.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
      <div><p class="label">Matériel requis</p><p class="small" style="margin-bottom:6px">${esc(needTxt(ex))}</p>${(ex.need || []).flat().length ? `<div class="mchips">${Array.from(new Set((ex.need || []).flat())).map(i => itemChip(i)).join('')}</div>` : ''}
        ${E.exAvailable(S, ex) ? '' : `<p class="xs" style="color:var(--warn);margin-top:6px">Indisponible dans « ${esc(E.activeGym(S).name)} » : il ne sera pas proposé.</p>`}</div>
      <div><p class="label">Variantes</p><div class="tbl-wrap"><table class="tbl"><tbody><tr><td class="muted">Débutant</td><td>${esc(ex.variants.deb)}</td></tr><tr><td class="muted">Intermédiaire</td><td>${esc(ex.variants.int)}</td></tr><tr><td class="muted">Avancé</td><td>${esc(ex.variants.adv)}</td></tr></tbody></table></div></div>
      <div><p class="label">Votre historique</p>${last ? `<p class="small">Dernière fois le ${esc(fdate(last.date))} : ${last.sets.map(s => `${s.reps}×${E.loadStr(ex, s.load)}`).join(', ')} · 1RM estimé ${fmt(E.bestE1rm(ex, last, last.bw || bw), 0)} kg · ${perf.length} séance${perf.length > 1 ? 's' : ''}</p><button class="btn sm" style="margin-top:6px" data-act="prog-ex" data-ex="${exId}">${icon('chart')}Voir la progression</button>` : '<p class="small muted">Jamais réalisé.</p>'}</div>
      <div class="row">${S.plan && !S.active ? `<button class="btn primary" data-act="add-to-plan" data-ex="${exId}">${icon('plus')}Ajouter à la séance prévue</button>` : ''}
        <button class="btn sm" data-act="fav" data-ex="${exId}">${fav ? 'Retirer des favoris' : 'Favori (prioritaire)'}</button>
        <button class="btn sm ${exc ? '' : 'ghost'}" data-act="exclude" data-ex="${exId}">${exc ? 'Réautoriser' : 'Ne jamais proposer'}</button></div>
    </div>`);
}

// ----- bibliothèque
function libraryView() {
  const f = UI.libFilter;
  const q = E.norm(f.q);
  const list = EXERCISE_LIST.filter(ex => (!f.onlyGym || E.exAvailable(S, ex)) && (!f.group || ex.primaryGroup === f.group) && (!f.eq || ex.eq === f.eq) && (!q || E.norm(ex.name + ' ' + primaryTxt(ex)).includes(q)));
  return `<div class="grid g3" style="margin-bottom:10px;grid-template-columns:2fr 1fr 1fr"><input class="input" id="lib-q" data-input="lib-q" placeholder="Rechercher un exercice" value="${esc(f.q)}">
      <select class="input" id="lib-g" data-input="lib-g" aria-label="Groupe"><option value="">Groupe</option>${Object.keys(GROUPS).map(g => `<option value="${g}" ${f.group === g ? 'selected' : ''}>${esc(GROUPS[g].name)}</option>`).join('')}</select>
      <select class="input" id="lib-e" data-input="lib-e" aria-label="Matériel"><option value="">Matériel</option>${Object.keys(EQUIPMENT).map(k => `<option value="${k}" ${f.eq === k ? 'selected' : ''}>${esc(EQUIPMENT[k])}</option>`).join('')}</select></div>
    <div class="spread" style="margin-bottom:8px"><span class="xs muted">${list.length} exercices</span><button class="chip" data-act="lib-gym" aria-pressed="${!!f.onlyGym}">Seulement « ${esc(E.activeGym(S).name)} »</button></div>
    <div class="card" style="padding-block:4px"><div class="list" id="lib-list">${list.map(ex => `<button class="li" data-act="ex-detail" data-ex="${ex.id}">${exBadge(ex)}<div class="li-main"><div class="li-title">${esc(ex.name)}</div><div class="xs muted">${esc(primaryTxt(ex))}${musclesTxt(ex, 0.5) ? ' · ' + esc(musclesTxt(ex, 0.5)) : ''}</div></div>${E.exAvailable(S, ex) ? `<span class="xs muted" style="white-space:nowrap">${ex.reps[0]}-${ex.reps[1]}</span>` : '<span class="chip" style="padding:2px 8px">absent</span>'}</button>`).join('')}</div></div>`;
}

// ----- cardio
function cardioView(now) {
  const prefs = S.settings.cardio || { type: 'incline_walk', intensity: 'moderate', minutes: 30, perWeek: 3, weeklyKcal: 1200 };
  const cp = E.cardioPlan(S, now, prefs);
  const kg = E.currentWeight(S);
  const logs = (S.cardioLogs || []).slice().sort((a, b) => b.date - a.date).slice(0, 8);
  const sel = (id, opts, v) => `<select class="input" id="${id}" data-input="${id}">${Object.keys(opts).map(k => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(opts[k].name || opts[k])}</option>`).join('')}</select>`;
  const goalPct = prefs.weeklyKcal ? Math.min(100, Math.round(cp.done.kcal / prefs.weeklyKcal * 100)) : 0;
  return `<div class="grid md-2">
    <div class="card"><h3 style="margin-bottom:12px">Mon plan cardio</h3>
      <div class="grid g2"><div class="field"><label for="cp-type">Activité</label>${sel('cp-type', E.CARDIO, prefs.type)}</div>
      <div class="field"><label for="cp-int">Intensité</label>${sel('cp-int', E.INTENSITY, prefs.intensity)}</div>
      <div class="field"><label for="cp-min">Durée (min)</label><input class="input" type="number" inputmode="numeric" id="cp-min" data-input="cp-min" value="${prefs.minutes}" min="5" max="180"></div>
      <div class="field"><label for="cp-fr">Séances / semaine</label><input class="input" type="number" inputmode="numeric" id="cp-fr" data-input="cp-fr" value="${prefs.perWeek}" min="0" max="7"></div>
      <div class="field" style="grid-column:1/-1"><label for="cp-kcal">Objectif indicatif (kcal / semaine)</label><input class="input" type="number" inputmode="numeric" id="cp-kcal" data-input="cp-kcal" value="${prefs.weeklyKcal}" step="100"></div></div>
      <div class="grid g2" style="margin-top:14px"><div class="stat"><p class="eyebrow">Par séance</p><div class="v" style="font-size:24px">~${cp.perSession}<small>kcal</small></div></div><div class="stat"><p class="eyebrow">Par semaine</p><div class="v" style="font-size:24px">~${cp.weekly}<small>kcal</small></div></div></div>
      <ul class="small" style="margin:12px 0 0;padding-left:18px;color:var(--fg-2);display:flex;flex-direction:column;gap:6px">${cp.advice.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
      <p class="xs muted" style="margin-top:10px">Estimations basées sur des équivalents métaboliques (MET) et votre poids (${fmt(kg)} kg) : la dépense réelle varie selon les personnes.</p></div>
    <div class="stack">
      <div class="card"><div class="card-h"><h3>Cette semaine</h3><span class="chip">${cp.done.count}/${prefs.perWeek} séances</span></div>
        <div class="vol-track" style="height:12px"><div class="vol-fill ${goalPct >= 100 ? 'ok' : ''}" style="width:${goalPct}%"></div></div>
        <p class="small muted" style="margin-top:8px">${cp.done.minutes} min · ~${cp.done.kcal} kcal sur ${prefs.weeklyKcal} kcal visées</p></div>
      <div class="card"><h3 style="margin-bottom:12px">Enregistrer une séance cardio</h3>
        <form data-form="cardio" class="grid g2">
          <div class="field"><label for="cl-type">Activité</label>${sel('cl-type', E.CARDIO, prefs.type).replace('data-input="cl-type"', 'name="type"')}</div>
          <div class="field"><label for="cl-int">Intensité</label>${sel('cl-int', E.INTENSITY, prefs.intensity).replace('data-input="cl-int"', 'name="intensity"')}</div>
          <div class="field"><label for="cl-min">Durée (min)</label><input class="input" type="number" inputmode="numeric" id="cl-min" name="minutes" value="${prefs.minutes}" min="1" required></div>
          <div class="field"><label for="cl-date">Date</label><input class="input" type="date" id="cl-date" name="date" value="${isoDay(now)}"></div>
          <button class="btn primary" style="grid-column:1/-1">${icon('plus')}Enregistrer</button></form></div>
    </div></div>
    ${logs.length ? `<div class="card section"><h3 style="margin-bottom:6px">Historique cardio</h3><div class="list">${logs.map(l => `<div class="li"><div class="eq-badge">${icon('run')}</div><div class="li-main"><div class="li-title">${esc(E.CARDIO[l.type].name)}</div><div class="xs muted">${esc(fday(l.date))} · ${l.minutes} min · ${esc(E.INTENSITY[l.intensity])} · ~${l.kcal} kcal</div></div><button class="icon-btn" data-act="del-cardio" data-id="${l.id}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('')}</div></div>` : ''}
    <div class="card section"><h3 style="margin-bottom:8px">Comparatif pour 30 minutes</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Activité</th><th>Légère</th><th>Modérée</th><th>Soutenue</th><th>Impact articulaire</th></tr></thead><tbody>
      ${Object.keys(E.CARDIO).map(k => `<tr><td>${esc(E.CARDIO[k].name)}</td>${['light', 'moderate', 'vigorous'].map(i => `<td class="num">~${E.cardioKcal(k, i, 30, kg)}</td>`).join('')}<td>${E.CARDIO[k].impact}</td></tr>`).join('')}</tbody></table></div></div>`;
}

// ----- matériel de la salle pour les muscles sélectionnés
function gymForSelection(sel) {
  const groups = Array.from(new Set(Array.from(sel).map(m => MUSCLES[m].group))).sort((a, b) => GROUPS[a].order - GROUPS[b].order);
  return `<div class="card section"><div class="card-h" style="align-items:center"><div><h3>Machines disponibles pour ces muscles</h3><p class="xs muted" style="margin-top:3px">Touchez une machine pour la passer de ✓ disponible à ★ préférée, puis à absente. Le générateur ne propose que ce qui existe dans la salle choisie.</p></div></div>
    <div class="row" style="margin-bottom:14px;flex-wrap:nowrap"><span class="label" style="white-space:nowrap">Salle</span>${gymSelect('gym-sel-m')}<button class="btn sm ghost" data-act="tab-sub" data-tab="profile" data-sub="gyms" style="white-space:nowrap">Gérer</button></div>
    ${groups.map(g => {
      const n = E.availableCount(S, g);
      const items = E.itemsForGroups([g]);
      return `<div class="gym-group"><div class="spread" style="margin-bottom:8px"><b>${esc(GROUPS[g].name)}</b><span class="chip ${n ? '' : 'bad'}">${n} exercice${n > 1 ? 's' : ''} possible${n > 1 ? 's' : ''}</span></div>
        <div class="mchips">${items.map(x => itemChip(x.item, x.exercises.length + ' ex.')).join('')}</div>
        ${n ? '' : '<p class="xs" style="color:var(--bad);margin-top:6px">Aucun exercice réalisable : réactivez au moins une machine pour ce muscle.</p>'}</div>`;
    }).join('')}
    ${groups.some(g => GROUPS[g].region === 'upper') ? '<p class="xs muted" style="margin-top:12px">Les pompes restent toujours possibles : elles ne demandent aucun matériel.</p>' : ''}</div>`;
}

// =====================================================================
// SÉANCE EN DIRECT
// =====================================================================
UI.liveOpen = false;
let tickT = null, wakeLock = null, audioCtx = null, restAlerted = false;

function startWorkout() {
  const plan = S.plan; if (!plan || !plan.exercises.length) return;
  S.active = { id: 'w' + E.uid(), title: plan.title || 'Séance', template: plan.template || null, planId: plan.id, auto: plan.auto,
    startedAt: Date.now(), bodyweight: E.currentWeight(S), cur: 0, rest: null,
    exercises: JSON.parse(JSON.stringify(plan.exercises)) };
  UI.liveOpen = true;
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  requestWake();
  commit();
}
async function requestWake() {
  try { if (navigator.wakeLock && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => wakeLock = null); } } catch (e) { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S && S.active && UI.liveOpen) requestWake(); });

function beep() {
  try {
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    if (!audioCtx) return;
    [0, 0.22].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch (e) { /* son indisponible */ }
}

function renderLive() {
  const host = $('#live');
  if (!S.active || !UI.liveOpen) { host.innerHTML = ''; document.body.style.overflow = ''; clearInterval(tickT); tickT = null; return; }
  document.body.style.overflow = 'hidden';
  const A = S.active;
  A.cur = Math.min(A.cur, Math.max(0, A.exercises.length - 1));
  const e = A.exercises[A.cur];
  const doneSets = A.exercises.reduce((a, x) => a + x.sets.filter(s => s.done).length, 0);
  const totSets = A.exercises.reduce((a, x) => a + x.sets.length, 0);
  let body = '';
  if (!e) {
    body = `<div class="card" style="margin-top:16px"><p>Plus aucun exercice dans cette séance.</p><button class="btn" style="margin-top:10px" data-act="live-add">${icon('plus')}Ajouter un exercice</button></div>`;
  } else {
    const ex = EXERCISES[e.exId];
    const unit = ex.unit === 'added' ? 'Lest kg' : ex.unit === 'per_hand' ? 'kg/halt.' : 'Charge kg';
    body = `
    <div class="ex-dots" role="tablist" aria-label="Exercices">${A.exercises.map((x, i) => `<button class="ex-dot ${i === A.cur ? 'cur' : x.sets.length && x.sets.every(s => s.done) ? 'done' : ''}" data-act="live-go" data-i="${i}" aria-label="${esc(EXERCISES[x.exId].name)}"></button>`).join('')}</div>
    <div class="spread" style="margin-top:8px;align-items:flex-start"><div style="min-width:0"><p class="eyebrow">Exercice ${A.cur + 1}/${A.exercises.length} · ${esc(GROUPS[e.group] ? GROUPS[e.group].name : '')}</p><h1 style="margin-top:4px">${esc(ex.name)}</h1></div>
      <button class="icon-btn" data-act="ex-detail" data-ex="${ex.id}" aria-label="Fiche technique">${icon('info')}</button></div>
    <div class="pres"><span>Fourchette <b>${e.repRange[0]}-${e.repRange[1]}</b></span><span>RIR <b>${e.rir}</b></span><span>Repos <b>${ftime(e.rest)}</b></span><span>Tempo <b>${esc(e.tempo)}</b></span></div>
    <div class="why" style="font-size:12.5px"><span class="kind ${e.progression.kind}">${KIND_TXT[e.progression.kind] || ''}</span> · ${esc(e.progression.why)}${e.warmup ? `<br><span class="muted">${esc(e.warmup)}</span>` : ''}</div>
    <table class="set-table" style="margin-top:12px"><thead><tr><th>#</th><th>${unit}</th><th>Reps</th><th>RIR</th><th></th></tr></thead><tbody>
    ${e.sets.map((s, i) => `<tr class="${s.done ? 'done' : ''}"><td class="set-n">${i + 1}</td>
      <td><input class="cell-in" inputmode="decimal" aria-label="Charge série ${i + 1}" data-live="load" data-i="${i}" value="${esc(s.load)}"></td>
      <td><input class="cell-in" inputmode="numeric" aria-label="Répétitions série ${i + 1}" data-live="reps" data-i="${i}" value="${esc(s.reps)}" placeholder="${s.targetReps}"><span class="target-s">obj. ${s.targetReps}</span></td>
      <td><input class="cell-in" inputmode="numeric" aria-label="RIR série ${i + 1}" data-live="rir" data-i="${i}" value="${esc(s.rir)}" placeholder="${s.targetRir}" style="max-width:60px"><span class="target-s">obj. ${s.targetRir}</span></td>
      <td><button class="tick" data-act="live-done" data-i="${i}" aria-label="${s.done ? 'Annuler la validation' : 'Valider la série'}">${icon('check')}</button></td></tr>`).join('')}
    </tbody></table>
    <p class="xs muted">RIR = répétitions que vous auriez encore pu faire (0 = échec). Champs vides à la validation = valeurs prévues.</p>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="live-addset">${icon('plus')}Série</button><button class="btn sm" data-act="live-delset" ${e.sets.length > 1 ? '' : 'disabled'}>${icon('minus')}Série</button>
      <button class="btn sm" data-act="live-swap">${icon('swap')}Remplacer</button><button class="btn sm" data-act="live-pain">${icon('pain')}Douleur</button><button class="btn sm ghost danger" data-act="live-delex">${icon('trash')}Supprimer</button></div>
    <div class="grid g2" style="margin-top:18px"><button class="btn" data-act="live-prev" ${A.cur ? '' : 'disabled'}>${icon('back')}Précédent</button>
      ${A.cur < A.exercises.length - 1 ? `<button class="btn primary" data-act="live-next">Exercice suivant${icon('chev')}</button>` : `<button class="btn primary" data-act="live-finish">${icon('check')}Terminer</button>`}</div>
    <button class="btn ghost block" style="margin-top:8px" data-act="live-add">${icon('plus')}Ajouter un exercice</button>`;
  }
  const restBar = A.rest ? (() => {
    const left = (A.rest.endAt - Date.now()) / 1000;
    return `<div class="rest-bar ${left <= 0 ? 'over' : ''}" id="rest-bar"><div class="rest-in"><span class="rest-time" id="rest-time">${left > 0 ? ftime(left) : 'Go !'}</span>
      <div style="flex:1;min-width:0"><p class="xs muted" style="margin-bottom:6px">${left > 0 ? 'Repos' : 'Repos terminé · série suivante'}</p><div class="rest-prog"><i id="rest-prog" style="width:${Math.max(0, Math.min(100, (1 - left / A.rest.total) * 100))}%"></i></div></div>
      <button class="btn sm" data-act="rest-add" data-d="-15">−15</button><button class="btn sm" data-act="rest-add" data-d="15">+15</button><button class="icon-btn" data-act="rest-skip" aria-label="Passer le repos">${icon('x')}</button></div></div>`;
  })() : '';
  host.innerHTML = `<div class="live" role="dialog" aria-label="Séance en cours"><div class="live-in">
    <div class="live-head"><button class="icon-btn" data-act="live-min" aria-label="Réduire">${icon('back')}</button>
      <div style="flex:1;min-width:0"><div class="li-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(A.title)}</div><div class="xs muted"><span id="live-elapsed">${ftime((Date.now() - A.startedAt) / 1000)}</span> · ${doneSets}/${totSets} séries</div></div>
      <button class="btn sm primary" data-act="live-finish">Terminer</button></div>
    ${body}</div>${restBar}</div>`;
  if (!tickT) tickT = setInterval(tick, 1000);
}

function tick() {
  if (!S.active) return;
  const el = $('#live-elapsed'); if (el) el.textContent = ftime((Date.now() - S.active.startedAt) / 1000);
  const r = S.active.rest;
  if (r) {
    const left = (r.endAt - Date.now()) / 1000;
    const t = $('#rest-time'), pr = $('#rest-prog'), bar = $('#rest-bar');
    if (t) t.textContent = left > 0 ? ftime(left) : 'Go !';
    if (pr) pr.style.width = Math.max(0, Math.min(100, (1 - left / r.total) * 100)) + '%';
    if (left <= 0 && !restAlerted) { restAlerted = true; beep(); if (bar) { bar.classList.add('over'); const p = bar.querySelector('.xs'); if (p) p.textContent = 'Repos terminé · série suivante'; } }
    if (left < -90) { S.active.rest = null; renderLive(); }
  }
}

function liveSetDone(i) {
  const A = S.active, e = A.exercises[A.cur], s = e.sets[i];
  if (s.done) { s.done = false; A.rest = null; commit({ render: false }); renderLive(); return; }
  if (s.reps === '' || s.reps == null) s.reps = s.targetReps;
  if (s.rir === '' || s.rir == null) s.rir = s.targetRir;
  s.reps = num(s.reps) || 0; s.rir = num(s.rir); s.load = num(s.load) || 0;
  s.done = true; s.at = Date.now();
  // Charge modifiée : on la reporte sur les séries suivantes non validées
  e.sets.slice(i + 1).forEach(n => { if (!n.done) n.load = s.load; });
  const allDone = e.sets.every(x => x.done);
  const lastOfAll = allDone && A.cur === A.exercises.length - 1;
  if (!lastOfAll) { A.rest = { endAt: Date.now() + e.rest * 1000, total: e.rest }; restAlerted = false; }
  if (allDone && A.cur < A.exercises.length - 1) setTimeout(() => { if (S.active && S.active.exercises[S.active.cur] === e) { S.active.cur++; renderLive(); } }, 600);
  commit({ render: false }); renderLive();
}

function liveOnPick(c, exId) {
  const A = S.active;
  if (c.mode === 'swap') {
    const i = A.exercises.findIndex(e => e.uid === c.uid);
    const old = A.exercises[i];
    const keep = old.sets.filter(s => s.done);
    const ne = prescribe(exId, Math.max(1, old.sets.length - keep.length), old.group);
    if (keep.length) {
      // Les séries déjà faites restent attachées à l'ancien exercice
      old.sets = keep; A.exercises.splice(i + 1, 0, ne); A.cur = i + 1;
    } else { ne.uid = old.uid; A.exercises[i] = ne; }
  } else { A.exercises.push(prescribe(exId, 3)); A.cur = A.exercises.length - 1; }
  commit({ render: false }); renderLive();
}

function openPain() {
  const A = S.active, e = A.exercises[A.cur], ex = EXERCISES[e.exId];
  const ms = Object.keys(ex.m).sort((a, b) => ex.m[b] - ex.m[a]);
  UI.painSel = new Set(ms.filter(m => ex.m[m] === 1));
  const draw = () => openSheet(sheetHead('Douleur pendant l\'exercice', esc(ex.name)) + `<div class="stack">
    <div class="notice bad">${icon('alert')}<span><b>Arrêtez cet exercice.</b> Une douleur vive, localisée, articulaire ou qui irradie n'est pas une courbature. Ne forcez pas à travers la douleur.</span></div>
    <div><p class="label" style="margin-bottom:6px">Zone concernée</p><div class="mchips">${ms.map(m => `<button class="chip" data-act="pain-m" data-m="${m}" aria-pressed="${UI.painSel.has(m)}">${esc(MUSCLES[m].name)}</button>`).join('')}</div></div>
    <div class="field"><label for="pain-note">Note (facultatif)</label><input class="input" id="pain-note" placeholder="ex. douleur à l'avant de l'épaule en bas du mouvement"></div>
    <button class="btn primary" data-act="pain-swap">Remplacer par un exercice qui épargne cette zone</button>
    <button class="btn" data-act="pain-del">Supprimer l'exercice de la séance</button>
    <p class="xs muted">L'exercice ne vous sera plus proposé pendant 7 jours et la zone sera évitée. Si la douleur persiste, s'aggrave ou s'accompagne de gonflement, d'engourdissement ou de perte de force, consultez un médecin ou un kinésithérapeute.</p></div>`);
  UI.painDraw = draw; draw();
}
function savePain(action) {
  const A = S.active, e = A.exercises[A.cur];
  const note = ($('#pain-note') || {}).value || '';
  S.painFlags = (S.painFlags || []).filter(p => Date.now() - p.date < 60 * DAY);
  S.painFlags.push({ id: E.uid(), date: Date.now(), exId: e.exId, muscles: Array.from(UI.painSel), note });
  closeSheet();
  if (action === 'swap') {
    openPicker({ target: 'live', mode: 'swap', uid: e.uid, exId: e.exId, avoid: Array.from(UI.painSel), exclude: [e.exId] });
  } else {
    const keep = e.sets.filter(s => s.done);
    if (keep.length) { e.sets = keep; if (A.cur < A.exercises.length - 1) A.cur++; }
    else { A.exercises.splice(A.cur, 1); A.cur = Math.max(0, Math.min(A.cur, A.exercises.length - 1)); }
    commit({ render: false }); renderLive();
  }
}

function askFinish() {
  const A = S.active;
  const done = A.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const tot = A.exercises.reduce((a, e) => a + e.sets.length, 0);
  openSheet(sheetHead('Terminer la séance ?') + `<div class="stack"><p>${done} séries validées sur ${tot}.${done < tot ? ' Les séries non validées ne seront pas enregistrées.' : ''}</p>
    <button class="btn primary" data-act="finish-save" ${done ? '' : 'disabled'}>${icon('check')}Enregistrer la séance</button>
    <button class="btn" data-act="close-sheet">Continuer la séance</button>
    <button class="btn ghost danger" data-act="finish-discard">Abandonner sans enregistrer</button></div>`);
}
function finishWorkout(save) {
  const A = S.active;
  closeSheet();
  if (save) {
    const w = { id: A.id, title: A.title, template: A.template, auto: A.auto, startedAt: A.startedAt, finishedAt: Date.now(), bodyweight: A.bodyweight,
      exercises: A.exercises.map(e => ({ uid: e.uid, exId: e.exId, group: e.group, repRange: e.repRange, rir: e.rir, rest: e.rest, tempo: e.tempo, sets: e.sets.filter(s => s.done) })).filter(e => e.sets.length) };
    S.workouts.push(w);
    S.active = null; S.plan = null; UI.liveOpen = false;
    try { if (wakeLock) wakeLock.release(); } catch (e) { /* ignore */ }
    commit({ workout: w.id });
    openSummary(w.id, true);
  } else {
    S.active = null; UI.liveOpen = false; commit(); toast('Séance abandonnée.');
  }
}

// ----- bilan de séance (aussi utilisé pour l'historique)
function extVolume(w) {
  let v = 0;
  w.exercises.forEach(e => e.sets.filter(E.isWorkSet).forEach(s => v += (+s.load || 0) * s.reps));
  return Math.round(v);
}
function openSummary(id, fresh) {
  const w = S.workouts.find(x => x.id === id); if (!w) return;
  const bw = E.currentWeight(S);
  const st = E.workoutStats(w, bw);
  const cmp = E.compareWorkouts(S, w);
  const kcal = E.strengthKcal(st.minutes, w.bodyweight || bw);
  const groups = Object.keys(st.groups).sort((a, b) => st.groups[b] - st.groups[a]);
  const d = (a, b, u) => { if (!b) return ''; const p = Math.round((a - b) / b * 100); return `<span class="${p >= 0 ? 'up' : 'down'} xs">${p >= 0 ? '+' : ''}${p} %</span>`; };
  openSheet(sheetHead(fresh ? 'Séance enregistrée' : esc(w.title || 'Séance'), `${esc(fday(w.finishedAt))}${w.demo ? ' · exemple' : ''}`) + `<div class="stack">
    <div class="grid g3">
      <div class="card stat"><p class="eyebrow">Volume total</p><div class="v" style="font-size:24px">${fmt(extVolume(w), 0)}<small>kg</small></div><div class="d">charges × reps ${cmp ? d(extVolume(w), extVolume(cmp.prev)) : ''}</div></div>
      <div class="card stat"><p class="eyebrow">Charge déplacée</p><div class="v" style="font-size:24px">${fmt(st.tonnage / 1000, 2)}<small>t</small></div><div class="d">avec haltères ×2 et poids du corps ${cmp ? d(cmp.a.tonnage, cmp.b.tonnage) : ''}</div></div>
      <div class="card stat"><p class="eyebrow">Durée</p><div class="v" style="font-size:24px">${st.minutes}<small>min</small></div><div class="d">~${kcal} kcal estimées</div></div>
      <div class="card stat"><p class="eyebrow">Séries</p><div class="v" style="font-size:24px">${st.sets}</div><div class="d">${cmp ? `vs ${cmp.b.sets} la dernière fois` : 'séries validées'}</div></div>
      <div class="card stat"><p class="eyebrow">Répétitions</p><div class="v" style="font-size:24px">${st.reps}</div><div class="d">${cmp ? `vs ${cmp.b.reps}` : ''}</div></div>
      <div class="card stat"><p class="eyebrow">Exercices</p><div class="v" style="font-size:24px">${w.exercises.length}</div></div>
    </div>
    <div><p class="label" style="margin-bottom:6px">Muscles travaillés (séries pondérées)</p><div class="mchips">${groups.map(g => `<span class="chip ${st.groups[g] >= 1 ? 'acc' : ''}">${esc(GROUPS[g].name)} ${fmt(st.groups[g])}</span>`).join('')}</div></div>
    ${cmp ? `<div class="card"><h3 style="margin-bottom:6px">Comparaison avec « ${esc(cmp.prev.title || 'séance')} » du ${esc(fdate(cmp.prev.finishedAt))}</h3>
      ${cmp.exDeltas.length ? `<div class="list">${cmp.exDeltas.map(x => `<div class="li"><div class="li-main"><div class="li-title">${esc(x.name)}</div><div class="xs muted">1RM estimé ${fmt(x.old)} → ${fmt(x.cur)} kg</div></div><span class="chip ${x.pct > 0.5 ? 'good' : x.pct < -0.5 ? 'bad' : ''}">${x.pct > 0 ? '+' : ''}${fmt(x.pct)} %</span></div>`).join('')}</div>` : '<p class="small muted">Aucun exercice commun avec cette séance.</p>'}</div>` : '<p class="small muted">Première séance de ce type : la comparaison apparaîtra la prochaine fois.</p>'}
    <div class="card"><h3 style="margin-bottom:6px">Détail</h3><div class="list">${w.exercises.map(e => { const ex = EXERCISES[e.exId]; return `<div class="li"><div class="li-main"><div class="li-title">${esc(ex ? ex.name : e.exId)}</div><div class="xs muted">${e.sets.map(s => `${s.reps} × ${ex ? E.loadStr(ex, s.load) : s.load}${s.rir != null && s.rir !== '' ? ` @RIR ${s.rir}` : ''}`).join(' · ')}</div></div></div>`; }).join('')}</div></div>
    ${fresh ? '' : `<div id="del-zone"><button class="btn ghost danger block" data-act="del-workout-ask" data-id="${w.id}">${icon('trash')}Supprimer cette séance</button></div>`}
  </div>`);
}

// =====================================================================
// PROGRESSION
// =====================================================================
VIEWS.progress = function (now) {
  const sub = UI.sub.progress;
  const tabs = `<div class="tabs" role="tablist">${[['lifts', 'Exercices'], ['volume', 'Volume'], ['body', 'Corps'], ['history', 'Historique']].map(([k, l]) => `<button role="tab" aria-selected="${sub === k}" data-act="sub" data-tab="progress" data-sub="${k}">${l}</button>`).join('')}</div>`;
  const body = sub === 'volume' ? volumeProgress(now) : sub === 'body' ? bodyProgress(now) : sub === 'history' ? historyView() : liftProgress(now);
  return `<h1 style="margin-bottom:12px">Progression</h1>` + tabs + body;
};

function liftProgress(now) {
  const counts = {};
  S.workouts.forEach(w => w.exercises.forEach(e => { if (e.sets.some(E.isWorkSet)) counts[e.exId] = (counts[e.exId] || 0) + 1; }));
  const ids = Object.keys(counts).filter(id => EXERCISES[id]).sort((a, b) => counts[b] - counts[a]);
  if (!ids.length) return `<div class="chart-empty">Terminez une première séance pour suivre la progression de chaque exercice.</div>`;
  if (!UI.progEx || !counts[UI.progEx]) UI.progEx = ids[0];
  const ex = EXERCISES[UI.progEx];
  const bw = E.currentWeight(S);
  const perf = E.performances(S, ex.id).slice().reverse();
  const e1 = perf.map(p => ({ x: p.date, y: Math.round(E.bestE1rm(ex, p, p.bw || bw) * 10) / 10 }));
  const top = perf.map(p => ({ x: p.date, y: ex.unit === 'added' ? Math.max(...p.sets.map(s => s.load)) + (ex.bw || 1) * (p.bw || bw) : Math.max(...p.sets.map(s => s.load)) * (ex.unit === 'per_hand' ? 2 : 1) }));
  const vol = perf.map(p => ({ x: p.date, y: Math.round(p.sets.reduce((a, s) => a + E.effLoad(ex, s.load, p.bw || bw) * s.reps, 0)) }));
  const ready = E.readiness(E.latestCheckin(S, now));
  const sc = E.scheme(S, ex, ready);
  const next = E.progression(S, ex, { now, reps: sc.reps, rir: sc.rir, ready });
  const best = e1.reduce((m, p) => p.y > m.y ? p : m, e1[0]);
  const first = e1[0], last = e1[e1.length - 1];
  const pct = first.y ? Math.round((last.y - first.y) / first.y * 1000) / 10 : 0;
  return `<div class="field" style="margin-bottom:12px"><label for="prog-sel">Exercice</label><select class="input" id="prog-sel" data-input="prog-sel">${ids.map(id => `<option value="${id}" ${id === ex.id ? 'selected' : ''}>${esc(EXERCISES[id].name)} (${counts[id]})</option>`).join('')}</select></div>
    <div class="grid g3">
      <div class="card stat"><p class="eyebrow">1RM estimé</p><div class="v" style="font-size:26px">${fmt(last.y, 0)}<small>kg</small></div><div class="d"><span class="${pct >= 0 ? 'up' : 'down'}">${pct > 0 ? '+' : ''}${fmt(pct)} %</span> depuis le ${esc(fdate(first.x))}</div></div>
      <div class="card stat"><p class="eyebrow">Record</p><div class="v" style="font-size:26px">${fmt(best.y, 0)}<small>kg</small></div><div class="d">le ${esc(fdate(best.x))}</div></div>
      <div class="card stat"><p class="eyebrow">Prochaine séance</p><div class="v" style="font-size:22px">${esc(E.loadStr(ex, next.load))}</div><div class="d"><span class="kind ${next.kind}">${KIND_TXT[next.kind]}</span> · ${next.reps} reps visées</div></div>
    </div>
    <div class="card section"><div class="card-h"><h3>Force estimée et charge maximale</h3><span class="xs muted">kg</span></div>
      ${chartSlot({ series: [{ pts: e1, color: 'var(--accent)', area: true, label: '1RM estimé (Epley, RIR inclus)' }, { pts: top, color: 'var(--good)', label: 'Charge la plus lourde' + (ex.unit === 'per_hand' ? ' (2 haltères)' : ex.unit === 'added' ? ' (avec poids du corps)' : '') }], h: 210, empty: 'Une seule séance pour cet exercice : la courbe apparaîtra après la prochaine.' }, 230)}</div>
    <div class="card section"><div class="card-h"><h3>Volume par séance</h3><span class="xs muted">kg × reps</span></div>${chartSlot({ series: [{ pts: vol, color: '#8FB4FF', area: true }], h: 160, yFmt: v => fmt(v, 0) }, 170)}</div>
    <div class="why section">${esc(next.why)}</div>
    <div class="card section"><h3 style="margin-bottom:6px">Séances</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Séries</th><th>1RM est.</th></tr></thead><tbody>
      ${perf.slice().reverse().map((p, i) => `<tr><td>${esc(fdate(p.date))}</td><td>${p.sets.map(s => `${s.reps}×${fmt(s.load)}`).join(' · ')}</td><td class="num">${fmt(e1[e1.length - 1 - i].y)}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function volumeProgress(now) {
  const weeks = [];
  const ws0 = E.weekStart(now);
  for (let i = 7; i >= 0; i--) { const from = ws0 - i * 7 * DAY; weeks.push({ from, to: from + 7 * DAY - 1 }); }
  const bw = E.currentWeight(S);
  const ton = weeks.map(w => ({ x: w.from, y: S.workouts.filter(o => o.finishedAt >= w.from && o.finishedAt <= w.to).reduce((a, o) => a + E.workoutStats(o, bw).tonnage, 0) }));
  const keyG = ['chest', 'back', 'delt_side', 'biceps', 'triceps'];
  const cols = { chest: 'var(--accent)', back: 'var(--good)', delt_side: 'var(--warn)', biceps: '#C58BFF', triceps: '#5FD3E0' };
  const per = weeks.map(w => E.setsInWindow(S, w.from, Math.min(w.to, now)).group);
  const firstData = ton.findIndex(t => t.y > 0);
  const from = firstData < 0 ? 0 : firstData;
  const tg = E.targets(S);
  return `<div class="card"><div class="card-h"><h3>Charge déplacée par semaine</h3><span class="xs muted">kg</span></div>${chartSlot({ series: [{ pts: ton.slice(from), color: 'var(--accent)', area: true }], h: 180, yFmt: v => fmt(v / 1000, 1) + ' t', empty: 'Pas encore de semaine complète.' }, 190)}</div>
    <div class="card section"><div class="card-h"><h3>Séries hebdomadaires par groupe</h3><span class="xs muted">lundi → dimanche</span></div>
      ${chartSlot({ series: keyG.map(g => ({ pts: weeks.slice(from).map((w, i) => ({ x: w.from, y: per[from + i][g] })), color: cols[g], label: GROUPS[g].name })), h: 210, empty: 'Pas encore de données.' }, 240)}</div>
    <div class="card section"><h3 style="margin-bottom:6px">Détail par semaine</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Semaine du</th>${Object.keys(GROUPS).filter(g => tg[g].max > 0).map(g => `<th>${esc(GROUPS[g].name)}</th>`).join('')}</tr></thead><tbody>
      ${weeks.slice(from).reverse().map((w, i) => { const v = per[weeks.length - 1 - i]; return `<tr><td>${esc(fdate(w.from))}</td>${Object.keys(GROUPS).filter(g => tg[g].max > 0).map(g => `<td class="num" style="color:${v[g] < tg[g].min * 0.75 ? 'var(--warn)' : v[g] > tg[g].max ? 'var(--bad)' : 'inherit'}">${fmt(v[g])}</td>`).join('')}</tr>`; }).join('')}
    </tbody></table></div><p class="xs muted" style="margin-top:6px">La semaine en cours n'est pas terminée : ses chiffres sont partiels.</p></div>`;
}

function bodyProgress(now) {
  const logs = S.bodyLogs.slice().sort((a, b) => a.date - b.date);
  const ser = k => logs.filter(l => l[k]).map(l => ({ x: l.date, y: +l[k] }));
  const M = [['waist', 'Tour de taille', 'var(--warn)'], ['chest', 'Tour de poitrine', 'var(--accent)'], ['arm', 'Tour de bras', '#C58BFF'], ['shoulders', 'Tour d\'épaules', 'var(--good)']];
  return `<div class="card"><div class="card-h"><h3>Poids</h3><button class="btn sm" data-act="add-weight">${icon('plus')}Mesure</button></div>${chartSlot({ series: [{ pts: ser('weight'), color: 'var(--accent)', area: true }], goal: S.profile.targetWeight, h: 190 }, 200)}</div>
    <div class="grid md-2 section">${M.map(([k, l, c]) => `<div class="card"><div class="card-h"><h3>${l}</h3><span class="xs muted">cm</span></div>${chartSlot({ series: [{ pts: ser(k), color: c, area: true }], h: 140, empty: 'Ajoutez au moins deux mesures.' }, 150)}</div>`).join('')}</div>
    <div class="card section"><h3 style="margin-bottom:6px">Mesures</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Poids</th><th>Taille</th><th>Poitrine</th><th>Bras</th><th>Épaules</th><th></th></tr></thead><tbody>
      ${logs.slice().reverse().map(l => `<tr><td>${esc(fdate(l.date, { day: 'numeric', month: 'short', year: '2-digit' }))}</td>${['weight', 'waist', 'chest', 'arm', 'shoulders'].map(k => `<td class="num">${l[k] ? fmt(l[k]) : '—'}</td>`).join('')}<td><button class="icon-btn" data-act="del-body" data-id="${l.id}" aria-label="Supprimer">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Aucune mesure.</td></tr>'}</tbody></table></div></div>`;
}

function historyView() {
  const ws = S.workouts.filter(w => w.finishedAt).slice().sort((a, b) => b.finishedAt - a.finishedAt);
  if (!ws.length) return '<div class="chart-empty">Aucune séance enregistrée.</div>';
  const groups = {};
  ws.forEach(w => { const k = E.weekStart(w.finishedAt); (groups[k] = groups[k] || []).push(w); });
  return Object.keys(groups).sort((a, b) => b - a).map(k => `<div class="section"><p class="eyebrow" style="margin-bottom:6px">Semaine du ${esc(fdate(+k, { day: 'numeric', month: 'long' }))} · ${groups[k].length} séance${groups[k].length > 1 ? 's' : ''}</p><div class="card" style="padding-block:4px"><div class="list">${groups[k].map(historyItem).join('')}</div></div></div>`).join('');
}

// =====================================================================
// PROFIL
// =====================================================================
VIEWS.profile = function (now) {
  const sub = UI.sub.profile;
  const tabs = `<div class="tabs" role="tablist">${[['profile', 'Profil'], ['gyms', 'Salles'], ['body', 'Corps'], ['targets', 'Cibles'], ['data', 'Données']].map(([k, l]) => `<button role="tab" aria-selected="${sub === k}" data-act="sub" data-tab="profile" data-sub="${k}">${l}</button>`).join('')}</div>`;
  const body = sub === 'gyms' ? gymsView() : sub === 'body' ? bodyNutrition(now) : sub === 'targets' ? targetsView() : sub === 'data' ? dataView() : profileForm();
  return `<h1 style="margin-bottom:12px">Profil</h1>` + tabs + body;
};

function profileForm() {
  const p = S.profile;
  const f = (k, label, type, extra) => `<div class="field"><label for="pf-${k}">${label}</label><input class="input" id="pf-${k}" data-pf="${k}" type="${type || 'text'}" ${type === 'number' ? 'inputmode="decimal"' : ''} value="${esc(p[k])}" ${extra || ''}></div>`;
  return `<div class="grid md-2"><div class="card"><h3 style="margin-bottom:12px">Identité</h3><div class="grid g2">
      ${f('name', 'Prénom')}
      <div class="field"><label for="pf-sex">Sexe (calcul du métabolisme)</label><select class="input" id="pf-sex" data-pf="sex"><option value="h" ${p.sex === 'h' ? 'selected' : ''}>Homme</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Femme</option></select></div>
      ${f('age', 'Âge', 'number', 'min="14" max="90"')}${f('height', 'Taille (cm)', 'number')}
      <div class="field"><label for="pf-weight">Poids actuel (kg)</label><input class="input" id="pf-weight" data-pf="weight" type="number" inputmode="decimal" step="0.1" value="${esc(E.currentWeight(S))}"></div>
      ${f('targetWeight', 'Objectif de poids (kg)', 'number', 'step="0.5"')}
    </div><p class="xs muted" style="margin-top:8px">Changer le poids ici ajoute une pesée datée d'aujourd'hui. Tout est sauvegardé automatiquement.</p></div>
    <div class="card"><h3 style="margin-bottom:12px">Entraînement</h3><div class="grid g2">
      <div class="field"><label for="pf-level">Niveau</label><select class="input" id="pf-level" data-pf="level">${[['debutant', 'Débutant'], ['intermediaire', 'Intermédiaire'], ['avance', 'Avancé']].map(([k, l]) => `<option value="${k}" ${p.level === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${f('sessionMinutes', 'Durée d\'une séance (min)', 'number', 'min="20" max="150"')}
      ${f('freqMin', 'Séances/sem. min', 'number', 'min="1" max="7"')}${f('freqMax', 'Séances/sem. max', 'number', 'min="1" max="7"')}
      ${f('steps', 'Pas par jour', 'number', 'step="500"')}
      <div class="field"><label for="pf-priority">Priorité</label><select class="input" id="pf-priority" data-pf="priority"><option value="upper" ${p.priority === 'upper' ? 'selected' : ''}>Haut du corps</option><option value="balanced" ${p.priority !== 'upper' ? 'selected' : ''}>Équilibrée</option></select></div></div>
      <label class="switch"><span><b>Ne pas programmer les jambes</b><br><span class="xs muted">Les séances automatiques n'incluent ni quadriceps, ni ischios, ni fessiers, ni mollets.</span></span><input type="checkbox" data-pf="noLegs" ${p.noLegs ? 'checked' : ''}></label></div>
    <div class="card"><h3 style="margin-bottom:12px">Objectifs</h3><div class="stack">
      <div class="field"><label for="pf-goalText">Objectif principal</label><textarea class="input" id="pf-goalText" data-pf="goalText">${esc(p.goalText)}</textarea></div>
      <div class="field"><label for="pf-goal2Text">Objectif secondaire</label><textarea class="input" id="pf-goal2Text" data-pf="goal2Text">${esc(p.goal2Text)}</textarea></div></div></div>
    </div>`;
}

function bodyNutrition(now) {
  const nu = E.nutrition(S, now);
  const today = isoDay(now);
  const last7 = (S.nutritionLogs || []).filter(l => l.date > now - 7 * DAY);
  const avg = k => last7.length ? Math.round(last7.reduce((a, l) => a + (+l[k] || 0), 0) / last7.length) : null;
  const photos = (S.photos || []).slice().sort((a, b) => b.date - a.date);
  const bar = (v, t) => `<div class="vol-track" style="height:8px;margin-top:4px"><div class="vol-fill ${v == null ? '' : v > t * 1.1 ? 'over' : v >= t * 0.9 ? 'ok' : 'low'}" style="width:${v == null ? 0 : Math.min(100, v / t * 100)}%"></div></div>`;
  return `<div class="grid md-2">
    <div class="card"><h3 style="margin-bottom:12px">Nouvelle mesure</h3>
      <form data-form="body" class="grid g2">
        <div class="field"><label for="bm-date">Date</label><input class="input" type="date" id="bm-date" name="date" value="${today}"></div>
        <div class="field"><label for="bm-w">Poids (kg)</label><input class="input" id="bm-w" name="weight" inputmode="decimal" placeholder="${fmt(E.currentWeight(S))}"></div>
        <div class="field"><label for="bm-waist">Tour de taille (cm)</label><input class="input" id="bm-waist" name="waist" inputmode="decimal"></div>
        <div class="field"><label for="bm-chest">Tour de poitrine (cm)</label><input class="input" id="bm-chest" name="chest" inputmode="decimal"></div>
        <div class="field"><label for="bm-arm">Tour de bras (cm)</label><input class="input" id="bm-arm" name="arm" inputmode="decimal"></div>
        <div class="field"><label for="bm-sh">Tour d'épaules (cm)</label><input class="input" id="bm-sh" name="shoulders" inputmode="decimal"></div>
        <button class="btn primary" style="grid-column:1/-1">Enregistrer la mesure</button></form>
      <p class="xs muted" style="margin-top:8px">Mesurez le tour de taille au nombril, le matin, à jeun : c'est le meilleur indicateur de perte de graisse.</p></div>
    <div class="card"><div class="card-h"><h3>Photos d'évolution</h3><label class="btn sm" for="photo-in">${icon('camera')}Ajouter</label><input type="file" id="photo-in" accept="image/*" hidden data-input="photo"></div>
      ${photos.length ? `<div class="photo-grid">${photos.map(p => `<figure>${p.data ? `<img src="${p.data}" alt="Photo du ${esc(fdate(p.date))}">` : ''}<figcaption>${esc(fdate(p.date, { day: 'numeric', month: 'short', year: '2-digit' }))} <button data-act="del-photo" data-id="${p.id}" style="float:right;background:none;border:0;color:inherit" aria-label="Supprimer">${icon('x')}</button></figcaption></figure>`).join('')}</div>` : '<p class="small muted">Même lumière, même pose, toutes les 2 à 4 semaines : les photos montrent souvent des changements que la balance ne voit pas. Elles restent privées.</p>'}</div>
  </div>
  <div class="grid md-2 section">
    <div class="card"><h3 style="margin-bottom:10px">Besoins estimés</h3>
      <div class="grid g2"><div class="stat"><p class="eyebrow">Dépense</p><div class="v" style="font-size:26px">~${fmt(nu.tdee, 0)}<small>kcal/j</small></div><div class="d">métabolisme ${nu.bmr} + pas + sport</div></div>
      <div class="stat"><p class="eyebrow">Cible</p><div class="v" style="font-size:26px">~${fmt(nu.target, 0)}<small>kcal/j</small></div><div class="d">déficit ~${nu.deficit} kcal</div></div></div>
      <div class="grid g3" style="margin-top:14px"><div><p class="label">Protéines</p><p class="num" style="font-size:20px">${nu.protein} g</p><p class="xs muted">2 g/kg</p></div><div><p class="label">Lipides</p><p class="num" style="font-size:20px">${nu.fat} g</p><p class="xs muted">0,8 g/kg</p></div><div><p class="label">Glucides</p><p class="num" style="font-size:20px">${nu.carbs} g</p><p class="xs muted">le reste</p></div></div>
      ${nu.adjust ? `<div class="notice acc" style="margin-top:12px">${icon('info')}<span>${esc(nu.adjust.text)}</span></div>` : ''}
      <p class="xs muted" style="margin-top:10px">Estimation (Mifflin-St Jeor, activité d'après ${esc(nu.source)}). Un déficit modéré favorise la perte de graisse en préservant le muscle, sans garantir un rythme précis : la balance mélange eau, glycogène et graisse. Jugez sur la moyenne hebdomadaire et le tour de taille, puis ajustez de ±150 kcal.</p></div>
    <div class="card"><h3 style="margin-bottom:10px">Journal alimentaire (facultatif)</h3>
      <form data-form="food" class="grid g2">
        <div class="field"><label for="fd-date">Date</label><input class="input" type="date" id="fd-date" name="date" value="${today}"></div>
        <div class="field"><label for="fd-k">Calories</label><input class="input" id="fd-k" name="kcal" inputmode="numeric" required></div>
        <div class="field"><label for="fd-p">Protéines (g)</label><input class="input" id="fd-p" name="protein" inputmode="numeric"></div>
        <div class="field"><label for="fd-c">Glucides (g)</label><input class="input" id="fd-c" name="carbs" inputmode="numeric"></div>
        <div class="field"><label for="fd-f">Lipides (g)</label><input class="input" id="fd-f" name="fat" inputmode="numeric"></div>
        <button class="btn primary" style="align-self:end">Enregistrer</button></form>
      <p class="label" style="margin-top:14px">Moyenne 7 jours (${last7.length} jour${last7.length > 1 ? 's' : ''} saisi${last7.length > 1 ? 's' : ''})</p>
      <div class="stack" style="gap:8px;margin-top:6px">${[['kcal', 'Calories', nu.target, 'kcal'], ['protein', 'Protéines', nu.protein, 'g'], ['carbs', 'Glucides', nu.carbs, 'g'], ['fat', 'Lipides', nu.fat, 'g']].map(([k, l, t, u]) => `<div><div class="spread small"><span>${l}</span><span class="num">${avg(k) == null ? '—' : avg(k)} / ${t} ${u}</span></div>${bar(avg(k), t)}</div>`).join('')}</div>
      ${(S.nutritionLogs || []).length ? `<div class="list" style="margin-top:10px">${S.nutritionLogs.slice().sort((a, b) => b.date - a.date).slice(0, 7).map(l => `<div class="li"><div class="li-main small">${esc(fdate(l.date))} · <b>${l.kcal}</b> kcal · P ${l.protein || '—'} · G ${l.carbs || '—'} · L ${l.fat || '—'}</div><button class="icon-btn" data-act="del-food" data-id="${l.id}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('')}</div>` : ''}</div>
  </div>`;
}

function targetsView() {
  const tg = E.targets(S);
  const vol = E.rolling7(S, Date.now()).group;
  return `<div class="card"><h3 style="margin-bottom:6px">Cibles de volume hebdomadaire</h3>
    <p class="small muted" style="margin-bottom:10px">Séries dures pondérées par groupe sur 7 jours. Les valeurs automatiques tiennent compte de votre niveau, de votre fréquence et de la priorité haut du corps. Modifiez-les si vous récupérez plus ou moins bien.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Groupe</th><th>Actuel</th><th>Min</th><th>Max</th><th></th></tr></thead><tbody>
    ${Object.keys(GROUPS).sort((a, b) => GROUPS[a].order - GROUPS[b].order).map(g => `<tr><td><b>${esc(GROUPS[g].name)}</b>${tg[g].custom ? ' <span class="chip acc" style="padding:2px 7px">perso</span>' : ''}</td><td class="num">${fmt(vol[g])}</td>
      <td><input class="input" style="width:70px;min-height:36px;padding:6px" inputmode="numeric" data-tg="${g}" data-k="min" value="${tg[g].min}" aria-label="Minimum ${esc(GROUPS[g].name)}"></td>
      <td><input class="input" style="width:70px;min-height:36px;padding:6px" inputmode="numeric" data-tg="${g}" data-k="max" value="${tg[g].max}" aria-label="Maximum ${esc(GROUPS[g].name)}"></td>
      <td>${tg[g].custom ? `<button class="btn sm ghost" data-act="tg-reset" data-g="${g}">Auto</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function dataView() {
  const n = S.workouts.length;
  return `<div class="grid md-2"><div class="card"><h3 style="margin-bottom:8px">Compte et sauvegarde</h3>
      <p class="small" style="color:var(--fg-2)">${Sync.status === 'cloud' ? 'Vos données sont liées à votre compte claude.ai, dans un espace privé que vous seul pouvez lire (même si vous partagez le lien de l\'application, chaque personne a ses propres données). Elles sont aussi gardées sur cet appareil et se synchronisent entre vos appareils.' : (window.FORGE_STANDALONE ? 'Vos données sont enregistrées uniquement sur cet appareil, sans compte ni serveur. Exportez une sauvegarde régulièrement (bouton ci-contre) : elle permet aussi de transférer vos données vers un autre appareil.' : 'Vos données sont enregistrées dans le navigateur de cet appareil. Ouvrez l\'application connecté à claude.ai pour les sauvegarder dans votre espace privé et les retrouver sur tous vos appareils.')}</p>
      <div class="row" style="margin-top:10px">${syncBadge()}<span class="xs muted">${n} séance${n > 1 ? 's' : ''} · ${S.bodyLogs.length} mesures</span></div>
      <h3 style="margin:18px 0 8px">Installer sur le téléphone</h3>
      <p class="small" style="color:var(--fg-2)">Ouvrez l'application dans le navigateur de votre téléphone puis « Ajouter à l'écran d'accueil » (Safari : bouton Partager ; Chrome : menu ⋮). Elle s'ouvre alors en plein écran comme une application.</p></div>
    <div class="card"><h3 style="margin-bottom:8px">Export, import, réinitialisation</h3><div class="stack">
      <button class="btn" data-act="export">${icon('download')}Exporter toutes mes données (JSON)</button>
      <label class="btn" for="import-in">${icon('upload')}Importer une sauvegarde</label><input type="file" id="import-in" accept="application/json,.json" hidden data-input="import">
      ${S.workouts.some(w => w.demo) ? `<button class="btn" data-act="clear-demo">Effacer les données d'exemple</button>` : `<button class="btn ghost" data-act="load-demo">Charger des données d'exemple</button>`}
      <div id="reset-zone"><button class="btn ghost danger block" data-act="reset-ask">${icon('trash')}Tout effacer</button></div></div></div></div>`;
}

function gymsView() {
  const gs = E.ensureGyms(S), g = E.activeGym(S);
  const cats = {};
  Object.keys(EQUIP_ITEMS).forEach(i => (cats[EQUIP_ITEMS[i].cat] = cats[EQUIP_ITEMS[i].cat] || []).push(i));
  const nAvail = EXERCISE_LIST.filter(ex => E.exAvailable(S, ex)).length;
  const lacking = Object.keys(GROUPS).filter(x => (GROUPS[x].region !== 'legs' || !S.profile.noLegs) && E.availableCount(S, x) === 0);
  return `<div class="grid md-3">
    <div class="card"><div class="card-h"><h3>Salle utilisée</h3><span class="chip acc">${nAvail}/${EXERCISE_LIST.length} exercices</span></div>
      <div class="grid g2"><div class="field"><label for="gym-sel-g">Salle active</label>${gymSelect('gym-sel-g')}</div>
        <div class="field"><label for="gym-name">Nom</label><input class="input" id="gym-name" data-input="gym-name" value="${esc(g.name)}"></div></div>
      ${lacking.length ? `<div class="notice warn" style="margin-top:12px">${icon('alert')}<span>Aucun exercice possible pour : ${esc(lacking.map(x => GROUPS[x].name).join(', '))}.</span></div>` : ''}
      <p class="small muted" style="margin:14px 0 6px">Touchez une machine : ✓ disponible → ★ préférée (proposée en priorité) → absente (jamais proposée).</p>
      ${Object.keys(cats).map(c => `<div class="gym-group"><p class="eyebrow" style="margin-bottom:8px">${esc(c)}</p><div class="mchips">${cats[c].map(i => itemChip(i)).join('')}</div></div>`).join('')}
      <div class="row" style="margin-top:14px"><button class="btn sm" data-act="gym-all" data-v="yes">Tout disponible</button><button class="btn sm" data-act="gym-all" data-v="no">Tout absent</button></div></div>
    <div class="stack">
      <div class="card"><h3 style="margin-bottom:8px">Ajouter une salle</h3><p class="small muted" style="margin-bottom:10px">Par exemple la salle du travail, celle en vacances ou votre matériel à la maison. Partez d'un modèle puis ajustez.</p>
        <div class="stack" style="gap:8px">${Object.keys(E.GYM_PRESETS).map(k => `<button class="btn" style="justify-content:flex-start" data-act="gym-add" data-preset="${k}">${icon('plus')}${esc(E.GYM_PRESETS[k].name)}</button>`).join('')}</div></div>
      ${gs.length > 1 ? `<div class="card" id="gym-del-zone"><button class="btn ghost danger block" data-act="gym-del-ask">${icon('trash')}Supprimer « ${esc(g.name)} »</button></div>` : ''}
    </div></div>`;
}

// =====================================================================
// SAISIES RAPIDES
// =====================================================================
function quickWeight() {
  openSheet(sheetHead('Nouvelle pesée', 'Le matin, à jeun, après être passé aux toilettes : c\'est la mesure la plus comparable.') +
    `<form data-form="qw" class="grid g2"><div class="field"><label for="qw-w">Poids (kg)</label><input class="input" id="qw-w" name="weight" inputmode="decimal" required autofocus placeholder="${fmt(E.currentWeight(S))}"></div>
     <div class="field"><label for="qw-waist">Tour de taille (cm, facultatif)</label><input class="input" id="qw-waist" name="waist" inputmode="decimal"></div>
     <div class="field"><label for="qw-d">Date</label><input class="input" type="date" id="qw-d" name="date" value="${isoDay(Date.now())}"></div>
     <button class="btn primary" style="align-self:end">Enregistrer</button></form>`);
}

function addBodyLog(o) {
  const date = o.date ? parseDay(o.date) : Date.now();
  const log = { id: E.uid(), date };
  ['weight', 'waist', 'chest', 'arm', 'shoulders'].forEach(k => { const v = num(o[k]); if (v) log[k] = v; });
  if (Object.keys(log).length <= 2) { toast('Renseignez au moins une valeur.'); return false; }
  S.bodyLogs.push(log);
  if (log.weight) S.profile.weight = E.currentWeight(S);
  return true;
}

function loadDemo() {
  const d = E.demoData(Date.now());
  S.workouts = S.workouts.concat(d.workouts).sort((a, b) => a.finishedAt - b.finishedAt);
  S.bodyLogs = S.bodyLogs.concat(d.bodyLogs);
  S.cardioLogs = S.cardioLogs.concat(d.cardioLogs);
  S.nutritionLogs = S.nutritionLogs.concat(d.nutritionLogs);
  S.deleted = (S.deleted || []).filter(id => !String(id).startsWith('demo_'));
  S.demoLoaded = true;
  d.workouts.forEach(w => Sync.dirtyW.add(w.id));
}
function clearDemo() {
  S.workouts.filter(w => w.demo).forEach(w => { S.deleted.push(w.id); Sync.delW.add(w.id); });
  S.workouts = S.workouts.filter(w => !w.demo);
  S.bodyLogs = S.bodyLogs.filter(x => !x.demo);
  S.cardioLogs = S.cardioLogs.filter(x => !x.demo);
  S.nutritionLogs = S.nutritionLogs.filter(x => !x.demo);
  S.profile.weight = E.currentWeight(S) || S.profile.weight;
  S.plan = null;
  commit(); toast('Exemples effacés : à vous de jouer.');
}

function compressImage(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error('lecture'));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('image'));
      img.onload = () => {
        const max = 720, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

async function exportData() {
  const data = JSON.stringify(Object.assign({}, S, { exportedAt: new Date().toISOString(), app: 'forge', active: null }), null, 1);
  const name = `forge-sauvegarde-${isoDay(Date.now())}.json`;
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
  if (dl) {
    try { await dl.save({ filename: name, data, mimeType: 'application/json' }); toast('Sauvegarde exportée.'); return; } catch (e) { if (e && e.code === 'declined') return; }
  }
  if (window.FORGE_STANDALONE) {
    try {
      const file = new File([data], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Sauvegarde Forge' }); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Sauvegarde exportée.'); return;
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  openSheet(sheetHead('Exporter mes données', 'Copiez ce texte et collez-le dans un fichier .json pour le conserver.') +
    `<textarea class="input" id="export-txt" style="min-height:240px;font-family:ui-monospace,monospace;font-size:12px" readonly>${esc(data)}</textarea><button class="btn primary block" style="margin-top:10px" data-act="copy-export">Copier</button>`);
}

function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || !Array.isArray(o.workouts) || !o.profile) throw new Error('format');
      const keepDeleted = S.deleted || [];
      S = Object.assign(freshState(), o, { active: null, updatedAt: Date.now() });
      S.deleted = keepDeleted.filter(id => !S.workouts.some(w => w.id === id));
      S.workouts.forEach(w => Sync.dirtyW.add(w.id));
      (S.photos || []).forEach(p => p.data && Sync.photoQ.push(p.id));
      commit(); toast(`Sauvegarde importée : ${S.workouts.length} séances.`);
    } catch (e) { toast('Fichier non reconnu : choisissez un export JSON de Forge.'); }
  };
  r.readAsText(file);
}

// =====================================================================
// ÉVÉNEMENTS
// =====================================================================
const musclesOf = groups => groups.flatMap(g => GROUPS[g].muscles);

function findPlanEx(uid) { return S.plan.exercises.findIndex(e => e.uid === uid); }

function toggleMuscle(m) {
  if (UI.sel.has(m)) UI.sel.delete(m); else UI.sel.add(m);
  UI.focusM = m;
}

document.addEventListener('click', ev => {
  // Clic sur un muscle de la silhouette principale
  const path = ev.target.closest('#body-sel .bd-m');
  if (path) { toggleMuscle(path.dataset.m); render(); return; }
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  if (a === 'sheet-bg') { if (ev.target === el) closeSheet(); return; }
  const A = S.active;
  switch (a) {
    case 'tab': closeSheet(); go(d.tab); break;
    case 'tab-sub': go(d.tab, d.sub); break;
    case 'sub': UI.sub[d.tab] = d.sub; closeSheet(); if (UI.tab !== d.tab) go(d.tab, d.sub); else render(); break;
    case 'close-sheet': closeSheet(); break;
    case 'clear-demo': clearDemo(); break;
    case 'load-demo': loadDemo(); commit(); toast('Données d\'exemple chargées.'); break;
    case 'auto-session': autoSession(); break;
    case 'custom-session': customSession(); break;
    case 'checkin': openCheckin(); break;
    case 'ck-set': ckDraft[d.k] = +d.v; renderCheckin(); break;
    case 'ck-sore': { const l = ckDraft.soreMuscles, i = l.indexOf(d.m); i >= 0 ? l.splice(i, 1) : l.push(d.m); renderCheckin(); break; }
    case 'ck-pain': { const l = ckDraft.painMuscles, i = l.indexOf(d.m); i >= 0 ? l.splice(i, 1) : l.push(d.m); renderCheckin(); break; }
    case 'ck-save': saveCheckin(); break;
    case 'select-lagging-go': selectLagging(); go('muscles'); break;
    case 'add-weight': quickWeight(); break;
    case 'prog-ex': UI.progEx = d.ex; closeSheet(); go('progress', 'lifts'); break;
    case 'ask': ask(d.q); break;
    case 'coach-select': UI.sel = new Set(UI.coachA.muscles); go('muscles'); break;
    case 'heat': UI.heat = d.k; render(); break;
    case 'toggle-m': toggleMuscle(d.m); render(); break;
    case 'toggle-pecs': { const all = ['pec_upper', 'pec_mid', 'pec_lower']; const on = all.every(m => UI.sel.has(m)); all.forEach(m => on ? UI.sel.delete(m) : UI.sel.add(m)); render(); break; }
    case 'sel-upper': SEL_GROUPS_UPPER.forEach(m => UI.sel.add(m)); render(); break;
    case 'sel-lagging': selectLagging(); render(); break;
    case 'sel-clear': UI.sel.clear(); UI.focusM = null; render(); break;
    case 'gen-groups': closeSheet(); buildPlan(musclesOf(d.groups.split(','))); break;
    case 'template': { const t = E.TEMPLATES.find(x => x.id === d.t); withCheckin(() => buildPlan(musclesOf(t.groups), { title: t.name, template: t.id })); break; }
    case 'empty-session': S.plan = { id: E.uid(), createdAt: Date.now(), title: 'Séance libre', muscles: [], exercises: [], notes: [], warnings: [], groupInfo: {} }; commit(); break;
    case 'open-live': UI.liveOpen = true; requestWake(); renderLive(); break;
    case 'ex-detail': openExercise(d.ex); break;
    case 'plan-swap': { const e = S.plan.exercises[findPlanEx(d.uid)]; openPicker({ target: 'plan', mode: 'swap', uid: d.uid, exId: e.exId }); break; }
    case 'plan-del': S.plan.exercises.splice(findPlanEx(d.uid), 1); commit(); break;
    case 'plan-sets': { const e = S.plan.exercises[findPlanEx(d.uid)]; if (+d.d > 0 && e.sets.length < 8) e.sets.push(Object.assign({}, e.sets[e.sets.length - 1])); if (+d.d < 0 && e.sets.length > 1) e.sets.pop(); commit(); break; }
    case 'plan-move': { const i = findPlanEx(d.uid); const [e] = S.plan.exercises.splice(i, 1); S.plan.exercises.splice(Math.max(0, i - 1), 0, e); commit(); break; }
    case 'plan-add': openPicker({ target: 'plan', mode: 'add' }); break;
    case 'start': startWorkout(); break;
    case 'regen': if (S.plan.muscles && S.plan.muscles.length) buildPlan(S.plan.muscles, { auto: S.plan.auto, title: S.plan.auto ? S.plan.title : null, template: S.plan.template }); else toast('Séance libre : ajoutez vos exercices.'); break;
    case 'plan-cancel': S.plan = null; commit(); break;
    case 'pick': onPick(d.ex); break;
    case 'add-to-plan': S.plan.exercises.push(prescribe(d.ex, 3)); closeSheet(); commit(); toast('Exercice ajouté à la séance.'); break;
    case 'fav': case 'exclude': {
      const k = a === 'fav' ? 'favorites' : 'excluded'; const l = S.settings[k] = S.settings[k] || []; const i = l.indexOf(d.ex);
      i >= 0 ? l.splice(i, 1) : l.push(d.ex); commit({ render: false }); openExercise(d.ex);
      toast(a === 'fav' ? (i >= 0 ? 'Retiré des favoris.' : 'Ajouté aux favoris : il sera privilégié.') : (i >= 0 ? 'Exercice réautorisé.' : 'Cet exercice ne sera plus proposé.')); break;
    }
    case 'history': openSummary(d.id); break;
    case 'del-workout-ask': $('#del-zone').innerHTML = `<div class="notice bad" style="flex-direction:column;gap:10px"><span>Supprimer définitivement cette séance ? Les volumes et la progression seront recalculés.</span><div class="row"><button class="btn danger" data-act="del-workout" data-id="${d.id}">Supprimer</button><button class="btn" data-act="close-sheet">Annuler</button></div></div>`; break;
    case 'del-workout': S.workouts = S.workouts.filter(w => w.id !== d.id); S.deleted.push(d.id); Sync.delW.add(d.id); closeSheet(); commit(); toast('Séance supprimée.'); break;
    // ----- séance en direct
    case 'live-min': UI.liveOpen = false; renderLive(); render(); break;
    case 'live-go': A.cur = +d.i; commit({ render: false }); renderLive(); break;
    case 'live-done': liveSetDone(+d.i); break;
    case 'live-addset': { const e = A.exercises[A.cur]; const l = e.sets[e.sets.length - 1]; e.sets.push({ targetReps: l.targetReps, targetRir: l.targetRir, load: l.load, reps: '', rir: '', done: false }); commit({ render: false }); renderLive(); break; }
    case 'live-delset': { const e = A.exercises[A.cur]; const i = e.sets.map(s => s.done).lastIndexOf(false); if (e.sets.length > 1) e.sets.splice(i >= 0 ? i : e.sets.length - 1, 1); commit({ render: false }); renderLive(); break; }
    case 'live-swap': { const e = A.exercises[A.cur]; openPicker({ target: 'live', mode: 'swap', uid: e.uid, exId: e.exId }); break; }
    case 'live-pain': openPain(); break;
    case 'live-delex': { const e = A.exercises[A.cur]; const keep = e.sets.filter(s => s.done); if (keep.length) { e.sets = keep; if (A.cur < A.exercises.length - 1) A.cur++; toast('Séries validées conservées, exercice clôturé.'); } else { A.exercises.splice(A.cur, 1); } A.rest = null; commit({ render: false }); renderLive(); break; }
    case 'live-prev': A.cur = Math.max(0, A.cur - 1); commit({ render: false }); renderLive(); break;
    case 'live-next': A.cur = Math.min(A.exercises.length - 1, A.cur + 1); commit({ render: false }); renderLive(); window.scrollTo(0, 0); $('.live') && ($('.live').scrollTop = 0); break;
    case 'live-finish': askFinish(); break;
    case 'live-add': openPicker({ target: 'live', mode: 'add' }); break;
    case 'rest-add': if (A.rest) { A.rest.endAt += +d.d * 1000; A.rest.total = Math.max(15, A.rest.total + +d.d); restAlerted = false; commit({ render: false }); renderLive(); } break;
    case 'rest-skip': A.rest = null; commit({ render: false }); renderLive(); break;
    case 'pain-m': UI.painSel.has(d.m) ? UI.painSel.delete(d.m) : UI.painSel.add(d.m); { const note = ($('#pain-note') || {}).value; UI.painDraw(); if (note) $('#pain-note').value = note; } break;
    case 'pain-swap': savePain('swap'); break;
    case 'pain-del': savePain('del'); break;
    case 'finish-save': finishWorkout(true); break;
    case 'finish-discard': finishWorkout(false); break;
    // ----- journaux
    case 'del-cardio': S.cardioLogs = S.cardioLogs.filter(x => x.id !== d.id); commit(); break;
    case 'del-body': S.bodyLogs = S.bodyLogs.filter(x => x.id !== d.id); commit(); break;
    case 'del-food': S.nutritionLogs = S.nutritionLogs.filter(x => x.id !== d.id); commit(); break;
    case 'del-photo': S.photos = S.photos.filter(x => x.id !== d.id); S.deleted.push(d.id); Sync.delP.add(d.id); lsDel('forge.photo.' + d.id); commit(); break;
    case 'gym-item': {
      const g = E.activeGym(S), cur = g.items[d.item] || 'yes';
      g.items[d.item] = { yes: 'pref', pref: 'no', no: 'yes' }[cur];
      commit({ render: false });
      const mb = $('#sheet .mini-body'); if (mb) openExercise(mb.dataset.ex);
      render(); break;
    }
    case 'gym-all': { const g = E.activeGym(S); Object.keys(g.items).forEach(i => g.items[i] = d.v); commit(); break; }
    case 'gym-add': { const g = E.makeGym(null, d.preset); const n = S.settings.gyms.filter(x => x.name.startsWith(g.name)).length; if (n) g.name += ' ' + (n + 1); S.settings.gyms.push(g); S.settings.gymId = g.id; commit(); toast(`Salle « ${g.name} » créée et activée.`); break; }
    case 'gym-del-ask': $('#gym-del-zone').innerHTML = `<div class="notice bad" style="flex-direction:column;gap:10px"><span>Supprimer la salle « ${esc(E.activeGym(S).name)} » ? Votre historique n'est pas touché.</span><div class="row"><button class="btn danger" data-act="gym-del">Supprimer</button><button class="btn" data-act="reset-cancel">Annuler</button></div></div>`; break;
    case 'gym-del': { const id = S.settings.gymId; S.settings.gyms = S.settings.gyms.filter(x => x.id !== id); S.settings.gymId = S.settings.gyms[0].id; commit(); toast('Salle supprimée.'); break; }
    case 'lib-gym': UI.libFilter.onlyGym = !UI.libFilter.onlyGym; render(); break;
    case 'tg-reset': delete S.settings.targets[d.g]; commit(); break;
    case 'export': exportData(); break;
    case 'copy-export': { const t = $('#export-txt'); const done = () => toast('Copié.'); try { navigator.clipboard.writeText(t.value).then(done, () => { t.select(); toast('Sélectionné : copiez avec Ctrl/Cmd + C.'); }); } catch (e) { t.select(); } break; }
    case 'reset-ask': $('#reset-zone').innerHTML = `<div class="notice bad" style="flex-direction:column;gap:10px"><span>Effacer toutes les séances, mesures et réglages ? Exportez d'abord si vous voulez les garder.</span><div class="row"><button class="btn danger" data-act="reset-do">Tout effacer</button><button class="btn" data-act="reset-cancel">Annuler</button></div></div>`; break;
    case 'reset-cancel': render(); break;
    case 'reset-do': {
      S.workouts.forEach(w => { Sync.delW.add(w.id); }); (S.photos || []).forEach(p => { Sync.delP.add(p.id); lsDel('forge.photo.' + p.id); });
      const del = S.workouts.map(w => w.id).concat((S.photos || []).map(p => p.id)).concat(S.deleted || []);
      S = freshState(); S.deleted = del; S.demoLoaded = true; UI.sel.clear(); commit(); toast('Toutes les données ont été effacées.'); break;
    }
  }
});

document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('#body-sel .bd-m')) { ev.preventDefault(); toggleMuscle(ev.target.dataset.m); render(); const el = $(`#body-sel .bd-m[data-m="${ev.target.dataset.m}"]`); if (el) el.focus(); }
  if (ev.key === 'Escape' && $('#sheet').innerHTML) closeSheet();
});

let inputT;
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.live) {
    const e = S.active.exercises[S.active.cur]; const s = e.sets[+t.dataset.i];
    s[t.dataset.live] = t.value.replace(',', '.');
    clearTimeout(inputT); inputT = setTimeout(() => commit({ render: false }), 500);
    return;
  }
  const k = t.dataset.input; if (!k) return;
  if (k === 'lib-q') { UI.libFilter.q = t.value; render(); }
  else if (k === 'pick-q') { pickCtx.q = t.value; renderPicker(); const i = $('#pick-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
});

document.addEventListener('change', async ev => {
  const t = ev.target;
  const k = t.dataset.input;
  if (k === 'lib-g') { UI.libFilter.group = t.value; render(); }
  else if (k === 'lib-e') { UI.libFilter.eq = t.value; render(); }
  else if (k === 'pick-g') { pickCtx.group = t.value; renderPicker(); }
  else if (k === 'prog-sel') { UI.progEx = t.value; render(); }
  else if (k === 'gym-sel') {
    S.settings.gymId = t.value; const name = E.activeGym(S).name;
    if (S.plan && !S.active && S.plan.muscles && S.plan.muscles.length) { commit({ render: false }); buildPlan(S.plan.muscles, { auto: S.plan.auto, title: S.plan.auto ? S.plan.title : null, template: S.plan.template }); toast(`Séance recalculée pour « ${name} ».`); }
    else { commit(); toast(`Salle active : ${name}`); }
  }
  else if (k === 'gym-name') { const v = t.value.trim(); if (v) { E.activeGym(S).name = v.slice(0, 40); commit(); } }
  else if (k && k.startsWith('cp-')) {
    const c = S.settings.cardio = Object.assign({ type: 'incline_walk', intensity: 'moderate', minutes: 30, perWeek: 3, weeklyKcal: 1200 }, S.settings.cardio);
    const map = { 'cp-type': 'type', 'cp-int': 'intensity', 'cp-min': 'minutes', 'cp-fr': 'perWeek', 'cp-kcal': 'weeklyKcal' };
    c[map[k]] = ['cp-type', 'cp-int'].includes(k) ? t.value : Math.max(0, num(t.value) || 0);
    commit();
  }
  else if (k === 'photo' && t.files[0]) {
    try { const data = await compressImage(t.files[0]); const p = { id: 'p' + E.uid(), date: Date.now(), data }; S.photos.push(p); commit({ photo: p.id }); toast('Photo ajoutée.'); }
    catch (e) { toast('Image illisible : essayez une photo JPEG ou PNG.'); }
  }
  else if (k === 'import' && t.files[0]) importData(t.files[0]);
  else if (t.dataset.pf) {
    const f = t.dataset.pf, p = S.profile;
    if (f === 'noLegs') p.noLegs = t.checked;
    else if (f === 'weight') { const v = num(t.value); if (v && v !== E.currentWeight(S)) { S.bodyLogs.push({ id: E.uid(), date: Date.now(), weight: v }); p.weight = v; } }
    else if (['age', 'height', 'targetWeight', 'steps', 'freqMin', 'freqMax', 'sessionMinutes'].includes(f)) { const v = num(t.value); if (v != null) p[f] = v; }
    else p[f] = t.value;
    if (p.freqMax < p.freqMin) p.freqMax = p.freqMin;
    commit({ render: false }); toast('Profil enregistré.');
  }
  else if (t.dataset.tg) {
    const g = t.dataset.tg, cur = E.targets(S)[g];
    const o = S.settings.targets[g] = { min: cur.min, max: cur.max };
    o[t.dataset.k] = Math.max(0, Math.round(num(t.value) || 0));
    if (o.max < o.min) o.max = o.min;
    commit();
  }
});

document.addEventListener('submit', ev => {
  const f = ev.target.closest('[data-form]'); if (!f) return;
  ev.preventDefault();
  const o = Object.fromEntries(new FormData(f).entries());
  switch (f.dataset.form) {
    case 'coach': ask(o.q); break;
    case 'qw': if (addBodyLog(o)) { closeSheet(); commit(); toast('Pesée enregistrée.'); } break;
    case 'body': if (addBodyLog(o)) { commit(); toast('Mesure enregistrée.'); } break;
    case 'cardio': {
      const m = num(o.minutes); if (!m) return;
      const date = parseDay(o.date) + 10 * 3600e3;
      S.cardioLogs.push({ id: E.uid(), date: Math.min(date, Date.now()), type: o.type, intensity: o.intensity, minutes: m, kcal: E.cardioKcal(o.type, o.intensity, m, E.currentWeight(S)) });
      commit(); toast('Séance cardio enregistrée.'); break;
    }
    case 'food': {
      const k = num(o.kcal); if (!k) return;
      S.nutritionLogs = S.nutritionLogs.filter(l => isoDay(l.date) !== o.date);
      S.nutritionLogs.push({ id: E.uid(), date: parseDay(o.date) + 12 * 3600e3, kcal: k, protein: num(o.protein), carbs: num(o.carbs), fat: num(o.fat) });
      commit(); toast('Journée enregistrée.'); break;
    }
  }
});

window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.some(t => t.id === h) && h !== UI.tab) { UI.tab = h; render(); } });

// =====================================================================
// DÉMARRAGE
// =====================================================================
function init() {
  S = loadLocal();
  const isNew = !S;
  if (!S) S = freshState();
  (S.photos || []).forEach(p => { if (!p.data) p.data = lsGet('forge.photo.' + p.id); });
  if (isNew) loadDemo();
  E.ensureGyms(S);
  if (window.FORGE_STANDALONE && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const h = location.hash.slice(1);
  if (TABS.some(t => t.id === h)) UI.tab = h;
  saveLocal();
  render();
  Sync.connect();
}
init();
})();
