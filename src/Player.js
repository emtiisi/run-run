import * as THREE from 'three';

export class Player {
    constructor(game) {
        this.game = game;
        // Humanoid Group
        this.mesh = new THREE.Group();

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
        const suitMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x002222 });

        // Head
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = 1.4;

        // Torso
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        this.body = new THREE.Mesh(bodyGeo, suitMat);
        this.body.position.y = 0.9;

        // Arms (Simple)
        const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        this.leftArm = new THREE.Mesh(armGeo, suitMat);
        this.leftArm.position.set(-0.35, 0.9, 0);
        this.rightArm = new THREE.Mesh(armGeo, suitMat);
        this.rightArm.position.set(0.35, 0.9, 0);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        this.leftLeg = new THREE.Mesh(legGeo, suitMat);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.rightLeg = new THREE.Mesh(legGeo, suitMat);
        this.rightLeg.position.set(0.15, 0.35, 0);

        this.mesh.add(this.head);
        this.mesh.add(this.body);
        this.mesh.add(this.leftArm);
        this.mesh.add(this.rightArm);
        this.mesh.add(this.leftLeg);
        this.mesh.add(this.rightLeg);

        this.mesh.position.y = 0; // Pivot at feet (roughly)
        this.mesh.scale.set(0.6, 0.6, 0.6);
        this.game.scene.add(this.mesh);

        this.lane = 0; // -1, 0, 1
        this.laneWidth = 3.0; // Distance between lanes

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    reset() {
        this.lane = 0;
        this.mesh.position.x = 0;
    }

    onKeyDown(e) {
        if (!this.game.isRunning) return;

        if (e.key === 'ArrowLeft' || e.key === 'a') {
            if (this.lane > -1) this.lane--;
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            if (this.lane < 1) this.lane++;
        }
    }

    update(delta) {
        // Lerp to target lane position
        const targetX = this.lane * this.laneWidth;
        // Simple lerp: current + (target - current) * factor
        const speed = 15;
        this.mesh.position.x += (targetX - this.mesh.position.x) * speed * delta;

        // Slight tilt when moving lanes
        this.mesh.rotation.z = -(this.mesh.position.x - targetX) * 0.1;
        this.mesh.rotation.y = Math.PI; // Face forward always

        // Running Animation
        const time = Date.now() * 0.015;
        this.leftLeg.rotation.x = Math.sin(time) * 0.5;
        this.rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.5;
        this.leftArm.rotation.x = Math.sin(time + Math.PI) * 0.5;
        this.rightArm.rotation.x = Math.sin(time) * 0.5;
    }
}
