import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import * as THREE from "three";
import TreasureBox from "./components/TreasureBox";

const MindARThreeViewer = () => {
  const containerRef = useRef(null);
  const mixersRef = useRef([]); // Pour gérer les animations GLTF
  const clockRef = useRef(new THREE.Clock());
  const treasureBoxesRef = useRef([]); // Pour gérer les boîtes au trésor

  useEffect(() => {
    console.log("🔧 Initialisation MindAR...");
    console.log("📍 Container:", containerRef.current);
    console.log("📁 Target file: /targets8.mind");
      console.log("🎁 Modèle: Boîte au trésor interactive");
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

      // 🎯 BOÎTE AU TRÉSOR INTERACTIVE
      console.log("🎁 Préparation des boîtes au trésor pour 13 marqueurs...");

      // État pour tracker quand chaque marqueur a été détecté
      const detectionTimes = Array(13).fill(null);
      const animationsStarted = Array(13).fill(false);
      const lastVisibleState = Array(13).fill(false); // Nouveau: tracker changements d'état
      
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
        
        // Mettre à jour les animations GLTF et les boîtes au trésor
        const delta = clockRef.current.getDelta();
        mixersRef.current.forEach((mixer) => mixer.update(delta));
        treasureBoxesRef.current.forEach((treasureBox) => {
          if (treasureBox) treasureBox.update(delta);
        });

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
                // 2 secondes écoulées - lancer l'ouverture de la boîte
                if (!animationsStarted[index]) {
                  console.log(`🎁 OUVERTURE DE LA BOÎTE AU TRÉSOR pour marqueur ${index} !`);
                  addTreasureBox(anchor, index);
                  animationsStarted[index] = true;
                }
              }
            }
          } else if (!isVisible && detectionTimes[index] !== null) {
            // Marqueur disparu - fermer la boîte et réinitialiser
            if (treasureBoxesRef.current[index]) {
              treasureBoxesRef.current[index].close();
            }
            console.log(`🔄 Réinitialisation marqueur ${index}`);
            detectionTimes[index] = null;
            animationsStarted[index] = false;
          }
        });

        renderer.render(scene, camera);
      });

      // � Fonction pour ajouter une boîte au trésor
      const addTreasureBox = async (anchor, markerIndex) => {
        console.log(`🎁 Création de la boîte au trésor pour marqueur ${markerIndex}`);
        
        try {
          const treasureBox = new TreasureBox();
          const treasureGroup = await treasureBox.create();
          
          // Ajouter la boîte à l'ancre
          anchor.group.add(treasureGroup);
          
          // Stocker la référence pour les updates
          treasureBoxesRef.current[markerIndex] = treasureBox;
          
          // Attendre un petit moment puis ouvrir la boîte
          setTimeout(() => {
            if (anchor.visible) {
              treasureBox.open();
            }
          }, 500); // Délai de 0.5 secondes pour l'effet dramatique
          
          console.log(`✨ Boîte au trésor créée et programmée pour s'ouvrir pour marqueur ${markerIndex}`);
          
        } catch (error) {
          console.error(`❌ Erreur création boîte au trésor pour marqueur ${markerIndex}:`, error);
          
          // Fallback : créer un cube simple
          console.log(`🔄 Création d'un cube de secours pour marqueur ${markerIndex}`);
          const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const material = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.y = 0.1;
          anchor.group.add(cube);
        }
      };

      return () => {
        renderer.setAnimationLoop(null);
        mindarThree.stop();
        mixersRef.current.forEach((mixer) => mixer.uncacheRoot(mixer.getRoot()));
        mixersRef.current = [];
        treasureBoxesRef.current = [];
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
