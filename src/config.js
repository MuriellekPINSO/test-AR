/**
 * Configuration AR - Marqueurs et Modèles
 */

export const AR_CONFIG = {
  // Fichier compilé des marqueurs (13 images)
  targetFile: "/targets8.mind",

  // Modèle 3D - Boîte au trésor interactive
  modelFile: "TreasureBox (Interactive 3D)",

  // Délai avant de lancer l'animation (en ms)
  animationDelay: 2000,

  // Marqueurs supportés
  markers: [
    { id: 0, name: "Marqueur 0", description: "Image 1" },
    { id: 1, name: "Marqueur 1", description: "Image 2" },
    { id: 2, name: "Marqueur 2", description: "Image 3" },
    { id: 3, name: "Marqueur 3", description: "Image 4" },
    { id: 4, name: "Marqueur 4", description: "Image 5" },
    { id: 5, name: "Marqueur 5", description: "Image 6" },
    { id: 6, name: "Marqueur 6", description: "Image 7" },
    { id: 7, name: "Marqueur 7", description: "Image 8" },
    { id: 8, name: "Marqueur 8", description: "Image 9" },
    { id: 9, name: "Marqueur 9", description: "Image 10" },
    { id: 10, name: "Marqueur 10", description: "Image 11" },
    { id: 11, name: "Marqueur 11", description: "Image 12" },
    { id: 12, name: "Marqueur 12", description: "Image 13" },
  ],

  // Configuration du modèle GLTF
  model: {
    scale: 0.5,
    positionY: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  },
};

export default AR_CONFIG;
