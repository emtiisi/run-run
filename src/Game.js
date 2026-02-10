import * as THREE from 'three';
import { Player } from './Player.js';
import { World } from './World.js';
import { ObstacleManager } from './ObstacleManager.js';
import { PowerupManager } from './PowerupManager.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.player = new Player(this);
        this.world = new World(this);
        this.obstacleManager = new ObstacleManager(this);
        this.powerupManager = new PowerupManager(this);

        this.isRunning = false;
        this.clock = new THREE.Clock();

        this.shieldActive = false;
        this.boostActive = false;
        this.boostTimer = 0;
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        this.scene.add(dirLight);

        // Fog for depth
        this.scene.fog = new THREE.Fog(0x000000, 10, 60);

        // Camera
        this.camera.position.set(0, 3, 7);
        this.camera.lookAt(0, 0, 0);

        // Input handlers
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.isRunning) {
                    this.start();
                } else if (this.player.isDead) { // Wait, player logic handles dead?
                    this.start();
                }
            }
        });

        this.animate();
    }

    start() {
        this.isRunning = true;
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';

        this.player.reset();
        this.world.reset();
        this.obstacleManager.reset();
        this.powerupManager.reset();

        this.shieldActive = false;
        this.boostActive = false;
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('game-over-screen').style.display = 'block';
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updatePowerups(delta) {
        if (this.boostActive) {
            this.boostTimer -= delta;
            if (this.boostTimer <= 0) {
                this.boostActive = false;
                // Reset Blaster Color
                this.player.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.material.color.setHex(child.name === 'skin' ? 0xffccaa : 0x00ffff); // How to know original?
                        // Hacky reset
                        if (child === this.player.head) child.material.color.setHex(0xffccaa);
                        else child.material.color.setHex(0x00ffff);
                        child.material.emissive.setHex(0x002222);
                    }
                });
            }
        }

        if (this.shieldActive) { // Ghost Timer
            this.shieldTimer -= delta;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                // Reset Ghost Transparency
                this.player.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                        if (child === this.player.head) child.material.color.setHex(0xffccaa);
                        else child.material.color.setHex(0x00ffff);
                    }
                });
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        if (this.isRunning) {
            // Boost speed multiplier
            const currentSpeed = this.world.speed * (this.boostActive ? 1.5 : 1.0);

            this.world.update(delta);
            this.player.update(delta);

            // Update Managers with boosted speed logic if needed, 
            // but world updates globally. 
            // Let's pass the calculated speed to managers so they move objects at correct rate
            this.obstacleManager.update(delta, currentSpeed);
            this.powerupManager.update(delta, currentSpeed);

            this.updatePowerups(delta);

            // Check Collisions
            const hitObstacle = this.obstacleManager.checkCollision(this.player.mesh);
            if (hitObstacle) {
                if (this.shieldActive) { // GHOST MODE
                    // Pass through, maybe visualize hit
                    console.log("Ghost passed through!");
                } else if (this.boostActive) { // BLAST MODE
                    // Destroy obstacle
                    this.obstacleManager.removeObstacle(hitObstacle);
                    console.log("Blasted Obstacle!");
                } else {
                    this.gameOver();
                }
            }

            const hitPowerup = this.powerupManager.checkCollision(this.player.mesh);
            if (hitPowerup) {
                if (hitPowerup.type === 'SHIELD') { // GHOST
                    this.shieldActive = true;
                    // Visual: Transparent
                    this.player.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material.transparent = true;
                            child.material.opacity = 0.4;
                            child.material.color.setHex(0xaaaaaa);
                        }
                    });
                    this.shieldTimer = 10.0; // 10 Seconds
                    // Let's add independent timer handling in updatePowerups
                    console.log("GHOST MODE! (10s)");
                } else if (hitPowerup.type === 'BOOST') { // BLAST
                    this.boostActive = true;
                    this.boostTimer = 10.0;
                    // Visual: Orange/Red
                    this.player.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material.color.setHex(0xffaa00);
                            child.material.emissive.setHex(0xff0000);
                            child.material.transparent = false;
                            child.material.opacity = 1.0;
                        }
                    });
                    console.log("BLASTER MODE! (10s)");
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
