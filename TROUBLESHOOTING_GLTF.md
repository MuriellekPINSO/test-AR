# 🔧 Résolution du Problème GLTF

## ❌ Erreur Actuelle

```
❌ Erreur chargement GLTF: RangeError: Invalid typed array length: 3726
THREE.GLTFLoader: Couldn't load texture textures/Material.001_baseColor.jpeg
THREE.GLTFLoader: Couldn't load texture textures/Material.001_clearcoat.png
```

## 🎯 Solutions

### **Solution 1 : Ajouter les Textures Manquantes** ⭐ Recommandé

Votre fichier `scene.gltf` référence des textures externes. Créez cette structure :

```
public/
  └── models/
      ├── scene.gltf
      ├── scene.bin (si séparé)
      └── textures/
          ├── Material.001_baseColor.jpeg
          └── Material.001_clearcoat.png
```

**Actions :**
1. Localisez les fichiers de texture (`.jpeg`, `.png`)
2. Créez le dossier `public/models/textures/`
3. Copiez les textures dedans

---

### **Solution 2 : Convertir en GLB** ⭐⭐ Meilleure Solution

Un fichier `.glb` contient tout (géométrie + textures) en un seul fichier binaire.

**Outil en ligne :**
1. Allez sur https://glb.ee/ ou https://products.aspose.app/3d/conversion/gltf-to-glb
2. Uploadez votre `scene.gltf` + textures
3. Téléchargez le fichier `scene.glb`
4. Remplacez dans votre code :

```javascript
// Changez :
loader.load("/models/scene.gltf", ...)

// Par :
loader.load("/models/scene.glb", ...)
```

---

### **Solution 3 : Utiliser un Modèle de Test**

Pour tester rapidement, utilisez un modèle simple sans textures :

```javascript
// Dans mindar-three-viewer.js, remplacez temporairement par un cube :
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
anchor.group.add(cube);
```

---

### **Solution 4 : Réparer le Fichier GLTF**

L'erreur `Invalid typed array length: 3726` suggère un problème de données.

**Validateur GLTF :**
1. Allez sur https://gltf-viewer.donmccurdy.com/
2. Glissez votre `scene.gltf`
3. Vérifiez les erreurs affichées
4. Corrigez-les dans votre logiciel 3D (Blender, etc.)

---

## 🧪 Vérification

Une fois corrigé, vous devriez voir :

```
✅ Modèle GLTF chargé
📊 Animations trouvées: X
🎯 Marqueur 0 détecté
🎬 Animation lancée pour marqueur 0
```

---

## 💡 Recommandations

1. **Toujours utiliser GLB** pour la production (plus fiable)
2. **Vérifier les chemins** des textures dans le fichier GLTF
3. **Tester les modèles** dans un viewer en ligne avant intégration
4. **Optimiser les tailles** de fichiers pour le web

---

**Besoin d'aide ?** Partagez votre fichier GLTF pour analyse !
