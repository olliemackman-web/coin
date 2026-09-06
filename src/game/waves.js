export function waveConfig(wave) {
  return {
    count: 4 + Math.floor(wave * 2.2),
    spawnInterval: Math.max(0.35, 1.1 - wave * 0.04),
    difficultyMult: 1 + (wave - 1) * 0.18,
    breakTime: 8,
  };
}
