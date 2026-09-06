export const ARENA_RADIUS = 42;

export const BUILDING_DEFS = {
  outpost: {
    id: 'outpost',
    name: 'Outpost',
    model: 'Barrier_Single',
    cost: 15,
    costGrowth: 1.35,
    color: '#8fb3ff',
    desc: 'Generates +2 coins every 4s.',
    key: '1',
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    model: 'Barrier_Fixed',
    cost: 40,
    costGrowth: 1.45,
    color: '#ffb84a',
    desc: 'Trains a troop every 12s (max 3 per barracks) to fight for you.',
    key: '2',
  },
  armory: {
    id: 'armory',
    name: 'Armory',
    model: 'Barrier_Large',
    cost: 60,
    costGrowth: 1.5,
    color: '#ff5d5d',
    desc: '+25% weapon damage and +12% fire rate, stacks.',
    key: '3',
  },
  scrapyard: {
    id: 'scrapyard',
    name: 'Scrapyard',
    model: 'Barrier_Trash',
    cost: 25,
    costGrowth: 1.3,
    color: '#8bd17c',
    desc: '+1 bonus coin per kill, stacks.',
    key: '4',
  },
};

export const MODEL_FILES = {
  AK: './assets/models/AK.gltf',
  Barrier_Single: './assets/models/Barrier_Single.gltf',
  Barrier_Fixed: './assets/models/Barrier_Fixed.gltf',
  Barrier_Large: './assets/models/Barrier_Large.gltf',
  Barrier_Trash: './assets/models/Barrier_Trash.gltf',
};

export const PLAYER_START_HEALTH = 100;
export const PLAYER_MOVE_SPEED = 8.5;
export const PLAYER_EYE_HEIGHT = 1.7;

export const WEAPON_BASE = {
  damage: 18,
  fireRate: 8.5, // shots per second
  magSize: 30,
  reserveAmmo: 90,
  range: 60,
  reloadTime: 1.6,
};

export const TROOP_STATS = {
  health: 40,
  damage: 8,
  fireRate: 2.2,
  range: 16,
  speed: 3.2,
};

export const ENEMY_BASE = {
  health: 30,
  speed: 2.6,
  damage: 8,
  attackRate: 1,
  coinDrop: 1,
};
