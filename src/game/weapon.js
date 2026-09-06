import * as THREE from 'three';
import { getModel } from './assets.js';
import { WEAPON_BASE } from './constants.js';

export class Weapon {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.damageMult = 1;
    this.fireRateMult = 1;

    this.magSize = WEAPON_BASE.magSize;
    this.ammoInMag = WEAPON_BASE.magSize;
    this.reserveAmmo = WEAPON_BASE.reserveAmmo;
    this.reloading = false;
    this.reloadTimer = 0;

    this._cooldown = 0;
    this._triggerHeld = false;
    this.enabled = true;
    this._bobT = 0;
    this._kick = 0;

    this.model = getModel('AK');
    this.model.scale.setScalar(0.38);
    this.model.position.set(0.22, -0.2, -0.78);
    this.model.rotation.set(0, -Math.PI / 2, 0);
    this.camera.add(this.model);

    this.muzzleFlash = new THREE.PointLight(0xffd24a, 0, 4, 2);
    this.muzzleFlash.position.set(0.22, -0.12, -1.25);
    this.camera.add(this.muzzleFlash);

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.setTrigger(true);
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.setTrigger(false);
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') this.startReload();
    });
  }

  setTrigger(held) {
    this._triggerHeld = held;
  }

  get damage() {
    return WEAPON_BASE.damage * this.damageMult;
  }

  get fireRate() {
    return WEAPON_BASE.fireRate * this.fireRateMult;
  }

  startReload() {
    if (this.reloading || this.ammoInMag === this.magSize || this.reserveAmmo <= 0) return;
    this.reloading = true;
    this.reloadTimer = WEAPON_BASE.reloadTime;
  }

  update(delta, moveSpeedFrac) {
    if (this._cooldown > 0) this._cooldown -= delta;
    if (this._kick > 0) {
      this._kick = Math.max(0, this._kick - delta * 6);
    }
    this.muzzleFlash.intensity = Math.max(0, this.muzzleFlash.intensity - delta * 20);

    if (this.reloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        const needed = this.magSize - this.ammoInMag;
        const take = Math.min(needed, this.reserveAmmo);
        this.ammoInMag += take;
        this.reserveAmmo -= take;
        this.reloading = false;
      }
    } else if (this._triggerHeld && this.ammoInMag <= 0) {
      this.startReload();
    }

    this._bobT += delta * (moveSpeedFrac > 0.05 ? 8 : 2);
    const bobAmount = moveSpeedFrac > 0.05 ? 0.015 : 0.004;
    const bobX = Math.sin(this._bobT) * bobAmount;
    const bobY = Math.abs(Math.cos(this._bobT)) * bobAmount;
    this.model.position.set(0.22 + bobX, -0.2 + bobY - this._kick * 0.05, -0.78 + this._kick * 0.08);

    if (this.enabled && this._triggerHeld && !this.reloading && this._cooldown <= 0 && this.ammoInMag > 0) {
      this._fire();
    }
  }

  _fire() {
    this._cooldown = 1 / this.fireRate;
    this.ammoInMag -= 1;
    this._kick = 1;
    this.muzzleFlash.intensity = 6;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);

    if (this.onFire) this.onFire(origin, dir, this.damage, WEAPON_BASE.range);
  }
}
