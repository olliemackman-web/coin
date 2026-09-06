import { getModel } from './assets.js';
import { BUILDING_DEFS } from './constants.js';

let nextId = 1;

const BUILDING_HEALTH = 120;
const OUTPOST_INTERVAL = 4;
const OUTPOST_INCOME = 2;
const BARRACKS_INTERVAL = 12;
const BARRACKS_MAX_TROOPS = 3;

export class Building {
  constructor(typeId, position, rotationY = 0) {
    const def = BUILDING_DEFS[typeId];
    this.id = nextId++;
    this.typeId = typeId;
    this.def = def;
    this.radius = 1.1;
    this.health = BUILDING_HEALTH;
    this.maxHealth = BUILDING_HEALTH;
    this.alive = true;

    this.mesh = getModel(def.model);
    this.mesh.position.copy(position);
    this.mesh.rotation.y = rotationY;

    this.incomeTimer = OUTPOST_INTERVAL;
    this.spawnTimer = BARRACKS_INTERVAL;
    this.troopCount = 0;
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

  update(delta, callbacks) {
    if (!this.alive) return;
    if (this.typeId === 'outpost') {
      this.incomeTimer -= delta;
      if (this.incomeTimer <= 0) {
        this.incomeTimer += OUTPOST_INTERVAL;
        callbacks.onIncome?.(OUTPOST_INCOME, this.position);
      }
    } else if (this.typeId === 'barracks') {
      if (this.troopCount < BARRACKS_MAX_TROOPS) {
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
          this.spawnTimer += BARRACKS_INTERVAL;
          this.troopCount += 1;
          callbacks.onSpawnTroop?.(this.position, this);
        }
      }
    }
  }
}
