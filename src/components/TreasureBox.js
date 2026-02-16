import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class TreasureBox {
  constructor() {
    this.group = new THREE.Group();
    this.isOpen = false;
    this.isOpening = false;
    this.box = null;
    this.lid = null;
    this.treasure = null;
    this.gems = [];
    this.particles = [];
    this.mixer = null;
  }

  async create() {
    console.log("🎁 Création de la boîte au trésor...");

    // Créer la base de la boîte
    this.createBox();
    
    // Créer le couvercle
    this.createLid();
    
    // Créer le trésor à l'intérieur
    this.createTreasure();
    
    // Créer des effets de particules
    this.createParticles();

    console.log("✨ Boîte au trésor créée avec succès !");
    return this.group;
  }

  createBox() {
    // Base de la boîte - bois foncé
    const boxGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.3);
    const boxMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513, // Brun
      shininess: 30,
    });
    
    this.box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.box.position.y = 0.075; // Moitié de la hauteur
    
    // Ajouter des détails dorés sur la boîte
    const edgeGeometry = new THREE.BoxGeometry(0.42, 0.02, 0.32);
    const goldMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFD700,
      shininess: 100 
    });
    
    const bottomEdge = new THREE.Mesh(edgeGeometry, goldMaterial);
    bottomEdge.position.y = 0.01;
    this.box.add(bottomEdge);
    
    const topEdge = new THREE.Mesh(edgeGeometry, goldMaterial);
    topEdge.position.y = 0.14;
    this.box.add(topEdge);
    
    this.group.add(this.box);
  }

  createLid() {
    // Couvercle de la boîte
    this.lid = new THREE.Group();
    
    const lidGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.3);
    const lidMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x654321, // Brun plus foncé
      shininess: 30 
    });
    
    const lidMesh = new THREE.Mesh(lidGeometry, lidMaterial);
    lidMesh.position.y = 0.025;
    
    // Poignée dorée
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.03, 0.08);
    const handleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFD700,
      shininess: 100 
    });
    
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = 0.065;
    
    this.lid.add(lidMesh);
    this.lid.add(handle);
    
    // Position initiale du couvercle (fermé)
    this.lid.position.y = 0.15;
    this.lid.position.z = -0.15; // Point de pivot arrière
    
    this.group.add(this.lid);
  }

  createTreasure() {
    // Groupe pour le trésor (invisible au début)
    this.treasure = new THREE.Group();
    this.treasure.visible = false;
    
    // Pièces d'or
    const coinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 16);
    const coinMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFD700,
      shininess: 100 
    });
    
    for (let i = 0; i < 10; i++) {
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.x = (Math.random() - 0.5) * 0.2;
      coin.position.y = 0.16 + Math.random() * 0.05;
      coin.position.z = (Math.random() - 0.5) * 0.15;
      coin.rotation.x = Math.random() * Math.PI;
      coin.rotation.z = Math.random() * Math.PI;
      this.treasure.add(coin);
    }
    
    // Gemmes colorées
    const gemGeometry = new THREE.OctahedronGeometry(0.02);
    const gemColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFF00FF, 0x00FFFF];
    
    for (let i = 0; i < 5; i++) {
      const gemMaterial = new THREE.MeshPhongMaterial({ 
        color: gemColors[i],
        shininess: 100,
        transparent: true,
        opacity: 0.8
      });
      
      const gem = new THREE.Mesh(gemGeometry, gemMaterial);
      gem.position.x = (Math.random() - 0.5) * 0.15;
      gem.position.y = 0.18 + Math.random() * 0.03;
      gem.position.z = (Math.random() - 0.5) * 0.1;
      
      this.gems.push(gem);
      this.treasure.add(gem);
    }
    
    this.group.add(this.treasure);
  }

  createParticles() {
    // Particules magiques qui apparaissent quand la boîte s'ouvre
    const particleGeometry = new THREE.SphereGeometry(0.005, 8, 8);
    
    for (let i = 0; i < 20; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: Math.random() < 0.5 ? 0xFFD700 : 0xFFFACD,
        transparent: true,
        opacity: 0
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(0, 0.15, 0);
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          Math.random() * 0.02 + 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        life: 0
      };
      
      this.particles.push(particle);
      this.group.add(particle);
    }
  }

  open() {
    if (this.isOpen || this.isOpening) return;
    
    console.log("🎁 Ouverture de la boîte au trésor !");
    this.isOpening = true;
    
    // Animation d'ouverture du couvercle
    const startRotation = 0;
    const endRotation = -Math.PI * 0.7; // Ouverture à 126 degrés
    const duration = 2000; // 2 secondes
    const startTime = Date.now();
    
    const animateOpening = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Animation avec courbe d'ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Rotation du couvercle autour de l'axe X
      this.lid.rotation.x = startRotation + (endRotation - startRotation) * easeProgress;
      
      // Révéler le trésor à mi-parcours
      if (progress > 0.5 && !this.treasure.visible) {
        this.treasure.visible = true;
        this.startParticleEffect();
        console.log("✨ Trésor révélé !");
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateOpening);
      } else {
        this.isOpen = true;
        this.isOpening = false;
        console.log("🎊 Boîte au trésor ouverte !");
      }
    };
    
    animateOpening();
  }

  startParticleEffect() {
    // Activer les particules
    this.particles.forEach(particle => {
      particle.material.opacity = 1;
      particle.userData.life = 0;
    });
  }

  update(deltaTime) {
    // Animer le trésor si visible
    if (this.treasure.visible) {
      // Rotation des gemmes
      this.gems.forEach((gem, index) => {
        gem.rotation.x += deltaTime * (1 + index * 0.5);
        gem.rotation.y += deltaTime * (1.5 + index * 0.3);
        gem.position.y += Math.sin(Date.now() * 0.005 + index) * 0.0005;
      });
    }
    
    // Animer les particules
    this.particles.forEach(particle => {
      if (particle.material.opacity > 0) {
        const userData = particle.userData;
        userData.life += deltaTime;
        
        // Mouvement
        particle.position.add(userData.velocity);
        
        // Gravité
        userData.velocity.y -= deltaTime * 0.01;
        
        // Fade out
        const maxLife = 3; // 3 secondes
        particle.material.opacity = Math.max(0, 1 - userData.life / maxLife);
        
        // Reset si nécessaire
        if (userData.life > maxLife) {
          particle.position.set(0, 0.15, 0);
          userData.velocity.set(
            (Math.random() - 0.5) * 0.01,
            Math.random() * 0.02 + 0.01,
            (Math.random() - 0.5) * 0.01
          );
          userData.life = 0;
        }
      }
    });
  }

  close() {
    if (!this.isOpen) return;
    
    console.log("🔒 Fermeture de la boîte au trésor");
    
    // Animation de fermeture
    const startRotation = this.lid.rotation.x;
    const endRotation = 0;
    const duration = 1500;
    const startTime = Date.now();
    
    const animateClosing = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.lid.rotation.x = startRotation + (endRotation - startRotation) * progress;
      
      if (progress > 0.7) {
        this.treasure.visible = false;
        // Arrêter les particules
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