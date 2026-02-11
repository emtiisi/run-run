import * as THREE from 'three';
import { Player } from './Player.js';
import { World } from './World.js';
import { ObstacleManager } from './ObstacleManager.js';
import { PowerupManager } from './PowerupManager.js';
import { SoundManager } from './SoundManager.js';

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
        this.shieldTimer = 0;
        this.invincibleTimer = 0;
        this.debris = [];
        this.sound = new SoundManager();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        this.scene.add(dirLight);

        this.scene.fog = new THREE.Fog(0x000000, 10, 60);

        this.camera.position.set(0, 3, 7);
        this.camera.lookAt(0, 0, 0);

        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.isRunning) {
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

        this.sound.init();
        this.sound.startBGM();

        this.player.reset();
        this.world.reset();
        this.obstacleManager.reset();
        this.powerupManager.reset();

        this.shieldActive = false;
        this.boostActive = false;
        this.invincibleTimer = 0;
        this.shieldTimer = 0;
        this.boostTimer = 0;
        this.resetPlayerVisual();

        // Clean up debris
        this.debris.forEach(d => { this.scene.remove(d.mesh); d.mesh.geometry.dispose(); d.mesh.material.dispose(); });
        this.debris = [];
    }

    gameOver() {
        this.isRunning = false;
        this.sound.playDeath();
        this.sound.stopBGM();
        this.world.saveHighScore();
        const finalScore = Math.floor(this.world.distance);
        document.getElementById('game-over-screen').style.display = 'block';
        document.getElementById('game-over-screen').querySelector('h1').innerText = 'GAME OVER';
        document.getElementById('game-over-screen').querySelector('p').innerText = 'Skor: ' + finalScore + ' | SPACE ile Tekrar';
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    resetPlayerVisual() {
        this.player.mesh.traverse((child) => {
            if (child.isMesh) {
                child.material.transparent = false;
                child.material.opacity = 1.0;
                child.material.color.setHex(0x888888);
                child.material.emissive.setHex(0x000000);
                if (this.player.head && child === this.player.head.children[0]) {
                    child.material.color.setHex(0xff0000);
                    child.material.emissive.setHex(0xff0000);
                }
            }
        });
    }

    deactivateAllPowerups() {
        this.shieldActive = false;
        this.boostActive = false;
        this.shieldTimer = 0;
        this.boostTimer = 0;
        this.resetPlayerVisual();
    }

    explodeObstacle(obstacle) {
        const pos = obstacle.mesh.position.clone();
        const fragmentCount = 10;
        const fragGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);

        for (let i = 0; i < fragmentCount; i++) {
            const fragMat = new THREE.MeshStandardMaterial({
                color: 0xff0055,
                emissive: 0xff0022,
                transparent: true,
                opacity: 1.0
            });
            const frag = new THREE.Mesh(fragGeo, fragMat);
            frag.position.copy(pos);
            frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 8
            );

            this.scene.add(frag);
            this.debris.push({ mesh: frag, velocity: vel, life: 1.5 });
        }
    }

    updateDebris(delta) {
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.velocity.y -= 9.8 * delta;
            d.mesh.position.add(d.velocity.clone().multiplyScalar(delta));
            d.mesh.rotation.x += delta * 5;
            d.mesh.rotation.z += delta * 3;
            d.life -= delta;
            d.mesh.material.opacity = Math.max(0, d.life / 1.5);

            if (d.life <= 0) {
                this.scene.remove(d.mesh);
                d.mesh.geometry.dispose();
                d.mesh.material.dispose();
                this.debris.splice(i, 1);
            }
        }
    }

    updatePowerups(delta) {
        const ui = document.getElementById('powerup-status');
        let statusText = "";

        if (this.boostActive) {
            this.boostTimer -= delta;
            statusText = `⚡ PATLAYICI: ${Math.ceil(this.boostTimer)}s`;
            if (this.boostTimer <= 0) {
                this.boostActive = false;
                this.resetPlayerVisual();
            }
        }

        if (this.shieldActive) {
            this.shieldTimer -= delta;
            statusText = `👻 HAYALET: ${Math.ceil(this.shieldTimer)}s`;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                this.invincibleTimer = 1.0;
                this.resetPlayerVisual();
            }
        }

        if (ui) {
            if (statusText) {
                ui.style.display = 'block';
                ui.innerText = statusText;
                if (this.boostActive) {
                    ui.style.color = '#ffaa00';
                    ui.style.textShadow = '0 0 15px #ff4400';
                    ui.style.borderColor = 'rgba(255, 170, 0, 0.5)';
                } else if (this.shieldActive) {
                    ui.style.color = '#88ccff';
                    ui.style.textShadow = '0 0 15px #0088ff';
                    ui.style.borderColor = 'rgba(0, 136, 255, 0.5)';
                }
            } else {
                ui.style.display = 'none';
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Always update debris (even after game over for visual)
        this.updateDebris(delta);

        if (this.isRunning) {
            const currentSpeed = this.world.speed * (this.boostActive ? 1.5 : 1.0);

            this.world.update(delta);
            this.player.update(delta);

            this.obstacleManager.update(delta, currentSpeed);
            this.powerupManager.update(delta, currentSpeed);

            this.updatePowerups(delta);

            if (this.invincibleTimer > 0) this.invincibleTimer -= delta;

            // Check Collisions
            const hitObstacle = this.obstacleManager.checkCollision(this.player.mesh);
            if (hitObstacle) {
                if (this.shieldActive || this.invincibleTimer > 0) {
                    if (hitObstacle.mesh.material) {
                        hitObstacle.mesh.material.transparent = true;
                        hitObstacle.mesh.material.opacity = 0.3;
                    }
                } else if (this.boostActive) {
                    this.explodeObstacle(hitObstacle);
                    this.obstacleManager.removeObstacle(hitObstacle);
                    this.sound.playExplosion();
                } else {
                    this.gameOver();
                }
            }

            const hitPowerup = this.powerupManager.checkCollision(this.player.mesh);
            if (hitPowerup) {
                // Only one power-up active at a time
                this.deactivateAllPowerups();
                this.sound.playPowerup();
                this.powerupManager.startCooldown(); // 30s before next spawn

                if (hitPowerup === 'SHIELD') {
                    this.shieldActive = true;
                    this.shieldTimer = 10.0;
                    this.player.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material.transparent = true;
                            child.material.opacity = 0.4;
                            child.material.color.setHex(0xaaaaaa);
                        }
                    });
                } else if (hitPowerup === 'BOOST') {
                    this.boostActive = true;
                    this.boostTimer = 10.0;
                    this.player.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material.color.setHex(0xffaa00);
                            child.material.emissive.setHex(0xff0000);
                            child.material.transparent = false;
                            child.material.opacity = 1.0;
                        }
                    });
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
