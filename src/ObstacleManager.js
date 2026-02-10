import * as THREE from 'three';

export class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
    }

    reset() {
        this.obstacles.forEach(obs => this.game.scene.remove(obs.mesh));
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
    }

    spawn() {
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        // Spiky obstacle
        const geometry = new THREE.OctahedronGeometry(0.7);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0055,
            roughness: 0.1,
            metalness: 0.8,
            flatShading: true
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Add random rotation for variety
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;

        mesh.position.set(lane * 3.0, 0.5, -50); // Spawn 50 units ahead
        this.game.scene.add(mesh);

        this.obstacles.push({ mesh, active: true });
    }

    update(delta, speed) {
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
            // Faster spawns as speed increases
            this.spawnInterval = Math.max(0.6, 20 / speed);
        }

        // Move obstacles towards player (z+)
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.z += speed * delta;
            obs.mesh.rotation.x += delta;
            obs.mesh.rotation.y += delta;

            // Cleanup if passed toggle
            if (obs.mesh.position.z > 10) {
                this.game.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkCollision(playerMesh) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        // Shrink box slightly for forgiveness
        playerBox.expandByScalar(-0.1);

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
