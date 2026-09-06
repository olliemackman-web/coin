# Coin Siege

A browser-based first-person survival shooter. Kill enemies to earn coins, then spend
those coins on buildings that raise troops, generate income, and upgrade your weapon.
Survive as many escalating waves as you can.

Built with [Three.js](https://threejs.org/) (vendored locally in `vendor/three`, no
build step or install required) and the provided low-poly assets:

- `assets/models/AK.gltf` — the player's rifle (view model)
- `assets/models/Barrier_Single.gltf` — **Outpost**
- `assets/models/Barrier_Fixed.gltf` — **Barracks**
- `assets/models/Barrier_Large.gltf` — **Armory**
- `assets/models/Barrier_Trash.gltf` — **Scrapyard**

Enemies, allied troops, and the player are represented with simple procedurally
generated low-poly characters (no character model files were supplied), styled to
match the rest of the low-poly art.

## Running it

Any static file server works, e.g.:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

(A plain `file://` open won't work because the browser blocks `fetch` of the `.gltf`
assets from the local filesystem — you need a local server.)

## How to play

- **WASD** — move, **mouse** — look, **click** — start/fire the AK
- **R** — reload
- **B** — open/close the build menu
- **1-4** — select a building while the build menu is open
- **Left click** — place the selected building at your crosshair (green = valid, red = invalid)
- **Right click / Esc** — cancel the current building selection

Kill enemies for coins. Coins buy buildings:

| Building | Model | Effect |
| --- | --- | --- |
| **Outpost** | Barrier_Single | Passive income: +2 coins every 4s |
| **Barracks** | Barrier_Fixed | Trains up to 3 troops (12s each) that auto-fight nearby enemies |
| **Armory** | Barrier_Large | +25% weapon damage and +12% fire rate per Armory, stacks |
| **Scrapyard** | Barrier_Trash | +1 bonus coin per kill, stacks |

Buildings and troops can be destroyed if enemies reach them, and every building also
physically blocks enemy movement — so placing them well doubles as base defense.
Each wave brings more enemies than the last; survive as long as you can.
