import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class TreasureBox {
  constructor() {
    this.group = new THREE.Group();
    this.isOpen = false;
    this.isOpening = false;
    this.model = null; // Référence au modèle chargé
    this.openableParts = []; // Pièces du modèle qui peuvent s'ouvrir
    this.particles = [];
    this.loader = new GLTFLoader();
  }

  async create() {
    console.log("🎁 Chargement du modèle de trésor...");

    try {
      // Charger le modèle GLB
      const gltf = await new Promise((resolve, reject) => {
        this.loader.load('/models/tt.glb', resolve, undefined, reject);
      });

      this.model = gltf.scene;
      
      // Analyser la structure du modèle pour trouver les parties ouvrables
      this.analyzeModel(this.model);
      
      // Ajouter le modèle au groupe
      this.group.add(this.model);
      
      // Créer les effets de particules
      this.createParticles();

      console.log("✨ Modèle de trésor chargé avec succès !");
      console.log(`📦 Parties détectées: ${this.openableParts.length}`);
      return this.group;
    } catch (error) {
      console.error("❌ Erreur chargement du modèle:", error);
      // Fallback sur la boîte classique
      this.createFallbackBox();
      console.log("🔄 Création d'une boîte de secours");
      return this.group;
    }
  }

  analyzeModel(object) {
    // Analyser la structure du modèle
    console.log("🔍 Analyse du modèle 3D...");
    
    object.traverse((child) => {
      if (child.isMesh) {
        console.log(`  📦 Mesh trouvé: ${child.name}`);
        
        // Rechercher les parties qui ressemblent à des couvercles/lids
        const nameLower = child.name.toLowerCase();
        if (nameLower.includes('lid') || 
            nameLower.includes('cover') || 
            nameLower.includes('top') || 
            nameLower.includes('door') ||
            nameLower.includes('couvercle') ||
            nameLower.includes('couvelle')) {
          
          console.log(`  ✅ Partie ouvrable détectée: ${child.name}`);
          this.openableParts.push({
            mesh: child,
            name: child.name,
            initialRotation: child.rotation.clone(),
            initialPosition: child.position.clone(),
            axis: 'z' // Axe de rotation par défaut
          });
        }
      }
    });

    // Si aucune partie ouvrables détectées, on prend le premier mesh important
    if (this.openableParts.length === 0) {
      console.log("⚠️ Aucune partie ouvrable explicitement détectée");
      
      // Essayer de trouver le mesh principal
      let mainMesh = null;
      object.traverse((child) => {
        if (child.isMesh && !mainMesh) {
          mainMesh = child;
        }
      });

      if (mainMesh) {
        console.log("🔧 Utilisation du premier mesh du modèle");
        this.openableParts.push({
          mesh: mainMesh,
          name: mainMesh.name || "Main",
          initialRotation: mainMesh.rotation.clone(),
          initialPosition: mainMesh.position.clone(),
          axis: 'z'
        });
      }
    }
  }

  createFallbackBox() {
    // Créer une boîte simple en cas d'erreur
    const boxGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.3);
    const boxMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xB8860B,
      shininess: 10,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 0.075;
    this.group.add(box);
  }

  createParticles() {
    // Particules dorées qui scintillent quand la boîte s'ouvre
    const particleGeometry = new THREE.SphereGeometry(0.003, 6, 6);
    
    for (let i = 0; i < 30; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700, // Dorées
        transparent: true,
        opacity: 0
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(0, 0.15, 0);
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          Math.random() * 0.015 + 0.008,
          (Math.random() - 0.5) * 0.008
        ),
        life: 0,
        maxLife: 2 + Math.random() * 2
      };
      
      this.particles.push(particle);
      this.group.add(particle);
    }
  }

  open() {
    if (this.isOpen || this.isOpening) return;
    
    console.log("🎁 Ouverture du trésor !");
    this.isOpening = true;
    
    // Animer l'ouverture des parties détectées
    if (this.openableParts.length > 0) {
      const duration = 2000; // 2 secondes
      const startTime = Date.now();
      
      const animateOpening = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Animation avec courbe d'ease-out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Animer chaque partie ouvrable
        this.openableParts.forEach((part, index) => {
          const rotation = Math.PI * 0.8 * easeProgress; // Ouverture à ~144°
          
          // Appliquer la rotation selon l'axe
          if (part.axis === 'x') {
            part.mesh.rotation.x = part.initialRotation.x + rotation;
          } else if (part.axis === 'y') {
            part.mesh.rotation.y = part.initialRotation.y + rotation;
          } else {
            part.mesh.rotation.z = part.initialRotation.z + rotation;
          }
        });
        
        // Montrer les particules à mi-parcours
        if (progress > 0.5) {
          this.startParticleEffect();
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateOpening);
        } else {
          this.isOpen = true;
          this.isOpening = false;
          console.log("🎊 Trésor ouvert !");
        }
      };
      
      animateOpening();
    } else {
      this.isOpen = true;
      this.isOpening = false;
    }
  }

  startParticleEffect() {
    // Activer les particules
    this.particles.forEach(particle => {
      if (particle.material.opacity === 0) {
        particle.material.opacity = 1;
        particle.userData.life = 0;
      }
    });
  }

  update(deltaTime) {
    // Animer les particules dorées
    this.particles.forEach(particle => {
      if (particle.material.opacity > 0) {
        const userData = particle.userData;
        userData.life += deltaTime;
        
        // Mouvement
        particle.position.add(userData.velocity);
        
        // Gravité légère
        userData.velocity.y -= deltaTime * 0.008;
        
        // Scintillement
        const scintillation = Math.sin(userData.life * 10) * 0.5 + 0.5;
        particle.material.opacity = Math.max(0, (1 - userData.life / userData.maxLife) * scintillation);
        
        // Reset si nécessaire
        if (userData.life > userData.maxLife) {
          particle.position.set(
            (Math.random() - 0.5) * 0.1,
            0.15 + Math.random() * 0.05,
            (Math.random() - 0.5) * 0.1
          );
          userData.velocity.set(
            (Math.random() - 0.5) * 0.008,
            Math.random() * 0.015 + 0.008,
            (Math.random() - 0.5) * 0.008
          );
          userData.life = 0;
          userData.maxLife = 2 + Math.random() * 2;
        }
      }
    });
  }

  close() {
    if (!this.isOpen) return;
    
    console.log("🔒 Fermeture du trésor");
    
    // Animation de fermeture
    const duration = 1500;
    const startTime = Date.now();
    
    const animateClosing = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Animer chaque partie ouvrable
      this.openableParts.forEach((part) => {
        const rotation = Math.PI * 0.8 * (1 - progress);
        
        if (part.axis === 'x') {
          part.mesh.rotation.x = part.initialRotation.x + rotation;
        } else if (part.axis === 'y') {
          part.mesh.rotation.y = part.initialRotation.y + rotation;
        } else {
          part.mesh.rotation.z = part.initialRotation.z + rotation;
        }
      });
      
      if (progress > 0.7) {
        this.particles.forEach(particle => {
          particle.material.opacity = 0;
        });
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateClosing);
      } else {
        this.isOpen = false;
      }
    };
    
    animateClosing();
  }
}

export default TreasureBox;