// Luna's vector geometry stays separate from the shared material and milestone catalog.
// These recipes are a 2D concept study, not production companion assets.
(() => {
  'use strict';
  const recipes = [
  {
    "form": "I",
    "concept": {
      "bodyScale": 0.78,
      "ruff": 0,
      "blaze": 0,
      "earTufts": 0,
      "mantle": 0,
      "cheekFan": 0,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "I",
    "concept": {
      "bodyScale": 0.78,
      "ruff": 0,
      "blaze": 1,
      "earTufts": 0,
      "mantle": 0,
      "cheekFan": 0,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "I",
    "concept": {
      "bodyScale": 0.78,
      "ruff": 0,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 0,
      "cheekFan": 0,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "I",
    "concept": {
      "bodyScale": 0.96,
      "ruff": 0,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 0,
      "cheekFan": 0,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "I",
    "concept": {
      "bodyScale": 0.96,
      "ruff": 0,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 0,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "II",
    "concept": {
      "bodyScale": 1.1,
      "ruff": 1,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 0,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "II",
    "concept": {
      "bodyScale": 1.1,
      "ruff": 1,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 1,
      "wideStance": 0,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "II",
    "concept": {
      "bodyScale": 1.22,
      "ruff": 1,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 1,
      "wideStance": 1,
      "faceMask": 0,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "II",
    "concept": {
      "bodyScale": 1.22,
      "ruff": 1,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 1,
      "wideStance": 1,
      "faceMask": 1,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "II",
    "concept": {
      "bodyScale": 1.22,
      "ruff": 2,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 1,
      "wideStance": 1,
      "faceMask": 1,
      "earPlumes": 0,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "II",
    "concept": {
      "bodyScale": 1.22,
      "ruff": 2,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 1,
      "wideStance": 1,
      "faceMask": 1,
      "earPlumes": 1,
      "renderer": "luna-vector-study-v1"
    }
  },
  {
    "form": "III",
    "concept": {
      "bodyScale": 1.38,
      "ruff": 3,
      "blaze": 1,
      "earTufts": 1,
      "mantle": 1,
      "cheekFan": 1,
      "wideStance": 1,
      "faceMask": 1,
      "earPlumes": 1,
      "renderer": "luna-vector-study-v1"
    }
  }
];
  window.HALO_EVOLUTION = Object.freeze({
    qualificationStatus: 'Concept only; production expression and monthly assets unqualified.',
    physicalCatalogSource: '../halo-i-catalog.js',
    stages: Object.freeze(window.HALO_I_CATALOG.map((stage, index) => Object.freeze({
      ...recipes[index],
      month: stage.month,
      name: stage.chapter,
      stone: {name: stage.stone},
      visual: {color: stage.color},
      minimumVisibleChange: stage.companion,
      reveal: stage.firstReveal
    })))
  });
})();
