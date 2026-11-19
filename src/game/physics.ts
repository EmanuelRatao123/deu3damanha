import type {
  ColliderBox,
  PlayerState,
  PushableProp,
  RegionId,
  RegionInfo,
  WeatherType,
} from './types';

export const PLAYER_RADIUS = 0.36;
export const PLAYER_EYE_STAND = 1.62;
export const PLAYER_EYE_CROUCH = 0.96;
export const PLAYER_HEIGHT_STAND = 1.75;
export const PLAYER_HEIGHT_CROUCH = 1.08;
export const GRAVITY = 22.0;
export const JUMP_VELOCITY = 7.6;
export const WALK_SPEED = 4.7;
export const SPRINT_SPEED = 8.0;
export const BIKE_SPEED = 11.4;
export const CROUCH_SPEED = 2.55;

export const WORLD_BOUND_RADIUS = 124;

export const REGIONS_18: RegionInfo[] = [
  {
    id: 'santa_batata',
    name: 'Santa Batata (Centro)',
    subtitle: 'Casa da Avó, Praça e Mercadinho',
    x: 0,
    z: -12,
    radius: 26,
    ambienceType: 'vila',
    dangerLevel: 'baixo',
  },
  {
    id: 'estrada_velha',
    name: 'Estrada Velha',
    subtitle: 'Rota rural de terra batida',
    x: 0,
    z: -48,
    radius: 18,
    ambienceType: 'estrada',
    dangerLevel: 'medio',
  },
  {
    id: 'fazenda_boa_esperanca',
    name: 'Fazenda Boa Esperança',
    subtitle: 'Curral, celeiro vermelho e lavoura',
    x: -36,
    z: 28,
    radius: 20,
    ambienceType: 'vila',
    dangerLevel: 'baixo',
  },
  {
    id: 'floresta_esquecimento',
    name: 'Floresta do Esquecimento',
    subtitle: 'Mata fechada e território do Saci',
    x: 0,
    z: 52,
    radius: 24,
    ambienceType: 'floresta',
    dangerLevel: 'alto',
  },
  {
    id: 'sitio_alves',
    name: 'Sítio dos Alves',
    subtitle: 'Casarão isolado e milharal',
    x: 42,
    z: 22,
    radius: 18,
    ambienceType: 'floresta',
    dangerLevel: 'medio',
  },
  {
    id: 'cemiterio_municipal',
    name: 'Cemitério Municipal',
    subtitle: 'Lápides de 1901 e névoa fria',
    x: -48,
    z: -18,
    radius: 16,
    ambienceType: 'sombrio',
    dangerLevel: 'alto',
  },
  {
    id: 'bairro_abandonado',
    name: 'Bairro Abandonado',
    subtitle: 'Casas evacuadas após 1987',
    x: -48,
    z: -56,
    radius: 18,
    ambienceType: 'sombrio',
    dangerLevel: 'alto',
  },
  {
    id: 'mina_desativada',
    name: 'Mina Desativada',
    subtitle: 'Escavação original da Primeira Madrugada',
    x: -78,
    z: -52,
    radius: 18,
    ambienceType: 'subterraneo',
    dangerLevel: 'extremo',
  },
  {
    id: 'represa',
    name: 'Represa de Santa Batata',
    subtitle: 'Águas profundas e paredão de concreto',
    x: 72,
    z: -58,
    radius: 20,
    ambienceType: 'agua',
    dangerLevel: 'medio',
  },
  {
    id: 'serra_silencio',
    name: 'Serra do Silêncio',
    subtitle: 'Mirante elevado e ventania constante',
    x: -76,
    z: 68,
    radius: 22,
    ambienceType: 'floresta',
    dangerLevel: 'alto',
  },
  {
    id: 'vila_pescadores',
    name: 'Vila dos Pescadores',
    subtitle: 'Casinhas de madeira e píer de pesca',
    x: 44,
    z: -38,
    radius: 18,
    ambienceType: 'agua',
    dangerLevel: 'baixo',
  },
  {
    id: 'fazenda_santa_luzia',
    name: 'Fazenda Santa Luzia',
    subtitle: 'Sede antiga dos primeiros fazendeiros',
    x: 76,
    z: 18,
    radius: 18,
    ambienceType: 'vila',
    dangerLevel: 'medio',
  },
  {
    id: 'tunel_antigo',
    name: 'Túnel da Estrada Antiga',
    subtitle: 'Passagem escura sob a serra',
    x: -24,
    z: -74,
    radius: 16,
    ambienceType: 'subterraneo',
    dangerLevel: 'alto',
  },
  {
    id: 'hospital_abandonado',
    name: 'Hospital Municipal Abandonado',
    subtitle: 'Alas fechadas e prontuários perdidos',
    x: 24,
    z: -74,
    radius: 18,
    ambienceType: 'sombrio',
    dangerLevel: 'extremo',
  },
  {
    id: 'estacao_ferroviaria',
    name: 'Estação Ferroviária',
    subtitle: 'Trilhos enferrujados e maria-fumaça',
    x: 42,
    z: -6,
    radius: 17,
    ambienceType: 'estrada',
    dangerLevel: 'medio',
  },
  {
    id: 'igreja_velha',
    name: 'Igreja Velha',
    subtitle: 'Campanário azul e sacristia selada',
    x: -24,
    z: -30,
    radius: 14,
    ambienceType: 'vila',
    dangerLevel: 'medio',
  },
  {
    id: 'casa_primeiro_morador',
    name: 'Casa do Primeiro Morador',
    subtitle: 'Ruína histórica de pedra e taipa',
    x: -74,
    z: 16,
    radius: 16,
    ambienceType: 'sombrio',
    dangerLevel: 'alto',
  },
  {
    id: 'complexo_subterraneo',
    name: 'Complexo Subterrâneo Secreto',
    subtitle: 'Laboratório de 1958 sob a mata',
    x: 72,
    z: 68,
    radius: 18,
    ambienceType: 'subterraneo',
    dangerLevel: 'extremo',
  },
];

/**
 * Multi-region terrain elevation with smooth transitions between flat building plateaus,
 * Serra do Silêncio ridge, Represa basin, Mina Desativada depression, and Complexo Subterrâneo.
 */
export function groundHeightAt(x: number, z: number): number {
  // Represa / Lago basin around (72, -58) & Vila dos Pescadores shore (44, -38)
  const represaDist = Math.hypot(x - 72, z + 58);
  if (represaDist < 17) {
    const t = Math.max(0, 1 - represaDist / 17);
    return -0.9 * t * t;
  }
  const lagoDist = Math.hypot(x - 40, z + 34);
  if (lagoDist < 11) {
    const t = Math.max(0, 1 - lagoDist / 11);
    return -0.6 * t * t;
  }

  // Serra do Silêncio elevated plateau (-76, 68)
  const serraDist = Math.hypot(x + 76, z - 68);
  if (serraDist < 26) {
    const t = Math.max(0, Math.min(1, (26 - serraDist) / 14));
    return 4.2 * (t * t * (3 - 2 * t));
  }

  // Mina Desativada sunken pit (-78, -52)
  const minaDist = Math.hypot(x + 78, z + 52);
  if (minaDist < 18) {
    const t = Math.max(0, Math.min(1, (18 - minaDist) / 10));
    return -1.4 * t;
  }

  // Complexo Subterrâneo sunken bunker (72, 68)
  const compDist = Math.hypot(x - 72, z - 68);
  if (compDist < 16) {
    const t = Math.max(0, Math.min(1, (16 - compDist) / 8));
    return -2.2 * t;
  }

  // Keep inner playable village & roads smooth
  const distFromCenter = Math.hypot(x, z);
  if (distFromCenter <= 92) {
    return 0;
  }

  // Outer Minas mountains framing the valley
  const hillFactor = Math.min(1, (distFromCenter - 92) / 34);
  const wave =
    Math.sin(x * 0.06) * 1.6 +
    Math.cos(z * 0.055) * 1.6 +
    Math.sin((x + z) * 0.04) * 1.1;
  return Math.max(0, (4.0 + wave) * hillFactor * hillFactor);
}

/**
 * Computes highest walkable surface below or at entity's feet (terrain, stairs, ramps, crates, roofs).
 */
export function supportHeightAt(
  x: number,
  z: number,
  currentY: number,
  colliders: ColliderBox[],
  radius = 0.25,
): number {
  let highest = groundHeightAt(x, z);

  for (let i = 0; i < colliders.length; i++) {
    const box = colliders[i];
    if (box.active === false) continue;

    if (
      x + radius < box.minX ||
      x - radius > box.maxX ||
      z + radius < box.minZ ||
      z - radius > box.maxZ
    ) {
      continue;
    }

    if (box.isRamp && box.rampAxis) {
      const span =
        box.rampAxis === 'x' ? box.maxX - box.minX : box.maxZ - box.minZ;
      const pos =
        box.rampAxis === 'x' ? x - box.minX : z - box.minZ;
      let t = span > 0.01 ? Math.max(0, Math.min(1, pos / span)) : 0;
      if (box.rampDir === -1) t = 1 - t;
      const rampY = box.minY + (box.maxY - box.minY) * t;
      if (rampY <= currentY + 0.65 && rampY > highest) {
        highest = rampY;
      }
    } else if (box.isLadder) {
      if (box.maxY > highest) {
        highest = Math.min(box.maxY, currentY + 0.38);
      }
    } else {
      // Allow stepping up onto ledges / stairs <= 0.52m above feet
      if (box.maxY <= currentY + 0.52 && box.maxY > highest) {
        highest = box.maxY;
      }
    }
  }

  return highest;
}

/**
 * Shared AABB collision resolver for BOTH Player and Monsters/NPCs.
 * Ensures zero wall, closed-door, window, or furniture clipping.
 */
export function resolveEntityCollisions(
  nextX: number,
  nextZ: number,
  entityY: number,
  entityHeight: number,
  colliders: ColliderBox[],
  radius = PLAYER_RADIUS,
): { x: number; z: number; hitWall: boolean; hitDoorId?: string } {
  let x = nextX;
  let z = nextZ;
  let hitWall = false;
  let hitDoorId: string | undefined;

  const r = Math.hypot(x, z);
  if (r > WORLD_BOUND_RADIUS) {
    const scale = WORLD_BOUND_RADIUS / r;
    x *= scale;
    z *= scale;
    hitWall = true;
  }

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (box.active === false) continue;
      // Ramps & ladders are climbed vertically, not horizontal walls
      if (box.isRamp || box.isLadder) continue;

      // Allow stepping onto low steps <= 0.45m
      if (entityY + 0.45 >= box.maxY || entityY + entityHeight <= box.minY) {
        continue;
      }

      const closestX = Math.max(box.minX, Math.min(x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        hitWall = true;
        if (box.isDoor && box.doorId) hitDoorId = box.doorId;

        if (distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          x += (dx / dist) * overlap;
          z += (dz / dist) * overlap;
        } else {
          const penLeft = Math.abs(x - box.minX);
          const penRight = Math.abs(box.maxX - x);
          const penTop = Math.abs(z - box.minZ);
          const penBottom = Math.abs(box.maxZ - z);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);
          if (minPen === penLeft) x = box.minX - radius;
          else if (minPen === penRight) x = box.maxX + radius;
          else if (minPen === penTop) z = box.minZ - radius;
          else z = box.maxZ + radius;
        }
      }
    }
  }

  return { x, z, hitWall, hitDoorId };
}

/**
 * Backward-compatible alias for player collision checks.
 */
export function resolvePlayerCollisions(
  nextX: number,
  nextZ: number,
  playerY: number,
  playerHeight: number,
  colliders: ColliderBox[],
  radius = PLAYER_RADIUS,
): { x: number; z: number; hitWall: boolean } {
  const res = resolveEntityCollisions(
    nextX,
    nextZ,
    playerY,
    playerHeight,
    colliders,
    radius,
  );
  return { x: res.x, z: res.z, hitWall: res.hitWall };
}

/**
 * Update physical pushable props (crates, chairs, barrels).
 * Returns true if any prop slid noticeably (creates sound for AI hearing).
 */
export function updatePushableProps(
  props: PushableProp[],
  playerX: number,
  playerY: number,
  playerZ: number,
  playerRadius: number,
  colliders: ColliderBox[],
  dt: number,
): boolean {
  let noiseMade = false;

  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    const dx = p.x - playerX;
    const dz = p.z - playerZ;
    const minDistX = p.halfW + playerRadius;
    const minDistZ = p.halfD + playerRadius;

    if (
      Math.abs(dx) < minDistX &&
      Math.abs(dz) < minDistZ &&
      Math.abs(playerY - (p.y - p.halfH)) < 1.3
    ) {
      const pushStrength = 3.6 / Math.max(0.6, p.mass);
      if (Math.abs(dx) > Math.abs(dz)) {
        p.vx += Math.sign(dx || 1) * pushStrength;
      } else {
        p.vz += Math.sign(dz || 1) * pushStrength;
      }
      p.knocked = true;
      noiseMade = true;
    }

    if (Math.abs(p.vx) > 0.02 || Math.abs(p.vz) > 0.02) {
      const nextX = p.x + p.vx * dt;
      const nextZ = p.z + p.vz * dt;
      const col = resolveEntityCollisions(
        nextX,
        nextZ,
        p.y - p.halfH,
        p.halfH * 2,
        colliders,
        Math.max(p.halfW, p.halfD),
      );
      p.x = col.x;
      p.z = col.z;
      p.vx *= Math.exp(-7 * dt);
      p.vz *= Math.exp(-7 * dt);
      if (col.hitWall) {
        p.vx = 0;
        p.vz = 0;
      }
    } else {
      p.vx = 0;
      p.vz = 0;
    }

    const gy = groundHeightAt(p.x, p.z);
    p.y = gy + p.halfH;
  }

  return noiseMade;
}

/**
 * Grid-based A* Pathfinding for Monsters/NPCs so they navigate around walls and closed doors.
 */
export interface NavGrid {
  cellSize: number;
  halfExtent: number;
  cols: number;
  blocked: Uint8Array;
}

export function buildNavGrid(colliders: ColliderBox[], cellSize = 2.0, halfExtent = 124): NavGrid {
  const cols = Math.ceil((halfExtent * 2) / cellSize);
  const blocked = new Uint8Array(cols * cols);

  for (let gz = 0; gz < cols; gz++) {
    const wz = -halfExtent + (gz + 0.5) * cellSize;
    for (let gx = 0; gx < cols; gx++) {
      const wx = -halfExtent + (gx + 0.5) * cellSize;
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (c.active === false || c.isRamp || c.isLadder) continue;
        if (c.maxY <= 0.6 || c.minY >= 2.2) continue;
        const pad = 0.35;
        if (
          wx >= c.minX - pad &&
          wx <= c.maxX + pad &&
          wz >= c.minZ - pad &&
          wz <= c.maxZ + pad
        ) {
          blocked[gz * cols + gx] = 1;
          break;
        }
      }
    }
  }

  return { cellSize, halfExtent, cols, blocked };
}

export function findPathAStar(
  grid: NavGrid,
  startX: number,
  startZ: number,
  goalX: number,
  goalZ: number,
  maxSteps = 420,
): Array<{ x: number; z: number }> {
  const toCell = (v: number) =>
    Math.max(0, Math.min(grid.cols - 1, Math.floor((v + grid.halfExtent) / grid.cellSize)));
  const toWorld = (c: number) => -grid.halfExtent + (c + 0.5) * grid.cellSize;

  const sx = toCell(startX);
  const sz = toCell(startZ);
  let gx = toCell(goalX);
  let gz = toCell(goalZ);

  // If goal cell is inside a collider, find nearest unblocked neighbor
  if (grid.blocked[gz * grid.cols + gx] === 1) {
    let found = false;
    for (let r = 1; r <= 3 && !found; r++) {
      for (let dz = -r; dz <= r && !found; dz++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const nx = gx + dx;
          const nz = gz + dz;
          if (
            nx >= 0 &&
            nx < grid.cols &&
            nz >= 0 &&
            nz < grid.cols &&
            grid.blocked[nz * grid.cols + nx] === 0
          ) {
            gx = nx;
            gz = nz;
            found = true;
          }
        }
      }
    }
    if (!found) return [];
  }

  const startIdx = sz * grid.cols + sx;
  const goalIdx = gz * grid.cols + gx;
  if (startIdx === goalIdx) return [{ x: goalX, z: goalZ }];

  const open: number[] = [startIdx];
  const cameFrom = new Int32Array(grid.cols * grid.cols).fill(-1);
  const gScore = new Float32Array(grid.cols * grid.cols).fill(1e9);
  const fScore = new Float32Array(grid.cols * grid.cols).fill(1e9);
  const closed = new Uint8Array(grid.cols * grid.cols);

  gScore[startIdx] = 0;
  fScore[startIdx] = Math.hypot(gx - sx, gz - sz);

  const dirs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, 1.414],
    [-1, 1, 1.414],
    [1, -1, 1.414],
    [-1, -1, 1.414],
  ];

  let iter = 0;
  while (open.length > 0 && iter < maxSteps) {
    iter++;
    let bestPos = 0;
    for (let i = 1; i < open.length; i++) {
      if (fScore[open[i]] < fScore[open[bestPos]]) bestPos = i;
    }
    const current = open.splice(bestPos, 1)[0];
    if (current === goalIdx) {
      const path: Array<{ x: number; z: number }> = [];
      let curr = current;
      while (curr !== -1 && curr !== startIdx) {
        const cx = curr % grid.cols;
        const cz = Math.floor(curr / grid.cols);
        path.push({ x: toWorld(cx), z: toWorld(cz) });
        curr = cameFrom[curr];
      }
      path.reverse();
      return path;
    }

    closed[current] = 1;
    const cx = current % grid.cols;
    const cz = Math.floor(current / grid.cols);

    for (const [dx, dz, cost] of dirs) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx < 0 || nx >= grid.cols || nz < 0 || nz >= grid.cols) continue;
      const nIdx = nz * grid.cols + nx;
      if (closed[nIdx]) continue;
      if (grid.blocked[nIdx] === 1 && nIdx !== goalIdx) continue;

      // Prevent corner cutting through adjacent blocked orthogonal cells
      if (dx !== 0 && dz !== 0) {
        if (
          grid.blocked[cz * grid.cols + nx] === 1 ||
          grid.blocked[nz * grid.cols + cx] === 1
        ) {
          continue;
        }
      }

      const tentativeG = gScore[current] + cost;
      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = current;
        gScore[nIdx] = tentativeG;
        fScore[nIdx] = tentativeG + Math.hypot(gx - nx, gz - nz);
        if (!open.includes(nIdx)) open.push(nIdx);
      }
    }
  }

  return [];
}

/**
 * Update stamina, fatigue, hunger, and hydration.
 */
export function updateStamina(
  state: Pick<PlayerState, 'stamina' | 'maxStamina' | 'staminaExhausted' | 'isSprinting'>,
  wantsSprint: boolean,
  isMoving: boolean,
  dt: number,
): boolean {
  const canSprint = wantsSprint && isMoving && !state.staminaExhausted && state.stamina > 1;
  if (canSprint) {
    state.isSprinting = true;
    state.stamina = Math.max(0, state.stamina - 20 * dt);
    if (state.stamina <= 0) {
      state.staminaExhausted = true;
      state.isSprinting = false;
    }
  } else {
    state.isSprinting = false;
    const regenRate = state.staminaExhausted ? 13 : 18;
    state.stamina = Math.min(state.maxStamina, state.stamina + regenRate * dt);
    if (state.staminaExhausted && state.stamina >= 25) {
      state.staminaExhausted = false;
    }
  }
  return state.isSprinting;
}

/**
 * Full 24h Clock Formatter (0..1440, where 0 = 00:00, 180 = 03:00, 1100 = 18:20).
 */
export function formatGameClock(
  gameTimeMinutes: number,
  dayNumber = 1,
): {
  formatted: string;
  hour24: number;
  minute: number;
  periodLabel: string;
  moonPhaseLabel: string;
  isNight: boolean;
  isThreeAM: boolean;
} {
  const wrapped = ((Math.floor(gameTimeMinutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;

  const formatted = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  let periodLabel = 'Manhã na Roça';
  if (hour24 >= 5 && hour24 < 7) periodLabel = 'Amanhecer';
  else if (hour24 >= 7 && hour24 < 12) periodLabel = 'Manhã em Santa Batata';
  else if (hour24 >= 12 && hour24 < 17) periodLabel = 'Tarde Ensolarada';
  else if (hour24 >= 17 && hour24 < 19) periodLabel = 'Entardecer na Roça';
  else if (hour24 >= 19 && hour24 <= 23) periodLabel = 'Noite de Santa Batata';
  else if (hour24 >= 0 && hour24 < 3) periodLabel = 'Madrugada Silenciosa';
  else if (hour24 === 3) periodLabel = 'DEU 3 DA MANHÃ';
  else periodLabel = 'Alta Madrugada';

  const moons = [
    'Lua Nova',
    'Lua Crescente',
    'Quarto Crescente',
    'Lua Cheia (Sangrenta)',
    'Lua Minguante',
  ];
  const moonPhaseLabel = moons[(dayNumber - 1) % moons.length];

  const isNight = hour24 >= 19 || hour24 < 5;
  const isThreeAM = hour24 === 3;

  return { formatted, hour24, minute, periodLabel, moonPhaseLabel, isNight, isThreeAM };
}

/**
 * Resolve nearest named region among the 18 Santa Batata regions.
 */
export function getRegionAt(x: number, z: number): RegionInfo {
  let best = REGIONS_18[0];
  let bestScore = Infinity;

  for (const r of REGIONS_18) {
    const d = Math.hypot(x - r.x, z - r.z);
    if (d <= r.radius && d < bestScore) {
      bestScore = d;
      best = r;
    }
  }

  if (bestScore === Infinity) {
    // Fallback to nearest overall
    for (const r of REGIONS_18) {
      const d = Math.hypot(x - r.x, z - r.z);
      if (d < bestScore) {
        bestScore = d;
        best = r;
      }
    }
  }
  return best;
}

export function getLocationName(x: number, z: number): string {
  return getRegionAt(x, z).name;
}

export function pickNextWeather(current: WeatherType, hour24: number, roll: number): WeatherType {
  if (hour24 >= 1 && hour24 <= 4 && roll < 0.35) return 'neblina';
  if (roll < 0.38) return 'limpo';
  if (roll < 0.58) return 'neblina';
  if (roll < 0.78) return 'chuva';
  if (roll < 0.9) return 'ventania';
  return current === 'chuva' ? 'tempestade' : 'chuva';
}
