import * as THREE from 'three';

export class World {
    constructor(game) {
        this.game = game;

        // Create "Tron" style grid
        this.grid = new THREE.GridHelper(200, 40, 0x00ffff, 0x220044);
        this.grid.position.y = -0.5; // Lower slightly
        this.game.scene.add(this.grid);

        // Add some "Stars" or particles for speed effect
        const starGeo = new THREE.BufferGeometry();
        const starCount = 500;
        const posArray = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100; // Spread x/y/z
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMat = new THREE.PointsMaterial({ size: 0.2, color: 0xffffff });
        this.stars = new THREE.Points(starGeo, starMat);
        this.stars.position.y = 10;
        this.game.scene.add(this.stars);

        this.speed = 10;
        this.distance = 0;
    }

    reset() {
        this.speed = 10;
        this.distance = 0;
        this.grid.position.z = 0;
        if (this.stars) this.stars.position.z = 0;
    }

    update(delta, speedOverride) {
        const moveSpeed = speedOverride !== undefined ? speedOverride : this.speed;

        // Move grid towards camera to simulate forward movement
        this.grid.position.z += moveSpeed * delta;
        this.distance += moveSpeed * delta;

        // Move stars too but slower for parallax - needs to be modulo'd or reset
        if (this.stars) {
            this.stars.position.z += moveSpeed * 0.2 * delta;
            if (this.stars.position.z > 50) this.stars.position.z = -50;
        }

        // Reset grid position to create loop illusion
        if (this.grid.position.z > 4) {
            this.grid.position.z %= 4;
        }

        // Increase base speed gradually
        this.speed += 0.5 * delta;

        // Update Score UI
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = 'Score: ' + Math.floor(this.distance);
    }
}
