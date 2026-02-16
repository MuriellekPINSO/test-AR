import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import * as THREE from "three";

const MindARThreeViewer = () => {
  const containerRef = useRef(null);
  const mixersRef = useRef([]); // Pour gérer les animations GLTF
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    console.log("🔧 Initialisation MindAR...");
    console.log("📍 Container:", containerRef.current);
    console.log("📁 Target file: /targets8.mind");
    console.log("🎨 Model file: /models/tresor.gltf");

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

      // 🎯 MODÈLE DE TEST - Cube animé (remplace temporairement le GLTF)
      console.log("🧪 Création d'un cube de test pour l'animation...");

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
                if (!animationsStarted[index]) {
                  console.log(`🎬 LANCEMENT ANIMATION pour marqueur ${index} !`);
                  addAnimatedTestCube(anchor, index);
                  animationsStarted[index] = true;
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

      // 🎯 Fonction pour ajouter le cube de test animé
      const addAnimatedTestCube = (anchor, markerIndex) => {
        console.log(`🧪 Création du cube de test pour marqueur ${markerIndex}`);
        
        // Créer un groupe pour contenir plusieurs objets
        const group = new THREE.Group();
        
        // 🟡 Cube principal - doré comme un trésor
        const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const cubeMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFD700, // Or
          shininess: 100 
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.y = 0.15; // Surélevé
        group.add(cube);
        
        // 🔵 Particules autour du cube
        const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const particles = [];
        
        for (let i = 0; i < 5; i++) {
          const particle = new THREE.Mesh(sphereGeometry, particleMaterial);
          const angle = (i / 5) * Math.PI * 2;
          const radius = 0.6;
          particle.position.x = Math.cos(angle) * radius;
          particle.position.z = Math.sin(angle) * radius;
          particle.position.y = 0.3 + Math.sin(i) * 0.1;
          particles.push(particle);
          group.add(particle);
        }
        
        // Ajouter le groupe à l'ancre
        anchor.group.add(group);
        
        // 🎬 Animation avec requestAnimationFrame
        let startTime = Date.now();
        const animate = () => {
          if (!anchor.visible) return; // Arrêter si marqueur non visible
          
          const elapsed = (Date.now() - startTime) / 1000; // temps en secondes
          
          // Rotation du cube principal
          cube.rotation.x = elapsed * 0.5;
          cube.rotation.y = elapsed * 1.2;
          
          // Mouvement de haut en bas
          cube.position.y = 0.15 + Math.sin(elapsed * 3) * 0.1;
          
          // Animation des particules en orbite
          particles.forEach((particle, i) => {
            const angle = (i / 5) * Math.PI * 2 + elapsed * 2;
            const radius = 0.6;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = 0.3 + Math.sin(elapsed * 4 + i) * 0.2;
            
            // Rotation des particules
            particle.rotation.x = elapsed * 2;
            particle.rotation.y = elapsed * 3;
          });
          
          // Continuer l'animation si le marqueur est visible
          if (anchor.visible) {
            requestAnimationFrame(animate);
          }
        };
        
        // Démarrer l'animation
        requestAnimationFrame(animate);
        
        console.log(`✨ Animation du cube de test démarrée pour marqueur ${markerIndex}`);
        console.log(`🎯 Effet : Cube doré en rotation avec particules en orbite`);
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
