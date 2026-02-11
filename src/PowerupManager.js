import * as THREE from 'three';

export class PowerupManager {
    constructor(game) {
        this.game = game;
        this.powerups = [];
        this.spawnTimer = 0;
        this.spawnInterval = 30.0; // Less frequent than obstacles
    }

    reset() {
        this.powerups.forEach(p => this.game.scene.remove(p.mesh));
        this.powerups = [];
        this.spawnTimer = 0;
        this.spawnInterval = 30.0;
    }

    spawn() {
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const type = Math.random() > 0.5 ? 'SHIELD' : 'BOOST';

        const starShape = new THREE.Shape();
        const outerRadius = 0.5;
        const innerRadius = 0.25;
        const points = 5;

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) starShape.moveTo(x, y);
            else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const geometry = new THREE.ExtrudeGeometry(starShape, { depth: 0.2, bevelEnabled: false });
        geometry.center(); // Center the pivot

        let material;
        if (type === 'SHIELD') {
            material = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0044aa, metalness: 0.5, roughness: 0.2 }); // Blue Star
        } else {
            material = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, metalness: 0.5, roughness: 0.2 }); // Gold Star
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(lane * 3.0, 0.5, -50);

        this.game.scene.add(mesh);
        this.powerups.push({ mesh, type, active: true });
    }

    startCooldown() {
        this.spawnTimer = 0;
    }

    update(delta, speed) {
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pup = this.powerups[i];
            pup.mesh.position.z += speed * delta;
            pup.mesh.rotation.y += 2 * delta;

            if (pup.mesh.position.z > 10) {
                this.game.scene.remove(pup.mesh);
                this.powerups.splice(i, 1);
            }
        }
    }

    checkCollision(playerMesh) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        playerBox.expandByScalar(-0.2);

        for (let i = 0; i < this.powerups.length; i++) {
            const pup = this.powerups[i];
            const pupBox = new THREE.Box3().setFromObject(pup.mesh);

            if (playerBox.intersectsBox(pupBox)) {
                this.game.scene.remove(pup.mesh);
                this.powerups.splice(i, 1);
                return pup.type;
            }
        }
        return null;
    }
}
