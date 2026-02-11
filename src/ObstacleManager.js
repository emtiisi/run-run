import * as THREE from 'three';

export class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.patternIndex = 0;
    }

    reset() {
        this.obstacles.forEach(obs => this.game.scene.remove(obs.mesh));
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.patternIndex = 0;
    }

    // Different obstacle patterns for variety
    getPattern() {
        const patterns = [
            // Single obstacle
            () => [Math.floor(Math.random() * 3) - 1],
            // Two side by side
            () => {
                const skip = Math.floor(Math.random() * 3) - 1;
                return [-1, 0, 1].filter(l => l !== skip);
            },
            // Single random
            () => [Math.floor(Math.random() * 3) - 1],
            // Wall with gap (two obstacles, one open)
            () => {
                const open = Math.floor(Math.random() * 3) - 1;
                return [-1, 0, 1].filter(l => l !== open);
            },
            // Single center
            () => [0],
            // Single side
            () => [Math.random() > 0.5 ? -1 : 1],
        ];

        this.patternIndex = (this.patternIndex + 1) % patterns.length;
        return patterns[this.patternIndex]();
    }

    spawn() {
        const lanes = this.getPattern();

        lanes.forEach(lane => {
            // Varied obstacle types
            const obstacleType = Math.random();
            let geometry, color, scale;

            if (obstacleType < 0.4) {
                // Spiky octahedron
                geometry = new THREE.OctahedronGeometry(0.7);
                color = 0xff0055;
                scale = 1.0;
            } else if (obstacleType < 0.7) {
                // Tall pillar
                geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 6);
                color = 0xff3300;
                scale = 1.0;
            } else {
                // Wide box
                geometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
                color = 0xcc0066;
                scale = 1.0;
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.1,
                metalness: 0.8,
                flatShading: true
            });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.scale.setScalar(scale);

            mesh.position.set(lane * 3.0, 0.5, -50);
            this.game.scene.add(mesh);

            this.obstacles.push({ mesh, active: true });
        });
    }

    update(delta, speed) {
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.6, 20 / speed);
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.z += speed * delta;
            obs.mesh.rotation.x += delta;
            obs.mesh.rotation.y += delta;

            if (obs.mesh.position.z > 10) {
                this.game.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkCollision(playerMesh) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        playerBox.expandByScalar(-0.15);

        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            const obsBox = new THREE.Box3().setFromObject(obs.mesh);
            if (playerBox.intersectsBox(obsBox)) {
                return obs;
            }
        }
        return null;
    }

    removeObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.game.scene.remove(obstacle.mesh);
            this.obstacles.splice(index, 1);
        }
    }
}
