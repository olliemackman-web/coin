import { BUILDING_DEFS } from './constants.js';

const el = (id) => document.getElementById(id);

export const dom = {
  healthBar: el('health-bar'),
  healthText: el('health-text'),
  coinCount: el('coin-count'),
  waveLabel: el('wave-label'),
  waveSub: el('wave-sub'),
  ammoCount: el('ammo-count'),
  killCount: el('kill-count'),
  buildMenu: el('build-menu'),
  buildList: el('build-list'),
  buildCoins: el('build-coins'),
  damageFlash: el('damage-flash'),
  startScreen: el('start-screen'),
  startBtn: el('start-btn'),
  gameoverScreen: el('gameover-screen'),
  gameoverStats: el('gameover-stats'),
  restartBtn: el('restart-btn'),
  crosshair: el('crosshair'),
};

let floaterLayer = document.getElementById('floaters');
if (!floaterLayer) {
  floaterLayer = document.createElement('div');
  floaterLayer.id = 'floaters';
  document.body.appendChild(floaterLayer);
}

export function updateHealth(health, maxHealth) {
  const pct = Math.max(0, (health / maxHealth) * 100);
  dom.healthBar.style.width = `${pct}%`;
  dom.healthText.textContent = Math.ceil(health);
}

export function updateCoins(coins) {
  dom.coinCount.textContent = Math.floor(coins);
  dom.buildCoins.textContent = Math.floor(coins);
}

export function updateWave(wave, subText) {
  dom.waveLabel.textContent = `Wave ${wave}`;
  dom.waveSub.textContent = subText;
}

export function updateAmmo(inMag, reserve, reloading) {
  dom.ammoCount.textContent = reloading ? 'RELOADING' : `${inMag} / ${reserve}`;
}

export function updateKills(kills) {
  dom.killCount.textContent = `Kills: ${kills}`;
}

export function flashDamage() {
  dom.damageFlash.classList.remove('show');
  void dom.damageFlash.offsetWidth;
  dom.damageFlash.classList.add('show');
  setTimeout(() => dom.damageFlash.classList.remove('show'), 400);
}

export function spawnFloater(worldToScreen, text) {
  if (!worldToScreen) return;
  const div = document.createElement('div');
  div.className = 'floater';
  div.textContent = text;
  div.style.left = `${worldToScreen.x}px`;
  div.style.top = `${worldToScreen.y}px`;
  floaterLayer.appendChild(div);
  setTimeout(() => div.remove(), 950);
}

export function buildBuildMenu(getOwnedCount, getCost, onSelect, selectedId) {
  dom.buildList.innerHTML = '';
  for (const def of Object.values(BUILDING_DEFS)) {
    const card = document.createElement('div');
    card.className = 'build-card' + (def.id === selectedId ? ' selected' : '');
    const owned = getOwnedCount(def.id);
    const cost = getCost(def);
    card.innerHTML = `
      <div class="swatch" style="background:${def.color}"></div>
      <div class="name">${def.key}. ${def.name}</div>
      <div class="cost">${cost} coins</div>
      <div class="desc">${def.desc}</div>
      <div class="owned">owned: ${owned}</div>
    `;
    card.addEventListener('click', () => onSelect(def.id));
    dom.buildList.appendChild(card);
  }
}

export function showGameOver(stats) {
  dom.gameoverScreen.classList.remove('hidden');
  dom.gameoverStats.textContent = stats;
}

export function hideGameOver() {
  dom.gameoverScreen.classList.add('hidden');
}
