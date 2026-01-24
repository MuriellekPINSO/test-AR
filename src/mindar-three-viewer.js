import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MindARThreeViewer = () => {
  const containerRef = useRef(null);
  const mixersRef = useRef([]); // Pour gérer les animations GLTF
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    console.log("🔧 Initialisation MindAR...");
    console.log("📍 Container:", containerRef.current);
    console.log("📁 Target file: /targets8.mind");
    console.log("🎨 Model file: /models/scene.gltf");

    // Vérifier WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    console.log(gl ? '✅ WebGL supporté' : '❌ WebGL NON supporté');

    // Vérifier les permissions média
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(d => d.kind === 'videoinput');
        console.log(`📹 Caméras détectées: ${cameras.length}`);
      })
      .catch(err => console.error("❌ Erreur énumération devices:", err));

    try {
      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/targets8.mind",
      });

      console.log("✅ MindARThree initialisé");

      const { renderer, scene, camera } = mindarThree;

      // Configurer l'éclairage
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);
      
      const pointLight1 = new THREE.PointLight(0xff6b6b, 1.5, 100);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);
      
      const pointLight2 = new THREE.PointLight(0x4ecdc4, 1.2, 100);
      pointLight2.position.set(-5, 3, -5);
      scene.add(pointLight2);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Créer des ancres pour 13 marqueurs (0 à 12)
      const anchors = [];
      for (let i = 0; i < 13; i++) {
        anchors.push(mindarThree.addAnchor(i));
      }
      console.log("✅ 13 marqueurs créés (indices 0-12)");

      // Charger le modèle GLTF une fois
      let gltfModel = null;
      
      const loader = new GLTFLoader();
      
      loader.load(
        "/models/scene.gltf",
        (gltf) => {
          gltfModel = gltf;
          console.log("✅ Modèle GLTF chargé");
          console.log(`📊 Animations trouvées: ${gltf.animations.length}`);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`⏳ Chargement GLTF: ${percent.toFixed(0)}%`);
          }
        },
        (error) => {
          console.error("❌ Erreur chargement GLTF:", error);
          console.error("💡 Vérifiez que tous les fichiers (scene.gltf, scene.bin, textures/) sont présents");
        }
      );

      // État pour tracker quand chaque marqueur a été détecté
      const detectionTimes = Array(13).fill(null);
      const animationsStarted = Array(13).fill(false);
      const lastVisibleState = Array(13).fill(false); // Nouveau: tracker changements d'état
      let modelAlreadyAdded = false; // 🎁 Garder seulement un modèle
      
      let frameCount = 0; // Compteur pour logs périodiques

      mindarThree.start().then(() => {
        console.log("✅ MindAR démarré avec succès - caméra active");
        console.log("🔍 Scannez maintenant l'un des 3 marqueurs...");
      }).catch((error) => {
        console.error("❌ Erreur démarrage MindAR:", error);
        console.error("Type d'erreur:", error.name);
        console.error("Message:", error.message);
        alert(`Erreur MindAR: ${error.message}\n\nVérifiez:\n- Permissions caméra\n- Fichier targets (8).mind existe\n- Utilisez HTTPS ou localhost`);
      });

      renderer.setAnimationLoop(() => {
        frameCount++;
        
        // Log périodique toutes les 60 frames (~1 seconde)
        if (frameCount % 60 === 0) {
          const visibleMarkers = anchors.map((a, i) => a.visible ? i : -1).filter(i => i >= 0);
          if (visibleMarkers.length > 0) {
            console.log(`👁️ Marqueurs visibles: [${visibleMarkers.join(', ')}]`);
          } else {
            console.log(`🔎 Recherche de marqueurs... (frame ${frameCount})`);
          }
        }
        
        // Mettre à jour les animations GLTF
        const delta = clockRef.current.getDelta();
        mixersRef.current.forEach((mixer) => mixer.update(delta));

        // Vérifier l'état de chaque marqueur
        anchors.forEach((anchor, index) => {
          const isVisible = anchor.visible;
          
          // Détecter changement d'état (apparition/disparition)
          if (isVisible !== lastVisibleState[index]) {
            if (isVisible) {
              console.log(`🟢 MARQUEUR ${index} DÉTECTÉ !`);
              console.log(`   → Temps avant animation: 2 secondes`);
            } else {
              console.log(`🔴 Marqueur ${index} perdu`);
            }
            lastVisibleState[index] = isVisible;
          }

          if (isVisible && !animationsStarted[index]) {
            // Marqueur détecté pour la première fois
            if (detectionTimes[index] === null) {
              detectionTimes[index] = Date.now();
              console.log(`⏱️ Chronomètre démarré pour marqueur ${index}`);
            } else {
              const elapsed = Date.now() - detectionTimes[index];
              const remaining = 2000 - elapsed;
              
              // Log du compte à rebours toutes les 500ms
              if (Math.floor(elapsed / 500) !== Math.floor((elapsed - 16) / 500)) {
                console.log(`⏳ Marqueur ${index}: ${(remaining / 1000).toFixed(1)}s restantes...`);
              }
              
              if (elapsed >= 2000) {
                // 2 secondes écoulées - lancer l'animation
                if (gltfModel && !modelAlreadyAdded) {
                  console.log(`🎬 LANCEMENT ANIMATION pour marqueur ${index} !`);
                  addAnimatedModel(anchor, gltfModel, index);
                  modelAlreadyAdded = true; // 🎁 Un seul modèle
                  animationsStarted[index] = true;
                } else if (!gltfModel) {
                  console.warn(`⚠️ Modèle GLTF pas encore chargé pour marqueur ${index}`);
                }
              }
            }
          } else if (!isVisible && detectionTimes[index] !== null) {
            // Marqueur disparu - réinitialiser
            console.log(`🔄 Réinitialisation marqueur ${index}`);
            detectionTimes[index] = null;
            animationsStarted[index] = false;
          }
        });

        renderer.render(scene, camera);
      });

      // Fonction pour ajouter le modèle animé
      const addAnimatedModel = (anchor, gltf, markerIndex) => {
        const model = gltf.scene.clone();
        model.scale.set(0.5, 0.5, 0.5);
        model.position.y = 0;

        anchor.group.add(model);

        // Configurer les animations GLTF
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          
          // Jouer toutes les animations (ouverture, affichage trésor, fermeture)
          gltf.animations.forEach((clip, index) => {
            const action = mixer.clipAction(clip);
            action.clampWhenFinished = true; // Garder la dernière frame
            action.play();
            console.log(`🎬 Animation ${index} (${clip.name}): ${(clip.duration).toFixed(2)}s`);
          });
          
          mixersRef.current.push(mixer);
          console.log(`✨ Animations du trésor démarrées pour marqueur ${markerIndex}`);
        } else {
          console.warn(`⚠️ Aucune animation trouvée pour marqueur ${markerIndex}`);
        }
      };

      return () => {
        renderer.setAnimationLoop(null);
        mindarThree.stop();
        mixersRef.current.forEach((mixer) => mixer.uncacheRoot(mixer.getRoot()));
        mixersRef.current = [];
      };
    } catch (error) {
      console.error("❌ Erreur Initialisation MindAR:", error);
      console.error("Stack:", error.stack);
      alert(`Erreur critique: ${error.message}\n\nVérifiez la console (F12) pour plus de détails`);
      return () => {}; // Nettoyage vide en cas d'erreur
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }} ref={containerRef}></div>
  );
};

export default MindARThreeViewer;
