import * as THREE from 'three';
import { ENEMY_BASE } from './constants.js';

let nextId = 1;

function buildEnemyMesh(tint) {
  const group = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const eye = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 8), skin);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), skin);
  head.position.y = 1.62;
  head.castShadow = true;
  group.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eye);
  eyeL.position.set(0.09, 1.65, 0.19);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.09;
  group.add(eyeL, eyeR);

  const armGeo = new THREE.CapsuleGeometry(0.09, 0.5, 4, 6);
  const armL = new THREE.Mesh(armGeo, dark);
  armL.position.set(0.4, 1.0, 0);
  armL.rotation.z = 0.3;
  armL.castShadow = true;
  const armR = armL.clone();
  armR.position.x = -0.4;
  armR.rotation.z = -0.3;
  group.add(armL, armR);

  const legGeo = new THREE.CapsuleGeometry(0.11, 0.55, 4, 6);
  const legL = new THREE.Mesh(legGeo, dark);
  legL.position.set(0.14, 0.35, 0);
  legL.castShadow = true;
  const legR = legL.clone();
  legR.position.x = -0.14;
  group.add(legL, legR);

  return group;
}

const TINTS = [0x4a7a3c, 0x6a5a3c, 0x5a4a6a, 0x3c6a6a];

export class Enemy {
  constructor(position, difficultyMult) {
    this.id = nextId++;
    this.maxHealth = ENEMY_BASE.health * difficultyMult;
    this.health = this.maxHealth;
    this.speed = ENEMY_BASE.speed * (0.85 + Math.random() * 0.3);
    this.damage = ENEMY_BASE.damage;
    this.coinDrop = ENEMY_BASE.coinDrop;
    this.alive = true;
    this.attackCooldown = 0;
    this.radius = 0.4;

    const tint = TINTS[Math.floor(Math.random() * TINTS.length)];
    this.mesh = buildEnemyMesh(tint);
    this.mesh.position.copy(position);
    this._walkT = Math.random() * 10;

    this.target = null; // { position, radius, kind, ref }
  }

  get position() {
    return this.mesh.position;
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  update(delta, targetPos, targetRadius, onAttack) {
    const pos = this.mesh.position;
    const dx = targetPos.x - pos.x;
    const dz = targetPos.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const stopDist = targetRadius + this.radius + 0.35;

    if (dist > stopDist) {
      const nx = dx / dist;
      const nz = dz / dist;
      pos.x += nx * this.speed * delta;
      pos.z += nz * this.speed * delta;
      this.mesh.rotation.y = Math.atan2(nx, nz);
      this._walkT += delta * this.speed * 3;
      this.mesh.position.y = Math.abs(Math.sin(this._walkT)) * 0.04;
      if (this.attackCooldown > 0) this.attackCooldown -= delta;
    } else {
      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1 / ENEMY_BASE.attackRate;
        if (onAttack) onAttack(this.damage);
      }
    }
  }
}
