import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import * as THREE from "three";
import { AR_CONFIG } from "./config";

// ─── Helpers Three.js ──────────────────────────────────────────

/** Crée une flèche 3D (cylindre + cône) pointant vers +X */
function createArrowGroup() {
  const group = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.3, roughness: 0.4 });

  // Corps de la flèche
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 10), red);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 0.16;
  group.add(shaft);

  // Pointe
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 10), red);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.4;
  group.add(tip);

  // Socle
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14),
    new THREE.MeshStandardMaterial({ color: 0xcc0000 })
  );
  group.add(base);

  return group;
}

/** Crée une boîte au trésor procédurale */
function createTreasureGroup() {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xb8860b, metalness: 0.6, roughness: 0.3,
    emissive: 0x7a5700, emissiveIntensity: 0.2,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d00, metalness: 0.4, roughness: 0.5 });

  // Base de la boîte
  const boxBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.24), goldMat);
  boxBase.position.y = 0.09;
  group.add(boxBase);

  // Cerclages
  [-0.1, 0, 0.1].forEach((z) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.02), darkMat);
    band.position.set(0, 0.09, z);
    group.add(band);
  });

  // Couvercle (pivote autour de son bord arrière)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.18, -0.12); // bord arrière
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.24), goldMat);
  lid.position.set(0, 0, 0.12); // offset pour pivoter sur le bord
  lidPivot.add(lid);
  group.add(lidPivot);

  // Serrure
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.04), darkMat);
  lock.position.set(0, 0.2, 0.13);
  group.add(lock);

  // Étincelles dorées (particules)
  const particles = [];
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffd700, transparent: true, opacity: 0,
  });
  for (let i = 0; i < 24; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), particleMat.clone());
    p.position.set(0, 0.18, 0);
    p.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      Math.random() * 0.018 + 0.006,
      (Math.random() - 0.5) * 0.01
    );
    p.userData.life = 0;
    p.userData.maxLife = 1.5 + Math.random() * 1.5;
    p.userData.active = false;
    particles.push(p);
    group.add(p);
  }

  return { group, lidPivot, particles };
}

/** Anime la flèche (easeOutExpo, rotation Y) */
function spinArrow(arrowGroup, finalAngle, duration, onDone) {
  const startTime = performance.now();
  const totalAngle = Math.PI * 2 * 6 + finalAngle; // 6 tours + angle final
  const tick = (now) => {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
    arrowGroup.rotation.y = totalAngle * eased;
    if (t < 1) requestAnimationFrame(tick);
    else onDone && onDone();
  };
  requestAnimationFrame(tick);
}

/** Anime l'ouverture du couvercle + fait apparaître les particules */
function openTreasure(lidPivot, particles, duration, onDone) {
  const startTime = performance.now();
  let particlesStarted = false;
  const tick = (now) => {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    lidPivot.rotation.x = -Math.PI * 0.85 * eased; // ouvre vers l'arrière
    if (t > 0.45 && !particlesStarted) {
      particlesStarted = true;
      particles.forEach((p) => { p.material.opacity = 1; p.userData.active = true; });
    }
    if (t < 1) requestAnimationFrame(tick);
    else onDone && onDone();
  };
  requestAnimationFrame(tick);
}

/** Met à jour les particules dans la boucle de rendu */
function updateParticles(particles, delta) {
  particles.forEach((p) => {
    if (!p.userData.active) return;
    p.userData.life += delta;
    p.position.addScaledVector(p.userData.vel, 1);
    p.userData.vel.y -= delta * 0.01;
    const ratio = 1 - p.userData.life / p.userData.maxLife;
    p.material.opacity = Math.max(0, ratio * (Math.sin(p.userData.life * 12) * 0.5 + 0.5));
    if (p.userData.life > p.userData.maxLife) {
      p.position.set(
        (Math.random() - 0.5) * 0.14,
        0.18 + Math.random() * 0.06,
        (Math.random() - 0.5) * 0.14
      );
      p.userData.vel.set(
        (Math.random() - 0.5) * 0.01,
        Math.random() * 0.018 + 0.006,
        (Math.random() - 0.5) * 0.01
      );
      p.userData.life = 0;
      p.userData.maxLife = 1.5 + Math.random() * 1.5;
    }
  });
}

/**
 * MindARThreeViewer
 * Props:
 *   onMarkerFound(markerConfig)          – marqueur détecté
 *   onMarkerLost(markerId)               – marqueur perdu
 *   onTreasureAnimationEnd(markerConfig) – animation coffre terminée → bouton actif
 */
const MindARThreeViewer = ({ onMarkerFound, onMarkerLost, onTreasureAnimationEnd }) => {
  const containerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // Refs stables pour les callbacks React
  const onMarkerFoundRef = useRef(onMarkerFound);
  const onMarkerLostRef = useRef(onMarkerLost);
  const onTreasureAnimationEndRef = useRef(onTreasureAnimationEnd);
  useEffect(() => { onMarkerFoundRef.current = onMarkerFound; }, [onMarkerFound]);
  useEffect(() => { onMarkerLostRef.current = onMarkerLost; }, [onMarkerLost]);
  useEffect(() => { onTreasureAnimationEndRef.current = onTreasureAnimationEnd; }, [onTreasureAnimationEnd]);

  useEffect(() => {
    let cleanup = () => { };
    const container = containerRef.current;

    const init = async () => {
      try {
        const mindarThree = new MindARThree({
          container,
          imageTargetSrc: AR_CONFIG.targetFile,
        });

        const { scene, camera } = mindarThree;
        let renderer = mindarThree.renderer;

        // ── Forcer alpha sur le renderer ───────────────────────────────────
        // MindAR crée le renderer en interne sans alpha → fond noir opaque.
        // On recrée un renderer avec alpha: true et on le substitue.
        const newRenderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,                         // ← la clé du fix
        });
        newRenderer.setClearColor(0x000000, 0); // fond 100% transparent
        newRenderer.setPixelRatio(renderer.getPixelRatio());
        newRenderer.setSize(
          renderer.domElement.width / renderer.getPixelRatio(),
          renderer.domElement.height / renderer.getPixelRatio()
        );
        newRenderer.domElement.style.position = 'absolute';
        newRenderer.domElement.style.top = '0';
        newRenderer.domElement.style.left = '0';
        newRenderer.domElement.style.width = '100%';
        newRenderer.domElement.style.height = '100%';
        newRenderer.domElement.style.zIndex = '2';
        newRenderer.domElement.style.background = 'transparent';

        // Remplacer le canvas original
        const oldCanvas = renderer.domElement;
        if (oldCanvas.parentNode) {
          oldCanvas.parentNode.replaceChild(newRenderer.domElement, oldCanvas);
        }
        renderer.dispose();
        renderer = newRenderer;
        // Mettre à jour la référence interne de MindAR
        mindarThree.renderer = renderer;

        // Éclairage
        scene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(1, 1, 1);
        scene.add(dirLight);

        // Données par marqueur (particules, etc.)
        const markerData = {};

        AR_CONFIG.markers.forEach((markerCfg) => {
          const anchor = mindarThree.addAnchor(markerCfg.id);

          if (markerCfg.type === 'clue') {
            const arrowGroup = createArrowGroup();
            arrowGroup.scale.setScalar(0.6);
            arrowGroup.position.y = 0.05;
            anchor.group.add(arrowGroup);
            markerData[markerCfg.id] = { arrowGroup };

            anchor.onTargetFound = () => {
              console.log(`🗺️  Indice ${markerCfg.id} trouvé — flèche en rotation`);
              onMarkerFoundRef.current && onMarkerFoundRef.current(markerCfg);
              arrowGroup.rotation.y = 0;
              spinArrow(arrowGroup, markerCfg.finalAngle, AR_CONFIG.arrowSpinDuration);
            };
            anchor.onTargetLost = () => {
              onMarkerLostRef.current && onMarkerLostRef.current(markerCfg.id);
            };

          } else if (markerCfg.type === 'treasure') {
            const { group, lidPivot, particles } = createTreasureGroup();
            group.scale.setScalar(0.8);
            anchor.group.add(group);
            markerData[markerCfg.id] = { particles, opened: false };

            anchor.onTargetFound = () => {
              console.log(`💰 Trésor ${markerCfg.id} trouvé — ouverture du coffre`);
              onMarkerFoundRef.current && onMarkerFoundRef.current(markerCfg);
              if (!markerData[markerCfg.id].opened) {
                markerData[markerCfg.id].opened = true;
                openTreasure(lidPivot, particles, AR_CONFIG.treasureOpenDuration, () => {
                  onTreasureAnimationEndRef.current && onTreasureAnimationEndRef.current(markerCfg);
                });
              }
            };
            anchor.onTargetLost = () => {
              onMarkerLostRef.current && onMarkerLostRef.current(markerCfg.id);
            };
          }
        });

        // Démarrer MindAR
        await mindarThree.start();
        console.log("✅ MindAR démarré avec succès");

        // ── Forcer la visibilité du flux vidéo ────────────────────────────
        // Après le start(), MindAR a créé l'élément <video> dans le container.
        // On s'assure qu'il est bien visible en arrière-plan.
        const videos = container.querySelectorAll('video');
        videos.forEach((v) => {
          v.style.position = 'absolute';
          v.style.top = '0';
          v.style.left = '0';
          v.style.width = '100%';
          v.style.height = '100%';
          v.style.objectFit = 'cover';
          v.style.zIndex = '0';
          v.style.display = 'block';
          v.setAttribute('playsinline', '');
        });

        // S'assurer que tous les canvas sauf le nôtre sont en dessous
        const canvases = container.querySelectorAll('canvas');
        canvases.forEach((c) => {
          if (c !== renderer.domElement) {
            c.style.position = 'absolute';
            c.style.top = '0';
            c.style.left = '0';
            c.style.zIndex = '1';
          }
        });

        // Boucle de rendu
        renderer.setAnimationLoop(() => {
          const delta = clockRef.current.getDelta();
          AR_CONFIG.markers
            .filter((m) => m.type === 'treasure')
            .forEach((m) => {
              if (markerData[m.id]?.particles) {
                updateParticles(markerData[m.id].particles, delta);
              }
            });
          renderer.render(scene, camera);
        });

        cleanup = () => {
          renderer.setAnimationLoop(null);
          mindarThree.stop();
          renderer.dispose();
        };

      } catch (err) {
        console.error("❌ Erreur MindAR:", err);
        alert(`Erreur MindAR: ${err.message}\n\nVérifiez permissions caméra et HTTPS.`);
      }
    };

    init();

    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    />
  );
};

export default MindARThreeViewer;
