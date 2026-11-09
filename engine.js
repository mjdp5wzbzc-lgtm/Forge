/* ==========================================================================
   Forge — moteur de programmation
   Fonctions pures : aucune dépendance au DOM. Testées dans Node (test.js).
   ========================================================================== */
(function (root) {
  'use strict';
  const D = root.FORGE_DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const { MUSCLES, GROUPS, EXERCISES, EXERCISE_LIST, EQUIPMENT, EQUIP_ITEMS } = D;

  const H = 3600e3, DAY = 24 * H;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round1 = v => Math.round(v * 10) / 10;
  const sum = a => a.reduce((s, v) => s + v, 0);
  const mean = a => a.length ? sum(a) / a.length : 0;
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
  const fmtKg = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
  const f1 = v => fmtKg(round1(v));

  // ---------------------------------------------------------------------------
  // Profil par défaut (prérempli à partir de la demande)
  // ---------------------------------------------------------------------------
  function defaultProfile() {
    return {
      name: '', sex: 'h', age: 35, height: 180, weight: 88, targetWeight: 82,
      level: 'intermediaire', steps: 4000, freqMin: 2, freqMax: 4,
      goal: 'recomposition',
      goalText: 'Perdre de la graisse tout en développant la masse musculaire',
      goal2Text: 'Améliorer la silhouette, la définition musculaire et l\'endurance',
      priority: 'upper', noLegs: true,
      sessionMinutes: 60,
      equipment: { barbell: true, dumbbell: true, machine: true, cable: true, bodyweight: true }
    };
  }

  // ---------------------------------------------------------------------------
  // Séries : comptage pondéré
  // ---------------------------------------------------------------------------
  function isWorkSet(s) { return s && s.done && (s.reps || 0) > 0; }

  // Intensité de la série selon la proximité de l'échec
  function intensity(rir) {
    if (rir == null || rir === '') return 1;
    if (rir <= 1) return 1.1;
    if (rir <= 3) return 1;
    if (rir <= 4) return 0.75;
    return 0.5; // trop loin de l'échec pour être une série « dure »
  }

  function workoutsBetween(state, from, to) {
    return (state.workouts || []).filter(w => w.finishedAt && w.finishedAt >= from && w.finishedAt <= to);
  }

  // Séries pondérées par muscle et par groupe sur une fenêtre
  function setsInWindow(state, from, to) {
    const muscle = {}, group = {};
    Object.keys(MUSCLES).forEach(m => muscle[m] = 0);
    Object.keys(GROUPS).forEach(g => group[g] = 0);
    workoutsBetween(state, from, to).forEach(w => {
      (w.exercises || []).forEach(e => {
        const ex = EXERCISES[e.exId]; if (!ex) return;
        const n = (e.sets || []).filter(isWorkSet).length;
        if (!n) return;
        Object.keys(ex.m).forEach(m => muscle[m] += n * ex.m[m]);
        Object.keys(ex.gw).forEach(g => group[g] += n * ex.gw[g]);
      });
    });
    Object.keys(muscle).forEach(k => muscle[k] = round1(muscle[k]));
    Object.keys(group).forEach(k => group[k] = round1(group[k]));
    return { muscle, group };
  }

  function rolling7(state, now) { return setsInWindow(state, now - 7 * DAY, now); }

  function weekStart(ts) {
    const d = new Date(ts); d.setHours(0, 0, 0, 0);
    const dow = (d.getDay() + 6) % 7; // lundi = 0
    return d.getTime() - dow * DAY;
  }
  function calendarWeek(state, now) { return setsInWindow(state, weekStart(now), now); }

  // ---------------------------------------------------------------------------
  // Objectifs de volume hebdomadaire (personnalisables)
  // ---------------------------------------------------------------------------
  const LEVEL_F = { debutant: 0.75, intermediaire: 1, avance: 1.2 };

  function targets(state) {
    const p = state.profile || defaultProfile();
    const lf = LEVEL_F[p.level] || 1;
    const freq = ((p.freqMin || 2) + (p.freqMax || 4)) / 2;
    const ff = freq <= 2 ? 0.8 : freq < 3 ? 0.9 : freq <= 3.5 ? 1 : 1.05;
    const out = {};
    Object.keys(GROUPS).forEach(g => {
      const G = GROUPS[g];
      let pf = 1;
      if (p.priority === 'upper' && G.region === 'upper') pf = 1.1;
      let min = G.min * lf * ff * pf, max = G.max * lf * ff * pf;
      if (G.region === 'legs' && p.noLegs) { min = 0; max = 0; }
      const o = (state.settings && state.settings.targets && state.settings.targets[g]) || null;
      out[g] = o ? { min: +o.min, max: +o.max, custom: true }
        : { min: Math.round(min), max: Math.max(Math.round(max), Math.round(min)), custom: false };
    });
    return out;
  }

  function groupStatus(done, t) {
    if (t.max === 0) return done > 0 ? 'over' : 'off';
    if (done < t.min * 0.75) return 'low';
    if (done < t.min) return 'near';
    if (done > t.max) return 'over';
    return 'ok';
  }

  // ---------------------------------------------------------------------------
  // Bilan de forme (check-in) et récupération
  // ---------------------------------------------------------------------------
  // Chaque critère : 1 à 5. fatigue et soreness : 5 = élevé (mauvais).
  function readiness(ck) {
    if (!ck) return { score: 70, label: 'Non renseigné', volFactor: 0.95, rirAdj: 0, level: 'unknown',
      advice: "Faites le bilan du jour pour adapter le volume à votre forme réelle." };
    const v = [ck.sleep, ck.energy, 6 - ck.fatigue, 6 - ck.soreness, ck.motivation].map(x => (clamp(+x || 3, 1, 5) - 1) / 4);
    const w = [1.2, 1.2, 1, 0.8, 0.6];
    const score = Math.round(100 * sum(v.map((x, i) => x * w[i])) / sum(w));
    if (score >= 75) return { score, label: 'Excellente forme', volFactor: 1, rirAdj: 0, level: 'high', advice: 'Feu vert : séance complète, progression possible.' };
    if (score >= 55) return { score, label: 'Bonne forme', volFactor: 0.9, rirAdj: 0, level: 'mid', advice: 'Séance normale, volume légèrement réduit.' };
    if (score >= 40) return { score, label: 'Forme moyenne', volFactor: 0.8, rirAdj: 1, level: 'low', advice: 'Volume réduit et 1 répétition de marge en plus : on consolide, on ne force pas.' };
    return { score, label: 'Fatigue marquée', volFactor: 0.6, rirAdj: 1, level: 'verylow',
      advice: 'Séance courte et légère, ou cardio doux / repos. Le sommeil et la récupération priment aujourd\'hui.' };
  }

  function latestCheckin(state, now) {
    const c = (state.checkins || []).filter(c => now - c.date < 14 * H && c.date <= now + H)
      .sort((a, b) => b.date - a.date)[0];
    return c || null;
  }

  // Récupération par muscle : fatigue = Σ séries × intensité × e^(−Δt/τ)
  function recovery(state, now, ck) {
    const F = {};
    Object.keys(MUSCLES).forEach(m => F[m] = 0);
    workoutsBetween(state, now - 6 * DAY, now).forEach(w => {
      const dt = Math.max(0, (now - w.finishedAt) / H);
      (w.exercises || []).forEach(e => {
        const ex = EXERCISES[e.exId]; if (!ex) return;
        (e.sets || []).filter(isWorkSet).forEach(s => {
          const it = intensity(s.rir);
          Object.keys(ex.m).forEach(m => {
            F[m] += ex.m[m] * it * Math.exp(-dt / MUSCLES[m].tau);
          });
        });
      });
    });
    const out = {};
    const sore = (ck && ck.soreMuscles) || [];
    Object.keys(MUSCLES).forEach(m => {
      let r = Math.round(100 * clamp(1 - F[m] / MUSCLES[m].cap, 0, 1));
      if (sore.indexOf(m) >= 0) r = Math.min(r, 55);
      out[m] = r;
    });
    return out;
  }

  function groupRecovery(rec, g) {
    const v = GROUPS[g].muscles.map(m => rec[m]);
    return Math.round(0.5 * mean(v) + 0.5 * Math.min.apply(null, v));
  }

  function recoveryLabel(r) {
    if (r >= 80) return { key: 'ok', text: 'Récupéré' };
    if (r >= 55) return { key: 'mid', text: 'Partiellement récupéré' };
    return { key: 'low', text: 'Encore fatigué' };
  }

  // Douleurs : muscles à éviter (check-in du jour + signalements en séance < 7 j)
  function painContext(state, now, ck) {
    const muscles = new Set((ck && ck.painMuscles) || []);
    const exercises = new Set();
    (state.painFlags || []).filter(p => now - p.date < 7 * DAY).forEach(p => {
      if (p.exId) exercises.add(p.exId);
      (p.muscles || []).forEach(m => muscles.add(m));
    });
    return { muscles, exercises };
  }

  // ---------------------------------------------------------------------------
  // Historique d'exercice, e1RM, progression (surcharge progressive)
  // ---------------------------------------------------------------------------
  function e1rm(load, reps, rir) {
    const r = (reps || 0) + (rir == null || rir === '' ? 0 : +rir);
    if (!load || !r) return 0;
    return load * (1 + r / 30);
  }

  // Charge effective (poids du corps inclus pour les exercices au PDC)
  function effLoad(ex, load, bw) {
    if (ex.unit === 'added') return (ex.bw || 1) * bw + (load || 0);
    if (ex.unit === 'per_hand') return (load || 0) * 2;
    return load || 0;
  }

  // Liste des performances passées d'un exercice, de la plus récente à la plus ancienne
  function performances(state, exId, before) {
    const out = [];
    (state.workouts || []).filter(w => w.finishedAt && (!before || w.finishedAt < before))
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .forEach(w => {
        (w.exercises || []).forEach(e => {
          if (e.exId !== exId) return;
          const sets = (e.sets || []).filter(isWorkSet).map(s => ({ load: +s.load || 0, reps: +s.reps, rir: s.rir === '' || s.rir == null ? null : +s.rir }));
          if (sets.length) out.push({ date: w.finishedAt, workoutId: w.id, sets, bw: w.bodyweight || null });
        });
      });
    return out;
  }

  function bestE1rm(ex, perf, bw) {
    return Math.max.apply(null, perf.sets.map(s => e1rm(effLoad(ex, s.load, bw), s.reps, s.rir)).concat([0]));
  }

  function roundLoad(ex, v) {
    const step = ex.inc || 2.5;
    let r = Math.round(v / step) * step;
    if (ex.unit === 'added') return Math.max(0, r);
    const min = ex.eq === 'barbell' ? 20 : ex.eq === 'dumbbell' ? 2 : step;
    return Math.max(min, Math.round(r * 100) / 100);
  }

  function totalReps(p) { return sum(p.sets.map(s => s.reps)); }

  /**
   * Recommandation de charge et de répétitions pour la prochaine séance.
   * Double progression : on gagne des répétitions dans la fourchette, puis
   * on augmente la charge quand toutes les séries atteignent le haut de la
   * fourchette avec une marge (RIR) suffisante.
   */
  function progression(state, ex, opts) {
    const now = opts.now || Date.now();
    const lo = opts.reps[0], hi = opts.reps[1];
    const rirT = opts.rir;
    const ready = opts.ready || readiness(null);
    const bw = currentWeight(state);
    const hist = performances(state, ex.id, now + 1);
    if (!hist.length) return estimateStart(state, ex, opts, bw);

    const last = hist[0];
    const top = Math.max.apply(null, last.sets.map(s => s.load));
    const topSets = last.sets.filter(s => s.load === top);
    const rirs = topSets.map(s => s.rir).filter(r => r != null);
    const avgRir = rirs.length ? mean(rirs) : null;
    const minReps = Math.min.apply(null, topSets.map(s => s.reps));
    const allHi = topSets.length >= 2 && topSets.every(s => s.reps >= hi);
    const days = Math.round((now - last.date) / DAY);

    // Régression : moins de répétitions à charge égale ou supérieure que la fois précédente
    const prev = hist[1];
    const regress = (a, b) => {
      if (!a || !b) return false;
      const ta = Math.max.apply(null, a.sets.map(s => s.load)), tb = Math.max.apply(null, b.sets.map(s => s.load));
      return ta >= tb && totalReps(a) < totalReps(b) * 0.9 && a.sets.length >= b.sets.length - 0;
    };
    const reg1 = regress(last, prev);
    const reg2 = reg1 && regress(prev, hist[2]);
    const lastStr = `${last.sets.length} × ${last.sets.map(s => s.reps).join('/')} à ${loadStr(ex, top)}` + (avgRir != null ? ` (RIR moy. ${f1(avgRir)})` : '');

    let load = top, reps, kind, why;
    const tooLongAgo = days > 21;

    if (tooLongAgo) {
      load = roundLoad(ex, top * 0.9); reps = lo + 1; kind = 'reduce';
      why = `Dernière fois il y a ${days} j (${lastStr}). Reprise à −10 % pour réadapter le geste.`;
    } else if (ready.level === 'verylow' || ready.level === 'low') {
      reps = clamp(Math.round(mean(topSets.map(s => s.reps))), lo, hi); kind = 'hold';
      why = `Dernière séance : ${lastStr}. Forme du jour ${ready.score}/100 : charge maintenue, pas de progression forcée aujourd'hui.`;
    } else if (reg2) {
      load = roundLoad(ex, top * 0.9); reps = lo + 1; kind = 'reduce';
      why = `Deux séances de suite en baisse (${lastStr}). Allègement de 10 % pour relancer la progression : c'est un signe de fatigue accumulée.`;
    } else if (allHi && (avgRir == null || avgRir >= rirT - 0.5)) {
      load = roundLoad(ex, top + (ex.unit === 'per_hand' ? ex.inc : ex.inc));
      if (load <= top) load = top + ex.inc;
      reps = lo; kind = 'increase';
      why = `Dernière séance : ${lastStr}. Toutes les séries au haut de la fourchette (${hi}) avec une marge suffisante → +${fmtKg(load - top)} kg, retour à ${lo} répétitions.`;
    } else if (allHi) {
      reps = hi; kind = 'hold';
      why = `Dernière séance : ${lastStr}. Haut de fourchette atteint mais trop près de l'échec (RIR ${f1(avgRir)}) : on consolide cette charge avant d'augmenter.`;
    } else if (minReps < lo - 1 || reg1) {
      const drop = minReps < lo - 2 || reg1;
      load = drop ? roundLoad(ex, top * 0.95) : top; reps = lo; kind = drop ? 'reduce' : 'hold';
      why = `Dernière séance : ${lastStr}. ` + (reg1 ? 'Performances en baisse par rapport à la séance précédente' : `Répétitions sous la fourchette (${lo}-${hi})`) +
        (drop ? ' → charge réduite de 5 % pour travailler proprement dans la fourchette.' : ' → charge maintenue, objectif : revenir dans la fourchette.');
    } else {
      const avg = Math.round(mean(topSets.map(s => s.reps)));
      reps = clamp(avg + 1, lo, hi); kind = 'hold';
      why = `Dernière séance : ${lastStr}. Même charge, objectif +1 répétition par série (double progression).`;
    }
    if (ex.unit === 'added' && load === 0 && kind === 'increase' && hi >= 15) {
      // Au poids du corps sans lest : on garde la progression en répétitions
      load = 0; reps = hi; kind = 'hold';
      why = `Dernière séance : ${lastStr}. Haut de fourchette atteint : ajoutez un lest léger (${fmtKg(ex.inc)} kg) si disponible, sinon ralentissez le tempo.`;
    }
    return { load, reps, kind, why, last, e1rm: round1(bestE1rm(ex, last, last.bw || bw)) };
  }

  function similarity(a, b) {
    const keys = new Set(Object.keys(a.m).concat(Object.keys(b.m)));
    let dot = 0, na = 0, nb = 0;
    keys.forEach(k => { const x = a.m[k] || 0, y = b.m[k] || 0; dot += x * y; na += x * x; nb += y * y; });
    return dot / Math.sqrt(na * nb || 1);
  }

  const LEVEL_START = { debutant: 0.7, intermediaire: 1, avance: 1.25 };

  function estimateStart(state, ex, opts, bw) {
    const lo = opts.reps[0], hi = opts.reps[1];
    const reps = Math.round((lo + hi) / 2);
    if (ex.unit === 'added') {
      return { load: 0, reps: lo, kind: 'estimate', why: `Pas d'historique : commencez au poids du corps et notez combien de répétitions vous réalisez à RIR ${opts.rir}. La progression se calera dessus.` };
    }
    // 1) Exercice proche déjà pratiqué → conversion par e1RM
    let best = null;
    EXERCISE_LIST.forEach(o => {
      if (o.id === ex.id || o.unit === 'added' || !o.start || !ex.start) return;
      const s = similarity(ex, o);
      if (s < 0.75) return;
      const h = performances(state, o.id, (opts.now || Date.now()) + 1);
      if (!h.length) return;
      if (!best || s > best.s) best = { o, s, h: h[0] };
    });
    if (best) {
      const e = bestE1rm(best.o, best.h, bw);
      const ratio = (ex.start * (ex.unit === 'per_hand' ? 2 : 1)) / (best.o.start * (best.o.unit === 'per_hand' ? 2 : 1));
      let total = e * ratio / (1 + (reps + opts.rir) / 30);
      if (ex.unit === 'per_hand') total /= 2;
      const load = roundLoad(ex, total * 0.95);
      return { load, reps, kind: 'estimate', why: `Pas encore d'historique sur cet exercice : charge estimée à partir de votre « ${best.o.name} » (1RM estimé ${Math.round(e)} kg), avec 5 % de marge. Ajustez dès la 1ʳᵉ série pour finir à RIR ${opts.rir}.` };
    }
    // 2) Estimation depuis le poids de corps et le niveau
    const lvl = LEVEL_START[(state.profile || {}).level] || 1;
    const load = roundLoad(ex, bw * ex.start * lvl * 0.9);
    return { load, reps, kind: 'estimate', why: `Pas d'historique : charge de départ estimée d'après votre poids (${fmtKg(bw)} kg) et votre niveau, volontairement prudente. Si la 1ʳᵉ série est trop facile (RIR > ${opts.rir + 2}), augmentez.` };
  }

  function loadStr(ex, load) {
    if (ex.unit === 'added') return load ? `PDC + ${fmtKg(load)} kg` : 'poids du corps';
    if (ex.unit === 'per_hand') return `${fmtKg(load)} kg/haltère`;
    return `${fmtKg(load)} kg`;
  }

  function currentWeight(state) {
    const logs = (state.bodyLogs || []).filter(l => l.weight).sort((a, b) => b.date - a.date);
    return logs.length ? +logs[0].weight : +((state.profile || {}).weight || 80);
  }

  // ---------------------------------------------------------------------------
  // Paramètres de série selon l'exercice, le niveau et la forme
  // ---------------------------------------------------------------------------
  function scheme(state, ex, ready) {
    const p = state.profile || defaultProfile();
    let rir = ex.type === 'compound' ? 2 : 1;
    if (p.level === 'debutant') rir += 1;
    rir += ready.rirAdj || 0;
    let rest = ex.rest + (ready.level === 'low' || ready.level === 'verylow' ? 15 : 0);
    const tempo = ex.unit === 'added' ? '2-0-1-0' : ex.type === 'compound' ? '3-1-1-0' : '2-0-1-1';
    return { reps: ex.reps.slice(), rir, rest, tempo };
  }

  // ---------------------------------------------------------------------------
  // GÉNÉRATEUR DE SÉANCE
  // ---------------------------------------------------------------------------
  const CAP = {
    debutant:      { big: 6, small: 4, exPerGroup: 2 },
    intermediaire: { big: 9, small: 6, exPerGroup: 3 },
    avance:        { big: 10, small: 8, exPerGroup: 3 }
  };

  function selectedGroups(muscles) {
    const map = {};
    muscles.forEach(m => {
      if (!MUSCLES[m]) return;
      const g = MUSCLES[m].group;
      (map[g] = map[g] || []).push(m);
    });
    return map; // groupe → muscles ciblés
  }

  // ---------------------------------------------------------------------------
  // Salles : inventaire précis du matériel disponible
  // ---------------------------------------------------------------------------
  const GYM_PRESETS = {
    full:  { name: 'Salle complète', items: Object.keys(EQUIP_ITEMS) },
    basic: { name: 'Salle de base', items: ['barbell', 'ez_bar', 'dumbbells', 'squat_rack', 'bench_flat', 'bench_incline', 'pullup_bar', 'dip_station', 'cable_station', 'lat_pulldown_m', 'low_row_m', 'chest_press_m', 'pec_deck_m', 'leg_press_m'] },
    home:  { name: 'Maison', items: ['dumbbells', 'bench_flat', 'bench_incline', 'pullup_bar', 'ab_wheel'] },
    empty: { name: 'Poids du corps', items: [] }
  };
  function makeGym(name, preset) {
    const on = new Set((GYM_PRESETS[preset] || GYM_PRESETS.full).items);
    const items = {};
    Object.keys(EQUIP_ITEMS).forEach(k => items[k] = on.has(k) ? 'yes' : 'no');
    return { id: 'g' + uid(), name: name || (GYM_PRESETS[preset] || GYM_PRESETS.full).name, items };
  }
  // Garantit qu'au moins une salle existe (migration des anciens réglages par catégorie)
  function ensureGyms(state) {
    state.settings = state.settings || {};
    if (!Array.isArray(state.settings.gyms) || !state.settings.gyms.length) {
      const g = makeGym('Ma salle', 'full');
      const eq = (state.profile && state.profile.equipment) || {};
      const catOf = { barbell: ['barbell', 'ez_bar', 'squat_rack'], dumbbell: ['dumbbells'], cable: ['cable_station', 'lat_pulldown_m', 'low_row_m'] };
      Object.keys(catOf).forEach(c => { if (eq[c] === false) catOf[c].forEach(i => g.items[i] = 'no'); });
      if (eq.machine === false) Object.keys(EQUIP_ITEMS).filter(i => /_m$/.test(i)).forEach(i => g.items[i] = 'no');
      state.settings.gyms = [g];
      state.settings.gymId = g.id;
    }
    if (!state.settings.gyms.some(g => g.id === state.settings.gymId)) state.settings.gymId = state.settings.gyms[0].id;
    state.settings.gyms.forEach(g => Object.keys(EQUIP_ITEMS).forEach(k => { if (!g.items[k]) g.items[k] = 'yes'; }));
    return state.settings.gyms;
  }
  function activeGym(state) {
    const gs = ensureGyms(state);
    return gs.find(g => g.id === state.settings.gymId) || gs[0];
  }
  function itemState(state, item) { return activeGym(state).items[item] || 'yes'; }
  function exAvailable(state, ex) {
    const g = activeGym(state);
    return (ex.need || []).every(r => Array.isArray(r) ? r.some(i => g.items[i] !== 'no') : g.items[r] !== 'no');
  }
  function exPreferred(state, ex) {
    const g = activeGym(state);
    return (ex.need || []).flat().some(i => g.items[i] === 'pref');
  }
  // Matériel pertinent pour une liste de groupes, avec le nombre d'exercices qu'il permet
  function itemsForGroups(groups) {
    const out = {};
    EXERCISE_LIST.filter(ex => groups.indexOf(ex.primaryGroup) >= 0).forEach(ex => {
      (ex.need || []).flat().forEach(i => { out[i] = out[i] || { item: i, exercises: [] }; out[i].exercises.push(ex.id); });
    });
    return Object.values(out).sort((a, b) => b.exercises.length - a.exercises.length);
  }
  function availableCount(state, g) {
    return EXERCISE_LIST.filter(ex => ex.primaryGroup === g && exAvailable(state, ex)).length;
  }

  function equipmentOk(state, ex) { return exAvailable(state, ex); }

  function lastDoneAt(state, exId, now) {
    const p = performances(state, exId, now + 1);
    return p.length ? p[0].date : null;
  }

  function candidateScore(state, ex, g, focus, chosen, ctx) {
    let s = 0;
    // Précision par rapport aux sous-muscles demandés (ex. haut des pectoraux)
    s += 3 * sum(focus.map(m => ex.m[m] || 0)) / Math.max(1, focus.length);
    const first = chosen.length === 0;
    if (first && GROUPS[g].size === 'big' && ex.type === 'compound') s += 2;
    if (first && GROUPS[g].size === 'small' && ex.type === 'compound' && ctx.dose >= 5) s += 0.5;
    if (!first && ex.type === 'isolation') s += 1;
    // Continuité : un exercice déjà pratiqué permet de mesurer la progression
    const last = lastDoneAt(state, ex.id, ctx.now);
    if (last && ctx.now - last < 28 * DAY) s += 1.5;
    if (last && ctx.now - last < 2 * DAY) s -= 1.5;
    // Variété dans la séance : angle ou matériel différent du 1er choix
    chosen.forEach(c => {
      if (c.eq !== ex.eq) s += 0.4;
      const dom = o => Object.keys(o.m).sort((a, b) => o.m[b] - o.m[a])[0];
      if (dom(c) !== dom(ex)) s += 0.6;
      s -= 2 * similarity(c, ex) * (c.eq === ex.eq ? 1 : 0.5);
    });
    // Évite de charger fortement un muscle secondaire non récupéré
    Object.keys(ex.m).forEach(m => {
      if (ex.m[m] >= 0.5 && ex.m[m] < 1 && ctx.rec[m] < 50) s -= 1.2;
    });
    // Préférences utilisateur
    const fav = (state.settings && state.settings.favorites) || [];
    if (fav.indexOf(ex.id) >= 0) s += 1;
    // Machine marquée « préférée » dans la salle active
    if (exPreferred(state, ex)) s += 3;
    // Niveau
    const lv = { debutant: 1, intermediaire: 2, avance: 3 }[(state.profile || {}).level] || 2;
    if (ex.lvl > lv) s -= 1.5;
    return s;
  }

  function splitSets(total, n) {
    const out = [];
    let left = total;
    for (let i = 0; i < n; i++) {
      const v = Math.ceil(left / (n - i));
      out.push(v); left -= v;
    }
    return out;
  }

  /**
   * Construit une séance.
   * opts : { muscles: [...], now, checkin, auto: bool, title }
   */
  function generate(state, opts) {
    const now = opts.now || Date.now();
    const p = state.profile || defaultProfile();
    const ck = opts.checkin !== undefined ? opts.checkin : latestCheckin(state, now);
    const ready = readiness(ck);
    const vol = rolling7(state, now).group;
    const tg = targets(state);
    const rec = recovery(state, now, ck);
    const pain = painContext(state, now, ck);
    const cap = CAP[p.level] || CAP.intermediaire;
    const sel = selectedGroups(opts.muscles || []);
    const groups = Object.keys(sel).sort((a, b) => GROUPS[a].order - GROUPS[b].order);
    const notes = [], warnings = [], groupInfo = {};
    const single = groups.length === 1;

    if (!groups.length) return { error: 'Sélectionnez au moins un muscle.' };

    // ---- 1. Dose de séries par groupe -------------------------------------
    groups.forEach(g => {
      const G = GROUPS[g], t = tg[g], W = vol[g] || 0;
      const R = groupRecovery(rec, g);
      const mid = (t.min + t.max) / 2;
      const gcap = G.size === 'big' ? cap.big : cap.small;
      let dose, why = [];
      const legsOff = G.region === 'legs' && p.noLegs;
      why.push(`${f1(W)} séries sur 7 j (cible ${legsOff ? 'non programmée' : t.min + '-' + t.max})`);
      why.push(`récupération ${R} %`);

      if (legsOff) {
        dose = Math.min(gcap, 6);
        warnings.push(`${G.name} : votre profil indique de ne pas programmer les jambes. Séance générée car vous l'avez sélectionné explicitement.`);
      } else if (W >= t.max) {
        dose = single ? 2 : 0;
        why.push(single ? 'volume hebdo déjà au maximum → 2 séries techniques légères seulement' : 'volume hebdo déjà au maximum → pas de séries supplémentaires');
      } else if (W >= mid) {
        dose = Math.min(3, Math.ceil(t.max - W));
        why.push('proche de la cible → volume d\'entretien');
      } else {
        const remaining = mid - W;
        dose = Math.min(gcap, Math.ceil(remaining));
        if (dose < 3) dose = Math.min(3, Math.ceil(t.max - W));
        if (remaining > gcap) why.push(`retard de ${Math.round(remaining)} séries : rattrapage réparti sur plusieurs séances (plafond ${gcap}/séance)`);
        else why.push(`il manque ~${Math.round(remaining)} séries pour atteindre la cible`);
      }

      // Récupération
      if (R < 40 && dose > 0) {
        if (single) { dose = Math.min(dose, 2); why.push('muscle encore très fatigué → 2 séries légères maximum'); }
        else { dose = 0; why.push('muscle encore très fatigué → reporté'); }
        warnings.push(`${G.name} n'est récupéré qu'à ${R} %. Mieux vaut cibler un autre groupe aujourd'hui.`);
      } else if (R < 65 && dose > 0) {
        dose = Math.max(2, Math.round(dose * 0.7)); why.push('récupération partielle → volume −30 %');
      } else if (R < 80 && dose > 0) {
        dose = Math.max(2, Math.round(dose * 0.9));
      }
      // Forme du jour
      if (dose > 0 && ready.volFactor < 1) {
        const before = dose;
        dose = Math.max(2, Math.round(dose * ready.volFactor));
        if (dose < before) why.push(`forme ${ready.score}/100 → ${before} ramené à ${dose}`);
      }
      // Douleur
      const painHit = sel[g].concat(G.muscles).some(m => pain.muscles.has(m));
      if (painHit) {
        dose = 0; why.push('douleur signalée → groupe non travaillé');
        warnings.push(`${G.name} : douleur signalée. Pas d'entraînement de ce groupe aujourd'hui. Si la douleur persiste ou est inhabituelle (aiguë, articulaire, irradiante), demandez l'avis d'un professionnel de santé.`);
      }
      groupInfo[g] = { done: W, target: t, recovery: R, dose, planned: 0, why };
    });

    // ---- 2. Plafond de la séance (temps disponible) -----------------------
    const minutes = opts.minutes || p.sessionMinutes || 60;
    const maxSets = Math.round(minutes / 3.1 * (ready.volFactor < 1 ? ready.volFactor + 0.05 : 1));
    let total = sum(groups.map(g => groupInfo[g].dose));
    if (total > maxSets) {
      notes.push(`Volume demandé (${total} séries) supérieur à ce que permettent ${minutes} min : ramené à ~${maxSets} séries en priorisant les groupes en retard.`);
      while (total > maxSets) {
        const g = groups.filter(g => groupInfo[g].dose > 2)
          .sort((a, b) => {
            const da = groupInfo[a].done / Math.max(1, groupInfo[a].target.min), db = groupInfo[b].done / Math.max(1, groupInfo[b].target.min);
            return (db - da) || (groupInfo[b].dose - groupInfo[a].dose);
          })[0];
        if (!g) break;
        groupInfo[g].dose--; total--;
      }
    }

    // ---- 3. Choix des exercices (groupes « gros » d'abord) ----------------
    const order = groups.slice().sort((a, b) => {
      const sz = x => GROUPS[x].size === 'big' ? 0 : 1;
      return sz(a) - sz(b) || GROUPS[a].order - GROUPS[b].order;
    });
    const indirect = {}; // séries indirectes déjà prévues dans cette séance
    const planned = [];
    const usedIds = new Set();
    order.forEach(g => {
      const info = groupInfo[g];
      let dose = info.dose;
      if (dose <= 0) return;
      const ind = indirect[g] || 0;
      if (ind >= 1 && GROUPS[g].size === 'small') {
        const adj = Math.max(2, Math.round(dose - ind));
        if (adj < dose) info.why.push(`${f1(ind)} séries indirectes déjà prévues (exercices polyarticulaires) → ${dose} ramené à ${adj} séries directes`);
        dose = adj;
      }
      const focus = sel[g].length ? sel[g] : GROUPS[g].muscles;
      let nEx = dose <= 4 ? 1 : dose <= 8 ? 2 : 3;
      nEx = Math.min(nEx, cap.exPerGroup);
      const chosen = [];
      const ctx = { now, rec, dose };
      for (let i = 0; i < nEx; i++) {
        const cands = EXERCISE_LIST.filter(ex => ex.gw[g] === 1 && ex.primaryGroup === g && equipmentOk(state, ex) &&
          !usedIds.has(ex.id) && !pain.exercises.has(ex.id) && !Object.keys(ex.m).some(m => ex.m[m] >= 0.5 && pain.muscles.has(m)) &&
          !((state.settings && state.settings.excluded) || []).includes(ex.id));
        if (!cands.length) break;
        const scored = cands.map(ex => ({ ex, s: candidateScore(state, ex, g, focus, chosen, ctx) }))
          .sort((a, b) => b.s - a.s || (a.ex.id < b.ex.id ? -1 : 1));
        chosen.push(scored[0].ex); usedIds.add(scored[0].ex.id);
      }
      if (!chosen.length) { warnings.push(`${GROUPS[g].name} : aucun exercice réalisable avec le matériel de « ${activeGym(state).name} ». Ajoutez une machine pour ce muscle ou changez de salle.`); return; }
      const split = splitSets(dose, chosen.length);
      chosen.forEach((ex, i) => {
        const n = clamp(split[i], 2, 5);
        planned.push({ ex, g, n });
        Object.keys(ex.gw).forEach(o => { if (o !== g) indirect[o] = (indirect[o] || 0) + n * ex.gw[o]; });
        info.planned += n;
      });
    });

    if (!planned.length) {
      return { error: 'Aucune série à programmer : les groupes choisis ont déjà leur volume de la semaine ou ne sont pas récupérés.', groupInfo, warnings, ready, alternatives: suggestGroups(state, now, ck, 3) };
    }

    // ---- 4. Ordre optimal --------------------------------------------------
    const lagging = new Set(groups.filter(g => groupInfo[g].done < groupInfo[g].target.min));
    planned.sort((a, b) => {
      const k = x => {
        let v = 0;
        if (GROUPS[x.g].region === 'core') v += 100;
        if (x.ex.type === 'isolation') v += 40;
        if (GROUPS[x.g].size === 'small') v += 20;
        if (lagging.has(x.g)) v -= 10;
        if (x.ex.eq === 'barbell') v -= 3;
        return v + GROUPS[x.g].order * 0.1;
      };
      return k(a) - k(b);
    });

    // ---- 5. Prescriptions ----------------------------------------------------
    let firstCompound = true;
    const exercises = planned.map(({ ex, g, n }) => {
      const sc = scheme(state, ex, ready);
      const pr = progression(state, ex, { now, reps: sc.reps, rir: sc.rir, ready });
      const sets = [];
      for (let i = 0; i < n; i++) {
        const last = i === n - 1;
        sets.push({ targetReps: pr.reps, targetRir: ex.type === 'isolation' && last && sc.rir > 0 && ready.level !== 'verylow' ? sc.rir - 1 : sc.rir, load: pr.load, reps: '', rir: '', done: false });
      }
      let warmup = null;
      if (ex.type === 'compound' && firstCompound && ex.unit !== 'added') {
        firstCompound = false;
        const w1 = roundLoad(ex, pr.load * 0.5), w2 = roundLoad(ex, pr.load * 0.75);
        warmup = `Échauffement : ${loadStr(ex, w1)} × 10, puis ${loadStr(ex, w2)} × 5 (non comptées).`;
      }
      return { uid: uid(), exId: ex.id, group: g, repRange: sc.reps, rir: sc.rir, rest: sc.rest, tempo: sc.tempo,
        progression: { kind: pr.kind, why: pr.why }, warmup, sets };
    });

    const est = Math.round(6 + sum(exercises.map(e => e.sets.length * (e.rest + 40) / 60)));
    const titleGroups = groups.filter(g => groupInfo[g].planned > 0).map(g => GROUPS[g].name);
    if (ready.level !== 'unknown') notes.unshift(`Forme du jour : ${ready.score}/100 (${ready.label}). ${ready.advice}`);
    else notes.unshift(ready.advice);

    return {
      id: uid(), createdAt: now, auto: !!opts.auto,
      title: opts.title || titleGroups.join(' · '),
      muscles: opts.muscles.slice(), groups: groups, groupInfo, exercises, notes, warnings,
      ready, estMinutes: est
    };
  }

  // ---------------------------------------------------------------------------
  // Recommandation automatique
  // ---------------------------------------------------------------------------
  const TEMPLATES = [
    { id: 'push',  name: 'Poussée (pecs, épaules, triceps)', groups: ['chest', 'delt_front', 'delt_side', 'triceps'] },
    { id: 'pull',  name: 'Tirage (dos, arrière d\'épaule, biceps)', groups: ['back', 'delt_rear', 'biceps', 'traps'] },
    { id: 'upper', name: 'Haut du corps complet', groups: ['chest', 'back', 'delt_side', 'biceps', 'triceps'] },
    { id: 'arms',  name: 'Épaules & bras', groups: ['delt_side', 'delt_rear', 'biceps', 'triceps', 'forearms'] },
    { id: 'legs',  name: 'Jambes', groups: ['quads', 'hamstrings', 'glutes', 'calves'], legs: true }
  ];

  function need(state, now, ck) {
    const vol = rolling7(state, now).group, tg = targets(state), rec = recovery(state, now, ck);
    const p = state.profile || defaultProfile();
    const out = {};
    Object.keys(GROUPS).forEach(g => {
      const t = tg[g], W = vol[g] || 0, R = groupRecovery(rec, g);
      const mid = (t.min + t.max) / 2;
      let n = mid > 0 ? clamp((mid - W) / mid, -0.5, 1) : -1;
      let score = R < 40 ? -1 : n * (R / 100);
      if (p.priority === 'upper' && GROUPS[g].region === 'upper') score *= 1.15;
      if (GROUPS[g].region === 'legs' && p.noLegs) score = -2;
      out[g] = { done: W, target: t, recovery: R, need: n, score, status: groupStatus(W, t) };
    });
    return out;
  }

  function suggestGroups(state, now, ck, n) {
    const nd = need(state, now, ck);
    const imp = g => GROUPS[g].size === 'big' ? 1.4 : ['forearms', 'obliques', 'lower_back', 'delt_front', 'traps'].includes(g) ? 0.6 : 1;
    return Object.keys(nd).filter(g => nd[g].score > 0.05)
      .sort((a, b) => nd[b].score * imp(b) - nd[a].score * imp(a)).slice(0, n || 3)
      .map(g => Object.assign({ g, name: GROUPS[g].name }, nd[g]));
  }

  function recommend(state, now, ck) {
    now = now || Date.now();
    if (ck === undefined) ck = latestCheckin(state, now);
    const p = state.profile || defaultProfile();
    const nd = need(state, now, ck);
    const ready = readiness(ck);
    const lastW = (state.workouts || []).filter(w => w.finishedAt).sort((a, b) => b.finishedAt - a.finishedAt)[0];
    const res = TEMPLATES.filter(t => !(t.legs && p.noLegs)).map(t => {
      let score = 0;
      const parts = [];
      t.groups.forEach(g => {
        const x = nd[g];
        const w = GROUPS[g].size === 'big' ? 1.4 : 1;
        score += x.score * w;
        parts.push({ g, ...x });
      });
      if (lastW && lastW.template === t.id && now - lastW.finishedAt < 3 * DAY) score -= 0.6;
      return { template: t, score: round1(score), parts };
    }).sort((a, b) => b.score - a.score);
    const best = res[0];
    const groups = best.template.groups.filter(g => nd[g].score > -0.3 && nd[g].recovery >= 40);
    // Ajout des abdominaux si en retard et récupérés
    if (nd.abs.status === 'low' && nd.abs.recovery >= 70 && groups.indexOf('abs') < 0) groups.push('abs');
    const muscles = [];
    groups.forEach(g => GROUPS[g].muscles.forEach(m => muscles.push(m)));
    const reasons = best.parts.map(x => {
      const st = { low: 'en retard', near: 'presque à la cible', ok: 'dans la cible', over: 'au-delà de la cible', off: 'non programmé' }[x.status];
      return `${GROUPS[x.g].name} : ${f1(x.done)}/${x.target.min}-${x.target.max} séries (${st}), récupéré à ${x.recovery} %`;
    });
    let lightDay = null;
    if (ready.level === 'verylow') lightDay = "Votre bilan indique une fatigue marquée : une séance courte (≈30 min) ou du cardio doux sont plus pertinents qu'une séance lourde.";
    if (best.score <= 0) lightDay = "Tous les groupes sont soit à leur volume cible, soit encore en récupération : une journée de cardio léger ou de repos est la meilleure option.";
    return { template: best.template, score: best.score, groups, muscles, reasons, ranking: res, ready, lightDay };
  }

  // ---------------------------------------------------------------------------
  // Bilan de séance et comparaison
  // ---------------------------------------------------------------------------
  function workoutStats(w, bw) {
    let sets = 0, reps = 0, tonnage = 0;
    const groups = {};
    (w.exercises || []).forEach(e => {
      const ex = EXERCISES[e.exId]; if (!ex) return;
      (e.sets || []).filter(isWorkSet).forEach(s => {
        sets++; reps += +s.reps;
        tonnage += effLoad(ex, +s.load || 0, w.bodyweight || bw || 80) * s.reps;
        Object.keys(ex.gw).forEach(g => groups[g] = (groups[g] || 0) + ex.gw[g]);
      });
    });
    const dur = w.finishedAt && w.startedAt ? Math.round((w.finishedAt - w.startedAt) / 60000) : 0;
    return { sets, reps, tonnage: Math.round(tonnage), minutes: dur, groups };
  }

  function similarPrevious(state, w) {
    const gs1 = workoutStats(w).groups;
    const g1 = new Set(Object.keys(gs1).filter(g => gs1[g] >= 1));
    const ref = w.finishedAt || Date.now();
    let best = null, bestJ = 0;
    (state.workouts || []).filter(o => o.id !== w.id && o.finishedAt && o.finishedAt < ref && ref - o.finishedAt < 45 * DAY)
      .sort((a, b) => b.finishedAt - a.finishedAt).forEach(o => {
        const gs = workoutStats(o).groups;
        const g2 = new Set(Object.keys(gs).filter(g => gs[g] >= 1));
        const inter = [...g1].filter(x => g2.has(x)).length;
        const uni = new Set([...g1, ...g2]).size;
        const j = uni ? inter / uni : 0;
        if (j >= 0.5 && j > bestJ + 0.05) { best = o; bestJ = j; }
      });
    return best;
  }

  function compareWorkouts(state, w) {
    const prev = similarPrevious(state, w);
    if (!prev) return null;
    const bw = currentWeight(state);
    const a = workoutStats(w, bw), b = workoutStats(prev, bw);
    const exDeltas = [];
    (w.exercises || []).forEach(e => {
      const ex = EXERCISES[e.exId]; if (!ex) return;
      const pe = (prev.exercises || []).find(x => x.exId === e.exId);
      if (!pe) return;
      const cur = Math.max(0, ...e.sets.filter(isWorkSet).map(s => e1rm(effLoad(ex, +s.load, w.bodyweight || bw), +s.reps, s.rir === '' ? null : +s.rir)));
      const old = Math.max(0, ...pe.sets.filter(isWorkSet).map(s => e1rm(effLoad(ex, +s.load, prev.bodyweight || bw), +s.reps, s.rir === '' ? null : +s.rir)));
      if (cur && old) exDeltas.push({ exId: e.exId, name: ex.name, cur: round1(cur), old: round1(old), pct: round1((cur - old) / old * 100) });
    });
    return { prev, a, b, exDeltas };
  }

  // ---------------------------------------------------------------------------
  // Remplacement d'exercice
  // ---------------------------------------------------------------------------
  function alternatives(state, exId, opts) {
    const ex = EXERCISES[exId];
    opts = opts || {};
    const avoid = new Set(opts.avoidMuscles || []);
    return EXERCISE_LIST.filter(o => o.id !== exId && o.primaryGroup === ex.primaryGroup && equipmentOk(state, o) &&
        !Object.keys(o.m).some(m => o.m[m] >= 0.5 && avoid.has(m)) && !(opts.exclude || []).includes(o.id))
      .map(o => ({ ex: o, sim: similarity(ex, o) }))
      .sort((a, b) => b.sim - a.sim)
      .map(x => x.ex);
  }

  // ---------------------------------------------------------------------------
  // Énergie : musculation et cardio
  // ---------------------------------------------------------------------------
  const CARDIO = {
    incline_walk: { name: 'Marche inclinée sur tapis', met: { light: 4.5, moderate: 6, vigorous: 8 }, impact: 'faible', hiit: false },
    bike:         { name: 'Vélo', met: { light: 5, moderate: 7, vigorous: 9.5 }, impact: 'faible', hiit: false },
    elliptical:   { name: 'Elliptique', met: { light: 5, moderate: 6.5, vigorous: 8.5 }, impact: 'faible', hiit: false },
    run:          { name: 'Course', met: { light: 8, moderate: 10, vigorous: 12 }, impact: 'élevé', hiit: false },
    hiit:         { name: 'Cardio fractionné', met: { light: 7, moderate: 9, vigorous: 11 }, impact: 'moyen', hiit: true }
  };
  const INTENSITY = { light: 'Légère', moderate: 'Modérée', vigorous: 'Soutenue' };

  function cardioKcal(type, intensityKey, minutes, kg) {
    const c = CARDIO[type]; if (!c) return 0;
    return Math.round(c.met[intensityKey] * kg * minutes / 60);
  }
  function strengthKcal(minutes, kg) { return Math.round(5 * kg * minutes / 60); }

  function cardioPlan(state, now, prefs) {
    now = now || Date.now();
    const kg = currentWeight(state);
    const ck = latestCheckin(state, now);
    const ready = readiness(ck);
    const plan = Object.assign({ type: 'incline_walk', intensity: 'moderate', minutes: 30, perWeek: 3, weeklyKcal: 1200 }, prefs || {});
    const per = cardioKcal(plan.type, plan.intensity, plan.minutes, kg);
    const weekly = per * plan.perWeek;
    const needMin = Math.ceil(plan.weeklyKcal / Math.max(1, cardioKcal(plan.type, plan.intensity, 1, kg) * plan.perWeek));
    const advice = [];
    if (plan.type === 'hiit' || plan.type === 'run') {
      if (plan.perWeek > 2 && plan.type === 'hiit') advice.push('Limitez le fractionné à 2 séances par semaine : au-delà, il pèse sur la récupération de la musculation.');
      if (ready.level === 'low' || ready.level === 'verylow') advice.push('Forme du jour basse : remplacez le fractionné par de la marche inclinée ou du vélo léger aujourd\'hui.');
    }
    advice.push('Placez le cardio après la musculation ou un jour sans séance, pas juste avant : vous gardez votre énergie pour les charges.');
    if ((state.profile || {}).noLegs) advice.push('Comme vous ne faites pas de musculation des jambes, le cardio n\'interfère pas avec la récupération du bas du corps : 3 à 5 séances par semaine sont tout à fait gérables.');
    if (plan.weeklyKcal) advice.push(weekly >= plan.weeklyKcal ? `Ce plan couvre votre objectif indicatif (${weekly} kcal estimées / ${plan.weeklyKcal} kcal).` :
      `Pour atteindre ~${plan.weeklyKcal} kcal/semaine avec ce choix, il faudrait ~${needMin} min par séance (ou une séance de plus).`);
    // Séances cardio de la semaine
    const ws = weekStart(now);
    const logs = (state.cardioLogs || []).filter(c => c.date >= ws && c.date <= now);
    const doneKcal = sum(logs.map(c => c.kcal || 0));
    return { plan, perSession: per, weekly, needMin, advice, ready, done: { count: logs.length, minutes: sum(logs.map(l => +l.minutes || 0)), kcal: doneKcal } };
  }

  // ---------------------------------------------------------------------------
  // Nutrition (estimations, sans promesse)
  // ---------------------------------------------------------------------------
  function weightTrend(state, now) {
    const logs = (state.bodyLogs || []).filter(l => l.weight).sort((a, b) => a.date - b.date);
    if (logs.length < 2) return null;
    const avg = (from, to) => { const x = logs.filter(l => l.date > from && l.date <= to).map(l => +l.weight); return x.length ? mean(x) : null; };
    const cur = avg(now - 7 * DAY, now), prev = avg(now - 14 * DAY, now - 7 * DAY);
    if (cur == null || prev == null) return { cur, prev: null, perWeek: null };
    return { cur: round1(cur), prev: round1(prev), perWeek: round1(cur - prev), pct: round1((cur - prev) / prev * 100) };
  }

  function nutrition(state, now) {
    now = now || Date.now();
    const p = state.profile || defaultProfile();
    const kg = currentWeight(state);
    const bmr = Math.round(10 * kg + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5));
    const steps = +p.steps || 4000;
    const neat = steps < 5000 ? 1.25 : steps < 7500 ? 1.35 : steps < 10000 ? 1.45 : 1.55;
    // Dépense liée au sport : réelle si ≥ 1 semaine de données, sinon estimée depuis la fréquence
    const from = now - 14 * DAY;
    const ws = workoutsBetween(state, from, now);
    const cardio = (state.cardioLogs || []).filter(c => c.date >= from && c.date <= now);
    let exerciseKcal, source;
    const span = ws.length || cardio.length;
    if (span >= 2) {
      exerciseKcal = Math.round((sum(ws.map(w => strengthKcal(workoutStats(w).minutes || 55, kg))) + sum(cardio.map(c => c.kcal || 0))) / 14);
      source = 'vos séances des 14 derniers jours';
    } else {
      exerciseKcal = Math.round(((p.freqMin + p.freqMax) / 2) * strengthKcal(p.sessionMinutes || 60, kg) / 7);
      source = 'votre fréquence prévue';
    }
    const tdee = Math.round(bmr * neat + exerciseKcal);
    let deficit = Math.min(500, Math.round(tdee * 0.18));
    const trend = weightTrend(state, now);
    let adjust = null;
    if (trend && trend.pct != null) {
      if (trend.pct > -0.2) adjust = { kcal: -150, text: `Moyenne hebdo stable (${trend.pct > 0 ? '+' : ''}${fmtKg(trend.pct)} %) : si vous avez bien suivi l'apport, réduisez d'environ 150 kcal.` };
      else if (trend.pct < -1) adjust = { kcal: +150, text: `Baisse rapide (${fmtKg(trend.pct)} %/sem.) : remontez d'environ 150 kcal pour préserver la masse musculaire et la performance.` };
      else adjust = { kcal: 0, text: `Rythme de ${fmtKg(trend.pct)} %/semaine : dans la zone recommandée (−0,3 à −1 %), on garde le cap.` };
    }
    const target = Math.max(bmr, tdee - deficit + (adjust ? adjust.kcal : 0));
    const protein = Math.round(2 * kg);
    const fat = Math.round(0.8 * kg);
    const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
    return { bmr, neat, exerciseKcal, source, tdee, deficit: tdee - target, target, protein, fat, carbs, trend, adjust, kg };
  }

  // ---------------------------------------------------------------------------
  // Synthèse hebdomadaire (tableau de bord)
  // ---------------------------------------------------------------------------
  function weekSummary(state, now) {
    now = now || Date.now();
    const ws = weekStart(now);
    const kg = currentWeight(state);
    const cur = workoutsBetween(state, ws, now);
    const prev = workoutsBetween(state, ws - 7 * DAY, ws - 1);
    const st = cur.map(w => workoutStats(w, kg));
    const pst = prev.map(w => workoutStats(w, kg));
    const cardio = (state.cardioLogs || []).filter(c => c.date >= ws && c.date <= now);
    const minutes = sum(st.map(s => s.minutes)) + sum(cardio.map(c => +c.minutes || 0));
    const kcal = sum(st.map(s => strengthKcal(s.minutes, kg))) + sum(cardio.map(c => c.kcal || 0));
    return {
      sessions: cur.length, prevSessions: prev.length,
      sets: sum(st.map(s => s.sets)), tonnage: sum(st.map(s => s.tonnage)), prevTonnage: sum(pst.map(s => s.tonnage)),
      minutes, kcal, cardioCount: cardio.length, cardioMinutes: sum(cardio.map(c => +c.minutes || 0))
    };
  }

  // Exercices principaux : évolution de l'e1RM sur 4 semaines
  function liftTrends(state, now, n) {
    now = now || Date.now();
    const bw = currentWeight(state);
    const counts = {};
    workoutsBetween(state, now - 42 * DAY, now).forEach(w => w.exercises.forEach(e => counts[e.exId] = (counts[e.exId] || 0) + 1));
    return Object.keys(counts).filter(id => counts[id] >= 2 && EXERCISES[id])
      .sort((a, b) => counts[b] - counts[a] || (EXERCISES[a].type === 'compound' ? -1 : 1))
      .slice(0, n || 4)
      .map(id => {
        const ex = EXERCISES[id];
        const h = performances(state, id, now + 1).filter(p => p.date >= now - 42 * DAY);
        const pts = h.map(p => ({ date: p.date, v: round1(bestE1rm(ex, p, p.bw || bw)) })).reverse();
        const first = pts[0].v, last = pts[pts.length - 1].v;
        return { exId: id, name: ex.name, points: pts, first, last, pct: first ? round1((last - first) / first * 100) : 0 };
      });
  }

  // ---------------------------------------------------------------------------
  // COACH : réponses fondées sur l'historique réel
  // ---------------------------------------------------------------------------
  const ALIASES = [
    { re: /haut des pec|pecs? haut|pectoraux? sup|incline/, groups: ['chest'], muscles: ['pec_upper'] },
    { re: /bas des pec|pecs? bas/, groups: ['chest'], muscles: ['pec_lower'] },
    { re: /pec|poitrine|pectora/, groups: ['chest'] },
    { re: /dorsa|grand dorsal|\bdos\b|rhombo/, groups: ['back'] },
    { re: /trap[eè]z|trapez/, groups: ['traps'] },
    { re: /epaule|deltoid|delto/, groups: ['delt_front', 'delt_side', 'delt_rear'] },
    { re: /biceps/, groups: ['biceps'] },
    { re: /triceps/, groups: ['triceps'] },
    { re: /avant[- ]bras/, groups: ['forearms'] },
    { re: /abdo/, groups: ['abs'] },
    { re: /oblique/, groups: ['obliques'] },
    { re: /lombaire/, groups: ['lower_back'] },
    { re: /quadri|cuisse/, groups: ['quads'] },
    { re: /ischio/, groups: ['hamstrings'] },
    { re: /fessier/, groups: ['glutes'] },
    { re: /mollet/, groups: ['calves'] },
    { re: /jambe/, groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { re: /\bbras\b/, groups: ['biceps', 'triceps'] }
  ];

  function findGroups(q) {
    const n = norm(q);
    for (const a of ALIASES) if (a.re.test(n)) return a.groups;
    return null;
  }

  function findExercise(state, q) {
    const n = norm(q);
    let best = null, bestScore = 0;
    EXERCISE_LIST.forEach(ex => {
      const words = norm(ex.name).split(/\s+/).filter(w => w.length > 2);
      const hit = words.filter(w => n.indexOf(w) >= 0).length;
      if (!hit) return;
      let score = hit / words.length + hit * 0.2;
      if (performances(state, ex.id).length) score += 0.5;
      if (score > bestScore) { best = ex; bestScore = score; }
    });
    if (!best && /couche|bench/.test(n)) best = EXERCISES.bench_bb;
    if (!best && /traction/.test(n)) best = EXERCISES.pullup;
    if (!best && /militaire/.test(n)) best = EXERCISES.ohp_bb;
    return bestScore >= 0.5 || best ? best : null;
  }

  function answer(state, q, now) {
    now = now || Date.now();
    const n = norm(q);
    const ck = latestCheckin(state, now);
    const nd = need(state, now, ck);
    const groups = findGroups(q);
    const nWorkouts = (state.workouts || []).filter(w => w.finishedAt).length;
    const noData = nWorkouts === 0 ? " (aucune séance enregistrée pour l'instant : mes réponses s'affineront avec votre historique)" : '';
    const fmtG = g => `${GROUPS[g].name} : ${f1(nd[g].done)} séries (cible ${nd[g].target.min}-${nd[g].target.max}), récupéré à ${nd[g].recovery} %`;

    // Récupération
    if (/recupere|recuperation|recuper|pret|fatigu/.test(n) && groups) {
      const lines = groups.map(g => {
        const r = nd[g].recovery, lab = recoveryLabel(r);
        const last = lastTrained(state, g, now);
        return `${GROUPS[g].name} : ${lab.text.toLowerCase()} (${r} %)` + (last ? `, dernière sollicitation directe il y a ${fmtAgo(now - last)}` : '');
      });
      const minR = Math.min.apply(null, groups.map(g => nd[g].recovery));
      const verdict = minR >= 80 ? 'Vous pouvez les entraîner normalement.' : minR >= 55 ? 'Entraînement possible avec un volume réduit (−30 %).' : 'Mieux vaut attendre 24 à 48 h ou cibler un autre groupe.';
      return { text: lines.join('\n') + '\n' + verdict + (ck ? '' : '\nAstuce : renseignez le bilan du jour, vos courbatures affinent ce calcul.'), kind: 'recovery' };
    }
    // Combien de séries
    if (/combien|nombre/.test(n) && /serie/.test(n)) {
      const gs = groups || Object.keys(GROUPS).filter(g => GROUPS[g].region !== 'legs');
      const cw = calendarWeek(state, now).group;
      const lines = gs.map(g => `${GROUPS[g].name} : ${f1(nd[g].done)} séries sur 7 jours glissants, ${f1(cw[g])} depuis lundi (cible ${nd[g].target.min}-${nd[g].target.max})`);
      return { text: lines.join('\n') + '\nLes séries indirectes sont pondérées (une série de développé compte 0,5 pour les triceps).' + noData, kind: 'volume' };
    }
    // Augmenter les charges
    if (/augment|monter|charge|progresser en charge/.test(n) && /charge|poids|augment/.test(n) && !/progresse.*(au|a la|sur)/.test(n)) {
      const ids = Array.from(new Set((state.workouts || []).filter(w => w.finishedAt && now - w.finishedAt < 21 * DAY).flatMap(w => w.exercises.map(e => e.exId))));
      if (!ids.length) return { text: "Aucune séance récente : je ne peux pas encore juger. Après 1 à 2 séances sur un exercice, je vous dirai précisément quand augmenter." , kind: 'load' };
      const ready = readiness(ck);
      const up = [], hold = [], down = [];
      ids.forEach(id => {
        const ex = EXERCISES[id]; if (!ex) return;
        const sc = scheme(state, ex, ready);
        const pr = progression(state, ex, { now, reps: sc.reps, rir: sc.rir, ready });
        const line = `${ex.name} → ${loadStr(ex, pr.load)} × ${pr.reps}`;
        (pr.kind === 'increase' ? up : pr.kind === 'reduce' ? down : hold).push(line);
      });
      let t = '';
      if (up.length) t += `À augmenter (toutes les séries au haut de la fourchette avec marge) :\n• ${up.join('\n• ')}\n`;
      if (hold.length) t += `À maintenir pour gagner des répétitions :\n• ${hold.join('\n• ')}\n`;
      if (down.length) t += `À alléger (baisse de performance ou longue pause) :\n• ${down.join('\n• ')}\n`;
      return { text: t.trim(), kind: 'load' };
    }
    // Progression sur un exercice
    if (/progress|evolu|stagn/.test(n)) {
      const ex = findExercise(state, q);
      if (ex) {
        const h = performances(state, ex.id, now + 1);
        if (!h.length) return { text: `Pas encore de données sur « ${ex.name} ». Faites-le au moins deux fois pour suivre votre progression.`, kind: 'progress' };
        const bw = currentWeight(state);
        const pts = h.slice(0, 6).reverse().map(p => ({ d: p.date, v: bestE1rm(ex, p, p.bw || bw), p }));
        const first = pts[0], last = pts[pts.length - 1];
        const pct = first.v ? (last.v - first.v) / first.v * 100 : 0;
        const desc = pts.map(x => `${fmtDate(x.d)} : ${x.p.sets.length}×${x.p.sets.map(s => s.reps).join('/')} à ${loadStr(ex, Math.max(...x.p.sets.map(s => s.load)))}`).join('\n');
        let verdict;
        if (pts.length < 2) verdict = 'Une seule séance enregistrée : revenez après la prochaine.';
        else if (pct > 2) verdict = `Oui : force estimée (1RM) +${fmtKg(round1(pct))} % sur ${pts.length} séances (${Math.round(first.v)} → ${Math.round(last.v)} kg).`;
        else if (pct >= -2) verdict = `Stable (${pct >= 0 ? '+' : ''}${fmtKg(round1(pct))} %). Si cela dure 3 séances de plus, variez la fourchette de répétitions ou l'exercice, et vérifiez sommeil et apport en protéines.`;
        else verdict = `En baisse (${fmtKg(round1(pct))} %). Probable fatigue ou déficit calorique marqué : une semaine plus légère peut relancer la progression.`;
        return { text: `${ex.name}\n${desc}\n${verdict}`, kind: 'progress', exId: ex.id };
      }
    }
    // En retard
    if (/retard|neglig|oubli|sous[- ]?entrain|manque/.test(n)) {
      const lag = Object.keys(nd).filter(g => (nd[g].status === 'low' || nd[g].status === 'near') && !(GROUPS[g].region === 'legs' && (state.profile || {}).noLegs))
        .sort((a, b) => nd[a].done / Math.max(1, nd[a].target.min) - nd[b].done / Math.max(1, nd[b].target.min));
      const over = Object.keys(nd).filter(g => nd[g].status === 'over');
      let t = lag.length ? `Groupes en retard sur 7 jours :\n• ${lag.map(fmtG).join('\n• ')}` : 'Aucun groupe en retard : tous les groupes programmés sont dans leur fourchette.';
      if (over.length) t += `\nAu-delà de la cible : ${over.map(g => GROUPS[g].name).join(', ')}.`;
      return { text: t + noData, kind: 'lagging', groups: lag };
    }
    // Quel muscle / quelle séance aujourd'hui
    if (/(quel|quoi).*(muscle|groupe|travailler|seance|faire|entrain)|aujourd|pertinent/.test(n)) {
      const r = recommend(state, now, ck);
      if (/seance|pertinent|faire/.test(n) || !/muscle|groupe/.test(n)) {
        return { text: (r.lightDay ? r.lightDay + '\n' : '') + `Séance la plus pertinente : ${r.template.name}.\n• ${r.reasons.join('\n• ')}`, kind: 'recommend', muscles: r.muscles };
      }
      const top = suggestGroups(state, now, ck, 3);
      if (!top.length) return { text: 'Tous vos groupes sont à leur volume cible ou en récupération : cardio léger ou repos aujourd\'hui.', kind: 'recommend' };
      return { text: `À travailler en priorité aujourd'hui :\n• ${top.map(x => fmtG(x.g)).join('\n• ')}`, kind: 'recommend', muscles: top.flatMap(x => GROUPS[x.g].muscles) };
    }
    // Volume d'un groupe nommé
    if (groups) {
      return { text: groups.map(fmtG).join('\n') + noData, kind: 'volume' };
    }
    // Nutrition
    if (/calor|manger|proteine|glucide|lipide|nutrition|deficit/.test(n)) {
      const nu = nutrition(state, now);
      return { text: `Besoins estimés : ~${nu.tdee} kcal/jour (métabolisme de base ${nu.bmr} kcal, activité calculée d'après ${nu.source}).\nCible pour la recomposition : ~${nu.target} kcal (déficit ~${nu.deficit} kcal), protéines ${nu.protein} g, lipides ${nu.fat} g, glucides ${nu.carbs} g.` + (nu.adjust ? '\n' + nu.adjust.text : '') + '\nCe sont des estimations : ajustez selon la moyenne hebdomadaire de votre poids et votre tour de taille.', kind: 'nutrition' };
    }
    // Poids
    if (/poids|maigri|grossi|balance/.test(n)) {
      const tr = weightTrend(state, now);
      if (!tr || tr.perWeek == null) return { text: 'Pesez-vous 3 à 4 matins par semaine, à jeun : la moyenne sur 7 jours est bien plus fiable qu\'une pesée isolée.', kind: 'weight' };
      return { text: `Moyenne des 7 derniers jours : ${fmtKg(tr.cur)} kg, contre ${fmtKg(tr.prev)} kg la semaine précédente (${tr.perWeek > 0 ? '+' : ''}${fmtKg(tr.perWeek)} kg). Le poids varie avec l'eau, le sel et les glucides : suivez aussi le tour de taille pour juger la perte de graisse.`, kind: 'weight' };
    }
    return null; // inconnu → l'interface peut interroger Claude ou afficher l'aide
  }

  function lastTrained(state, g, now) {
    let last = null;
    (state.workouts || []).filter(w => w.finishedAt && w.finishedAt <= now).forEach(w => {
      if (w.exercises.some(e => EXERCISES[e.exId] && EXERCISES[e.exId].gw[g] === 1 && e.sets.some(isWorkSet))) last = Math.max(last || 0, w.finishedAt);
    });
    return last;
  }

  function fmtAgo(ms) {
    const h = Math.round(ms / H);
    if (h < 36) return `${h} h`;
    return `${Math.round(h / 24)} jours`;
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // Résumé compact de l'état pour une question libre posée à Claude
  function contextSummary(state, now) {
    now = now || Date.now();
    const p = state.profile;
    const ck = latestCheckin(state, now);
    const nd = need(state, now, ck);
    const wk = weekSummary(state, now);
    const lifts = liftTrends(state, now, 5);
    const nu = nutrition(state, now);
    return [
      `Profil : ${p.age} ans, ${p.height} cm, ${currentWeight(state)} kg (objectif ${p.targetWeight} kg), niveau ${p.level}, ${p.steps} pas/j, ${p.freqMin}-${p.freqMax} séances/sem, objectif : ${p.goalText}. Priorité haut du corps. ${p.noLegs ? 'Ne programme pas les jambes.' : ''}`,
      `Semaine en cours : ${wk.sessions} séances, ${wk.sets} séries, ${wk.tonnage} kg de tonnage, ${wk.minutes} min.`,
      'Volume 7 j / cible / récupération : ' + Object.keys(nd).filter(g => nd[g].target.max > 0).map(g => `${GROUPS[g].name} ${f1(nd[g].done)}/${nd[g].target.min}-${nd[g].target.max}/${nd[g].recovery}%`).join('; '),
      'Tendances (1RM estimé, 6 sem.) : ' + (lifts.map(l => `${l.name} ${l.first}→${l.last} kg`).join('; ') || 'pas assez de données'),
      `Bilan du jour : ${ck ? `sommeil ${ck.sleep}/5, énergie ${ck.energy}/5, fatigue ${ck.fatigue}/5, courbatures ${ck.soreness}/5, motivation ${ck.motivation}/5` : 'non renseigné'}.`,
      `Nutrition estimée : TDEE ${nu.tdee} kcal, cible ${nu.target} kcal, protéines ${nu.protein} g.`
    ].join('\n');
  }

  // ---------------------------------------------------------------------------
  // Données d'exemple (marquées demo:true, supprimables d'un clic)
  // ---------------------------------------------------------------------------
  function demoData(now) {
    now = now || Date.now();
    const at = (daysAgo, hour) => { const d = new Date(now - daysAgo * DAY); d.setHours(hour, 0, 0, 0); return d.getTime(); };
    const W = [];
    const mk = (daysAgo, template, list) => {
      const fin = at(daysAgo, 19);
      const w = { id: 'demo_' + daysAgo, demo: true, template, title: { push: 'Poussée', pull: 'Tirage', upper: 'Haut du corps' }[template],
        startedAt: fin - 62 * 60000, finishedAt: fin, bodyweight: 88 + daysAgo * 0.07, exercises: [] };
      list.forEach(([exId, load, reps, rir]) => {
        w.exercises.push({ uid: uid(), exId, sets: reps.map(r => ({ load, reps: r, rir: rir, done: true, targetReps: r, targetRir: rir })) });
      });
      W.push(w);
    };
    // 3 semaines : poussée / tirage / haut du corps, progression réaliste
    mk(20, 'push', [['bench_bb', 57.5, [10, 9, 9, 8], 2], ['incline_db', 22, [11, 10, 10], 2], ['lateral_raise_db', 8, [15, 14, 13], 1], ['pushdown', 30, [12, 12, 11], 1]]);
    mk(18, 'pull', [['lat_pulldown', 55, [11, 10, 10], 2], ['seated_row', 55, [12, 11, 10], 2], ['face_pull', 20, [15, 15], 1], ['db_curl', 12, [11, 10], 1]]);
    mk(15, 'upper', [['incline_db', 22, [12, 11, 11], 2], ['db_row', 30, [12, 11, 11], 2], ['ohp_db', 18, [10, 9, 9], 2], ['cable_curl', 25, [12, 11], 1], ['overhead_cable_ext', 22.5, [12, 12], 1]]);
    mk(13, 'push', [['bench_bb', 57.5, [10, 10, 10, 9], 2], ['incline_db', 22, [12, 12, 11], 2], ['lateral_raise_db', 8, [16, 15, 14], 1], ['pushdown', 30, [13, 12, 12], 1]]);
    mk(11, 'pull', [['lat_pulldown', 55, [12, 12, 11], 2], ['seated_row', 55, [12, 12, 12], 2], ['face_pull', 20, [16, 15], 1], ['db_curl', 12, [12, 11], 1]]);
    mk(8, 'upper', [['incline_db', 24, [10, 10, 9], 2], ['db_row', 32, [11, 10, 10], 2], ['ohp_db', 18, [11, 10, 10], 2], ['cable_curl', 25, [13, 12], 1], ['overhead_cable_ext', 22.5, [13, 12], 1]]);
    // Semaine courante : beaucoup de pecs, peu de biceps (cas d'école)
    mk(5, 'push', [['bench_bb', 57.5, [10, 10, 10, 10], 2], ['incline_db', 24, [11, 10, 10], 2], ['cable_fly', 12.5, [14, 13], 1], ['lateral_raise_db', 9, [14, 13, 12], 1], ['pushdown', 32.5, [12, 11], 1]]);
    mk(3, 'pull', [['lat_pulldown', 60, [10, 10, 9], 2], ['seated_row', 60, [10, 10, 9], 2], ['face_pull', 22.5, [14, 13], 1]]);
    mk(1, 'push', [['chest_press_machine', 60, [12, 11, 10], 1], ['pec_deck', 40, [14, 13], 1], ['lateral_raise_db', 9, [15, 14], 1]]);

    const bodyLogs = [];
    [27, 24, 21, 19, 17, 14, 12, 10, 7, 5, 3, 1].forEach((d, i) => {
      const base = 89.6 - i * 0.14 + (i % 3 === 0 ? 0.35 : i % 3 === 1 ? -0.15 : 0.05);
      bodyLogs.push({ id: 'demo_b' + d, demo: true, date: at(d, 7), weight: round1(base),
        waist: d % 7 === 0 || d === 27 ? round1(98 - i * 0.18) : null, chest: d === 27 || d === 7 ? (d === 27 ? 108 : 108.5) : null,
        arm: d === 27 || d === 7 ? (d === 27 ? 37 : 37.3) : null, shoulders: d === 27 || d === 7 ? (d === 27 ? 122 : 122.5) : null });
    });
    const cardioLogs = [
      { id: 'demo_c1', demo: true, date: at(9, 18), type: 'incline_walk', intensity: 'moderate', minutes: 30, kcal: cardioKcal('incline_walk', 'moderate', 30, 88) },
      { id: 'demo_c2', demo: true, date: at(6, 18), type: 'bike', intensity: 'moderate', minutes: 25, kcal: cardioKcal('bike', 'moderate', 25, 88) },
      { id: 'demo_c3', demo: true, date: at(2, 18), type: 'incline_walk', intensity: 'moderate', minutes: 35, kcal: cardioKcal('incline_walk', 'moderate', 35, 88) }
    ];
    const nutritionLogs = [3, 2, 1].map(d => ({ id: 'demo_n' + d, demo: true, date: at(d, 21), kcal: 2350 - d * 40, protein: 165 + d * 3, carbs: 230, fat: 75 }));
    return { workouts: W, bodyLogs, cardioLogs, nutritionLogs };
  }

  let _c = 0;
  function uid() { return Date.now().toString(36) + (_c++).toString(36) + Math.random().toString(36).slice(2, 6); }

  root.FORGE_ENGINE = {
    DAY, H, defaultProfile, targets, groupStatus, rolling7, calendarWeek, setsInWindow, weekStart,
    readiness, latestCheckin, recovery, groupRecovery, recoveryLabel, painContext,
    e1rm, effLoad, performances, progression, roundLoad, loadStr, currentWeight, scheme,
    generate, recommend, need, suggestGroups, TEMPLATES,
    workoutStats, compareWorkouts, alternatives, similarity,
    CARDIO, INTENSITY, cardioKcal, strengthKcal, cardioPlan,
    nutrition, weightTrend, weekSummary, liftTrends,
    GYM_PRESETS, makeGym, ensureGyms, activeGym, itemState, exAvailable, exPreferred, itemsForGroups, availableCount,
    answer, contextSummary, demoData, uid, fmtKg, norm, isWorkSet, bestE1rm
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FORGE_ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
