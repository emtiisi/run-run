import * as THREE from 'three';

export class PowerupManager {
    constructor(game) {
        this.game = game;
        this.powerups = [];
        this.spawnTimer = 0;
        this.spawnInterval = 8.0; // Less frequent than obstacles
    }

    reset() {
        this.powerups.forEach(p => this.game.scene.remove(p.mesh));
        this.powerups = [];
        this.spawnTimer = 0;
        this.spawnInterval = 8.0;
    }

    spawn() {
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const type = Math.random() > 0.5 ? 'SHIELD' : 'BOOST';

        let geometry, material;
        if (type === 'SHIELD') {
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
            material = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000aa }); // Blue
        } else {
            geometry = new THREE.ConeGeometry(0.4, 1, 4);
            material = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00 }); // Yellow
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(lane * 3.0, 0.5, -50);

        this.game.scene.add(mesh);
        this.powerups.push({ mesh, type, active: true });
    }

    update(delta, speed) {
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(2.0, 60 / speed);
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
