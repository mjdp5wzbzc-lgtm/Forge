/* ==========================================================================
   Forge — silhouette anatomique (face / dos), SVG généré
   Chaque muscle est dessiné pour le côté gauche puis reflété.
   ========================================================================== */
(function (root) {
  'use strict';

  // Contour du corps (moitié gauche, x ≤ 100)
  const OUTLINE = 'M100 12 C88 12 80 22 80 35 C80 46 85 53 91 56 L91 62 C84 64 72 64 62 69 C52 73 46 82 45 96 L43 118 C42 128 41 134 40 140 C37 156 35 170 34 186 L32 198 C30 208 33 216 38 215 C41 214 43 208 44 198 L47 184 C50 168 53 154 55 140 L58 116 L60 108 C64 112 67 118 68 124 C70 142 70 160 68 182 C66 200 66 228 69 258 C71 282 73 298 73 310 C72 336 74 360 77 384 L76 398 C75 404 88 405 92 401 L92 388 C92 362 94 334 95 310 C96 284 98 246 100 210 Z';

  const FRONT = {
    traps:      ['M91 60 C86 62 78 64 68 67 C76 67 84 67 91 66 Z'],
    delt_front: ['M64 70 C71 70 75 76 73 86 C70 94 63 99 57 101 C56 89 58 77 64 70 Z'],
    delt_side:  ['M61 71 C53 74 47 82 46 98 C49 100 52 101 55 101 C55 89 56 79 61 71 Z'],
    pec_upper:  ['M75 69 C84 67 93 67 98 69 L98 81 C90 80 81 81 73 85 C75 80 76 74 75 69 Z'],
    pec_mid:    ['M73 88 C81 84 90 83 98 84 L98 95 C90 96 81 97 71 99 C71 95 72 91 73 88 Z'],
    pec_lower:  ['M71 102 C81 100 90 99 98 98 L98 106 C92 112 81 114 73 110 C71 108 71 105 71 102 Z'],
    biceps:     ['M54 104 C59 108 60 118 58 130 C56 136 50 137 47 132 C46 122 48 110 54 104 Z'],
    forearms:   ['M45 140 C51 138 54 143 52 157 C50 171 46 184 42 192 C38 190 36 186 36 182 C37 166 40 151 45 140 Z'],
    abs:        ['M87 114 L98 114 L98 179 C94 183 90 183 87 179 C86 157 86 135 87 114 Z'],
    obliques:   ['M72 118 C77 117 81 117 84 119 C83 140 83 160 84 178 C78 176 73 172 71 168 C72 150 72 134 72 118 Z'],
    quads:      ['M72 200 C80 196 92 202 96 214 C96 248 92 280 88 300 C82 302 78 300 76 296 C70 270 68 230 72 200 Z'],
    calves:     ['M78 318 C84 316 88 320 89 330 C88 350 86 368 84 380 C80 380 78 376 78 370 C76 352 76 334 78 318 Z']
  };

  const BACK = {
    traps:      ['M100 54 L100 98 C96 96 92 92 88 86 C83 79 75 74 65 70 C76 66 86 62 92 57 Z', 'M98 116 L100 116 L100 138 C98 132 96 124 95 118 Z'],
    delt_rear:  ['M64 71 C71 72 75 78 73 87 C69 94 62 99 57 101 C56 89 58 78 64 71 Z'],
    delt_side:  ['M61 71 C53 74 47 82 46 98 C49 100 52 101 55 101 C55 89 56 79 61 71 Z'],
    rhomboids:  ['M98 100 L98 114 C93 113 88 108 84 100 C85 96 87 92 89 89 C92 94 95 98 98 100 Z'],
    lats:       ['M71 100 C76 99 81 104 85 114 C89 126 93 140 96 156 C88 160 79 160 73 150 C71 134 69 116 71 100 Z'],
    triceps:    ['M49 101 C55 101 58 107 58 117 C58 127 56 134 52 136 C48 134 46 126 46 116 C46 108 47 103 49 101 Z'],
    forearms:   ['M45 140 C51 138 54 143 52 157 C50 171 46 184 42 192 C38 190 36 186 36 182 C37 166 40 151 45 140 Z'],
    lower_back: ['M90 161 L98 161 L98 192 L88 190 C88 180 88 170 90 161 Z'],
    glutes:     ['M71 196 C80 192 94 194 98 200 L98 232 C90 238 78 236 72 230 C68 220 68 206 71 196 Z'],
    hamstrings: ['M72 239 C80 241 92 241 96 237 C96 262 92 284 88 300 C82 302 78 300 76 296 C72 280 70 260 72 239 Z'],
    calves:     ['M76 316 C84 312 92 318 92 330 C92 346 88 360 84 370 C80 370 76 364 76 356 C74 342 74 328 76 316 Z']
  };

  // Détails décoratifs (non cliquables) : lignes des abdos, colonne
  const FRONT_DETAIL = '<path d="M87 130 H98 M87 146 H98 M87 162 H98" class="bd-line"/>';
  const BACK_DETAIL = '<path d="M100 60 V196" class="bd-line"/>';

  function half(map, side) {
    let out = '';
    Object.keys(map).forEach(m => {
      map[m].forEach(d => {
        out += `<path d="${d}" data-m="${m}" class="bd-m" />`;
      });
    });
    return out;
  }

  function svg(view, opts) {
    opts = opts || {};
    const map = view === 'back' ? BACK : FRONT;
    const detail = view === 'back' ? BACK_DETAIL : FRONT_DETAIL;
    const inner = `<path d="${OUTLINE}" class="bd-skin"/>` + half(map) + detail;
    return `<svg viewBox="22 6 156 422" class="body-svg" role="group" aria-label="Silhouette ${view === 'back' ? 'de dos' : 'de face'}">` +
      `<g>${inner}</g><g transform="translate(200 0) scale(-1 1)">${inner}</g>` +
      `<text x="100" y="420" text-anchor="middle" class="bd-cap">${view === 'back' ? 'DOS' : 'FACE'}</text>` +
      `</svg>`;
  }

  root.FORGE_BODY = { svg, FRONT, BACK };
})(typeof window !== 'undefined' ? window : globalThis);
