import * as THREE from 'three';
import { TROOP_STATS } from './constants.js';

function buildTroopMesh() {
  const group = new THREE.Group();
  const uniform = new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: 0.7 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.8 });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.4 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.65, 4, 8), uniform);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), skin);
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), uniform);
  helmet.position.y = 1.6;
  group.add(helmet);

  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.7), gunMat);
  gun.position.set(0.15, 1.05, 0.35);
  group.add(gun);

  return group;
}

let nextId = 1;

export class Troop {
  constructor(position) {
    this.id = nextId++;
    this.health = TROOP_STATS.health;
    this.maxHealth = TROOP_STATS.health;
    this.alive = true;
    this.radius = 0.4;
    this.fireCooldown = 0;
    this.mesh = buildTroopMesh();
    this.mesh.position.copy(position);
    this.homePosition = position.clone();
  }

  get position() {
    return this.mesh.position;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health -= amount;
    if (this.health <= 0) this.alive = false;
  }

  update(delta, enemies, onShoot) {
    if (this.fireCooldown > 0) this.fireCooldown -= delta;

    let nearest = null;
    let nearestDist = TROOP_STATS.range;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = this.mesh.position.distanceTo(enemy.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    }

    if (nearest) {
      this.mesh.lookAt(nearest.position.x, this.mesh.position.y, nearest.position.z);
      if (this.fireCooldown <= 0) {
        this.fireCooldown = 1 / TROOP_STATS.fireRate;
        if (onShoot) onShoot(nearest, TROOP_STATS.damage, this.mesh.position);
      }
    }
  }
}
