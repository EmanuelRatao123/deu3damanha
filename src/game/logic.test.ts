import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS,
  CHAPTERS,
  ENDING_DETAILS,
  ITEM_CATALOG,
  LORE_ENTRIES,
  MAX_BACKPACK_SLOTS,
  OPTIONAL_STORIES,
  SIDE_MISSIONS,
  SPECIAL_EVENTS,
  getChapterByNumber,
} from './campaign';
import { selectNpcDialogue } from './dialogues';
import {
  REGIONS_18,
  buildNavGrid,
  findPathAStar,
  formatGameClock,
  getRegionAt,
  groundHeightAt,
  resolveEntityCollisions,
  supportHeightAt,
  updatePushableProps,
  updateStamina,
} from './physics';
import { pickSpecialEvent, updateCreatureAI } from './simulation';
import {
  createInitialSave,
  validateAndRepairSave,
} from './storage';
import type { ColliderBox, CreatureState, PushableProp } from './types';

test('REGIONS_18 covers all 18 distinct regions with varied vertical terrain', () => {
  assert.equal(REGIONS_18.length, 18);
  const ids = new Set(REGIONS_18.map((r) => r.id));
  assert.equal(ids.size, 18);

  // Inner village plateau is flat
  assert.equal(groundHeightAt(0, -10), 0);
  // Serra do Silêncio elevated > 3m
  assert.ok(groundHeightAt(-76, 68) > 3.5);
  // Represa basin < 0
  assert.ok(groundHeightAt(72, -58) < -0.5);
  // Mina Desativada sunken pit < 0
  assert.ok(groundHeightAt(-78, -52) < -0.8);
  // Complexo Subterrâneo sunken bunker < 0
  assert.ok(groundHeightAt(72, 68) < -1.5);

  assert.equal(getRegionAt(0, -12).id, 'santa_batata');
  assert.equal(getRegionAt(-76, 68).id, 'serra_silencio');
  assert.equal(getRegionAt(72, 68).id, 'complexo_subterraneo');
});

test('monsters and player share solid wall & closed-door collision + A* navigation', () => {
  const walls: ColliderBox[] = [
    // Horizontal wall at z = 5 from x = -4 to x = 4
    { id: 'wall_block', minX: -4, maxX: 4, minZ: 4.5, maxZ: 5.5, minY: 0, maxY: 3, active: true },
    // Closed door at x = 6..8
    { id: 'closed_door', minX: 5.5, maxX: 8.5, minZ: 4.5, maxZ: 5.5, minY: 0, maxY: 2.6, isDoor: true, doorId: 'd1', active: true },
  ];

  // Player blocked by wall
  const pRes = resolveEntityCollisions(0, 4.3, 0, 1.75, walls, 0.36);
  assert.equal(pRes.hitWall, true);
  assert.ok(pRes.z <= 4.5 - 0.36 + 0.001);

  // Closed door blocks monster, open door lets it pass
  const dClosed = resolveEntityCollisions(7, 4.3, 0, 1.85, walls, 0.42);
  assert.equal(dClosed.hitWall, true);
  assert.equal(dClosed.hitDoorId, 'd1');

  // A* pathfinding routes around the x=-4..4 wall
  const grid = buildNavGrid([walls[0]], 2.0, 20);
  const path = findPathAStar(grid, 0, 2, 0, 8, 300);
  assert.ok(path.length >= 2);
  const crossesWall = path.some((pt) => pt.z > 4.4 && pt.z < 5.6 && pt.x > -4 && pt.x < 4);
  assert.equal(crossesWall, false);
});

test('supportHeightAt climbs ramps, stairs, and ladders smoothly', () => {
  const stairsAndRamp: ColliderBox[] = [
    {
      id: 'ramp_hosp',
      minX: 10,
      maxX: 16,
      minZ: 0,
      maxZ: 2,
      minY: 0,
      maxY: 3.0,
      isRamp: true,
      rampAxis: 'x',
      rampDir: 1,
      active: true,
    },
    {
      id: 'ladder_serra',
      minX: 20,
      maxX: 21,
      minZ: 0,
      maxZ: 1,
      minY: 0,
      maxY: 4.0,
      isLadder: true,
      active: true,
    },
  ];

  // Midpoint of ramp (x=13) should be ~1.5m
  const hMid = supportHeightAt(13, 1, 1.4, stairsAndRamp);
  assert.ok(Math.abs(hMid - 1.5) < 0.05);

  // Ladder lets entity climb up incrementally
  const hLadder = supportHeightAt(20.5, 0.5, 1.0, stairsAndRamp);
  assert.ok(hLadder > 1.0);
});

test('updatePushableProps moves crate without clipping through walls and emits noise flag', () => {
  const wall: ColliderBox[] = [
    { id: 'w', minX: 4, maxX: 5, minZ: -2, maxZ: 2, minY: 0, maxY: 3, active: true },
  ];
  const props: PushableProp[] = [
    {
      id: 'crate1',
      label: 'Caixote',
      x: 2.0,
      y: 0.45,
      z: 0,
      vx: 0,
      vz: 0,
      halfW: 0.45,
      halfH: 0.45,
      halfD: 0.45,
      mass: 1,
      knocked: false,
    },
  ];
  const madeNoise = updatePushableProps(props, 1.4, 0, 0, 0.36, wall, 0.1);
  assert.equal(madeNoise, true);
  assert.equal(props[0].knocked, true);
  assert.ok(props[0].x > 2.0);
  assert.ok(props[0].x < 4.0);
});

test('stamina drains and enters exhaustion at zero', () => {
  const player = { stamina: 10, maxStamina: 100, staminaExhausted: false, isSprinting: false };
  assert.equal(updateStamina(player, true, true, 0.4), true);
  assert.equal(updateStamina(player, true, true, 0.4), false);
  assert.equal(player.staminaExhausted, true);
  assert.equal(updateStamina(player, true, true, 0.2), false);
});

test('24h formatGameClock covers 18:15, 03:00 DA MANHÃ, and daytime 08:00', () => {
  const evening = formatGameClock(1095, 1);
  assert.equal(evening.formatted, '18:15');
  assert.equal(evening.isNight, false);
  assert.equal(evening.isThreeAM, false);

  const threeAM = formatGameClock(180, 2);
  assert.equal(threeAM.formatted, '03:00');
  assert.equal(threeAM.isNight, true);
  assert.equal(threeAM.isThreeAM, true);
  assert.equal(threeAM.periodLabel, 'DEU 3 DA MANHÃ');
  assert.equal(threeAM.moonPhaseLabel, 'Lua Crescente');

  const morning = formatGameClock(480, 1);
  assert.equal(morning.formatted, '08:00');
  assert.equal(morning.isNight, false);
});

test('campaign has 15 chapters, 45 side missions, 20 lore, 30 events, 20 stories, 20 achievements, 6 endings', () => {
  assert.equal(CHAPTERS.length, 15);
  for (let i = 1; i <= 15; i++) {
    const ch = getChapterByNumber(i as any);
    assert.ok(ch.objectives.length >= 1);
    assert.ok(ch.title.length > 5);
  }
  assert.equal(SIDE_MISSIONS.length, 45);
  assert.equal(LORE_ENTRIES.length, 20);
  assert.equal(SPECIAL_EVENTS.length, 30);
  assert.equal(OPTIONAL_STORIES.length, 20);
  assert.equal(ACHIEVEMENTS.length, 20);
  assert.equal(Object.keys(ENDING_DETAILS).length, 6);
  assert.equal(MAX_BACKPACK_SLOTS, 24);
  assert.ok(ITEM_CATALOG.disco_1958);
  assert.ok(ENDING_DETAILS.segredo_primeira_madrugada.victory);
});

test('10-state creature AI sleeps by day, suspects then chases at night, and never clips closed doors', () => {
  const closedDoor: ColliderBox[] = [
    { id: 'door', minX: 11.8, maxX: 12.2, minZ: -5, maxZ: 5, minY: 0, maxY: 2.5, isDoor: true, doorId: 'd_front', active: true },
  ];
  const homem: CreatureState = {
    id: 'homem',
    type: 'homem_do_saco',
    name: 'Homem do Saco',
    x: 10,
    y: 0,
    z: 0,
    homeX: 10,
    homeZ: 0,
    yaw: Math.PI / 2,
    speed: 3.8,
    radius: 0.45,
    mode: 'dormindo',
    modeTimer: 0,
    windupTimer: 0,
    suspicion: 0,
    lastKnownX: null,
    lastKnownZ: null,
    path: [],
    pathRecalcTimer: 0,
    active: true,
    reactionCooldown: 0,
  };

  // Bright day (10:00) -> nocturnal creature stays dormindo
  updateCreatureAI(
    homem,
    {
      player: { x: 11, y: 0, z: 0, isHiding: false, isCrouching: false, flashlightOn: false, noiseLevel: 20 },
      isNight: false,
      isThreeAM: false,
      hour24: 10,
      hasCornDistraction: false,
      hasAmulet: false,
      disturbancePos: null,
      colliders: [],
      navGrid: null,
    },
    0.5,
  );
  assert.equal(homem.mode, 'dormindo');

  // Night (03:00) -> player clearly visible at x=13 (no door in first check) -> builds suspicion -> suspeitando -> perseguindo
  updateCreatureAI(
    homem,
    {
      player: { x: 14, y: 0, z: 0, isHiding: false, isCrouching: false, flashlightOn: true, noiseLevel: 40 },
      isNight: true,
      isThreeAM: true,
      hour24: 3,
      hasCornDistraction: false,
      hasAmulet: false,
      disturbancePos: null,
      colliders: [],
      navGrid: null,
    },
    1.2,
  );
  assert.equal(homem.mode, 'suspeitando');

  updateCreatureAI(
    homem,
    {
      player: { x: 14, y: 0, z: 0, isHiding: false, isCrouching: false, flashlightOn: true, noiseLevel: 40 },
      isNight: true,
      isThreeAM: true,
      hour24: 3,
      hasCornDistraction: false,
      hasAmulet: false,
      disturbancePos: null,
      colliders: [],
      navGrid: null,
    },
    0.85,
  );
  assert.equal(homem.mode, 'perseguindo');

  // Now put closed door between creature (x=11.2) and player (x=15) -> creature cannot cross x=11.8
  homem.x = 11.2;
  let knocked = false;
  let caught = false;
  for (let i = 0; i < 10; i++) {
    const doorStep = updateCreatureAI(
      homem,
      {
        player: { x: 15, y: 0, z: 0, isHiding: false, isCrouching: false, flashlightOn: true, noiseLevel: 40 },
        isNight: true,
        isThreeAM: true,
        hour24: 3,
        hasCornDistraction: false,
        hasAmulet: false,
        disturbancePos: null,
        colliders: closedDoor,
        navGrid: null,
      },
      0.04,
    );
    if (doorStep.triggeredKnockDoor) knocked = true;
    if (doorStep.caughtPlayer) caught = true;
  }
  assert.ok(homem.x <= 11.8 - 0.45 + 0.02);
  assert.equal(knocked, true);
  assert.equal(caught, false);
});

test('dialogue memory avoids repeating lines and pickSpecialEvent adapts to night/day', () => {
  const first = selectNpcDialogue({
    npcId: 'avo',
    chapter: 3,
    hour24: 2,
    weather: 'chuva',
    reputation: 50,
    completedObjectives: new Set(['cap1_talk_vo', 'cap2_talk_vo_regra']),
    seenDialogueIds: new Set(),
    inventoryIds: new Set(),
  });
  assert.equal(first, 'chuva_varanda');

  const second = selectNpcDialogue({
    npcId: 'avo',
    chapter: 3,
    hour24: 2,
    weather: 'chuva',
    reputation: 50,
    completedObjectives: new Set(['cap1_talk_vo', 'cap2_talk_vo_regra']),
    seenDialogueIds: new Set(['avo_chuva_varanda']),
    inventoryIds: new Set(),
  });
  assert.equal(second, 'madrugada_tensa');

  const ev = pickSpecialEvent(0, -12, true, 0.1);
  assert.ok(ev.title.length > 0);
});

test('save validation repairs partial saves and rejects corrupted payloads', () => {
  const fresh = createInitialSave(undefined, 'slot1');
  assert.equal(fresh.slotId, 'slot1');
  assert.equal(fresh.gameTimeMinutes, 1095);

  const repaired = validateAndRepairSave({ chapter: 5, playerPos: { x: 1, y: 0, z: 2, yaw: 0 } }, 'slot2');
  assert.ok(repaired);
  assert.equal(repaired?.chapter, 5);
  assert.equal(repaired?.slotId, 'slot2');

  assert.equal(validateAndRepairSave({ chapter: 999 }, 'auto'), null);
  assert.equal(validateAndRepairSave('corrupted', 'auto'), null);
});
