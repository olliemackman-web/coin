import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODEL_FILES } from './constants.js';

const loader = new GLTFLoader();
const cache = new Map();

function loadOne(key, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        cache.set(key, gltf.scene);
        resolve();
      },
      undefined,
      (err) => reject(new Error(`Failed to load ${key} (${url}): ${err?.message ?? err}`))
    );
  });
}

export async function preloadAssets(onProgress) {
  const entries = Object.entries(MODEL_FILES);
  let done = 0;
  for (const [key, url] of entries) {
    await loadOne(key, url);
    done += 1;
    if (onProgress) onProgress(done / entries.length, key);
  }
}

export function getModel(key) {
  const source = cache.get(key);
  if (!source) throw new Error(`Model not loaded: ${key}`);
  return source.clone(true);
}
