import * as THREE from 'three';

export class Player {
    constructor(game) {
        this.game = game;
        // Alien Bot Group
        this.mesh = new THREE.Group();

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
        const visorMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 });

        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
        this.head = new THREE.Mesh(headGeo, metalMat);
        this.head.position.y = 1.4;

        // Visor (Eye)
        const visorGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0, 0.21);
        this.head.add(visor);

        // Antenna
        const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
        const antenna = new THREE.Mesh(antGeo, metalMat);
        antenna.position.set(0, 0.35, 0);
        this.head.add(antenna);

        // Torso
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.1, 0.6, 8);
        this.body = new THREE.Mesh(bodyGeo, metalMat);
        this.body.position.y = 0.9;

        // Arms
        const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
        this.leftArm = new THREE.Mesh(armGeo, metalMat);
        this.leftArm.position.set(-0.35, 0.9, 0);
        this.rightArm = new THREE.Mesh(armGeo, metalMat);
        this.rightArm.position.set(0.35, 0.9, 0);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
        this.leftLeg = new THREE.Mesh(legGeo, metalMat);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.rightLeg = new THREE.Mesh(legGeo, metalMat);
        this.rightLeg.position.set(0.15, 0.35, 0);

        this.mesh.add(this.head);
        this.mesh.add(this.body);
        this.mesh.add(this.leftArm);
        this.mesh.add(this.rightArm);
        this.mesh.add(this.leftLeg);
        this.mesh.add(this.rightLeg);

        this.mesh.position.y = 0;
        this.mesh.scale.set(0.6, 0.6, 0.6);
        this.game.scene.add(this.mesh);

        this.lane = 0;
        this.laneWidth = 3.0;

        // Jump state
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpHeight = 0;
        this.gravity = -20;
        this.jumpForce = 8;

        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 40;

        // Input listeners
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Touch events
        window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        window.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    }

    reset() {
        this.lane = 0;
        this.mesh.position.x = 0;
        this.mesh.position.y = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpHeight = 0;
    }

    onKeyDown(e) {
        if (!this.game.isRunning) return;

        if (e.key === 'ArrowLeft' || e.key === 'a') {
            if (this.lane > -1) {
                this.lane--;
                if (this.game.sound) this.game.sound.playLaneSwitch();
            }
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            if (this.lane < 1) {
                this.lane++;
                if (this.game.sound) this.game.sound.playLaneSwitch();
            }
        }
        if ((e.key === 'ArrowUp' || e.key === 'w' || e.code === 'Space') && !this.isJumping && this.game.isRunning) {
            this.jump();
        }
    }

    onTouchStart(e) {
        if (e.touches.length > 0) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
    }

    onTouchEnd(e) {
        if (!this.game.isRunning) {
            // Tap to start/restart
            this.game.start();
            return;
        }

        if (e.changedTouches.length > 0) {
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            const dy = e.changedTouches[0].clientY - this.touchStartY;

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > this.swipeThreshold) {
                // Horizontal swipe
                if (dx > 0 && this.lane < 1) {
                    this.lane++;
                    if (this.game.sound) this.game.sound.playLaneSwitch();
                } else if (dx < 0 && this.lane > -1) {
                    this.lane--;
                    if (this.game.sound) this.game.sound.playLaneSwitch();
                }
            } else if (dy < -this.swipeThreshold && !this.isJumping) {
                // Swipe up = jump
                this.jump();
            }
        }
    }

    jump() {
        this.isJumping = true;
        this.jumpVelocity = this.jumpForce;
        if (this.game.sound) this.game.sound.playJump();
    }

    update(delta) {
        // Lane movement
        const targetX = this.lane * this.laneWidth;
        const speed = 15;
        this.mesh.position.x += (targetX - this.mesh.position.x) * speed * delta;

        // Jump physics
        if (this.isJumping) {
            this.jumpVelocity += this.gravity * delta;
            this.jumpHeight += this.jumpVelocity * delta;

            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
        this.mesh.position.y = this.jumpHeight;

        // Slight tilt when moving lanes
        this.mesh.rotation.z = -(this.mesh.position.x - targetX) * 0.1;
        this.mesh.rotation.y = Math.PI;

        // Running Animation (slower when jumping)
        const time = Date.now() * 0.015;
        const animScale = this.isJumping ? 0.1 : 0.5;
        this.leftLeg.rotation.x = Math.sin(time) * animScale;
        this.rightLeg.rotation.x = Math.sin(time + Math.PI) * animScale;
        this.leftArm.rotation.x = Math.sin(time + Math.PI) * animScale;
        this.rightArm.rotation.x = Math.sin(time) * animScale;
    }
}
