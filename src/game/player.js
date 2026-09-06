import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ARENA_RADIUS, PLAYER_EYE_HEIGHT, PLAYER_MOVE_SPEED, PLAYER_START_HEALTH } from './constants.js';

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.camera.position.set(0, PLAYER_EYE_HEIGHT, 8);
    this.controls = new PointerLockControls(camera, domElement);

    this.health = PLAYER_START_HEALTH;
    this.maxHealth = PLAYER_START_HEALTH;
    this.alive = true;

    this.velocity = new THREE.Vector3();
    this.keys = { forward: false, back: false, left: false, right: false };
    this.touchMove = { x: 0, y: 0 };
    this.radius = 0.5;

    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._pitch = 0;

    window.addEventListener('keydown', (e) => this._onKey(e.code, true));
    window.addEventListener('keyup', (e) => this._onKey(e.code, false));
  }

  /** Rotate the camera directly by a screen-space drag delta. Used for touch look
   * since PointerLockControls only reacts to real pointer-locked mousemove events. */
  lookDelta(deltaX, deltaY, sensitivity) {
    this.camera.rotation.y -= deltaX * sensitivity;
    this._pitch = THREE.MathUtils.clamp(this._pitch - deltaY * sensitivity, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    this.camera.rotation.x = this._pitch;
  }

  _onKey(code, down) {
    switch (code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = down; break;
      case 'KeyS': case 'ArrowDown': this.keys.back = down; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = down; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = down; break;
    }
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.alive = false;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  get position() {
    return this.camera.position;
  }

  update(delta, colliders) {
    if (!this.alive) return;

    const damping = Math.pow(0.0001, delta);
    this.velocity.x *= damping;
    this.velocity.z *= damping;

    this.camera.getWorldDirection(this._forward);
    this._forward.y = 0;
    this._forward.normalize();
    this._right.crossVectors(this._forward, new THREE.Vector3(0, 1, 0)).negate();

    const accel = PLAYER_MOVE_SPEED * 8;
    const move = new THREE.Vector3();
    if (this.keys.forward) move.add(this._forward);
    if (this.keys.back) move.sub(this._forward);
    if (this.keys.right) move.add(this._right);
    if (this.keys.left) move.sub(this._right);
    if (this.touchMove.y) move.addScaledVector(this._forward, this.touchMove.y);
    if (this.touchMove.x) move.addScaledVector(this._right, this.touchMove.x);
    const moveLenSq = move.lengthSq();
    if (moveLenSq > 1) move.multiplyScalar(1 / Math.sqrt(moveLenSq));
    if (moveLenSq > 0) {
      this.velocity.addScaledVector(move, accel * delta);
    }

    const speedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
    const maxSpeedSq = PLAYER_MOVE_SPEED * PLAYER_MOVE_SPEED;
    if (speedSq > maxSpeedSq) {
      const scale = PLAYER_MOVE_SPEED / Math.sqrt(speedSq);
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }

    const pos = this.camera.position;
    let nextX = pos.x + this.velocity.x * delta;
    let nextZ = pos.z + this.velocity.z * delta;

    if (colliders) {
      for (const c of colliders) {
        const dx = nextX - c.x;
        const dz = nextZ - c.z;
        const minDist = c.radius + this.radius;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const push = (minDist - dist);
          nextX += (dx / dist) * push;
          nextZ += (dz / dist) * push;
        }
      }
    }

    const distFromCenter = Math.sqrt(nextX * nextX + nextZ * nextZ);
    const maxDist = ARENA_RADIUS - 1;
    if (distFromCenter > maxDist) {
      const scale = maxDist / distFromCenter;
      nextX *= scale;
      nextZ *= scale;
    }

    pos.x = nextX;
    pos.z = nextZ;
    pos.y = PLAYER_EYE_HEIGHT;
  }
}
