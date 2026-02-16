import * as THREE from "three";

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
    // Base de la boîte - bois clair comme dans l'image
    const boxGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.3);
    const boxMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xB8860B, // Bois doré/beige
      shininess: 10,
    });
    
    this.box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.box.position.y = 0.075;
    
    // Renforts métalliques horizontaux - noir métallique
    const metalMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2C2C2C, // Noir métallique
      shininess: 80,
      metalness: 0.8
    });
    
    // Renfort horizontal du bas
    const bottomBandGeometry = new THREE.BoxGeometry(0.42, 0.025, 0.32);
    const bottomBand = new THREE.Mesh(bottomBandGeometry, metalMaterial);
    bottomBand.position.y = 0.02;
    this.box.add(bottomBand);
    
    // Renfort horizontal du milieu
    const middleBand = new THREE.Mesh(bottomBandGeometry, metalMaterial);
    middleBand.position.y = 0.075;
    this.box.add(middleBand);
    
    // Renfort horizontal du haut
    const topBand = new THREE.Mesh(bottomBandGeometry, metalMaterial);
    topBand.position.y = 0.13;
    this.box.add(topBand);
    
    // Renforts verticaux sur les côtés
    const verticalBandGeometry = new THREE.BoxGeometry(0.025, 0.16, 0.32);
    const leftBand = new THREE.Mesh(verticalBandGeometry, metalMaterial);
    leftBand.position.x = -0.19;
    leftBand.position.y = 0.075;
    this.box.add(leftBand);
    
    const rightBand = new THREE.Mesh(verticalBandGeometry, metalMaterial);
    rightBand.position.x = 0.19;
    rightBand.position.y = 0.075;
    this.box.add(rightBand);
    
    // Rivets sur les renforts
    const rivetGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8);
    const rivetMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x404040,
      shininess: 100
    });
    
    // Rivets sur les bandes horizontales
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        const rivet = new THREE.Mesh(rivetGeometry, rivetMaterial);
        rivet.position.x = -0.15 + j * 0.075;
        rivet.position.y = 0.02 + i * 0.055;
        rivet.position.z = 0.16;
        rivet.rotation.x = Math.PI / 2;
        this.box.add(rivet);
        
        // Rivets arrière
        const rivetBack = rivet.clone();
        rivetBack.position.z = -0.16;
        this.box.add(rivetBack);
      }
    }
    
    // Serrure métallique au centre
    const lockGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.02);
    const lock = new THREE.Mesh(lockGeometry, metalMaterial);
    lock.position.y = 0.075;
    lock.position.z = 0.16;
    this.box.add(lock);
    
    // Trou de serrure
    const keyholeGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8);
    const keyhole = new THREE.Mesh(keyholeGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    keyhole.position.y = 0.075;
    keyhole.position.z = 0.17;
    keyhole.rotation.x = Math.PI / 2;
    this.box.add(keyhole);
    
    this.group.add(this.box);
  }

  createLid() {
    // Couvercle bombé comme dans l'image
    this.lid = new THREE.Group();
    
    // Partie principale du couvercle - forme bombée
    const lidGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.08, 16, 1, false, 0, Math.PI);
    const lidMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xB8860B, // Même couleur que la base
      shininess: 10 
    });
    
    const lidMesh = new THREE.Mesh(lidGeometry, lidMaterial);
    lidMesh.rotation.z = Math.PI; // Retourner pour avoir la forme bombée vers le haut
    lidMesh.position.y = 0.04;
    
    // Renforts métalliques sur le couvercle
    const metalMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2C2C2C,
      shininess: 80,
      metalness: 0.8
    });
    
    // Renfort central sur le couvercle
    const lidBandGeometry = new THREE.CylinderGeometry(0.21, 0.23, 0.02, 16, 1, false, 0, Math.PI);
    const lidBand = new THREE.Mesh(lidBandGeometry, metalMaterial);
    lidBand.rotation.z = Math.PI;
    lidBand.position.y = 0.05;
    
    // Renforts sur les bords
    const edgeBandGeometry = new THREE.TorusGeometry(0.2, 0.01, 8, 16, Math.PI);
    const frontEdgeBand = new THREE.Mesh(edgeBandGeometry, metalMaterial);
    frontEdgeBand.rotation.x = Math.PI / 2;
    frontEdgeBand.position.y = 0.08;
    frontEdgeBand.position.z = 0.05;
    
    const backEdgeBand = new THREE.Mesh(edgeBandGeometry, metalMaterial);
    backEdgeBand.rotation.x = Math.PI / 2;
    backEdgeBand.rotation.y = Math.PI;
    backEdgeBand.position.y = 0.08;
    backEdgeBand.position.z = -0.05;
    
    // Poignées métalliques sur les côtés
    const handleGeometry = new THREE.TorusGeometry(0.03, 0.008, 8, 16);
    const handleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x404040,
      shininess: 100 
    });
    
    const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
    leftHandle.position.x = -0.18;
    leftHandle.position.y = 0.04;
    leftHandle.rotation.z = Math.PI / 2;
    
    const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
    rightHandle.position.x = 0.18;
    rightHandle.position.y = 0.04;
    rightHandle.rotation.z = Math.PI / 2;
    
    // Rivets sur le couvercle
    const rivetGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8);
    const rivetMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x404040,
      shininess: 100
    });
    
    for (let i = 0; i < 7; i++) {
      const angle = (i / 6) * Math.PI - Math.PI / 2;
      const rivet = new THREE.Mesh(rivetGeometry, rivetMaterial);
      rivet.position.x = Math.cos(angle) * 0.18;
      rivet.position.z = Math.sin(angle) * 0.18;
      rivet.position.y = 0.06;
      this.lid.add(rivet);
    }
    
    this.lid.add(lidMesh);
    this.lid.add(lidBand);
    this.lid.add(frontEdgeBand);
    this.lid.add(backEdgeBand);
    this.lid.add(leftHandle);
    this.lid.add(rightHandle);
    
    // Position initiale du couvercle (fermé)
    this.lid.position.y = 0.15;
    this.lid.position.z = -0.15; // Point de pivot arrière
    
    this.group.add(this.lid);
  }

  createTreasure() {
    // Groupe pour le trésor (invisible au début)
    this.treasure = new THREE.Group();
    this.treasure.visible = false;
    
    // Piles de pièces d'or brillantes
    const coinGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.003, 16);
    const coinMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFD700,
      shininess: 100,
      metalness: 0.9,
      roughness: 0.1
    });
    
    // Créer plusieurs piles de pièces
    const coinStacks = 8; // 8 piles de pièces
    for (let stack = 0; stack < coinStacks; stack++) {
      const stackHeight = 3 + Math.floor(Math.random() * 5); // 3-7 pièces par pile
      const angle = (stack / coinStacks) * Math.PI * 2;
      const radius = 0.08 + Math.random() * 0.06; // Disposition circulaire
      
      const stackX = Math.cos(angle) * radius;
      const stackZ = Math.sin(angle) * radius;
      
      for (let coin = 0; coin < stackHeight; coin++) {
        const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
        coinMesh.position.x = stackX + (Math.random() - 0.5) * 0.01; // Léger décalage
        coinMesh.position.y = 0.16 + coin * 0.0035; // Empilage
        coinMesh.position.z = stackZ + (Math.random() - 0.5) * 0.01;
        coinMesh.rotation.y = Math.random() * Math.PI * 2;
        
        // Gravure sur les pièces (petits détails)
        if (Math.random() > 0.7) {
          const embossGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.001, 8);
          const embossMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFA500,
            shininess: 150
          });
          const emboss = new THREE.Mesh(embossGeometry, embossMaterial);
          emboss.position.y = 0.0025;
          coinMesh.add(emboss);
        }
        
        this.treasure.add(coinMesh);
      }
    }
    
    // Quelques pièces éparpillées
    for (let i = 0; i < 12; i++) {
      const looseCoin = new THREE.Mesh(coinGeometry, coinMaterial);
      looseCoin.position.x = (Math.random() - 0.5) * 0.25;
      looseCoin.position.y = 0.16 + Math.random() * 0.02;
      looseCoin.position.z = (Math.random() - 0.5) * 0.18;
      looseCoin.rotation.x = Math.random() * Math.PI;
      looseCoin.rotation.y = Math.random() * Math.PI;
      looseCoin.rotation.z = Math.random() * Math.PI;
      this.treasure.add(looseCoin);
    }
    
    // Quelques lingots d'or pour la richesse
    const barGeometry = new THREE.BoxGeometry(0.04, 0.015, 0.02);
    const barMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFD700,
      shininess: 120,
      metalness: 1.0
    });
    
    for (let i = 0; i < 3; i++) {
      const goldBar = new THREE.Mesh(barGeometry, barMaterial);
      goldBar.position.x = (Math.random() - 0.5) * 0.1;
      goldBar.position.y = 0.167;
      goldBar.position.z = (Math.random() - 0.5) * 0.1;
      goldBar.rotation.y = Math.random() * Math.PI;
      this.treasure.add(goldBar);
    }
    
    this.group.add(this.treasure);
  }

  createParticles() {
    // Particules dorées qui scintillent quand la boîte s'ouvre
    const particleGeometry = new THREE.SphereGeometry(0.003, 6, 6);
    
    for (let i = 0; i < 30; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700, // Toutes dorées
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
        maxLife: 2 + Math.random() * 2 // 2-4 secondes de vie
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
    // Animer le trésor si visible - faire scintiller les pièces d'or
    if (this.treasure.visible) {
      const time = Date.now() * 0.001;
      this.treasure.children.forEach((coin, index) => {
        if (coin.geometry.type === 'CylinderGeometry') { // Pièces uniquement
          // Rotation lente des pièces
          coin.rotation.y += deltaTime * (0.5 + index * 0.1);
          
          // Léger mouvement de flottement
          coin.position.y += Math.sin(time * 2 + index) * 0.0002;
          
          // Scintillement doré
          const intensity = 0.8 + Math.sin(time * 4 + index) * 0.2;
          coin.material.emissive.setHex(0x332200);
          coin.material.emissiveIntensity = intensity * 0.1;
        } else if (coin.geometry.type === 'BoxGeometry') { // Lingots d'or
          coin.rotation.y += deltaTime * 0.3;
          coin.material.emissiveIntensity = 0.05 + Math.sin(time * 3 + index) * 0.02;
        }
      });
    }
    
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