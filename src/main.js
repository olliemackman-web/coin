import * as THREE from 'three';
import { preloadAssets, getModel } from './game/assets.js';
import { createWorld } from './game/world.js';
import { Player } from './game/player.js';
import { Weapon } from './game/weapon.js';
import { Enemy } from './game/enemy.js';
import { Troop } from './game/troop.js';
import { Building } from './game/building.js';
import { waveConfig } from './game/waves.js';
import { ARENA_RADIUS, BUILDING_DEFS, WEAPON_BASE } from './game/constants.js';
import * as UI from './game/ui.js';
import { isTouchDevice, setupMobileControls } from './game/mobileControls.js';

const isTouch = isTouchDevice();
document.body.classList.toggle('touch', isTouch);

const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

createWorld(scene, { lowSpec: isTouch });
scene.add(camera);

if (isTouch) {
  UI.dom.startBtn.textContent = 'Tap to Play';
  const startHint = document.getElementById('start-hint');
  if (startHint) startHint.textContent = 'Left joystick to move · Drag screen to look · Fire / Reload / Build buttons';
  const rotateHint = document.getElementById('rotate-hint');
  const rotateHintClose = document.getElementById('rotate-hint-close');
  if (rotateHint) {
    rotateHint.classList.add('show');
    rotateHintClose?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      rotateHint.classList.remove('show');
    });
  }
}

const state = {
  started: false,
  gameOver: false,
  coins: 40,
  kills: 0,
  wave: 0,
  waveActive: false,
  waveTimer: 0,
  waveQueueRemaining: 0,
  waveSpawnTimer: 0,
  waveDifficulty: 1,
  buildMode: false,
  selectedBuildType: null,
  armoryCount: 0,
  scrapyardCount: 0,
  buildingCounts: { outpost: 0, barracks: 0, armory: 0, scrapyard: 0 },
};

let player = null;
let weapon = null;
/** @type {Enemy[]} */
const enemies = [];
/** @type {Troop[]} */
const troops = [];
/** @type {Building[]} */
const buildings = [];

let ghost = null;
let ghostValid = false;


function worldToScreen(pos) {
  const v = pos.clone().project(camera);
  if (v.z > 1) return null;
  return {
    x: (v.x * 0.5 + 0.5) * window.innerWidth,
    y: (-v.y * 0.5 + 0.5) * window.innerHeight,
  };
}

function cloneWithFreshMaterials(root) {
  root.traverse((child) => {
    if (child.isMesh) {
      child.material = Array.isArray(child.material)
        ? child.material.map((m) => m.clone())
        : child.material.clone();
    }
  });
  return root;
}

function buildCost(typeId) {
  const def = BUILDING_DEFS[typeId];
  const owned = state.buildingCounts[typeId];
  return Math.round(def.cost * Math.pow(def.costGrowth, owned));
}

function refreshBuildUI() {
  UI.buildBuildMenu(
    (id) => state.buildingCounts[id],
    (def) => buildCost(def.id),
    selectBuildType,
    state.selectedBuildType
  );
}

const mobileBuildActions = document.getElementById('mobile-build-actions');

function updateMobileBuildActionsVisibility() {
  if (!mobileBuildActions) return;
  mobileBuildActions.classList.toggle('hidden', !(isTouch && state.buildMode && state.selectedBuildType));
}

function selectBuildType(typeId) {
  state.selectedBuildType = typeId;
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }
  const def = BUILDING_DEFS[typeId];
  ghost = cloneWithFreshMaterials(getModel(def.model));
  ghost.traverse((c) => {
    if (c.isMesh) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      for (const m of mats) {
        m.transparent = true;
        m.opacity = 0.55;
        m.depthWrite = false;
      }
    }
  });
  scene.add(ghost);
  refreshBuildUI();
  updateMobileBuildActionsVisibility();
  if (isTouch) UI.dom.buildMenu.classList.add('hidden');
}

function cancelSelection() {
  state.selectedBuildType = null;
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }
  refreshBuildUI();
  updateMobileBuildActionsVisibility();
  if (isTouch && state.buildMode) UI.dom.buildMenu.classList.remove('hidden');
}

function setTint(object3d, color) {
  object3d.traverse((c) => {
    if (c.isMesh) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      for (const m of mats) {
        m.emissive = new THREE.Color(color);
        m.emissiveIntensity = 0.6;
      }
    }
  });
}

function toggleBuildMenu(force) {
  state.buildMode = force !== undefined ? force : !state.buildMode;
  UI.dom.buildMenu.classList.toggle('hidden', !state.buildMode);
  if (!state.buildMode) {
    if (ghost) {
      scene.remove(ghost);
      ghost = null;
    }
    state.selectedBuildType = null;
  } else {
    refreshBuildUI();
  }
  updateMobileBuildActionsVisibility();
}

const BUILD_REACH = 4.5;

function updateGhost() {
  if (!ghost || !state.selectedBuildType) return;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
  forward.normalize();

  const hit = new THREE.Vector3(
    player.position.x + forward.x * BUILD_REACH,
    0,
    player.position.z + forward.z * BUILD_REACH
  );

  ghost.visible = true;
  ghost.position.copy(hit);
  ghost.rotation.y = -camera.rotation.y;

  const distFromCenter = Math.sqrt(hit.x * hit.x + hit.z * hit.z);
  let valid = distFromCenter < ARENA_RADIUS - 1.5 && distFromCenter > 3;
  if (valid) {
    for (const b of buildings) {
      if (!b.alive) continue;
      const d = Math.hypot(hit.x - b.position.x, hit.z - b.position.z);
      if (d < b.radius + 1.3) {
        valid = false;
        break;
      }
    }
  }
  if (valid) {
    const distToPlayer = Math.hypot(hit.x - player.position.x, hit.z - player.position.z);
    if (distToPlayer < 2.2) valid = false;
  }
  const cost = buildCost(state.selectedBuildType);
  if (state.coins < cost) valid = false;

  ghostValid = valid;
  setTint(ghost, valid ? 0x33ff66 : 0xff3333);
}

function confirmPlacement() {
  if (!state.buildMode || !state.selectedBuildType || !ghostValid) return;
  const typeId = state.selectedBuildType;
  const cost = buildCost(typeId);
  if (state.coins < cost) return;

  state.coins -= cost;
  state.buildingCounts[typeId] += 1;

  const building = new Building(typeId, ghost.position.clone(), ghost.rotation.y);
  buildings.push(building);
  scene.add(building.mesh);

  if (typeId === 'armory') {
    state.armoryCount += 1;
    weapon.damageMult = 1 + state.armoryCount * 0.25;
    weapon.fireRateMult = 1 + state.armoryCount * 0.12;
  } else if (typeId === 'scrapyard') {
    state.scrapyardCount += 1;
  }

  refreshBuildUI();
}

function computeNearestTarget(enemy) {
  let best = { position: player.position, radius: player.radius, kind: 'player', ref: player };
  let bestDist = enemy.position.distanceTo(player.position);

  for (const b of buildings) {
    if (!b.alive) continue;
    const d = enemy.position.distanceTo(b.position);
    if (d < bestDist) {
      bestDist = d;
      best = { position: b.position, radius: b.radius, kind: 'building', ref: b };
    }
  }
  for (const t of troops) {
    if (!t.alive) continue;
    const d = enemy.position.distanceTo(t.position);
    if (d < bestDist) {
      bestDist = d;
      best = { position: t.position, radius: t.radius, kind: 'troop', ref: t };
    }
  }
  return best;
}

function rewardKill(position) {
  state.kills += 1;
  const coinGain = 1 + state.scrapyardCount;
  state.coins += coinGain;
  const screen = worldToScreen(position.clone().add(new THREE.Vector3(0, 1.6, 0)));
  UI.spawnFloater(screen, `+${coinGain}`);
}

function killEnemy(enemy) {
  scene.remove(enemy.mesh);
  const idx = enemies.indexOf(enemy);
  if (idx !== -1) enemies.splice(idx, 1);
  rewardKill(enemy.position);
}

function spawnEnemyAtEdge(difficultyMult) {
  const angle = Math.random() * Math.PI * 2;
  const pos = new THREE.Vector3(Math.cos(angle) * (ARENA_RADIUS - 1), 0, Math.sin(angle) * (ARENA_RADIUS - 1));
  const enemy = new Enemy(pos, difficultyMult);
  enemies.push(enemy);
  scene.add(enemy.mesh);
}

function startNextWave() {
  state.wave += 1;
  const cfg = waveConfig(state.wave);
  state.waveDifficulty = cfg.difficultyMult;
  state.waveQueueRemaining = cfg.count;
  state.waveSpawnInterval = cfg.spawnInterval;
  state.waveSpawnTimer = 0;
  state.waveActive = true;
  UI.updateWave(state.wave, `${cfg.count} enemies incoming`);
}

function onWeaponFire(origin, dir, damage, range) {
  let bestT = range;
  let bestEnemy = null;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const center = enemy.position.clone().add(new THREE.Vector3(0, 1.05, 0));
    const oc = origin.clone().sub(center);
    const b = oc.dot(dir);
    const c = oc.dot(oc) - 0.85 * 0.85;
    const disc = b * b - c;
    if (disc < 0) continue;
    const t = -b - Math.sqrt(disc);
    if (t >= 0 && t < bestT) {
      bestT = t;
      bestEnemy = enemy;
    }
  }
  if (bestEnemy) {
    const died = bestEnemy.takeDamage(damage);
    if (died) killEnemy(bestEnemy);
  }
}

function onTroopShoot(enemy, damage) {
  const died = enemy.takeDamage(damage);
  if (died) killEnemy(enemy);
}

function endGame() {
  state.gameOver = true;
  player.controls.unlock();
  setTouchControlsVisible(false);
  UI.showGameOver(`Wave ${state.wave} · ${state.kills} kills · ${Math.floor(state.coins)} coins earned`);
}

function resetGame() {
  for (const e of enemies) scene.remove(e.mesh);
  enemies.length = 0;
  for (const t of troops) scene.remove(t.mesh);
  troops.length = 0;
  for (const b of buildings) scene.remove(b.mesh);
  buildings.length = 0;
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }

  state.coins = 40;
  state.kills = 0;
  state.wave = 0;
  state.waveActive = false;
  state.armoryCount = 0;
  state.scrapyardCount = 0;
  state.buildMode = false;
  state.selectedBuildType = null;
  state.buildingCounts = { outpost: 0, barracks: 0, armory: 0, scrapyard: 0 };
  UI.dom.buildMenu.classList.add('hidden');
  updateMobileBuildActionsVisibility();

  player.health = player.maxHealth;
  player.alive = true;
  player.camera.position.set(0, 1.7, 8);
  player.velocity.set(0, 0, 0);
  player.touchMove.x = 0;
  player.touchMove.y = 0;

  weapon.damageMult = 1;
  weapon.fireRateMult = 1;
  weapon.ammoInMag = weapon.magSize;
  weapon.reserveAmmo = WEAPON_BASE.reserveAmmo;
  weapon.reloading = false;

  state.gameOver = false;
  UI.hideGameOver();
  startNextWave();
}

window.addEventListener('keydown', (e) => {
  if (!state.started || state.gameOver) return;
  if (e.code === 'KeyB') {
    toggleBuildMenu();
  } else if (state.buildMode && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
    const map = { Digit1: 'outpost', Digit2: 'barracks', Digit3: 'armory', Digit4: 'scrapyard' };
    selectBuildType(map[e.code]);
  } else if (e.code === 'Escape' && state.selectedBuildType) {
    cancelSelection();
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!state.started || state.gameOver) return;
  if (state.buildMode) {
    if (e.button === 0) confirmPlacement();
    else if (e.button === 2) cancelSelection();
  }
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

if (!isTouch) {
  renderer.domElement.addEventListener('click', () => {
    if (state.started && !state.gameOver && !player.controls.isLocked) {
      player.controls.lock();
    }
  });
}

const touchControlsEl = document.getElementById('touch-controls');
function setTouchControlsVisible(visible) {
  if (isTouch) touchControlsEl?.classList.toggle('hidden', !visible);
}

UI.dom.startBtn.addEventListener('click', async () => {
  UI.dom.startBtn.textContent = 'Loading...';
  UI.dom.startBtn.disabled = true;
  await init();
  UI.dom.startScreen.classList.add('hidden');
  if (isTouch) {
    setupMobileControls({ player, weapon, toggleBuild: toggleBuildMenu, confirmPlacement, cancelSelection });
    setTouchControlsVisible(true);
  } else {
    player.controls.lock();
  }
  state.started = true;
  startNextWave();
});

UI.dom.restartBtn.addEventListener('click', () => {
  resetGame();
  if (!isTouch) player.controls.lock();
  setTouchControlsVisible(true);
});

async function init() {
  await preloadAssets();
  player = new Player(camera, renderer.domElement);
  weapon = new Weapon(camera, scene);
  weapon.onFire = onWeaponFire;
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  if (state.started && !state.gameOver && player) {
    const colliders = buildings.filter((b) => b.alive).map((b) => ({ x: b.position.x, z: b.position.z, radius: b.radius }));
    player.update(delta, colliders);

    const speedFrac = Math.hypot(player.velocity.x, player.velocity.z) / 8.5;
    weapon.enabled = !state.buildMode;
    weapon.update(delta, speedFrac);

    if (state.buildMode) updateGhost();

    if (state.waveActive) {
      if (state.waveQueueRemaining > 0) {
        state.waveSpawnTimer -= delta;
        if (state.waveSpawnTimer <= 0) {
          state.waveSpawnTimer = state.waveSpawnInterval;
          spawnEnemyAtEdge(state.waveDifficulty);
          state.waveQueueRemaining -= 1;
        }
      } else if (enemies.length === 0) {
        state.waveActive = false;
        UI.updateWave(state.wave, 'Wave cleared! Next wave incoming...');
        state.waveTimer = 6;
      }
    } else if (state.wave > 0) {
      state.waveTimer -= delta;
      if (state.waveTimer <= 0) startNextWave();
      else UI.updateWave(state.wave, `Next wave in ${Math.ceil(state.waveTimer)}s`);
    }

    for (const enemy of [...enemies]) {
      const target = computeNearestTarget(enemy);
      enemy.update(delta, target.position, target.radius, (dmg) => {
        if (target.kind === 'player') {
          player.takeDamage(dmg);
          UI.flashDamage();
          if (!player.alive) endGame();
        } else if (target.kind === 'building') {
          const destroyed = target.ref.takeDamage(dmg);
          if (destroyed) {
            scene.remove(target.ref.mesh);
            const idx = buildings.indexOf(target.ref);
            if (idx !== -1) buildings.splice(idx, 1);
            if (target.ref.typeId === 'armory') {
              state.armoryCount = Math.max(0, state.armoryCount - 1);
              weapon.damageMult = 1 + state.armoryCount * 0.25;
              weapon.fireRateMult = 1 + state.armoryCount * 0.12;
            } else if (target.ref.typeId === 'scrapyard') {
              state.scrapyardCount = Math.max(0, state.scrapyardCount - 1);
            }
          }
        } else if (target.kind === 'troop') {
          target.ref.takeDamage(dmg);
          if (!target.ref.alive) {
            scene.remove(target.ref.mesh);
            const idx = troops.indexOf(target.ref);
            if (idx !== -1) troops.splice(idx, 1);
            if (target.ref.sourceBuilding) target.ref.sourceBuilding.troopCount -= 1;
          }
        }
      });
    }

    for (const building of buildings) {
      building.update(delta, {
        onIncome: (amount, pos) => {
          state.coins += amount;
          UI.spawnFloater(worldToScreen(pos.clone().add(new THREE.Vector3(0, 2.2, 0))), `+${amount}`);
        },
        onSpawnTroop: (pos, sourceBuilding) => {
          const offset = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
          const troop = new Troop(pos.clone().add(offset));
          troop.sourceBuilding = sourceBuilding;
          troops.push(troop);
          scene.add(troop.mesh);
        },
      });
    }

    for (const troop of troops) {
      troop.update(delta, enemies, onTroopShoot);
    }

    UI.updateHealth(player.health, player.maxHealth);
    UI.updateCoins(state.coins);
    UI.updateAmmo(weapon.ammoInMag, weapon.reserveAmmo, weapon.reloading);
    UI.updateKills(state.kills);
  }

  renderer.render(scene, camera);
}

animate();
