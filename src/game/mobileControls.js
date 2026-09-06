export function isTouchDevice() {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window
  );
}

function bindPress(el, onDown, onUp) {
  if (!el) return;
  el.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      onDown?.();
    },
    { passive: false }
  );
  if (onUp) {
    el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); }, { passive: false });
    el.addEventListener('touchcancel', (e) => { e.preventDefault(); onUp(); }, { passive: false });
  }
}

export function setupMobileControls({ player, weapon, toggleBuild, confirmPlacement, cancelSelection }) {
  const joyBase = document.getElementById('joystick-base');
  const joyNub = document.getElementById('joystick-nub');
  const lookZone = document.getElementById('look-zone');
  const fireBtn = document.getElementById('fire-btn');
  const reloadBtn = document.getElementById('reload-btn-mobile');
  const buildBtn = document.getElementById('build-btn-mobile');
  const placeBtn = document.getElementById('place-btn-mobile');
  const cancelBtn = document.getElementById('cancel-btn-mobile');

  const joyRadius = 46;
  let joyId = null;
  const joyCenter = { x: 0, y: 0 };

  function updateJoy(clientX, clientY) {
    let dx = clientX - joyCenter.x;
    let dy = clientY - joyCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist > joyRadius) {
      dx = (dx / dist) * joyRadius;
      dy = (dy / dist) * joyRadius;
    }
    joyNub.style.transform = `translate(${dx}px, ${dy}px)`;
    player.touchMove.x = dx / joyRadius;
    player.touchMove.y = -dy / joyRadius;
  }

  function resetJoy() {
    joyId = null;
    joyNub.style.transform = 'translate(0px, 0px)';
    player.touchMove.x = 0;
    player.touchMove.y = 0;
  }

  joyBase?.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      if (joyId !== null) return;
      const t = e.changedTouches[0];
      joyId = t.identifier;
      const rect = joyBase.getBoundingClientRect();
      joyCenter.x = rect.left + rect.width / 2;
      joyCenter.y = rect.top + rect.height / 2;
      updateJoy(t.clientX, t.clientY);
    },
    { passive: false }
  );
  joyBase?.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) updateJoy(t.clientX, t.clientY);
      }
    },
    { passive: false }
  );
  function joyEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) resetJoy();
    }
  }
  joyBase?.addEventListener('touchend', joyEnd);
  joyBase?.addEventListener('touchcancel', joyEnd);

  let lookId = null;
  let lastX = 0;
  let lastY = 0;
  const LOOK_SENSITIVITY = 0.0048;

  lookZone?.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      if (lookId !== null) return;
      const t = e.changedTouches[0];
      lookId = t.identifier;
      lastX = t.clientX;
      lastY = t.clientY;
    },
    { passive: false }
  );
  lookZone?.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== lookId) continue;
        const dx = t.clientX - lastX;
        const dy = t.clientY - lastY;
        lastX = t.clientX;
        lastY = t.clientY;
        player.lookDelta(dx, dy, LOOK_SENSITIVITY);
      }
    },
    { passive: false }
  );
  function lookEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === lookId) lookId = null;
    }
  }
  lookZone?.addEventListener('touchend', lookEnd);
  lookZone?.addEventListener('touchcancel', lookEnd);

  bindPress(fireBtn, () => weapon.setTrigger(true), () => weapon.setTrigger(false));
  bindPress(reloadBtn, () => weapon.startReload());
  bindPress(buildBtn, () => toggleBuild());
  bindPress(placeBtn, () => confirmPlacement());
  bindPress(cancelBtn, () => cancelSelection());
}
