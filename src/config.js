/**
 * Configuration AR — Chasse au trésor
 */

export const AR_CONFIG = {
  // Fichier compilé des marqueurs (13 images)
  targetFile: "/targets8.mind",

  // Durée de l'animation de la flèche (ms)
  arrowSpinDuration: 3500,

  // Durée de l'animation d'ouverture du trésor (ms)
  treasureOpenDuration: 3000,

  /**
   * Marqueurs : deux types
   *   type: 'clue'     → flèche tournoyante qui pointe vers une autre carte
   *   type: 'treasure' → boîte au trésor qui s'ouvre
   *
   * finalAngle (clue)  : angle final de la flèche en radians (rotation Y)
   * points (treasure)  : points remportés par le joueur
   * reward (treasure)  : libellé du butin
   */
  markers: [
    // --- Indices ---
    { id: 0,  type: 'clue',     name: 'Indice 1',  finalAngle: Math.PI * 0.5  },
    { id: 1,  type: 'clue',     name: 'Indice 2',  finalAngle: Math.PI * 1.0  },
    { id: 2,  type: 'clue',     name: 'Indice 3',  finalAngle: Math.PI * 1.5  },
    { id: 3,  type: 'clue',     name: 'Indice 4',  finalAngle: Math.PI * 0.25 },
    { id: 4,  type: 'clue',     name: 'Indice 5',  finalAngle: Math.PI * 0.75 },
    { id: 5,  type: 'clue',     name: 'Indice 6',  finalAngle: Math.PI * 1.25 },
    { id: 6,  type: 'clue',     name: 'Indice 7',  finalAngle: Math.PI * 0.0  },
    { id: 7,  type: 'clue',     name: 'Indice 8',  finalAngle: Math.PI * 1.75 },
    { id: 8,  type: 'clue',     name: 'Indice 9',  finalAngle: Math.PI * 0.6  },
    { id: 9,  type: 'clue',     name: 'Indice 10', finalAngle: Math.PI * 1.2  },
    // --- Trésors ---
    { id: 10, type: 'treasure', name: 'Trésor A',  points: 100, reward: 'Diamant'       },
    { id: 11, type: 'treasure', name: 'Trésor B',  points: 150, reward: 'Rubis'          },
    { id: 12, type: 'treasure', name: 'Trésor C',  points: 200, reward: "Étoile d'or"   },
  ],
};

export default AR_CONFIG;
