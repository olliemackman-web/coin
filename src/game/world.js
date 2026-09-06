import * as THREE from 'three';
import { ARENA_RADIUS } from './constants.js';

export function createWorld(scene) {
  scene.background = new THREE.Color(0x0b0f14);
  scene.fog = new THREE.Fog(0x0b0f14, 25, 75);

  const hemi = new THREE.HemisphereLight(0x8fb3ff, 0x1a1206, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.4);
  sun.position.set(30, 40, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0015;
  scene.add(sun);

  const groundGeo = new THREE.CircleGeometry(ARENA_RADIUS + 6, 64);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b3a2a, roughness: 1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ringGeo = new THREE.RingGeometry(ARENA_RADIUS - 0.3, ARENA_RADIUS, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd24a, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  // simple scattered rocks/props for visual interest, purely decorative
  const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x555f5a, roughness: 1 });
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = ARENA_RADIUS + 3 + Math.random() * 12;
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(Math.cos(angle) * dist, 0.3, Math.sin(angle) * dist);
    rock.scale.setScalar(0.6 + Math.random() * 1.6);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  return { ground };
}
