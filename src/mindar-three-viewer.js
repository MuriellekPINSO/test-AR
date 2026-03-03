import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
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

/**
 * Crée les particules dorées pour l'effet d'ouverture du trésor
 */
function createGoldParticles(count = 30) {
  const particles = [];
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffd700, transparent: true, opacity: 0,
  });
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 6, 6),
      particleMat.clone()
    );
    p.position.set(0, 0, 0);
    p.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.015,
      Math.random() * 0.025 + 0.01,
      (Math.random() - 0.5) * 0.015
    );
    p.userData.life = 0;
    p.userData.maxLife = 1.5 + Math.random() * 2;
    p.userData.active = false;
    particles.push(p);
  }
  return particles;
}

/**
 * Crée un halo lumineux doré autour du trésor
 */
function createGlowRing() {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.25, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  return ring;
}

/**
 * Anime l'apparition du trésor (scale up + rotation + glow + particules)
 */
function animateTreasureReveal(treasureGroup, glowRing, particles, duration, onDone) {
  const startTime = performance.now();
  let particlesStarted = false;

  // Phase 1 (0-40%) : le coffre grossit en tournant
  // Phase 2 (40-70%) : glow apparaît, particules
  // Phase 3 (70-100%) : stabilisation

  const tick = (now) => {
    const t = Math.min((now - startTime) / duration, 1);

    // Scale up avec rebond
    if (t < 0.4) {
      const s = t / 0.4;
      const eased = 1 - Math.pow(1 - s, 3);
      const scale = eased * 0.55;
      treasureGroup.scale.setScalar(scale);
      treasureGroup.rotation.y = s * Math.PI * 2;
    } else {
      // Légère oscillation
      const osc = Math.sin((t - 0.4) * 8) * 0.02 * (1 - t);
      treasureGroup.scale.setScalar(0.55 + osc);
      treasureGroup.rotation.y = Math.PI * 2 + (t - 0.4) * 0.3;
    }

    // Glow ring
    if (t > 0.3) {
      const gt = Math.min((t - 0.3) / 0.4, 1);
      glowRing.material.opacity = gt * 0.5 * (1 + Math.sin(now * 0.005) * 0.3);
      glowRing.scale.setScalar(1 + gt * 0.3 + Math.sin(now * 0.003) * 0.1);
    }

    // Particules
    if (t > 0.35 && !particlesStarted) {
      particlesStarted = true;
      particles.forEach((p) => {
        p.material.opacity = 1;
        p.userData.active = true;
      });
    }

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onDone && onDone();
    }
  };
  requestAnimationFrame(tick);
}

/** Met à jour les particules dans la boucle de rendu */
function updateParticles(particles, delta) {
  particles.forEach((p) => {
    if (!p.userData.active) return;
    p.userData.life += delta;
    p.position.addScaledVector(p.userData.vel, 1);
    p.userData.vel.y -= delta * 0.008;
    const ratio = 1 - p.userData.life / p.userData.maxLife;
    p.material.opacity = Math.max(0, ratio * (Math.sin(p.userData.life * 12) * 0.5 + 0.5));
    if (p.userData.life > p.userData.maxLife) {
      p.position.set(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.1,
        (Math.random() - 0.5) * 0.2
      );
      p.userData.vel.set(
        (Math.random() - 0.5) * 0.015,
        Math.random() * 0.025 + 0.01,
        (Math.random() - 0.5) * 0.015
      );
      p.userData.life = 0;
      p.userData.maxLife = 1.5 + Math.random() * 2;
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

    // Pré-charger le modèle GLB
    const gltfLoader = new GLTFLoader();
    let treasureModelTemplate = null;

    const init = async () => {
      try {
        // ── Charger le modèle de coffre au trésor ──────────────────
        console.log("📦 Chargement du modèle treasure_chest.glb...");
        try {
          const gltf = await new Promise((resolve, reject) => {
            gltfLoader.load("/models/treasure_chest.glb", resolve, undefined, reject);
          });
          treasureModelTemplate = gltf.scene;
          console.log("✅ Modèle de coffre chargé avec succès !");
        } catch (modelErr) {
          console.warn("⚠️ Impossible de charger treasure_chest.glb, coffre procédural utilisé:", modelErr);
        }

        const mindarThree = new MindARThree({
          container,
          imageTargetSrc: AR_CONFIG.targetFile,
        });

        const { scene, camera } = mindarThree;
        let renderer = mindarThree.renderer;

        // ── Forcer alpha sur le renderer ───────────────────────────────────
        const newRenderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        newRenderer.setClearColor(0x000000, 0);
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
        mindarThree.renderer = renderer;

        // Éclairage
        scene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(1, 1, 1);
        scene.add(dirLight);

        // Lumière ponctuelle dorée pour les trésors
        const goldLight = new THREE.PointLight(0xffd700, 0, 2);
        goldLight.position.set(0, 0.3, 0);
        scene.add(goldLight);

        // Données par marqueur
        const markerData = {};

        AR_CONFIG.markers.forEach((markerCfg) => {
          const anchor = mindarThree.addAnchor(markerCfg.id);

          if (markerCfg.type === 'clue') {
            // ── INDICE : Flèche directionnelle ─────────────────────
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
            // ── TRÉSOR : Vrai modèle GLB ───────────────────────────
            const treasureContainer = new THREE.Group();
            treasureContainer.scale.setScalar(0); // caché au départ

            // Créer les effets
            const particles = createGoldParticles(35);
            const glowRing = createGlowRing();

            // Ajouter le modèle 3D (clone du template)
            if (treasureModelTemplate) {
              const model = treasureModelTemplate.clone();
              // Ajuster la taille et position du modèle
              // Calculer la bounding box pour centrer et redimensionner
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const targetSize = 0.5; // taille souhaitée
              const scaleFactor = targetSize / maxDim;
              model.scale.multiplyScalar(scaleFactor);

              // Centrer le modèle
              const center = box.getCenter(new THREE.Vector3());
              model.position.sub(center.multiplyScalar(scaleFactor));
              model.position.y = 0; // poser sur le sol

              treasureContainer.add(model);
              console.log(`💰 Modèle GLB attaché au trésor ${markerCfg.id}`);
            } else {
              // Fallback : coffre procédural
              const fallbackGeo = new THREE.BoxGeometry(0.32, 0.18, 0.24);
              const fallbackMat = new THREE.MeshStandardMaterial({
                color: 0xb8860b, metalness: 0.6, roughness: 0.3,
                emissive: 0x7a5700, emissiveIntensity: 0.2,
              });
              const fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
              fallback.position.y = 0.09;
              treasureContainer.add(fallback);
            }

            // Ajouter les effets au container
            treasureContainer.add(glowRing);
            particles.forEach((p) => treasureContainer.add(p));
            anchor.group.add(treasureContainer);

            markerData[markerCfg.id] = {
              treasureContainer,
              particles,
              glowRing,
              revealed: false,
            };

            anchor.onTargetFound = () => {
              console.log(`💰 Trésor ${markerCfg.id} trouvé — animation du coffre`);
              onMarkerFoundRef.current && onMarkerFoundRef.current(markerCfg);
              if (!markerData[markerCfg.id].revealed) {
                markerData[markerCfg.id].revealed = true;
                animateTreasureReveal(
                  treasureContainer,
                  glowRing,
                  particles,
                  AR_CONFIG.treasureOpenDuration,
                  () => {
                    onTreasureAnimationEndRef.current && onTreasureAnimationEndRef.current(markerCfg);
                  }
                );
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

          // Mettre à jour les particules et le glow de chaque trésor
          AR_CONFIG.markers
            .filter((m) => m.type === 'treasure')
            .forEach((m) => {
              const data = markerData[m.id];
              if (data?.particles) {
                updateParticles(data.particles, delta);
              }
              // Animer le glow ring en continu
              if (data?.glowRing && data.revealed) {
                const time = performance.now() * 0.001;
                data.glowRing.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;
                data.glowRing.rotation.z += delta * 0.5;
              }
              // Légère lévitation du coffre
              if (data?.treasureContainer && data.revealed) {
                const time = performance.now() * 0.001;
                data.treasureContainer.position.y = Math.sin(time * 1.5) * 0.015;
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
