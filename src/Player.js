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
        visor.position.set(0, 0, 0.21); // Front of face
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
