# 🎯 AR Boule Explorer — Guide d'intégration MindAR.js

## 📖 Comment intégrer un modèle 3D animé avec MindAR.js (selon la doc officielle)

> Source : [Documentation MindAR.js](https://hiukim.github.io/mind-ar-js-doc/quick-start/overview)

MindAR.js propose **2 méthodes** pour intégrer de l'AR :
- **A-Frame** (HTML déclaratif, plus simple)
- **Three.js** (JavaScript programmatique, plus flexible)

Ce projet utilise la méthode **Three.js + React**.

---

## 🔧 Les 6 étapes pour intégrer un modèle 3D animé

### Étape 1 — Préparer les images cibles (Target Images)

Compiler les images que la caméra doit reconnaître :

1. Aller sur le [MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
2. Glisser-déposer les images à reconnaître
3. Cliquer **Start** pour compiler
4. **Télécharger** le fichier `.mind` généré (ex: `targets.mind`)
5. Placer ce fichier dans `public/` de votre projet

```
public/
  targets.mind    ← Fichier compilé avec les features des images
```

> 💡 **Astuce** : Plus une image a de détails et de contraste, mieux elle sera détectée. Évitez les images trop uniformes.

---

### Étape 2 — Préparer le modèle 3D (GLTF/GLB)

Le format recommandé est **.glb** (GLTF binaire, tout-en-un) :

- Exporter depuis **Blender** : `File > Export > glTF 2.0 (.glb)`
- S'assurer que les **animations** sont incluses dans l'export
- S'assurer que les **matériaux** sont inclus (sinon le modèle sera invisible !)
- Placer le fichier dans `public/models/`

```
public/
  models/
    boule.glb    ← Modèle 3D avec animations
```

> ⚠️ **Important** : Si le GLB n'a pas de matériaux, il faut en assigner un par code (voir `mindar-three-viewer.js` → `MeshStandardMaterial`).

---

### Étape 3 — Initialiser MindAR (Three.js)

```javascript
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

const mindarThree = new MindARThree({
  container: document.getElementById("container"),  // Élément HTML conteneur
  imageTargetSrc: "/targets.mind",                   // Fichier compilé des marqueurs
});

const { renderer, scene, camera } = mindarThree;
```

**Ce que ça fait** : Crée le moteur AR avec la caméra du téléphone et prépare la scène Three.js.

---

### Étape 4 — Créer une ancre (Anchor) sur le marqueur

```javascript
const anchor = mindarThree.addAnchor(0);  // 0 = index du marqueur dans le .mind
```

**Ce que ça fait** : Crée un point d'ancrage 3D lié à l'image cible n°0. Tout objet ajouté à `anchor.group` apparaîtra au-dessus de cette image quand elle est détectée.

> Pour plusieurs marqueurs : `addAnchor(0)`, `addAnchor(1)`, `addAnchor(2)`, etc.

---

### Étape 5 — Charger le modèle GLB et l'attacher à l'ancre

```javascript
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

loader.load("/models/boule.glb", (gltf) => {
  const model = gltf.scene;

  // Ajuster la taille et la position
  model.scale.set(0.5, 0.5, 0.5);    // Taille
  model.position.set(0, 0, 0);        // Position par rapport au marqueur

  // Attacher le modèle au marqueur
  anchor.group.add(model);

  // Si le modèle a des animations
  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
    // Stocker le mixer pour l'updater dans la boucle de rendu
  }
});
```

**Ce que ça fait** :
- `GLTFLoader` charge le fichier `.glb`
- `gltf.scene` contient le modèle 3D
- `anchor.group.add(model)` attache le modèle au marqueur
- `AnimationMixer` gère les animations intégrées au fichier

---

### Étape 6 — Démarrer MindAR et la boucle de rendu

```javascript
const clock = new THREE.Clock();

// Démarrer la caméra et la détection
await mindarThree.start();

// Boucle de rendu (appelée à chaque frame ~60fps)
renderer.setAnimationLoop(() => {
  // Mettre à jour les animations
  const delta = clock.getDelta();
  mixer.update(delta);  // Met à jour l'animation du modèle

  // Rendu de la scène
  renderer.render(scene, camera);
});
```

**Ce que ça fait** :
- `start()` active la caméra et commence la détection d'images
- `setAnimationLoop` est appelée ~60 fois/seconde
- `mixer.update(delta)` fait avancer les animations
- Quand un marqueur est détecté → le modèle apparaît automatiquement
- Quand le marqueur disparaît → le modèle disparaît

---

## 📁 Architecture du projet actuel

```
mind-ar-js-react/
├── public/
│   ├── targets8.mind              ← 13 images cibles compilées
│   └── models/
│       └── boule.glb              ← Modèle 3D (sphère avec animation)
│
├── src/
│   ├── App.js                     ← Interface (boutons Start/Stop)
│   ├── config.js                  ← Configuration (scale, position, fichiers)
│   ├── mindar-three-viewer.js     ← Logique AR principale (Three.js)
│   └── components/
│       └── DiagnosticPanel.js     ← Panneau de diagnostic en overlay
│
├── vercel.json                    ← Config déploiement Vercel
└── package.json                   ← Dépendances (mind-ar, three, react)
```

---

## ⚙️ Configuration rapide (`src/config.js`)

```javascript
export const AR_CONFIG = {
  targetFile: "/targets8.mind",      // Images cibles compilées
  modelFile: "/models/boule.glb",    // Modèle 3D à afficher

  model: {
    scale: 0.5,       // Taille du modèle (0.1 = petit, 1 = taille réelle)
    positionY: -1,    // Position verticale (-1 compense le décalage interne du GLB)
    rotationX: 0,     // Rotation X en radians
    rotationY: 0,     // Rotation Y en radians
    rotationZ: 0,     // Rotation Z en radians
  },
};
```

---

## 🚀 Commandes

```bash
# Installer les dépendances
npm install

# Lancer en développement (localhost)
npm start

# Lancer en HTTPS (nécessaire pour la caméra sur mobile)
npm run start-https

# Compiler pour la production
npm run build
```

---

## 🔍 Checklist avant de tester

- [ ] Le fichier `.mind` est dans `public/`
- [ ] Le fichier `.glb` est dans `public/models/`
- [ ] Le modèle `.glb` contient des **matériaux** (sinon → invisible)
- [ ] L'app est servie en **HTTPS** ou sur **localhost** (requis pour la caméra)
- [ ] Le navigateur a les **permissions caméra**

---

## 📚 Liens utiles

- [Documentation MindAR.js](https://hiukim.github.io/mind-ar-js-doc/quick-start/overview)
- [Compilateur d'images cibles](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
- [Exemples officiels](https://hiukim.github.io/mind-ar-js-doc/examples/summary)
- [GitHub MindAR.js](https://github.com/hiukim/mind-ar-js)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
