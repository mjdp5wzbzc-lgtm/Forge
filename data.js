/* ==========================================================================
   Forge — référentiel : muscles, groupes de volume, bibliothèque d'exercices
   Chargé tel quel dans le navigateur et dans Node (tests).
   ========================================================================== */
(function (root) {
  'use strict';

  // ---- Muscles (ce que l'on sélectionne sur la silhouette) ----------------
  // tau = constante de récupération (heures) ; cap = séries « dures » qui
  // amènent la récupération à ~0 % juste après la séance.
  const MUSCLES = {
    pec_upper:  { name: 'Haut des pectoraux',   short: 'Pecs hauts',   group: 'chest',      region: 'upper', tau: 40, cap: 9 },
    pec_mid:    { name: 'Milieu des pectoraux', short: 'Pecs milieu',  group: 'chest',      region: 'upper', tau: 40, cap: 9 },
    pec_lower:  { name: 'Bas des pectoraux',    short: 'Pecs bas',     group: 'chest',      region: 'upper', tau: 40, cap: 9 },
    lats:       { name: 'Grand dorsal',         short: 'Dorsaux',      group: 'back',       region: 'upper', tau: 40, cap: 9 },
    rhomboids:  { name: 'Rhomboïdes',           short: 'Rhomboïdes',   group: 'back',       region: 'upper', tau: 36, cap: 9 },
    traps:      { name: 'Trapèzes',             short: 'Trapèzes',     group: 'traps',      region: 'upper', tau: 30, cap: 7 },
    delt_front: { name: 'Deltoïdes antérieurs', short: 'Delt. ant.',   group: 'delt_front', region: 'upper', tau: 32, cap: 7 },
    delt_side:  { name: 'Deltoïdes latéraux',   short: 'Delt. lat.',   group: 'delt_side',  region: 'upper', tau: 30, cap: 8 },
    delt_rear:  { name: 'Deltoïdes postérieurs',short: 'Delt. post.',  group: 'delt_rear',  region: 'upper', tau: 30, cap: 8 },
    biceps:     { name: 'Biceps',               short: 'Biceps',       group: 'biceps',     region: 'upper', tau: 28, cap: 7 },
    triceps:    { name: 'Triceps',              short: 'Triceps',      group: 'triceps',    region: 'upper', tau: 28, cap: 7 },
    forearms:   { name: 'Avant-bras',           short: 'Avant-bras',   group: 'forearms',   region: 'upper', tau: 24, cap: 7 },
    abs:        { name: 'Abdominaux',           short: 'Abdos',        group: 'abs',        region: 'core',  tau: 24, cap: 8 },
    obliques:   { name: 'Obliques',             short: 'Obliques',     group: 'obliques',   region: 'core',  tau: 24, cap: 8 },
    lower_back: { name: 'Lombaires',            short: 'Lombaires',    group: 'lower_back', region: 'core',  tau: 40, cap: 6 },
    quads:      { name: 'Quadriceps',           short: 'Quadriceps',   group: 'quads',      region: 'legs',  tau: 48, cap: 9 },
    hamstrings: { name: 'Ischio-jambiers',      short: 'Ischios',      group: 'hamstrings', region: 'legs',  tau: 48, cap: 8 },
    glutes:     { name: 'Fessiers',             short: 'Fessiers',     group: 'glutes',     region: 'legs',  tau: 44, cap: 9 },
    calves:     { name: 'Mollets',              short: 'Mollets',      group: 'calves',     region: 'legs',  tau: 30, cap: 8 }
  };

  // ---- Groupes de volume (là où l'on compte les séries hebdo) ------------
  // min/max = fourchette hebdo indicative pour un pratiquant intermédiaire
  // (séries « dures » pondérées). size pilote le plafond par séance.
  const GROUPS = {
    chest:      { name: 'Pectoraux',             muscles: ['pec_upper', 'pec_mid', 'pec_lower'], min: 12, max: 16, size: 'big',   region: 'upper', order: 1 },
    back:       { name: 'Dos',                   muscles: ['lats', 'rhomboids'],                 min: 12, max: 18, size: 'big',   region: 'upper', order: 2 },
    delt_side:  { name: 'Épaules latérales',     muscles: ['delt_side'],                         min: 10, max: 16, size: 'small', region: 'upper', order: 4 },
    delt_front: { name: 'Épaules antérieures',   muscles: ['delt_front'],                        min: 4,  max: 10, size: 'small', region: 'upper', order: 3 },
    delt_rear:  { name: 'Épaules postérieures',  muscles: ['delt_rear'],                         min: 6,  max: 12, size: 'small', region: 'upper', order: 5 },
    traps:      { name: 'Trapèzes',              muscles: ['traps'],                             min: 4,  max: 10, size: 'small', region: 'upper', order: 6 },
    biceps:     { name: 'Biceps',                muscles: ['biceps'],                            min: 8,  max: 14, size: 'small', region: 'upper', order: 7 },
    triceps:    { name: 'Triceps',               muscles: ['triceps'],                           min: 8,  max: 14, size: 'small', region: 'upper', order: 8 },
    forearms:   { name: 'Avant-bras',            muscles: ['forearms'],                          min: 2,  max: 8,  size: 'small', region: 'upper', order: 9 },
    abs:        { name: 'Abdominaux',            muscles: ['abs'],                               min: 6,  max: 12, size: 'small', region: 'core',  order: 10 },
    obliques:   { name: 'Obliques',              muscles: ['obliques'],                          min: 2,  max: 8,  size: 'small', region: 'core',  order: 11 },
    lower_back: { name: 'Lombaires',             muscles: ['lower_back'],                        min: 0,  max: 6,  size: 'small', region: 'core',  order: 12 },
    quads:      { name: 'Quadriceps',            muscles: ['quads'],                             min: 8,  max: 14, size: 'big',   region: 'legs',  order: 13 },
    hamstrings: { name: 'Ischio-jambiers',       muscles: ['hamstrings'],                        min: 6,  max: 12, size: 'big',   region: 'legs',  order: 14 },
    glutes:     { name: 'Fessiers',              muscles: ['glutes'],                            min: 6,  max: 12, size: 'big',   region: 'legs',  order: 15 },
    calves:     { name: 'Mollets',               muscles: ['calves'],                            min: 6,  max: 12, size: 'small', region: 'legs',  order: 16 }
  };

  const EQUIPMENT = {
    barbell:    'Barre',
    dumbbell:   'Haltères',
    machine:    'Machine guidée',
    cable:      'Poulie',
    bodyweight: 'Poids du corps'
  };

  // ---- Bibliothèque ------------------------------------------------------
  // m      : sollicitation par muscle (1 = principal, 0.5 = secondaire, 0.25 = mineur)
  // reps   : fourchette ; sets : séries recommandées [min,max] ; rest : s
  // inc    : incrément de charge ; start : charge de travail ~10 reps en
  //          fraction du poids de corps (intermédiaire) ; unit : total|per_hand|added
  // bw     : part du poids de corps déplacée (exercices au poids du corps)
  // lvl    : 1 débutant ok, 2 intermédiaire, 3 avancé
  const X = [];
  function ex(o) { X.push(o); }

  // ---------------- PECTORAUX ----------------
  ex({ id: 'bench_bb', name: 'Développé couché barre', eq: 'barbell', type: 'compound', lvl: 1,
    m: { pec_mid: 1, pec_upper: 0.5, pec_lower: 0.5, delt_front: 0.5, triceps: 0.5 },
    reps: [6, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0.65, unit: 'total',
    desc: "Mouvement de poussée horizontale de référence pour la masse des pectoraux.",
    setup: "Allongé, yeux sous la barre, omoplates serrées et abaissées, pieds ancrés au sol, légère cambrure naturelle. Prise un peu plus large que les épaules.",
    exec: "Descendre la barre de façon contrôlée jusqu'au bas des pectoraux, coudes à ~45° du buste, puis pousser vers le haut et légèrement vers l'arrière.",
    mistakes: ["Rebondir la barre sur la poitrine", "Coudes ouverts à 90° (stress des épaules)", "Décoller les fessiers du banc"],
    variants: { deb: "Développé couché à la machine guidée (Smith)", int: "Développé couché barre classique", adv: "Développé couché avec pause de 1 s sur la poitrine" } });
  ex({ id: 'incline_bb', name: 'Développé incliné barre', eq: 'barbell', type: 'compound', lvl: 2,
    m: { pec_upper: 1, pec_mid: 0.5, delt_front: 0.5, triceps: 0.5 },
    reps: [6, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0.55, unit: 'total',
    desc: "Développé sur banc incliné à 30° pour cibler la portion claviculaire.",
    setup: "Banc à 30° (pas plus de 45°), omoplates rétractées, barre au-dessus des clavicules.",
    exec: "Descendre la barre vers le haut des pectoraux, avant-bras verticaux, puis pousser en gardant les omoplates plaquées.",
    mistakes: ["Banc trop incliné (devient un développé épaules)", "Perdre la rétraction des omoplates", "Trajectoire vers le cou"],
    variants: { deb: "Presse inclinée machine", int: "Développé incliné barre", adv: "Développé incliné tempo 4 s en descente" } });
  ex({ id: 'bench_db', name: 'Développé couché haltères', eq: 'dumbbell', type: 'compound', lvl: 1,
    m: { pec_mid: 1, pec_upper: 0.5, pec_lower: 0.5, delt_front: 0.5, triceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 120, inc: 2, start: 0.27, unit: 'per_hand',
    desc: "Amplitude plus grande que la barre et travail de stabilisation de chaque côté.",
    setup: "Haltères posés sur les cuisses, s'allonger en les ramenant à hauteur de poitrine, omoplates serrées.",
    exec: "Descendre jusqu'à un étirement confortable des pectoraux, coudes à ~45°, puis pousser en rapprochant légèrement les haltères.",
    mistakes: ["Descendre trop bas et forcer l'épaule", "Entrechoquer les haltères en haut", "Mouvement trop rapide en descente"],
    variants: { deb: "Pompes ou presse pectorale machine", int: "Développé couché haltères", adv: "Développé haltères avec pause en bas" } });
  ex({ id: 'incline_db', name: 'Développé incliné haltères', eq: 'dumbbell', type: 'compound', lvl: 1,
    m: { pec_upper: 1, pec_mid: 0.5, delt_front: 0.5, triceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 120, inc: 2, start: 0.23, unit: 'per_hand',
    desc: "Le meilleur rapport efficacité/sécurité pour développer le haut des pectoraux.",
    setup: "Banc à 30°, haltères à hauteur des clavicules, poignets alignés avec les avant-bras.",
    exec: "Pousser vers le haut en arc léger, puis redescendre lentement jusqu'à l'étirement.",
    mistakes: ["Banc trop incliné", "Épaules qui remontent vers les oreilles", "Amplitude partielle"],
    variants: { deb: "Presse inclinée machine", int: "Développé incliné haltères", adv: "Incliné haltères tempo 3-1-1 + dernière série en dégressive" } });
  ex({ id: 'decline_bb', name: 'Développé décliné barre', eq: 'barbell', type: 'compound', lvl: 2,
    m: { pec_lower: 1, pec_mid: 0.5, triceps: 0.5, delt_front: 0.25 },
    reps: [6, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0.65, unit: 'total',
    desc: "Variante déclinée qui accentue la portion basse des pectoraux et ménage les épaules.",
    setup: "Banc décliné à 15-20°, jambes calées, barre au-dessus du bas des pectoraux.",
    exec: "Descendre la barre vers le bas du sternum puis pousser verticalement.",
    mistakes: ["Déclinaison excessive", "Descente non contrôlée", "Se lever sans pareur sur charges lourdes"],
    variants: { deb: "Écarté poulie haute vers bas", int: "Développé décliné barre", adv: "Dips lestés" } });
  ex({ id: 'dips', name: 'Dips aux barres parallèles', eq: 'bodyweight', type: 'compound', lvl: 2,
    m: { pec_lower: 1, triceps: 0.75, delt_front: 0.5, pec_mid: 0.25 },
    reps: [6, 12], sets: [3, 4], rest: 120, inc: 2.5, start: 0, unit: 'added', bw: 0.9,
    desc: "Poussée verticale au poids du corps, très efficace pour le bas des pectoraux et les triceps.",
    setup: "Bras tendus sur les barres, buste légèrement penché vers l'avant, jambes croisées.",
    exec: "Descendre jusqu'à ce que les épaules soient au niveau des coudes, puis remonter sans verrouiller brutalement.",
    mistakes: ["Descendre trop bas (épaules)", "Épaules enroulées vers l'avant", "Balancer les jambes"],
    variants: { deb: "Dips assistés (machine ou élastique)", int: "Dips au poids du corps", adv: "Dips lestés" } });
  ex({ id: 'chest_press_machine', name: 'Presse pectorale machine', eq: 'machine', type: 'compound', lvl: 1,
    m: { pec_mid: 1, pec_lower: 0.5, delt_front: 0.5, triceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.6, unit: 'total',
    desc: "Poussée guidée stable : idéale pour pousser près de l'échec en sécurité.",
    setup: "Régler le siège pour que les poignées soient au niveau du milieu des pectoraux, dos plaqué.",
    exec: "Pousser sans verrouiller totalement les coudes, revenir lentement jusqu'à l'étirement.",
    mistakes: ["Siège mal réglé", "Décoller le dos du dossier", "Retour non contrôlé"],
    variants: { deb: "Presse pectorale charge modérée", int: "Presse pectorale", adv: "Presse unilatérale + pause en étirement" } });
  ex({ id: 'incline_machine', name: 'Presse inclinée machine', eq: 'machine', type: 'compound', lvl: 1,
    m: { pec_upper: 1, pec_mid: 0.5, delt_front: 0.5, triceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.5, unit: 'total',
    desc: "Version guidée du développé incliné.",
    setup: "Poignées au niveau du haut des pectoraux, omoplates en arrière.",
    exec: "Pousser vers le haut et l'avant, revenir en contrôlant 2 à 3 secondes.",
    mistakes: ["Hausser les épaules", "Amplitude trop courte", "Rebond en bas"],
    variants: { deb: "Presse inclinée", int: "Presse inclinée", adv: "Presse inclinée unilatérale" } });
  ex({ id: 'cable_fly', name: 'Écarté poulie vis-à-vis', eq: 'cable', type: 'isolation', lvl: 1,
    m: { pec_mid: 1, pec_lower: 0.25, delt_front: 0.25 },
    reps: [10, 15], sets: [2, 4], rest: 75, inc: 2.5, start: 0.12, unit: 'per_hand',
    desc: "Isolation des pectoraux avec tension constante sur toute l'amplitude.",
    setup: "Poulies à hauteur d'épaules, un pas en avant, coudes légèrement fléchis et fixes.",
    exec: "Rapprocher les mains devant la poitrine en arc de cercle, serrer 1 s, revenir lentement.",
    mistakes: ["Plier les coudes (devient un développé)", "Charge trop lourde", "Perdre la posture"],
    variants: { deb: "Pec deck", int: "Écarté poulie vis-à-vis", adv: "Écarté poulie unilatéral + pause en étirement" } });
  ex({ id: 'low_high_fly', name: 'Écarté poulie basse vers haut', eq: 'cable', type: 'isolation', lvl: 1,
    m: { pec_upper: 1, delt_front: 0.25 },
    reps: [12, 15], sets: [2, 3], rest: 75, inc: 2.5, start: 0.08, unit: 'per_hand',
    desc: "Isolation ciblant le haut des pectoraux par une trajectoire montante.",
    setup: "Poulies en position basse, paumes vers l'avant, buste droit.",
    exec: "Monter les mains en arc jusqu'à hauteur du menton en les rapprochant, revenir en contrôle.",
    mistakes: ["Monter avec les épaules", "Bras tendus verrouillés", "Élan du buste"],
    variants: { deb: "Charge légère, amplitude contrôlée", int: "Écarté bas vers haut", adv: "Unilatéral avec pause en haut" } });
  ex({ id: 'high_low_fly', name: 'Écarté poulie haute vers bas', eq: 'cable', type: 'isolation', lvl: 1,
    m: { pec_lower: 1, pec_mid: 0.25 },
    reps: [12, 15], sets: [2, 3], rest: 75, inc: 2.5, start: 0.1, unit: 'per_hand',
    desc: "Isolation du bas des pectoraux, trajectoire descendante.",
    setup: "Poulies en position haute, buste légèrement penché, coudes semi-fléchis.",
    exec: "Ramener les mains vers le bas et le centre, au niveau du nombril, puis remonter lentement.",
    mistakes: ["Trop pencher le buste", "Tirer avec les bras", "Charge excessive"],
    variants: { deb: "Charge légère", int: "Écarté haut vers bas", adv: "Croisement des mains en fin de mouvement" } });
  ex({ id: 'pec_deck', name: 'Pec deck (butterfly)', eq: 'machine', type: 'isolation', lvl: 1,
    m: { pec_mid: 1, delt_front: 0.25 },
    reps: [10, 15], sets: [2, 4], rest: 75, inc: 5, start: 0.45, unit: 'total',
    desc: "Isolation guidée des pectoraux, très simple à pousser près de l'échec.",
    setup: "Poignées à hauteur des pectoraux, dos plaqué, coudes légèrement fléchis.",
    exec: "Rapprocher les bras devant soi, contracter 1 s, revenir jusqu'à l'étirement.",
    mistakes: ["Siège trop bas", "Épaules qui avancent", "Rebond en étirement"],
    variants: { deb: "Pec deck", int: "Pec deck", adv: "Pec deck + série dégressive" } });
  ex({ id: 'db_fly', name: 'Écarté couché haltères', eq: 'dumbbell', type: 'isolation', lvl: 2,
    m: { pec_mid: 1, pec_upper: 0.25, delt_front: 0.25 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 2, start: 0.12, unit: 'per_hand',
    desc: "Isolation en étirement des pectoraux.",
    setup: "Allongé, haltères au-dessus de la poitrine, coudes légèrement fléchis.",
    exec: "Ouvrir les bras en arc jusqu'à l'étirement, puis refermer comme pour enlacer un arbre.",
    mistakes: ["Descendre trop bas", "Charge trop lourde", "Transformer en développé"],
    variants: { deb: "Pec deck", int: "Écarté haltères", adv: "Écarté sur banc incliné" } });
  ex({ id: 'pushup', name: 'Pompes', eq: 'bodyweight', type: 'compound', lvl: 1,
    m: { pec_mid: 1, triceps: 0.5, delt_front: 0.5, abs: 0.25 },
    reps: [10, 20], sets: [3, 4], rest: 75, inc: 2.5, start: 0, unit: 'added', bw: 0.65,
    desc: "Poussée au poids du corps, utilisable partout.",
    setup: "Mains un peu plus larges que les épaules, corps gainé en ligne droite.",
    exec: "Descendre la poitrine près du sol, coudes à 45°, puis repousser.",
    mistakes: ["Bassin qui s'affaisse", "Coudes à 90°", "Amplitude partielle"],
    variants: { deb: "Pompes sur les genoux ou mains surélevées", int: "Pompes classiques", adv: "Pompes lestées ou pieds surélevés" } });

  // ---------------- DOS ----------------
  ex({ id: 'pullup', name: 'Tractions pronation', eq: 'bodyweight', type: 'compound', lvl: 2,
    m: { lats: 1, rhomboids: 0.5, biceps: 0.5, delt_rear: 0.25, forearms: 0.25 },
    reps: [5, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0, unit: 'added', bw: 1,
    desc: "Tirage vertical au poids du corps, référence pour la largeur du dos.",
    setup: "Prise pronation un peu plus large que les épaules, bras tendus, gainage.",
    exec: "Tirer les coudes vers les hanches jusqu'à passer le menton au-dessus de la barre, redescendre bras tendus.",
    mistakes: ["Balancer le corps (kipping)", "Demi-amplitude", "Épaules qui montent vers les oreilles"],
    variants: { deb: "Tractions assistées (machine ou élastique)", int: "Tractions au poids du corps", adv: "Tractions lestées" } });
  ex({ id: 'chinup', name: 'Tractions supination', eq: 'bodyweight', type: 'compound', lvl: 2,
    m: { lats: 1, biceps: 0.75, rhomboids: 0.25, forearms: 0.25 },
    reps: [5, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0, unit: 'added', bw: 1,
    desc: "Tractions paumes vers soi : plus d'implication des biceps.",
    setup: "Prise supination largeur d'épaules, bras tendus.",
    exec: "Tirer la poitrine vers la barre en gardant les coudes près du corps.",
    mistakes: ["Balancer", "Ne pas tendre les bras en bas", "Tirer avec le cou"],
    variants: { deb: "Tractions assistées supination", int: "Tractions supination", adv: "Tractions supination lestées" } });
  ex({ id: 'lat_pulldown', name: 'Tirage vertical poulie haute', eq: 'cable', type: 'compound', lvl: 1,
    m: { lats: 1, rhomboids: 0.5, biceps: 0.5, delt_rear: 0.25 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.6, unit: 'total',
    desc: "Alternative modulable aux tractions pour développer les dorsaux.",
    setup: "Cuisses calées, prise un peu plus large que les épaules, buste légèrement incliné en arrière.",
    exec: "Tirer la barre vers le haut de la poitrine en abaissant les coudes, remonter bras tendus en contrôle.",
    mistakes: ["Tirer derrière la nuque", "Se pencher excessivement en arrière", "Tirer avec les biceps"],
    variants: { deb: "Tirage vertical", int: "Tirage vertical", adv: "Tirage unilatéral à la poignée" } });
  ex({ id: 'pulldown_neutral', name: 'Tirage vertical prise neutre serrée', eq: 'cable', type: 'compound', lvl: 1,
    m: { lats: 1, biceps: 0.5, rhomboids: 0.25 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.6, unit: 'total',
    desc: "Prise neutre qui permet un grand étirement des dorsaux.",
    setup: "Poignée triangle, cuisses calées, buste droit.",
    exec: "Tirer vers le haut du sternum en amenant les coudes le long du corps.",
    mistakes: ["Arrondir le dos", "Élan du buste", "Amplitude courte en haut"],
    variants: { deb: "Tirage prise neutre", int: "Tirage prise neutre", adv: "Pause 1 s en contraction" } });
  ex({ id: 'bb_row', name: 'Rowing barre', eq: 'barbell', type: 'compound', lvl: 2,
    m: { lats: 1, rhomboids: 1, traps: 0.5, delt_rear: 0.5, biceps: 0.5, lower_back: 0.5 },
    reps: [6, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0.6, unit: 'total',
    desc: "Tirage horizontal lourd pour l'épaisseur du dos.",
    setup: "Buste penché à ~45°, dos neutre, genoux fléchis, prise pronation largeur d'épaules.",
    exec: "Tirer la barre vers le nombril en serrant les omoplates, redescendre en contrôle.",
    mistakes: ["Dos arrondi", "Se redresser à chaque répétition", "Élan des hanches"],
    variants: { deb: "Tirage horizontal poulie", int: "Rowing barre", adv: "Rowing Pendlay (départ du sol)" } });
  ex({ id: 'db_row', name: 'Rowing haltère unilatéral', eq: 'dumbbell', type: 'compound', lvl: 1,
    m: { lats: 1, rhomboids: 0.5, biceps: 0.5, delt_rear: 0.25 },
    reps: [8, 12], sets: [3, 4], rest: 90, inc: 2, start: 0.36, unit: 'per_hand',
    desc: "Tirage unilatéral, grande amplitude et dos protégé par l'appui.",
    setup: "Main et genou en appui sur un banc, dos plat, haltère bras tendu.",
    exec: "Tirer le coude vers la hanche, contracter, redescendre jusqu'à l'étirement.",
    mistakes: ["Rotation du buste", "Tirer vers l'épaule", "Mouvement saccadé"],
    variants: { deb: "Rowing haltère léger", int: "Rowing haltère", adv: "Rowing Kroc (plus de répétitions, charge lourde)" } });
  ex({ id: 'seated_row', name: 'Tirage horizontal poulie basse', eq: 'cable', type: 'compound', lvl: 1,
    m: { rhomboids: 1, lats: 0.75, traps: 0.5, delt_rear: 0.5, biceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.6, unit: 'total',
    desc: "Tirage horizontal guidé, excellent pour le milieu du dos.",
    setup: "Assis, pieds calés, dos droit, poignée triangle bras tendus.",
    exec: "Tirer vers le bas du sternum en serrant les omoplates, revenir en laissant les épaules s'avancer légèrement.",
    mistakes: ["Balancer le buste", "Hausser les épaules", "Dos arrondi"],
    variants: { deb: "Tirage horizontal", int: "Tirage horizontal", adv: "Tirage unilatéral rotation" } });
  ex({ id: 'chest_row_machine', name: 'Rowing poitrine appuyée machine', eq: 'machine', type: 'compound', lvl: 1,
    m: { rhomboids: 1, lats: 0.75, delt_rear: 0.5, traps: 0.5, biceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.55, unit: 'total',
    desc: "Rowing sans contrainte pour le bas du dos.",
    setup: "Poitrine contre l'appui, poignées à bout de bras.",
    exec: "Tirer les coudes vers l'arrière, serrer les omoplates, revenir lentement.",
    mistakes: ["Décoller la poitrine", "Amplitude partielle", "Hausser les épaules"],
    variants: { deb: "Rowing machine", int: "Rowing machine", adv: "Rowing machine unilatéral" } });
  ex({ id: 'tbar_row', name: 'Rowing T-bar', eq: 'barbell', type: 'compound', lvl: 2,
    m: { rhomboids: 1, lats: 1, traps: 0.5, delt_rear: 0.5, biceps: 0.5, lower_back: 0.25 },
    reps: [6, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0.5, unit: 'total',
    desc: "Tirage lourd prise neutre pour l'épaisseur du dos.",
    setup: "Pieds de part et d'autre de la barre, buste penché, dos neutre.",
    exec: "Tirer la charge vers le bas de la poitrine, redescendre sans arrondir le dos.",
    mistakes: ["Dos arrondi", "Élan des jambes", "Charge excessive"],
    variants: { deb: "Rowing machine appuyée", int: "Rowing T-bar", adv: "T-bar poitrine appuyée lourd" } });
  ex({ id: 'straight_arm_pulldown', name: 'Pull-over poulie bras tendus', eq: 'cable', type: 'isolation', lvl: 1,
    m: { lats: 1, triceps: 0.25 },
    reps: [12, 15], sets: [2, 3], rest: 75, inc: 2.5, start: 0.25, unit: 'total',
    desc: "Isolation des dorsaux sans fatigue des biceps.",
    setup: "Debout face à la poulie haute, bras presque tendus, buste légèrement penché.",
    exec: "Ramener la barre vers les cuisses en arc de cercle, puis remonter jusqu'à l'étirement.",
    mistakes: ["Plier les coudes", "Balancer le buste", "Charge trop lourde"],
    variants: { deb: "Pull-over poulie", int: "Pull-over poulie", adv: "Pull-over à la corde avec pause" } });

  // ---------------- TRAPÈZES ----------------
  ex({ id: 'db_shrug', name: 'Shrugs haltères', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { traps: 1, forearms: 0.5 },
    reps: [10, 15], sets: [2, 4], rest: 75, inc: 2, start: 0.35, unit: 'per_hand',
    desc: "Haussements d'épaules pour les trapèzes supérieurs.",
    setup: "Debout, haltères le long du corps, bras tendus.",
    exec: "Monter les épaules vers les oreilles, tenir 1 s, redescendre lentement.",
    mistakes: ["Rouler les épaules", "Plier les coudes", "Mouvement trop rapide"],
    variants: { deb: "Shrugs haltères", int: "Shrugs haltères", adv: "Shrugs avec pause de 2 s" } });
  ex({ id: 'bb_shrug', name: 'Shrugs barre', eq: 'barbell', type: 'isolation', lvl: 1,
    m: { traps: 1, forearms: 0.5 },
    reps: [10, 15], sets: [2, 4], rest: 75, inc: 2.5, start: 0.9, unit: 'total',
    desc: "Shrugs à la barre, permet de charger lourd.",
    setup: "Barre devant les cuisses, prise largeur d'épaules.",
    exec: "Haussement vertical des épaules, maintien 1 s, retour contrôlé.",
    mistakes: ["Élan des jambes", "Rotation des épaules", "Tête en avant"],
    variants: { deb: "Shrugs haltères", int: "Shrugs barre", adv: "Shrugs barre derrière le dos" } });
  ex({ id: 'face_pull', name: 'Face pull', eq: 'cable', type: 'isolation', lvl: 1,
    m: { delt_rear: 1, traps: 0.5, rhomboids: 0.5 },
    reps: [12, 20], sets: [2, 4], rest: 60, inc: 2.5, start: 0.2, unit: 'total',
    desc: "Arrière d'épaule et santé de la coiffe des rotateurs.",
    setup: "Poulie à hauteur du visage, corde, prise pouces vers l'arrière.",
    exec: "Tirer la corde vers le front en écartant les mains et en ouvrant les coudes, rotation externe en fin de mouvement.",
    mistakes: ["Charge trop lourde", "Tirer vers le cou", "Se pencher en arrière"],
    variants: { deb: "Face pull léger", int: "Face pull", adv: "Face pull avec pause de 2 s" } });

  // ---------------- ÉPAULES ----------------
  ex({ id: 'ohp_bb', name: 'Développé militaire barre', eq: 'barbell', type: 'compound', lvl: 2,
    m: { delt_front: 1, delt_side: 0.5, triceps: 0.5, traps: 0.25, abs: 0.25 },
    reps: [6, 10], sets: [3, 4], rest: 150, inc: 2.5, start: 0.4, unit: 'total',
    desc: "Poussée verticale debout, base de la force des épaules.",
    setup: "Debout, barre sur le haut des pectoraux, prise un peu plus large que les épaules, fessiers et abdos serrés.",
    exec: "Pousser la barre à la verticale en reculant la tête, puis la ramener au-dessus du crâne en fin de mouvement.",
    mistakes: ["Cambrer le bas du dos", "Barre trop en avant", "Utiliser les jambes"],
    variants: { deb: "Développé épaules machine", int: "Développé militaire", adv: "Développé militaire avec pause" } });
  ex({ id: 'ohp_db', name: 'Développé épaules haltères assis', eq: 'dumbbell', type: 'compound', lvl: 1,
    m: { delt_front: 1, delt_side: 0.5, triceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 2, start: 0.19, unit: 'per_hand',
    desc: "Poussée verticale stable avec dossier.",
    setup: "Banc à 80-90°, haltères à hauteur d'oreilles, avant-bras verticaux.",
    exec: "Pousser vers le haut sans entrechoquer, redescendre jusqu'à hauteur du menton.",
    mistakes: ["Dos qui décolle du dossier", "Amplitude courte", "Coudes trop en arrière"],
    variants: { deb: "Développé épaules machine", int: "Développé haltères assis", adv: "Développé Arnold" } });
  ex({ id: 'shoulder_press_machine', name: 'Développé épaules machine', eq: 'machine', type: 'compound', lvl: 1,
    m: { delt_front: 1, delt_side: 0.5, triceps: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 105, inc: 5, start: 0.4, unit: 'total',
    desc: "Poussée verticale guidée et sécurisée.",
    setup: "Poignées à hauteur d'épaules, dos plaqué.",
    exec: "Pousser sans verrouiller, revenir lentement.",
    mistakes: ["Siège mal réglé", "Cambrure", "Retour non contrôlé"],
    variants: { deb: "Développé machine", int: "Développé machine", adv: "Unilatéral + dégressive" } });
  ex({ id: 'lateral_raise_db', name: 'Élévations latérales haltères', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { delt_side: 1, traps: 0.25 },
    reps: [12, 20], sets: [3, 4], rest: 60, inc: 1, start: 0.09, unit: 'per_hand',
    desc: "L'exercice clé pour élargir la carrure (deltoïde latéral).",
    setup: "Debout, buste très légèrement penché, haltères le long du corps, coudes un peu fléchis.",
    exec: "Monter les bras sur les côtés jusqu'à hauteur d'épaules en menant avec les coudes, redescendre en 2-3 s.",
    mistakes: ["Élan du buste", "Monter avec les trapèzes", "Charge trop lourde"],
    variants: { deb: "Élévations latérales assis", int: "Élévations latérales debout", adv: "Élévations latérales partielles en fin de série" } });
  ex({ id: 'lateral_raise_cable', name: 'Élévations latérales poulie', eq: 'cable', type: 'isolation', lvl: 1,
    m: { delt_side: 1 },
    reps: [12, 20], sets: [2, 4], rest: 60, inc: 1.25, start: 0.06, unit: 'per_hand',
    desc: "Tension constante, notamment en bas du mouvement.",
    setup: "Poulie basse, poignée dans la main opposée, câble devant ou derrière le corps.",
    exec: "Monter le bras sur le côté jusqu'à l'horizontale, redescendre lentement.",
    mistakes: ["Pencher le buste", "Plier le coude progressivement", "Hausser l'épaule"],
    variants: { deb: "Poulie légère", int: "Élévations latérales poulie", adv: "Avec pause de 1 s en haut" } });
  ex({ id: 'lateral_raise_machine', name: 'Élévations latérales machine', eq: 'machine', type: 'isolation', lvl: 1,
    m: { delt_side: 1 },
    reps: [12, 20], sets: [2, 4], rest: 60, inc: 2.5, start: 0.25, unit: 'total',
    desc: "Isolation guidée des deltoïdes latéraux.",
    setup: "Épaules alignées avec l'axe de la machine, coussinets sur l'extérieur des bras.",
    exec: "Écarter les bras jusqu'à l'horizontale, redescendre lentement.",
    mistakes: ["Hausser les épaules", "Mauvais alignement", "Élan"],
    variants: { deb: "Machine", int: "Machine", adv: "Machine + séries partielles" } });
  ex({ id: 'rear_delt_fly', name: 'Oiseau haltères', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { delt_rear: 1, rhomboids: 0.5, traps: 0.25 },
    reps: [12, 20], sets: [2, 4], rest: 60, inc: 1, start: 0.07, unit: 'per_hand',
    desc: "Isolation des deltoïdes postérieurs.",
    setup: "Buste penché à ~70° (ou poitrine sur banc incliné), bras pendants, coudes légèrement fléchis.",
    exec: "Écarter les bras sur les côtés jusqu'à l'alignement avec le buste, redescendre lentement.",
    mistakes: ["Serrer les omoplates (travail des rhomboïdes)", "Élan", "Charge trop lourde"],
    variants: { deb: "Oiseau poitrine sur banc", int: "Oiseau haltères", adv: "Oiseau avec pause en haut" } });
  ex({ id: 'reverse_pec_deck', name: 'Pec deck inversé', eq: 'machine', type: 'isolation', lvl: 1,
    m: { delt_rear: 1, rhomboids: 0.5 },
    reps: [12, 20], sets: [2, 4], rest: 60, inc: 2.5, start: 0.3, unit: 'total',
    desc: "Isolation guidée des deltoïdes postérieurs.",
    setup: "Face à la machine, poignées à hauteur d'épaules, bras presque tendus.",
    exec: "Écarter les bras vers l'arrière en arc, revenir lentement.",
    mistakes: ["Hausser les épaules", "Plier les coudes", "Rebond"],
    variants: { deb: "Machine légère", int: "Pec deck inversé", adv: "Unilatéral croisé" } });
  ex({ id: 'front_raise', name: 'Élévations frontales', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { delt_front: 1, pec_upper: 0.25 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 1, start: 0.09, unit: 'per_hand',
    desc: "Isolation du deltoïde antérieur, souvent déjà sollicité par les développés.",
    setup: "Debout, haltères devant les cuisses.",
    exec: "Monter les bras devant soi jusqu'à hauteur des yeux, redescendre lentement.",
    mistakes: ["Élan du buste", "Monter trop haut", "Charge trop lourde"],
    variants: { deb: "Alterné", int: "Simultané", adv: "Poulie basse" } });
  ex({ id: 'upright_row_cable', name: 'Tirage menton poulie prise large', eq: 'cable', type: 'compound', lvl: 2,
    m: { delt_side: 1, traps: 0.75, biceps: 0.25 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 2.5, start: 0.3, unit: 'total',
    desc: "Deltoïdes latéraux et trapèzes, en prise large pour préserver les épaules.",
    setup: "Barre à la poulie basse, prise plus large que les épaules.",
    exec: "Tirer jusqu'à hauteur du bas de la poitrine en menant avec les coudes, redescendre.",
    mistakes: ["Prise serrée", "Monter au-dessus des épaules", "Élan"],
    variants: { deb: "Élévations latérales", int: "Tirage menton prise large", adv: "Tirage menton haltères" } });

  // ---------------- BICEPS ----------------
  ex({ id: 'bb_curl', name: 'Curl barre', eq: 'barbell', type: 'isolation', lvl: 1,
    m: { biceps: 1, forearms: 0.5 },
    reps: [8, 12], sets: [2, 4], rest: 75, inc: 2.5, start: 0.3, unit: 'total',
    desc: "Le curl de base, permet de charger lourd.",
    setup: "Debout, prise supination largeur d'épaules, coudes collés au buste.",
    exec: "Fléchir les coudes sans les avancer, contracter en haut, redescendre en 2-3 s.",
    mistakes: ["Balancer le buste", "Avancer les coudes", "Descente trop rapide"],
    variants: { deb: "Curl barre EZ", int: "Curl barre", adv: "Curl barre + négatives lentes" } });
  ex({ id: 'db_curl', name: 'Curl haltères alterné', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { biceps: 1, forearms: 0.25 },
    reps: [8, 12], sets: [2, 4], rest: 75, inc: 2, start: 0.13, unit: 'per_hand',
    desc: "Curl avec supination pour une contraction complète.",
    setup: "Debout ou assis, haltères le long du corps, paumes vers l'intérieur.",
    exec: "Monter en tournant la paume vers le haut, contracter, redescendre lentement.",
    mistakes: ["Élan", "Coudes qui avancent", "Amplitude partielle"],
    variants: { deb: "Curl assis", int: "Curl alterné", adv: "Curl simultané tempo lent" } });
  ex({ id: 'incline_curl', name: 'Curl incliné haltères', eq: 'dumbbell', type: 'isolation', lvl: 2,
    m: { biceps: 1 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 2, start: 0.1, unit: 'per_hand',
    desc: "Curl en étirement maximal de la longue portion.",
    setup: "Banc à 45-60°, bras pendants derrière le buste.",
    exec: "Fléchir sans avancer les coudes, redescendre jusqu'à l'étirement complet.",
    mistakes: ["Avancer les épaules", "Charge trop lourde", "Rebond en bas"],
    variants: { deb: "Curl assis", int: "Curl incliné", adv: "Curl incliné pause en étirement" } });
  ex({ id: 'hammer_curl', name: 'Curl marteau', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { forearms: 1, biceps: 0.75 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 2, start: 0.15, unit: 'per_hand',
    desc: "Prise neutre : brachial, brachio-radial et biceps.",
    setup: "Debout, haltères en prise neutre (pouces vers le haut).",
    exec: "Fléchir les coudes en gardant la prise neutre, redescendre en contrôle.",
    mistakes: ["Balancer", "Coudes qui partent en avant", "Poignets cassés"],
    variants: { deb: "Curl marteau assis", int: "Curl marteau", adv: "Curl marteau à la corde" } });
  ex({ id: 'cable_curl', name: 'Curl poulie basse', eq: 'cable', type: 'isolation', lvl: 1,
    m: { biceps: 1, forearms: 0.25 },
    reps: [10, 15], sets: [2, 4], rest: 60, inc: 2.5, start: 0.25, unit: 'total',
    desc: "Tension continue sur toute l'amplitude.",
    setup: "Face à la poulie basse, barre droite ou EZ.",
    exec: "Fléchir les coudes, contracter 1 s, redescendre lentement.",
    mistakes: ["Reculer les hanches", "Coudes qui bougent", "Élan"],
    variants: { deb: "Curl poulie", int: "Curl poulie", adv: "Curl poulie Bayesian (dos à la poulie)" } });
  ex({ id: 'preacher_machine', name: 'Curl pupitre machine', eq: 'machine', type: 'isolation', lvl: 1,
    m: { biceps: 1 },
    reps: [10, 15], sets: [2, 4], rest: 60, inc: 2.5, start: 0.25, unit: 'total',
    desc: "Isolation stricte des biceps, impossible de tricher.",
    setup: "Aisselles calées sur le pupitre, bras alignés avec le coussin.",
    exec: "Fléchir jusqu'en haut, redescendre presque bras tendus.",
    mistakes: ["Décoller les coudes", "Rebond en bas", "Amplitude partielle"],
    variants: { deb: "Pupitre machine", int: "Pupitre machine", adv: "Pupitre unilatéral + dégressive" } });

  // ---------------- TRICEPS ----------------
  ex({ id: 'close_grip_bench', name: 'Développé couché prise serrée', eq: 'barbell', type: 'compound', lvl: 2,
    m: { triceps: 1, pec_mid: 0.5, delt_front: 0.5 },
    reps: [6, 10], sets: [3, 4], rest: 120, inc: 2.5, start: 0.55, unit: 'total',
    desc: "Poussée lourde centrée sur les triceps.",
    setup: "Prise largeur d'épaules, coudes près du corps.",
    exec: "Descendre au bas du sternum, pousser en gardant les coudes serrés.",
    mistakes: ["Prise trop serrée (poignets)", "Coudes qui s'ouvrent", "Rebond"],
    variants: { deb: "Dips entre bancs", int: "Développé prise serrée", adv: "Prise serrée avec pause" } });
  ex({ id: 'pushdown', name: 'Extension triceps poulie haute', eq: 'cable', type: 'isolation', lvl: 1,
    m: { triceps: 1 },
    reps: [10, 15], sets: [2, 4], rest: 60, inc: 2.5, start: 0.3, unit: 'total',
    desc: "Isolation simple et efficace des triceps.",
    setup: "Face à la poulie haute, corde ou barre, coudes collés au buste.",
    exec: "Tendre les bras vers le bas, écarter la corde en fin de mouvement, remonter jusqu'à 90°.",
    mistakes: ["Coudes qui bougent", "Se pencher sur la charge", "Amplitude courte"],
    variants: { deb: "Barre droite", int: "Corde", adv: "Unilatéral prise inversée" } });
  ex({ id: 'overhead_cable_ext', name: 'Extension triceps nuque poulie', eq: 'cable', type: 'isolation', lvl: 1,
    m: { triceps: 1 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 2.5, start: 0.25, unit: 'total',
    desc: "Étirement de la longue portion du triceps.",
    setup: "Dos à la poulie, corde derrière la tête, coudes vers le haut.",
    exec: "Tendre les bras vers l'avant et le haut, revenir jusqu'à l'étirement.",
    mistakes: ["Coudes qui s'écartent", "Cambrure", "Charge trop lourde"],
    variants: { deb: "Extension haltère assis", int: "Extension nuque poulie", adv: "Unilatérale avec pause en étirement" } });
  ex({ id: 'skullcrusher', name: 'Barre au front (EZ)', eq: 'barbell', type: 'isolation', lvl: 2,
    m: { triceps: 1 },
    reps: [8, 12], sets: [2, 4], rest: 75, inc: 2.5, start: 0.3, unit: 'total',
    desc: "Extension couchée, travail complet des trois chefs.",
    setup: "Allongé, barre EZ bras tendus au-dessus des yeux.",
    exec: "Fléchir les coudes pour amener la barre derrière le front, puis tendre.",
    mistakes: ["Coudes qui s'ouvrent", "Bras qui bougent", "Charge trop lourde pour les coudes"],
    variants: { deb: "Extension haltères couché", int: "Barre au front", adv: "Barre au front banc incliné" } });
  ex({ id: 'db_overhead_ext', name: 'Extension haltère au-dessus de la tête', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { triceps: 1 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 2, start: 0.2, unit: 'total',
    desc: "Étirement de la longue portion avec un seul haltère.",
    setup: "Assis dos calé, haltère tenu à deux mains au-dessus de la tête.",
    exec: "Descendre l'haltère derrière la tête, coudes pointés vers le haut, puis tendre.",
    mistakes: ["Coudes écartés", "Cambrure", "Amplitude partielle"],
    variants: { deb: "Assis", int: "Assis", adv: "Unilatéral" } });
  ex({ id: 'bench_dips', name: 'Dips entre bancs', eq: 'bodyweight', type: 'compound', lvl: 1,
    m: { triceps: 1, delt_front: 0.25, pec_lower: 0.25 },
    reps: [10, 20], sets: [2, 3], rest: 60, inc: 2.5, start: 0, unit: 'added', bw: 0.6,
    desc: "Triceps au poids du corps, matériel minimal.",
    setup: "Mains sur un banc derrière soi, jambes tendues ou fléchies.",
    exec: "Descendre jusqu'à 90° aux coudes, remonter sans verrouiller.",
    mistakes: ["Descendre trop bas", "Épaules enroulées", "Écarter les coudes"],
    variants: { deb: "Jambes fléchies", int: "Jambes tendues", adv: "Pieds surélevés + lest sur les cuisses" } });

  // ---------------- AVANT-BRAS ----------------
  ex({ id: 'wrist_curl', name: 'Curl poignets', eq: 'dumbbell', type: 'isolation', lvl: 1,
    m: { forearms: 1 },
    reps: [12, 20], sets: [2, 3], rest: 60, inc: 1, start: 0.1, unit: 'per_hand',
    desc: "Fléchisseurs des avant-bras.",
    setup: "Avant-bras posés sur un banc, poignets dans le vide, paumes vers le haut.",
    exec: "Fléchir les poignets vers le haut, redescendre en laissant la charge rouler dans les doigts.",
    mistakes: ["Soulever les avant-bras", "Mouvement trop rapide", "Charge trop lourde"],
    variants: { deb: "Curl poignets", int: "Curl poignets", adv: "Curl poignets barre derrière le dos" } });
  ex({ id: 'reverse_curl', name: 'Curl inversé barre EZ', eq: 'barbell', type: 'isolation', lvl: 1,
    m: { forearms: 1, biceps: 0.5 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 2.5, start: 0.2, unit: 'total',
    desc: "Extenseurs des avant-bras et brachio-radial.",
    setup: "Prise pronation largeur d'épaules, coudes au corps.",
    exec: "Fléchir les coudes en gardant les poignets neutres, redescendre lentement.",
    mistakes: ["Poignets cassés", "Élan", "Coudes qui avancent"],
    variants: { deb: "Curl inversé léger", int: "Curl inversé", adv: "Curl inversé tempo lent" } });

  // ---------------- TRONC ----------------
  ex({ id: 'cable_crunch', name: 'Crunch à la poulie', eq: 'cable', type: 'isolation', lvl: 1,
    m: { abs: 1, obliques: 0.25 },
    reps: [10, 15], sets: [2, 4], rest: 60, inc: 2.5, start: 0.4, unit: 'total',
    desc: "Abdominaux chargés, progression facile.",
    setup: "À genoux face à la poulie haute, corde tenue près de la tête.",
    exec: "Enrouler la colonne en rapprochant les côtes du bassin, revenir lentement.",
    mistakes: ["Tirer avec les bras", "Plier les hanches au lieu d'enrouler", "Élan"],
    variants: { deb: "Crunch au sol", int: "Crunch poulie", adv: "Crunch poulie lourd + pause" } });
  ex({ id: 'hanging_leg_raise', name: 'Relevés de jambes suspendu', eq: 'bodyweight', type: 'isolation', lvl: 2,
    m: { abs: 1, obliques: 0.5, forearms: 0.25 },
    reps: [8, 15], sets: [2, 4], rest: 75, inc: 2.5, start: 0, unit: 'added', bw: 0.3,
    desc: "Abdominaux, surtout la partie basse, avec enroulement du bassin.",
    setup: "Suspendu à une barre, bras tendus, corps immobile.",
    exec: "Monter les genoux ou jambes en enroulant le bassin vers l'avant, redescendre sans balancer.",
    mistakes: ["Balancer", "Monter les jambes sans enrouler le bassin", "Redescendre en chute"],
    variants: { deb: "Relevés de genoux sur chaise romaine", int: "Relevés de genoux suspendu", adv: "Relevés de jambes tendues" } });
  ex({ id: 'ab_wheel', name: 'Roulette abdominale', eq: 'bodyweight', type: 'isolation', lvl: 2,
    m: { abs: 1, lats: 0.25, lower_back: 0.25 },
    reps: [6, 12], sets: [2, 3], rest: 75, inc: 2.5, start: 0, unit: 'added', bw: 0.4,
    desc: "Gainage dynamique très exigeant.",
    setup: "À genoux, roulette sous les épaules, dos neutre.",
    exec: "Rouler vers l'avant en gardant le bassin rétroversé, revenir en contractant les abdos.",
    mistakes: ["Creuser le bas du dos", "Aller trop loin trop tôt", "Bassin en arrière"],
    variants: { deb: "Amplitude courte", int: "À genoux", adv: "Debout" } });
  ex({ id: 'machine_crunch', name: 'Crunch machine', eq: 'machine', type: 'isolation', lvl: 1,
    m: { abs: 1 },
    reps: [10, 15], sets: [2, 4], rest: 60, inc: 5, start: 0.4, unit: 'total',
    desc: "Abdominaux guidés, chargeables.",
    setup: "Siège réglé, poignées ou coussinets en place.",
    exec: "Enrouler le buste, contracter 1 s, revenir lentement.",
    mistakes: ["Tirer avec les bras", "Élan", "Amplitude courte"],
    variants: { deb: "Crunch machine", int: "Crunch machine", adv: "Avec pause" } });
  ex({ id: 'torso_rotation_machine', name: 'Rotation du buste machine', eq: 'machine', type: 'isolation', lvl: 1,
    m: { obliques: 1, abs: 0.5 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 5, start: 0.3, unit: 'total',
    desc: "Rotation guidée du tronc contre résistance : cible les obliques sans charger le bas du dos.",
    setup: "Assis, réglez l'amplitude de départ sur le côté, bassin et cuisses bien calés dans les coussins, buste droit contre l'appui, mains sur les poignées.",
    exec: "Tournez le buste en expirant en contractant les abdominaux, le bassin reste immobile. Marquez 1 s en fin de rotation, revenez lentement. Faites toutes les répétitions d'un côté puis changez.",
    mistakes: ["Tourner avec les bras au lieu du tronc", "Laisser le bassin pivoter", "Amplitude forcée en fin de rotation ou retour en lâchant la charge"],
    variants: { deb: "Amplitude réduite, charge légère", int: "Rotation du buste machine", adv: "Pause de 2 s en fin de rotation et retour en 3 s" } });
  ex({ id: 'pallof_press', name: 'Pallof press', eq: 'cable', type: 'isolation', lvl: 1,
    m: { obliques: 1, abs: 0.5 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 2.5, start: 0.15, unit: 'total',
    desc: "Anti-rotation : obliques et stabilité du tronc.",
    setup: "De profil à la poulie à hauteur de poitrine, poignée contre le sternum.",
    exec: "Tendre les bras devant soi sans laisser le buste tourner, tenir 2 s, revenir.",
    mistakes: ["Rotation du buste", "Trop près de la poulie", "Bassin qui bouge"],
    variants: { deb: "Pallof à genoux", int: "Pallof debout", adv: "Pallof avec pas latéral" } });
  ex({ id: 'woodchopper', name: 'Bûcheron à la poulie', eq: 'cable', type: 'isolation', lvl: 1,
    m: { obliques: 1, abs: 0.5 },
    reps: [10, 15], sets: [2, 3], rest: 60, inc: 2.5, start: 0.2, unit: 'total',
    desc: "Rotation contrôlée du tronc.",
    setup: "Poulie haute, de profil, poignée à deux mains.",
    exec: "Tirer en diagonale vers la hanche opposée en pivotant le buste, revenir lentement.",
    mistakes: ["Tirer avec les bras", "Rotation lombaire excessive", "Élan"],
    variants: { deb: "Bûcheron léger", int: "Haut vers bas", adv: "Bas vers haut" } });
  ex({ id: 'back_extension', name: 'Extensions lombaires 45°', eq: 'bodyweight', type: 'isolation', lvl: 1,
    m: { lower_back: 1, glutes: 0.5, hamstrings: 0.5 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 2.5, start: 0, unit: 'added', bw: 0.5,
    desc: "Renforcement des érecteurs du rachis.",
    setup: "Hanches sur le coussin, pieds calés, buste aligné.",
    exec: "Descendre le buste en gardant le dos neutre, remonter jusqu'à l'alignement sans hyperextension.",
    mistakes: ["Hyperextension en haut", "Dos arrondi", "Élan"],
    variants: { deb: "Amplitude réduite", int: "Poids du corps", adv: "Avec disque contre la poitrine" } });

  // ---------------- JAMBES (disponibles si vous les sélectionnez) ----------------
  ex({ id: 'leg_press', name: 'Presse à cuisses', eq: 'machine', type: 'compound', lvl: 1,
    m: { quads: 1, glutes: 0.5, hamstrings: 0.25 },
    reps: [8, 12], sets: [3, 4], rest: 150, inc: 10, start: 1.5, unit: 'total',
    desc: "Quadriceps et fessiers sans charge axiale sur le dos.",
    setup: "Pieds largeur de bassin au milieu de la plateforme, bas du dos plaqué.",
    exec: "Descendre jusqu'à ~90° aux genoux sans décoller le bassin, pousser sans verrouiller.",
    mistakes: ["Bassin qui décolle", "Genoux vers l'intérieur", "Verrouiller les genoux"],
    variants: { deb: "Presse", int: "Presse", adv: "Presse unilatérale" } });
  ex({ id: 'goblet_squat', name: 'Squat goblet', eq: 'dumbbell', type: 'compound', lvl: 1,
    m: { quads: 1, glutes: 0.5, abs: 0.25 },
    reps: [8, 12], sets: [3, 4], rest: 120, inc: 2, start: 0.3, unit: 'total',
    desc: "Squat avec haltère contre la poitrine, technique accessible.",
    setup: "Haltère contre le sternum, pieds largeur d'épaules.",
    exec: "Descendre entre les genoux, buste droit, remonter en poussant le sol.",
    mistakes: ["Talons qui décollent", "Genoux vers l'intérieur", "Dos arrondi"],
    variants: { deb: "Squat goblet sur box", int: "Squat goblet", adv: "Squat barre" } });
  ex({ id: 'back_squat', name: 'Squat barre', eq: 'barbell', type: 'compound', lvl: 2,
    m: { quads: 1, glutes: 0.75, lower_back: 0.5, abs: 0.25 },
    reps: [6, 10], sets: [3, 4], rest: 180, inc: 2.5, start: 0.8, unit: 'total',
    desc: "Le mouvement roi pour les jambes.",
    setup: "Barre sur les trapèzes, pieds largeur d'épaules, gainage.",
    exec: "Descendre hanches en arrière et genoux en avant jusqu'à la parallèle, remonter.",
    mistakes: ["Dos arrondi", "Genoux en dedans", "Talons qui décollent"],
    variants: { deb: "Squat goblet", int: "Squat barre", adv: "Squat avec pause" } });
  ex({ id: 'leg_ext', name: 'Leg extension', eq: 'machine', type: 'isolation', lvl: 1,
    m: { quads: 1 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 5, start: 0.5, unit: 'total',
    desc: "Isolation des quadriceps.",
    setup: "Genou aligné avec l'axe de la machine, coussin au-dessus des chevilles.",
    exec: "Tendre les jambes, contracter 1 s, redescendre lentement.",
    mistakes: ["Élan", "Soulever le bassin", "Retour brutal"],
    variants: { deb: "Leg extension", int: "Leg extension", adv: "Unilatéral" } });
  ex({ id: 'leg_curl', name: 'Leg curl assis', eq: 'machine', type: 'isolation', lvl: 1,
    m: { hamstrings: 1, calves: 0.25 },
    reps: [10, 15], sets: [2, 3], rest: 75, inc: 5, start: 0.45, unit: 'total',
    desc: "Isolation des ischio-jambiers.",
    setup: "Genou aligné avec l'axe, cuisses bloquées.",
    exec: "Fléchir les genoux au maximum, revenir lentement.",
    mistakes: ["Décoller le bassin", "Amplitude courte", "Élan"],
    variants: { deb: "Leg curl", int: "Leg curl", adv: "Leg curl unilatéral" } });
  ex({ id: 'rdl_db', name: 'Soulevé de terre jambes tendues haltères', eq: 'dumbbell', type: 'compound', lvl: 2,
    m: { hamstrings: 1, glutes: 0.75, lower_back: 0.5 },
    reps: [8, 12], sets: [3, 4], rest: 120, inc: 2, start: 0.3, unit: 'per_hand',
    desc: "Charnière de hanche : ischios et fessiers.",
    setup: "Debout, haltères devant les cuisses, genoux légèrement fléchis.",
    exec: "Pousser les hanches en arrière en gardant le dos neutre jusqu'à l'étirement des ischios, remonter.",
    mistakes: ["Dos arrondi", "Plier les genoux comme un squat", "Haltères loin des jambes"],
    variants: { deb: "Charnière au bâton", int: "SDT jambes tendues haltères", adv: "SDT roumain barre" } });
  ex({ id: 'hip_thrust', name: 'Hip thrust barre', eq: 'barbell', type: 'compound', lvl: 1,
    m: { glutes: 1, hamstrings: 0.25 },
    reps: [8, 12], sets: [3, 4], rest: 120, inc: 5, start: 0.9, unit: 'total',
    desc: "Isolation lourde des fessiers.",
    setup: "Haut du dos sur un banc, barre sur les hanches avec protection.",
    exec: "Pousser les hanches vers le haut jusqu'à l'alignement, menton rentré, redescendre.",
    mistakes: ["Hyperextension lombaire", "Pieds trop loin", "Amplitude partielle"],
    variants: { deb: "Pont fessier au sol", int: "Hip thrust", adv: "Hip thrust unilatéral" } });
  ex({ id: 'calf_raise', name: 'Mollets debout machine', eq: 'machine', type: 'isolation', lvl: 1,
    m: { calves: 1 },
    reps: [10, 15], sets: [3, 4], rest: 60, inc: 5, start: 1.0, unit: 'total',
    desc: "Isolation des mollets.",
    setup: "Avant des pieds sur la marche, épaules sous les coussins.",
    exec: "Monter sur la pointe des pieds, tenir 1 s, descendre en étirement complet.",
    mistakes: ["Rebond", "Amplitude courte", "Plier les genoux"],
    variants: { deb: "Mollets au poids du corps", int: "Machine", adv: "Unilatéral lesté" } });

  // ---- Inventaire précis du matériel (ce qu'une salle possède ou non) ----
  const EQUIP_ITEMS = {
    barbell:          { name: 'Barre olympique et disques', cat: 'Poids libres' },
    ez_bar:           { name: 'Barre EZ', cat: 'Poids libres' },
    dumbbells:        { name: 'Haltères', cat: 'Poids libres' },
    squat_rack:       { name: 'Rack à squat', cat: 'Poids libres' },
    bench_flat:       { name: 'Banc plat', cat: 'Bancs et stations' },
    bench_incline:    { name: 'Banc inclinable', cat: 'Bancs et stations' },
    bench_decline:    { name: 'Banc décliné', cat: 'Bancs et stations' },
    pullup_bar:       { name: 'Barre de traction', cat: 'Bancs et stations' },
    dip_station:      { name: 'Barres parallèles (dips)', cat: 'Bancs et stations' },
    back_ext_bench:   { name: 'Banc à lombaires 45°', cat: 'Bancs et stations' },
    ab_wheel:         { name: 'Roulette abdominale', cat: 'Bancs et stations' },
    cable_station:    { name: 'Poulie réglable / vis-à-vis', cat: 'Poulies' },
    lat_pulldown_m:   { name: 'Poulie haute (tirage vertical)', cat: 'Poulies' },
    low_row_m:        { name: 'Poulie basse (tirage horizontal)', cat: 'Poulies' },
    chest_press_m:    { name: 'Presse pectorale', cat: 'Machines guidées' },
    incline_press_m:  { name: 'Presse inclinée', cat: 'Machines guidées' },
    pec_deck_m:       { name: 'Pec deck / butterfly', cat: 'Machines guidées' },
    shoulder_press_m: { name: 'Presse à épaules', cat: 'Machines guidées' },
    lateral_raise_m:  { name: 'Machine élévations latérales', cat: 'Machines guidées' },
    row_machine_m:    { name: 'Rowing assis poitrine appuyée', cat: 'Machines guidées' },
    tbar_m:           { name: 'T-bar / landmine', cat: 'Machines guidées' },
    preacher_m:       { name: 'Machine curl pupitre', cat: 'Machines guidées' },
    crunch_m:         { name: 'Machine à crunch', cat: 'Machines guidées' },
    torso_rot_m:      { name: 'Machine rotation du buste', cat: 'Machines guidées' },
    leg_press_m:      { name: 'Presse à cuisses', cat: 'Machines jambes' },
    leg_ext_m:        { name: 'Leg extension', cat: 'Machines jambes' },
    leg_curl_m:       { name: 'Leg curl', cat: 'Machines jambes' },
    calf_m:           { name: 'Machine à mollets', cat: 'Machines jambes' }
  };
  // Besoins par exercice : chaque élément est requis ; un tableau = « l'un ou l'autre »
  const CABLE_ANY = ['cable_station', 'lat_pulldown_m'];
  const LOW_CABLE = ['cable_station', 'low_row_m'];
  const NEEDS = {
    bench_bb: ['barbell', 'bench_flat'], incline_bb: ['barbell', 'bench_incline'], bench_db: ['dumbbells', 'bench_flat'],
    incline_db: ['dumbbells', 'bench_incline'], decline_bb: ['barbell', 'bench_decline'], dips: ['dip_station'],
    chest_press_machine: ['chest_press_m'], incline_machine: ['incline_press_m'], cable_fly: ['cable_station'],
    low_high_fly: ['cable_station'], high_low_fly: ['cable_station'], pec_deck: ['pec_deck_m'], db_fly: ['dumbbells', 'bench_flat'], pushup: [],
    pullup: ['pullup_bar'], chinup: ['pullup_bar'], lat_pulldown: ['lat_pulldown_m'], pulldown_neutral: ['lat_pulldown_m'],
    bb_row: ['barbell'], db_row: ['dumbbells', 'bench_flat'], seated_row: ['low_row_m'], chest_row_machine: ['row_machine_m'],
    tbar_row: ['tbar_m'], straight_arm_pulldown: [CABLE_ANY],
    db_shrug: ['dumbbells'], bb_shrug: ['barbell'], face_pull: [CABLE_ANY],
    ohp_bb: ['barbell'], ohp_db: ['dumbbells', 'bench_incline'], shoulder_press_machine: ['shoulder_press_m'],
    lateral_raise_db: ['dumbbells'], lateral_raise_cable: [LOW_CABLE], lateral_raise_machine: ['lateral_raise_m'],
    rear_delt_fly: ['dumbbells'], reverse_pec_deck: ['pec_deck_m'], front_raise: ['dumbbells'], upright_row_cable: [LOW_CABLE],
    bb_curl: [['barbell', 'ez_bar']], db_curl: ['dumbbells'], incline_curl: ['dumbbells', 'bench_incline'], hammer_curl: ['dumbbells'],
    cable_curl: [LOW_CABLE], preacher_machine: ['preacher_m'],
    close_grip_bench: ['barbell', 'bench_flat'], pushdown: [CABLE_ANY], overhead_cable_ext: [CABLE_ANY],
    skullcrusher: [['ez_bar', 'barbell'], 'bench_flat'], db_overhead_ext: ['dumbbells'], bench_dips: ['bench_flat'],
    wrist_curl: ['dumbbells', 'bench_flat'], reverse_curl: [['ez_bar', 'barbell']],
    cable_crunch: [CABLE_ANY], hanging_leg_raise: [['pullup_bar', 'dip_station']], ab_wheel: ['ab_wheel'], machine_crunch: ['crunch_m'],
    torso_rotation_machine: ['torso_rot_m'], pallof_press: ['cable_station'], woodchopper: ['cable_station'], back_extension: ['back_ext_bench'],
    leg_press: ['leg_press_m'], goblet_squat: ['dumbbells'], back_squat: ['barbell', 'squat_rack'], leg_ext: ['leg_ext_m'],
    leg_curl: ['leg_curl_m'], rdl_db: ['dumbbells'], hip_thrust: ['barbell', 'bench_flat'], calf_raise: ['calf_m']
  };

  // Index + pondération par groupe
  const EXERCISES = {};
  X.forEach(function (e) {
    e.gw = {};
    Object.keys(e.m).forEach(function (mu) {
      const g = MUSCLES[mu].group;
      e.gw[g] = Math.max(e.gw[g] || 0, e.m[mu]);
    });
    e.primaryGroup = Object.keys(e.gw).filter(function (g) { return e.gw[g] === 1; })
      .sort(function (a, b) { return GROUPS[a].order - GROUPS[b].order; })[0];
    e.need = NEEDS[e.id] || [];
    EXERCISES[e.id] = e;
  });

  root.FORGE_DATA = { MUSCLES: MUSCLES, GROUPS: GROUPS, EQUIPMENT: EQUIPMENT, EQUIP_ITEMS: EQUIP_ITEMS, EXERCISES: EXERCISES, EXERCISE_LIST: X };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FORGE_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
