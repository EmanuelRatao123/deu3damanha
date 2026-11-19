import { SPECIAL_EVENTS } from './campaign';
import {
  findPathAStar,
  getRegionAt,
  groundHeightAt,
  resolveEntityCollisions,
  type NavGrid,
} from './physics';
import type {
  ColliderBox,
  CreatureState,
  NpcState,
  PlayerState,
  WeatherType,
} from './types';

export interface CreaturePerceptionInput {
  player: Pick<
    PlayerState,
    'x' | 'y' | 'z' | 'isHiding' | 'isCrouching' | 'flashlightOn' | 'noiseLevel'
  >;
  isNight: boolean;
  isThreeAM: boolean;
  hour24: number;
  hasCornDistraction: boolean;
  hasAmulet: boolean;
  disturbancePos: { x: number; z: number } | null;
  colliders: ColliderBox[];
  navGrid: NavGrid | null;
}

/**
 * Checks approximate line-of-sight between creature and target against active wall/closed-door colliders.
 */
export function hasLineOfSight(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  colliders: ColliderBox[],
): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.8) return true;
  const steps = Math.min(20, Math.ceil(dist / 1.1));
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const px = x1 + dx * t;
    const pz = z1 + dz * t;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.active === false || c.isRamp || c.isLadder || c.isWindow) continue;
      if (c.maxY <= 0.7 || c.minY >= 2.2) continue;
      if (px >= c.minX && px <= c.maxX && pz >= c.minZ && pz <= c.maxZ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Moves a creature toward a target point using A* waypoints + solid wall/door collision resolution.
 * Creatures NEVER clip through walls or closed doors.
 */
function moveCreatureWithCollision(
  c: CreatureState,
  targetX: number,
  targetZ: number,
  moveSpeed: number,
  dt: number,
  colliders: ColliderBox[],
  navGrid: NavGrid | null,
): { hitWall: boolean; hitDoorId?: string } {
  let steerX = targetX;
  let steerZ = targetZ;

  // Use A* pathfinding when grid is available and target is > 2.5m away
  const directDist = Math.hypot(targetX - c.x, targetZ - c.z);
  if (navGrid && directDist > 2.5) {
    if (c.pathRecalcTimer <= 0 || c.path.length === 0) {
      c.path = findPathAStar(navGrid, c.x, c.z, targetX, targetZ, 260);
      c.pathRecalcTimer = 0.75;
    }
    while (c.path.length > 0 && Math.hypot(c.path[0].x - c.x, c.path[0].z - c.z) < 0.9) {
      c.path.shift();
    }
    if (c.path.length > 0) {
      steerX = c.path[0].x;
      steerZ = c.path[0].z;
    }
  }

  const dx = steerX - c.x;
  const dz = steerZ - c.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05) return { hitWall: false };

  const stepX = (dx / d) * moveSpeed * dt;
  const stepZ = (dz / d) * moveSpeed * dt;
  const gy = groundHeightAt(c.x, c.z);
  const res = resolveEntityCollisions(
    c.x + stepX,
    c.z + stepZ,
    gy,
    1.85,
    colliders,
    c.radius || 0.42,
  );
  c.x = res.x;
  c.z = res.z;
  c.y = groundHeightAt(c.x, c.z);
  c.yaw = Math.atan2(dx, dz);

  // If blocked by a closed door or corner wall, invalidate path immediately to reroute
  if (res.hitWall) {
    c.pathRecalcTimer = 0;
  }

  return { hitWall: res.hitWall, hitDoorId: res.hitDoorId };
}

/**
 * 10-State Creature AI with vision cone, hearing, wall/door blocking, suspicion meter,
 * investigation of pushed props/noises, search timeout, and distinct creature personalities.
 */
export function updateCreatureAI(
  creature: CreatureState,
  input: CreaturePerceptionInput,
  dt: number,
  elapsed = 0,
): {
  caughtPlayer: boolean;
  triggeredLaugh: boolean;
  triggeredSteal: boolean;
  triggeredKnockDoor?: string;
} {
  let caughtPlayer = false;
  let triggeredLaugh = false;
  let triggeredSteal = false;
  let triggeredKnockDoor: string | undefined;

  if (!creature.active) {
    return { caughtPlayer, triggeredLaugh, triggeredSteal };
  }

  const { player, isNight, isThreeAM, hour24, hasCornDistraction, hasAmulet, disturbancePos, colliders, navGrid } =
    input;

  creature.modeTimer = Math.max(0, creature.modeTimer - dt);
  creature.pathRecalcTimer = Math.max(0, creature.pathRecalcTimer - dt);
  creature.reactionCooldown = Math.max(0, creature.reactionCooldown - dt);

  // Sleep schedule during bright day for nocturnal horrors
  const isNocturnal =
    creature.type === 'homem_do_saco' ||
    creature.type === 'criatura_floresta' ||
    creature.type === 'mula_sem_cabeca';

  if (isNocturnal && !isNight && hour24 >= 6 && hour24 < 19) {
    creature.mode = 'dormindo';
    creature.suspicion = Math.max(0, creature.suspicion - 35 * dt);
    return { caughtPlayer, triggeredLaugh, triggeredSteal };
  }
  if (creature.mode === 'dormindo' && isNight) {
    creature.mode = 'patrulhando';
  }

  const dx = player.x - creature.x;
  const dz = player.z - creature.z;
  const distToPlayer = Math.hypot(dx, dz);

  // Vision cone & hearing calculations
  const baseVision =
    creature.type === 'homem_do_saco'
      ? isThreeAM
        ? 25
        : 17
      : creature.type === 'mula_sem_cabeca'
        ? 22
        : creature.type === 'criatura_floresta'
          ? 19
          : creature.type === 'saci'
            ? 15
            : isNight
              ? 14
              : 6;

  const amuletFactor = hasAmulet ? 0.82 : 1.0;
  const lightBonus = player.flashlightOn ? 5.5 : 0;
  const crouchFactor = player.isCrouching && !player.flashlightOn ? 0.52 : 1.0;
  const effectiveVision = player.isHiding ? 0 : (baseVision + lightBonus) * crouchFactor * amuletFactor;

  // Directional vision check (wider close-up, 110 deg cone at range)
  const forwardX = Math.sin(creature.yaw);
  const forwardZ = Math.cos(creature.yaw);
  const dot = distToPlayer > 0.01 ? (dx / distToPlayer) * forwardX + (dz / distToPlayer) * forwardZ : 1;
  const inFov = distToPlayer < 4.5 || dot > 0.25;
  const canSee =
    !player.isHiding &&
    distToPlayer <= effectiveVision &&
    inFov &&
    hasLineOfSight(creature.x, creature.z, player.x, player.z, colliders);

  // Noise hearing radius
  const hearRadius = player.isHiding ? 0 : 4 + (player.noiseLevel / 100) * 14;
  const canHear = !player.isHiding && distToPlayer <= hearRadius && player.noiseLevel > 28;

  // Galinha special corn distraction
  if (creature.type === 'galinha' && hasCornDistraction && distToPlayer < 6) {
    creature.mode = 'interagindo';
    creature.suspicion = Math.max(0, creature.suspicion - 45 * dt);
    creature.modeTimer = 3.0;
  }

  // Saci special mischievous behavior (steal attempt then vanish/flee)
  if (creature.type === 'saci') {
    if (distToPlayer < 2.3 && !player.isHiding && creature.reactionCooldown <= 0) {
      creature.mode = 'desistindo';
      creature.modeTimer = 4.5;
      creature.reactionCooldown = 14;
      triggeredSteal = true;
    } else if (canSee && creature.mode !== 'desistindo') {
      creature.mode = 'interagindo';
      creature.lastKnownX = player.x;
      creature.lastKnownZ = player.z;
    } else if (creature.mode === 'desistindo' && creature.modeTimer <= 0) {
      creature.mode = 'retornando';
    }
  } else {
    // Perception -> Suspicion -> 10-State Machine for Homem do Saco, Criatura, Mula, Galinha
    if (canSee) {
      creature.lastKnownX = player.x;
      creature.lastKnownZ = player.z;
      const gain = creature.type === 'galinha' && !isNight ? 18 : 68;
      creature.suspicion = Math.min(100, creature.suspicion + gain * dt);

      if (creature.mode !== 'perseguindo') {
        if (creature.suspicion >= 72 && (isNight || creature.type === 'galinha')) {
          if (creature.mode !== 'suspeitando') {
            creature.mode = 'suspeitando';
            creature.windupTimer = 0.72;
            if (creature.type === 'galinha' && creature.reactionCooldown <= 0) {
              triggeredLaugh = true;
              creature.reactionCooldown = 9;
            }
          } else {
            creature.windupTimer -= dt;
            creature.yaw = Math.atan2(dx, dz);
            if (creature.windupTimer <= 0) {
              creature.mode = 'perseguindo';
              creature.modeTimer = isThreeAM ? 9.5 : 7.0;
            }
          }
        } else if (creature.suspicion >= 25) {
          creature.mode = 'investigando';
          creature.modeTimer = 4.5;
        }
      } else {
        creature.modeTimer = isThreeAM ? 8.5 : 6.0;
      }
    } else if (canHear) {
      creature.lastKnownX = player.x;
      creature.lastKnownZ = player.z;
      creature.suspicion = Math.min(100, creature.suspicion + 36 * dt);
      if (creature.mode === 'patrulhando' || creature.mode === 'explorando' || creature.mode === 'retornando') {
        creature.mode = 'investigando';
        creature.modeTimer = 5.0;
      }
    } else if (disturbancePos && Math.hypot(disturbancePos.x - creature.x, disturbancePos.z - creature.z) < 22) {
      creature.lastKnownX = disturbancePos.x;
      creature.lastKnownZ = disturbancePos.z;
      if (creature.mode === 'patrulhando' || creature.mode === 'explorando') {
        creature.mode = 'investigando';
        creature.modeTimer = 5.0;
      }
    } else {
      // Lost sight/sound -> drop chase into searching -> giving up -> returning
      creature.suspicion = Math.max(0, creature.suspicion - 18 * dt);
      if (creature.mode === 'perseguindo' && creature.modeTimer <= 0) {
        creature.mode = 'procurando';
        creature.modeTimer = 4.2;
      } else if (creature.mode === 'procurando' && creature.modeTimer <= 0) {
        creature.mode = 'desistindo';
        creature.modeTimer = 2.0;
      } else if (creature.mode === 'investigando' && creature.modeTimer <= 0) {
        creature.mode = 'desistindo';
        creature.modeTimer = 1.8;
      } else if (creature.mode === 'desistindo' && creature.modeTimer <= 0) {
        creature.mode = 'retornando';
      } else if (creature.mode === 'interagindo' && creature.modeTimer <= 0) {
        creature.mode = 'patrulhando';
      } else if (creature.mode === 'suspeitando' && creature.suspicion < 35) {
        creature.mode = 'procurando';
        creature.modeTimer = 3.0;
      }
    }
  }

  // Execute movement per current state
  if (creature.mode === 'perseguindo') {
    const mult = isThreeAM ? 1.32 : 1.15;
    const stepRes = moveCreatureWithCollision(
      creature,
      player.x,
      player.z,
      creature.speed * mult,
      dt,
      colliders,
      navGrid,
    );
    if (stepRes.hitDoorId && creature.reactionCooldown <= 0) {
      triggeredKnockDoor = stepRes.hitDoorId;
      creature.reactionCooldown = 4.0;
    }
    const nowDist = Math.hypot(player.x - creature.x, player.z - creature.z);
    if (
      nowDist < 1.18 &&
      !player.isHiding &&
      hasLineOfSight(creature.x, creature.z, player.x, player.z, colliders)
    ) {
      caughtPlayer = true;
    }
  } else if (creature.mode === 'investigando' || creature.mode === 'procurando') {
    const tx = creature.lastKnownX ?? creature.homeX;
    const tz = creature.lastKnownZ ?? creature.homeZ;
    if (Math.hypot(tx - creature.x, tz - creature.z) > 1.0) {
      const stepRes = moveCreatureWithCollision(
        creature,
        tx,
        tz,
        creature.speed * 0.78,
        dt,
        colliders,
        navGrid,
      );
      if (stepRes.hitDoorId && creature.reactionCooldown <= 0) {
        triggeredKnockDoor = stepRes.hitDoorId;
        creature.reactionCooldown = 5.0;
      }
    } else {
      // Look around suspiciously
      creature.yaw += dt * 2.1;
    }
  } else if (creature.mode === 'retornando') {
    const dHome = Math.hypot(creature.homeX - creature.x, creature.homeZ - creature.z);
    if (dHome < 1.6) {
      creature.mode = 'patrulhando';
    } else {
      moveCreatureWithCollision(
        creature,
        creature.homeX,
        creature.homeZ,
        creature.speed * 0.7,
        dt,
        colliders,
        navGrid,
      );
    }
  } else if (creature.mode === 'suspeitando') {
    const tx = creature.lastKnownX ?? player.x;
    const tz = creature.lastKnownZ ?? player.z;
    creature.yaw = Math.atan2(tx - creature.x, tz - creature.z);
  } else if (creature.mode === 'desistindo') {
    if (creature.type === 'saci') {
      // Flee away from player
      const awayX = creature.x - (dx / (distToPlayer || 1)) * 8;
      const awayZ = creature.z - (dz / (distToPlayer || 1)) * 8;
      moveCreatureWithCollision(creature, awayX, awayZ, creature.speed * 1.4, dt, colliders, navGrid);
    } else {
      creature.yaw += dt * 1.2;
    }
  } else if (creature.mode === 'interagindo') {
    if (creature.type === 'saci' && !player.isHiding) {
      // Saci orbits playfully around player
      const perpX = -dz / (distToPlayer || 1);
      const perpZ = dx / (distToPlayer || 1);
      moveCreatureWithCollision(
        creature,
        player.x + perpX * 3.5,
        player.z + perpZ * 3.5,
        creature.speed,
        dt,
        colliders,
        navGrid,
      );
    } else {
      creature.yaw += Math.sin(elapsed * 5) * dt * 2;
    }
  } else {
    // 'patrulhando' or 'explorando'
    if (creature.mode === 'patrulhando' && creature.modeTimer <= 0) {
      creature.mode = 'explorando';
      creature.modeTimer = 6 + Math.random() * 5;
    } else if (creature.mode === 'explorando' && creature.modeTimer <= 0) {
      creature.mode = 'patrulhando';
      creature.modeTimer = 6 + Math.random() * 5;
    }

    const orbitR = creature.mode === 'explorando' ? 11 : 5.5;
    const t = elapsed * (creature.type === 'mula_sem_cabeca' ? 0.55 : 0.32) + creature.homeX;
    const wx = creature.homeX + Math.cos(t) * orbitR;
    const wz = creature.homeZ + Math.sin(t * 0.85) * orbitR;
    moveCreatureWithCollision(creature, wx, wz, creature.speed * 0.56, dt, colliders, navGrid);
  }

  return { caughtPlayer, triggeredLaugh, triggeredSteal, triggeredKnockDoor };
}

/**
 * Updates 24h NPC daily routines (sleep at night inside homes, work during day,
 * evening social gathering at Praça Central / Feira).
 */
export function updateNpcRoutines(
  npcs: NpcState[],
  hour24: number,
  weather: WeatherType,
  colliders: ColliderBox[],
  dt: number,
): void {
  const isRaining = weather === 'chuva' || weather === 'tempestade';

  for (const npc of npcs) {
    // Vó Maria stays near home/porch and watches over the player
    let targetX = npc.workX;
    let targetZ = npc.workZ;
    let sleeping = false;
    let label = 'Trabalhando';

    if (npc.id === 'avo') {
      targetX = isRaining || hour24 >= 23 || hour24 < 6 ? npc.homeX : npc.workX;
      targetZ = isRaining || hour24 >= 23 || hour24 < 6 ? npc.homeZ : npc.workZ;
      label = hour24 >= 1 && hour24 < 5 ? 'Vigiando a Porta' : 'Na Varanda / Cozinha';
    } else if (npc.id === 'saci') {
      // Saci roams forest always
      targetX = npc.workX;
      targetZ = npc.workZ;
      label = 'Vigiando a Floresta';
    } else if (hour24 >= 22 || hour24 < 6) {
      targetX = npc.homeX;
      targetZ = npc.homeZ;
      sleeping = true;
      label = 'Dormindo em casa';
    } else if (hour24 >= 17 && hour24 < 22 && !isRaining) {
      targetX = npc.plazaX;
      targetZ = npc.plazaZ;
      label = 'Na Praça / Feirinha';
    } else if (isRaining) {
      targetX = npc.homeX;
      targetZ = npc.homeZ;
      label = 'Abrigo da chuva';
    }

    npc.sleeping = sleeping;
    npc.routineLabel = label;

    const dx = targetX - npc.x;
    const dz = targetZ - npc.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.45) {
      const spd = 2.4;
      const res = resolveEntityCollisions(
        npc.x + (dx / d) * spd * dt,
        npc.z + (dz / d) * spd * dt,
        groundHeightAt(npc.x, npc.z),
        1.75,
        colliders,
        0.34,
      );
      npc.x = res.x;
      npc.z = res.z;
      npc.y = groundHeightAt(npc.x, npc.z);
      npc.yaw = Math.atan2(dx, dz);
    }
  }
}

/**
 * Picks one of the 30 Special Events contextualized by current region and night/day cycle.
 */
export function pickSpecialEvent(
  playerX: number,
  playerZ: number,
  isNight: boolean,
  roll: number,
) {
  const region = getRegionAt(playerX, playerZ);
  const candidates = SPECIAL_EVENTS.filter(
    (ev) =>
      (!ev.nightOnly || isNight) &&
      (ev.regionId === region.id || ev.regionId === 'global'),
  );
  const pool = candidates.length > 0 ? candidates : SPECIAL_EVENTS.filter((e) => !e.nightOnly || isNight);
  const idx = Math.min(pool.length - 1, Math.floor(roll * pool.length));
  return pool[idx] ?? SPECIAL_EVENTS[0];
}
