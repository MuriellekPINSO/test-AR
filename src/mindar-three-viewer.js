import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AR_CONFIG } from "./config";

const MindARThreeViewer = () => {
  const containerRef = useRef(null);
  const mixersRef = useRef([]); // Pour gérer les animations GLTF
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    console.log("🔧 Initialisation MindAR...");
    console.log("📍 Container:", containerRef.current);
    console.log("📁 Target file:", AR_CONFIG.targetFile);
    console.log("🎨 Model file:", AR_CONFIG.modelFile);

    // Vérifier WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    console.log(gl ? '✅ WebGL supporté' : '❌ WebGL NON supporté');

    try {
      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: AR_CONFIG.targetFile,
      });

      console.log("✅ MindARThree initialisé");

      const { renderer, scene, camera } = mindarThree;

      // Configurer l'éclairage
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      const pointLight = new THREE.PointLight(0xffffff, 1.0, 100);
      pointLight.position.set(0, 5, 5);
      scene.add(pointLight);

      // Créer des ancres pour les marqueurs
      const numMarkers = AR_CONFIG.markers.length;
      const anchors = [];
      for (let i = 0; i < numMarkers; i++) {
        anchors.push(mindarThree.addAnchor(i));
      }
      console.log(`✅ ${numMarkers} marqueurs créés (indices 0-${numMarkers - 1})`);

      // Charger le modèle GLB
      const loader = new GLTFLoader();

      loader.load(
        AR_CONFIG.modelFile,
        (gltf) => {
          console.log("✅ Modèle GLB (boule) chargé avec succès !");
          console.log(`📊 Animations trouvées: ${gltf.animations.length}`);
          if (gltf.animations.length > 0) {
            gltf.animations.forEach((clip, i) => {
              console.log(`   🎬 Animation ${i}: "${clip.name}" (${clip.duration.toFixed(2)}s)`);
            });
          }

          // Ajouter le modèle à CHAQUE ancre/marqueur
          anchors.forEach((anchor, index) => {
            const model = gltf.scene.clone();

            // Appliquer la configuration de taille/position
            const { scale, positionY, rotationX, rotationY, rotationZ } = AR_CONFIG.model;
            model.scale.set(scale, scale, scale);
            model.position.set(0, positionY, 0);
            model.rotation.set(rotationX, rotationY, rotationZ);

            // Assigner un matériau visible si le modèle n'en a pas
            const defaultMaterial = new THREE.MeshStandardMaterial({
              color: 0xFFD700,       // Doré
              metalness: 0.7,
              roughness: 0.2,
              emissive: 0xCC9900,
              emissiveIntensity: 0.3,
            });

            model.traverse((child) => {
              if (child.isMesh) {
                if (!child.material || !child.material.color) {
                  console.log(`🎨 Matériau par défaut appliqué à: ${child.name}`);
                  child.material = defaultMaterial;
                } else {
                  console.log(`🎨 Mesh "${child.name}" a déjà un matériau`);
                }
              }
            });

            // Ajouter le modèle à l'ancre du marqueur
            anchor.group.add(model);
            console.log(`🎯 Boule ajoutée au marqueur ${index} (échelle: ${scale})`);

            // Configurer les animations si le modèle en a
            if (gltf.animations && gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();
              });
              mixersRef.current.push(mixer);
              console.log(`✨ Animations démarrées pour marqueur ${index}`);
            }
          });

          console.log("🎉 Boule attachée à tous les marqueurs ! Scannez une image pour la voir.");
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`⏳ Chargement boule.glb: ${percent.toFixed(0)}%`);
          }
        },
        (error) => {
          console.error("❌ Erreur chargement boule.glb:", error);
          console.error("💡 Vérifiez que le fichier boule.glb est présent dans public/models/");
        }
      );

      // Démarrer MindAR
      mindarThree.start().then(() => {
        console.log("✅ MindAR démarré - caméra active");
        console.log("🔍 Scannez une image cible pour voir la boule 3D !");
      }).catch((error) => {
        console.error("❌ Erreur démarrage MindAR:", error);
        alert(`Erreur MindAR: ${error.message}\n\nVérifiez:\n- Permissions caméra\n- Utilisez HTTPS ou localhost`);
      });

      // Boucle de rendu
      renderer.setAnimationLoop(() => {
        // Mettre à jour les animations
        const delta = clockRef.current.getDelta();
        mixersRef.current.forEach((mixer) => mixer.update(delta));

        // Rendu
        renderer.render(scene, camera);
      });

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
      return () => { };
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }} ref={containerRef}></div>
  );
};

export default MindARThreeViewer;
