# 🎯 AR Treasure Box - Configuration

## 📋 Setup Effectué

### 1. **Fichiers Intégrés**
- ✅ `targets (8).mind` → Fichier compilé avec 2-3 marqueurs AR
- ✅ `models/scene.gltf` → Modèle 3D de la boîte au trésor avec animations

### 2. **Fonctionnalités**
- 🎬 **Chargement GLTF automatique** au démarrage
- 🎯 **Détection multi-marqueurs** (3 marqueurs supportés)
- ⏱️ **Délai de 2 secondes** avant lancement de l'animation
- 🔄 **Gestion automatique des animations** ThreeJS
- 📍 **Affichage d'infos** sur les marqueurs chargés

### 3. **Architecture du Code**

```
src/
├── App.js                          ← Interface principale
├── mindar-three-viewer.js          ← Logique AR (mise à jour)
├── config.js                       ← Configuration centralisée
├── App.css                         ← Styles (mise à jour)
└── components/
    └── MarkerInfo.js               ← Affichage info marqueurs

public/
├── targets (8).mind                ← Marqueurs compilés
└── models/
    └── scene.gltf                  ← Modèle 3D avec animations
```

### 4. **Comment ça Marche**

```javascript
// Détection du marqueur
1. MindAR détecte l'image → Marqueur visible
2. Chronomètre démarre (detectionTimes[index])
3. Attendre 2 secondes (2000 ms)
4. Lancer l'animation GLTF
5. Marqueur disparu → Réinitialiser
```

### 5. **Personnalisation**

Modifiez `src/config.js` :
```javascript
animationDelay: 2000,        // Modifier le délai
model: {
  scale: 0.5,              // Taille du modèle
  positionY: 0,            // Hauteur
  // ... autres propriétés
}
```

### 6. **Vérification**

Ouvrez la console du navigateur pour voir :
```
✅ Modèle GLTF chargé
🎯 Marqueur 0 détecté
⏱️ [2 secondes passent]
🎬 Animation lancée pour marqueur 0
🎨 Animation GLTF démarrée pour marqueur 0
```

### 7. **Notes Importants**

- ⚠️ Assurez-vous que `targets (8).mind` contient exactement 2-3 images
- ⚠️ Le fichier `scene.gltf` doit avoir des animations intégrées
- ⚠️ GLTFLoader se charge automatiquement (package three)
- ⚠️ Les marqueurs 0, 1, 2 correspondent aux 3 images du `.mind`

## 🚀 Lancer le Projet

```bash
npm start
# ou
pnpm start
```

---

**Créé le:** 22 Janvier 2026
**Configuration AR:** Multi-marqueurs + GLTF + Délai
