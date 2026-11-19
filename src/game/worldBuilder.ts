import * as THREE from 'three';
import { groundHeightAt } from './physics';
import { createSignTexture, type MaterialPalette } from './textures';
import type {
  ColliderBox,
  DoorState,
  HidingSpot,
  InteractableTarget,
  PushableProp,
} from './types';
import {
  buildBikeVoxel,
  buildCandleVoxel,
  buildChickenVoxel,
  buildCriaturaFlorestaVoxel,
  buildDonaClaraVoxel,
  buildGrandmaVoxel,
  buildHomemDoSacoVoxel,
  buildMirrorVoxel,
  buildMulaSemCabecaVoxel,
  buildNeighborVoxel,
  buildPadreBentoVoxel,
  buildPickupProp,
  buildPushCrateVoxel,
  buildSaciVoxel,
  buildTiaoVoxel,
  buildTvVoxel,
  buildWardrobeVoxel,
  buildZePescadorVoxel,
} from './voxelModels';

export interface BuiltWorld {
  colliders: ColliderBox[];
  doors: DoorState[];
  doorMeshes: Map<string, THREE.Group>;
  hidingSpots: HidingSpot[];
  interactables: InteractableTarget[];
  pickupMeshes: Map<string, THREE.Group>;
  pushProps: PushableProp[];
  pushPropMeshes: Map<string, THREE.Group>;
  npcGroups: {
    avo: THREE.Group;
    vizinho: THREE.Group;
    tiao: THREE.Group;
    padre_bento: THREE.Group;
    ze_pescador: THREE.Group;
    dona_clara: THREE.Group;
    saci: THREE.Group;
  };
  creatureGroups: {
    galinha: THREE.Group;
    saci: THREE.Group;
    homem_do_saco: THREE.Group;
    criatura_floresta: THREE.Group;
    mula_sem_cabeca: THREE.Group;
  };
  lampLights: THREE.PointLight[];
  lampBulbs: THREE.Mesh[];
  interiorLights: Map<string, THREE.PointLight>;
  puddleMeshes: THREE.Mesh[];
  waterMesh: THREE.Mesh;
  bikeGroup: THREE.Group;
  tvScreenMesh: THREE.Mesh | null;
  foliageInstances: THREE.InstancedMesh[];
}

export function buildSantaBatataWorld(
  scene: THREE.Scene,
  mats: MaterialPalette,
  quality: 'baixo' | 'medio' | 'alto',
): BuiltWorld {
  const colliders: ColliderBox[] = [];
  const doors: DoorState[] = [];
  const doorMeshes = new Map<string, THREE.Group>();
  const hidingSpots: HidingSpot[] = [];
  const interactables: InteractableTarget[] = [];
  const pickupMeshes = new Map<string, THREE.Group>();
  const pushProps: PushableProp[] = [];
  const pushPropMeshes = new Map<string, THREE.Group>();
  const lampLights: THREE.PointLight[] = [];
  const lampBulbs: THREE.Mesh[] = [];
  const interiorLights = new Map<string, THREE.PointLight>();
  const puddleMeshes: THREE.Mesh[] = [];
  const foliageInstances: THREE.InstancedMesh[] = [];
  let tvScreenMesh: THREE.Mesh | null = null;

  const addBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    collide = true,
    id = 'box',
    castShadow = true,
  ): THREE.Mesh => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (collide) {
      colliders.push({
        id,
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        active: true,
      });
    }
    return mesh;
  };

  const addRamp = (
    w: number,
    d: number,
    x: number,
    minY: number,
    maxY: number,
    z: number,
    axis: 'x' | 'z',
    dir: 1 | -1,
    mat: THREE.Material,
    id: string,
  ) => {
    const length = axis === 'z' ? d : w;
    const rise = maxY - minY;
    const hyp = Math.hypot(length, rise);
    const angle = Math.atan2(rise, length) * dir;
    const geo =
      axis === 'z'
        ? new THREE.BoxGeometry(w, 0.22, hyp)
        : new THREE.BoxGeometry(hyp, 0.22, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, (minY + maxY) / 2, z);
    if (axis === 'z') mesh.rotation.x = -angle;
    else mesh.rotation.z = angle;
    mesh.receiveShadow = true;
    scene.add(mesh);

    colliders.push({
      id,
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      minY,
      maxY,
      isRamp: true,
      rampAxis: axis,
      rampDir: dir,
      active: true,
    });
  };

  const addLadder = (x: number, minY: number, maxY: number, z: number, id: string) => {
    const h = maxY - minY;
    addBox(0.1, h, 0.1, x - 0.3, minY + h / 2, z, mats.woodDark, false);
    addBox(0.1, h, 0.1, x + 0.3, minY + h / 2, z, mats.woodDark, false);
    const steps = Math.floor(h / 0.45);
    for (let s = 0; s < steps; s++) {
      addBox(0.6, 0.08, 0.1, x, minY + 0.3 + s * 0.45, z, mats.woodWarm, false);
    }
    colliders.push({
      id,
      minX: x - 0.55,
      maxX: x + 0.55,
      minZ: z - 0.55,
      maxZ: z + 0.55,
      minY,
      maxY,
      isLadder: true,
      active: true,
    });
  };

  const addDoor = (
    id: string,
    label: string,
    hingeX: number,
    y: number,
    hingeZ: number,
    width: number,
    height: number,
    orientation: 'x' | 'z',
    options?: {
      locked?: boolean;
      requiredItemId?: string;
      isGrandmaFrontDoor?: boolean;
      isSecretPassage?: boolean;
    },
  ) => {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, y, hingeZ);
    const panelGeo =
      orientation === 'x'
        ? new THREE.BoxGeometry(width, height, 0.14)
        : new THREE.BoxGeometry(0.14, height, width);
    const panel = new THREE.Mesh(panelGeo, options?.isSecretPassage ? mats.iron : mats.woodDark);
    if (orientation === 'x') panel.position.set(width / 2, height / 2, 0);
    else panel.position.set(0, height / 2, width / 2);
    panel.castShadow = true;
    panel.receiveShadow = true;
    pivot.add(panel);

    const knob = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.85 }),
    );
    if (orientation === 'x') knob.position.set(width - 0.24, height * 0.48, 0);
    else knob.position.set(0, height * 0.48, width - 0.24);
    pivot.add(knob);
    scene.add(pivot);
    doorMeshes.set(id, pivot);

    const centerX = orientation === 'x' ? hingeX + width / 2 : hingeX;
    const centerZ = orientation === 'z' ? hingeZ + width / 2 : hingeZ;
    colliders.push({
      id: `col_${id}`,
      minX: centerX - (orientation === 'x' ? width / 2 : 0.18),
      maxX: centerX + (orientation === 'x' ? width / 2 : 0.18),
      minZ: centerZ - (orientation === 'z' ? width / 2 : 0.18),
      maxZ: centerZ + (orientation === 'z' ? width / 2 : 0.18),
      minY: y,
      maxY: y + height,
      isDoor: true,
      doorId: id,
      active: true,
    });

    doors.push({
      id,
      label,
      x: centerX,
      y,
      z: centerZ,
      isOpen: false,
      locked: options?.locked,
      requiredItemId: options?.requiredItemId,
      isGrandmaFrontDoor: options?.isGrandmaFrontDoor,
      isSecretPassage: options?.isSecretPassage,
      angle: 0,
      targetAngle: 0,
    });

    interactables.push({
      id: `int_${id}`,
      type: 'door',
      label,
      prompt: `[E] Abrir/Fechar ${label}`,
      x: centerX,
      y: y + 1.1,
      z: centerZ,
      radius: 2.7,
      doorId: id,
    });
  };

  const addLampPost = (x: number, z: number, withPointLight: boolean) => {
    const gy = groundHeightAt(x, z);
    addBox(0.22, 3.6, 0.22, x, gy + 1.8, z, mats.woodDark, true, `lamp_${x}_${z}`);
    addBox(0.7, 0.16, 0.22, x + 0.22, gy + 3.55, z, mats.iron, false);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), mats.lampGlow.clone());
    bulb.position.set(x + 0.46, gy + 3.36, z);
    scene.add(bulb);
    lampBulbs.push(bulb);
    if (withPointLight) {
      const pl = new THREE.PointLight(0xffb454, 5.2, 20, 1.5);
      pl.position.set(x + 0.46, gy + 3.1, z);
      scene.add(pl);
      lampLights.push(pl);
    }
  };

  const addWardrobe = (
    id: string,
    label: string,
    x: number,
    z: number,
    rotY: number,
    locationName: string,
    y = 0,
  ) => {
    const w = buildWardrobeVoxel();
    w.position.set(x, y, z);
    w.rotation.y = rotY;
    scene.add(w);
    colliders.push({
      id: `col_${id}`,
      minX: x - 0.65,
      maxX: x + 0.65,
      minZ: z - 0.55,
      maxZ: z + 0.55,
      minY: y,
      maxY: y + 2.3,
      active: true,
    });
    hidingSpots.push({
      id,
      label,
      x,
      y: y + 0.95,
      z,
      exitX: x + Math.sin(rotY) * 1.4,
      exitZ: z + Math.cos(rotY) * 1.4,
      locationName,
    });
    interactables.push({
      id: `int_${id}`,
      type: 'hide',
      label,
      prompt: `[E] Esconder em: ${label}`,
      x,
      y: y + 1.2,
      z,
      radius: 2.6,
      hideId: id,
    });
  };

  const addPickup = (
    itemId: string,
    label: string,
    x: number,
    y: number,
    z: number,
  ) => {
    const prop = buildPickupProp(itemId);
    prop.position.set(x, y, z);
    scene.add(prop);
    pickupMeshes.set(itemId, prop);
    interactables.push({
      id: `item_${itemId}`,
      type: 'item',
      label,
      prompt: `[E] Pegar ${label}`,
      x,
      y: y + 0.35,
      z,
      radius: 2.6,
      itemId,
      collected: false,
    });
  };

  const addLorePickup = (loreId: string, title: string, x: number, y: number, z: number) => {
    const prop = buildPickupProp(`lore_${loreId}`);
    prop.position.set(x, y, z);
    scene.add(prop);
    pickupMeshes.set(loreId, prop);
    interactables.push({
      id: `lore_${loreId}`,
      type: 'lore',
      label: title,
      prompt: `[E] Ler Documento: ${title}`,
      x,
      y: y + 0.3,
      z,
      radius: 2.8,
      loreId,
      collected: false,
    });
  };

  const addSign = (
    id: string,
    title: string,
    subtitle: string,
    signText: string,
    x: number,
    z: number,
    rotY = 0,
  ) => {
    const gy = groundHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, gy, z);
    group.rotation.y = rotY;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.16), mats.woodDark);
    post.position.y = 0.75;
    post.castShadow = true;
    group.add(post);

    const boardMat = new THREE.MeshStandardMaterial({
      map: createSignTexture(title, subtitle),
      roughness: 0.78,
      metalness: 0.02,
    });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.92, 0.12), boardMat);
    board.position.y = 1.65;
    board.castShadow = true;
    group.add(board);
    scene.add(group);

    interactables.push({
      id,
      type: 'sign',
      label: title,
      prompt: `[E] Ler: ${title}`,
      x,
      y: gy + 1.5,
      z,
      radius: 2.9,
      signTitle: title,
      signText,
    });
  };

  const addPushCrate = (id: string, label: string, x: number, z: number, color = '#7c4d2b') => {
    const gy = groundHeightAt(x, z);
    const mesh = buildPushCrateVoxel(color);
    mesh.position.set(x, gy + 0.45, z);
    scene.add(mesh);
    pushPropMeshes.set(id, mesh);
    pushProps.push({
      id,
      label,
      x,
      y: gy + 0.45,
      z,
      vx: 0,
      vz: 0,
      halfW: 0.45,
      halfH: 0.45,
      halfD: 0.45,
      mass: 1.0,
      knocked: false,
    });
  };

  const addPuddle = (x: number, z: number, radius = 1.9) => {
    const gy = groundHeightAt(x, z);
    const geo = new THREE.CircleGeometry(radius, 14);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mats.puddle);
    m.position.set(x, gy + 0.03, z);
    m.visible = false;
    scene.add(m);
    puddleMeshes.push(m);
  };

  // =========================================================================
  // 0. 260x260m MULTI-REGION TERRAIN (Matched to groundHeightAt!)
  // =========================================================================
  const terrainGeo = new THREE.PlaneGeometry(260, 260, 88, 88);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, mats.grass);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Dirt Roads connecting the 18 regions
  const addRoad = (w: number, d: number, x: number, z: number) => {
    const gy = groundHeightAt(x, z);
    const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mats.dirt);
    road.position.set(x, gy + 0.02, z);
    road.receiveShadow = true;
    scene.add(road);
  };
  addRoad(6.2, 86, 0, -34); // North-South Santa Batata -> Estrada Velha
  addRoad(130, 5.4, 0, -12); // East-West Crossroad (Casa Primeiro Morador <-> Estação <-> Faz. Santa Luzia)
  addRoad(100, 4.8, -10, -56); // Estrada Norte (Mina <-> Bairro <-> Túnel <-> Hospital <-> Represa)
  addRoad(6.0, 52, 0, 26); // South into Floresta do Esquecimento
  addRoad(42, 4.8, -18, 28); // Road to Fazenda Boa Esperança
  addRoad(44, 4.8, 22, 22); // Road to Sítio dos Alves

  // Rain puddles along main dirt roads (appear when raining!)
  addPuddle(0.4, -13.5, 1.8);
  addPuddle(-10.5, -11.8, 1.5);
  addPuddle(12.2, -12.4, 2.0);
  addPuddle(-1.2, -44.0, 2.2);
  addPuddle(1.5, 22.0, 1.7);

  // =========================================================================
  // 1. SANTA BATATA CENTRO — CASA DA AVÓ (0, 0) + APPLIANCES & INTERIOR
  // =========================================================================
  addBox(12.4, 0.12, 10.4, 0, 0.06, 0, mats.woodWarm, false, 'avo_floor', false);
  addBox(12.4, 0.14, 3.0, 0, 0.07, -6.4, mats.woodDark, false, 'avo_porch', false);
  addBox(0.28, 3.0, 0.28, -5.6, 1.5, -7.6, mats.woodDark, true, 'porch_p1');
  addBox(0.28, 3.0, 0.28, -2.0, 1.5, -7.6, mats.woodDark, true, 'porch_p2');
  addBox(0.28, 3.0, 0.28, 2.0, 1.5, -7.6, mats.woodDark, true, 'porch_p3');
  addBox(0.28, 3.0, 0.28, 5.6, 1.5, -7.6, mats.woodDark, true, 'porch_p4');

  // Front & Back walls with doors
  addBox(4.8, 3.2, 0.3, -3.6, 1.6, -5.0, mats.stuccoWhite, true, 'avo_front_l');
  addBox(4.8, 3.2, 0.3, 3.6, 1.6, -5.0, mats.stuccoWhite, true, 'avo_front_r');
  addBox(2.4, 0.8, 0.3, 0, 2.8, -5.0, mats.stuccoWhite, false);
  addDoor('porta_vo_frente', 'Porta da Frente da Avó', -1.0, 0.12, -5.0, 2.0, 2.3, 'x', {
    isGrandmaFrontDoor: true,
  });

  addBox(4.8, 3.2, 0.3, -3.6, 1.6, 5.0, mats.stuccoWhite, true, 'avo_back_l');
  addBox(4.8, 3.2, 0.3, 3.6, 1.6, 5.0, mats.stuccoWhite, true, 'avo_back_r');
  addBox(2.4, 0.8, 0.3, 0, 2.8, 5.0, mats.stuccoWhite, false);
  addDoor('porta_vo_quintal', 'Porta do Quintal', -1.0, 0.12, 5.0, 2.0, 2.3, 'x');

  addBox(0.3, 3.2, 10.2, -6.0, 1.6, 0, mats.stuccoWhite, true, 'avo_left');
  addBox(0.3, 3.2, 10.2, 6.0, 1.6, 0, mats.stuccoWhite, true, 'avo_right');
  addBox(0.24, 3.0, 3.8, -1.6, 1.5, 3.0, mats.stuccoWhite, true, 'avo_div_quarto');
  addBox(3.6, 3.0, 0.24, -4.1, 1.5, 0.2, mats.stuccoWhite, true, 'avo_div_banho');
  addBox(3.4, 3.0, 0.24, 4.2, 1.5, -0.2, mats.stuccoWhite, true, 'avo_div_cozinha');
  addBox(13.4, 0.35, 7.6, 0, 3.45, -2.5, mats.terracotta, false);
  addBox(13.4, 0.35, 7.6, 0, 3.45, 2.5, mats.terracotta, false);
  addBox(13.0, 0.55, 5.4, 0, 3.9, 0, mats.terracotta, false);

  // Sala: Sofa, Table, Functional TV, Wall Clock, Light Switch, Candle
  addBox(2.2, 0.8, 0.9, 2.4, 0.52, -2.8, mats.redBarn, true, 'sofa');
  addBox(1.4, 0.55, 0.9, 2.4, 0.4, -1.4, mats.woodDark, true, 'mesinha_sala');
  const tvGroup = buildTvVoxel();
  tvGroup.position.set(4.8, 0.12, -3.2);
  tvGroup.rotation.y = -Math.PI * 0.75;
  scene.add(tvGroup);
  tvScreenMesh = (tvGroup.getObjectByName('tvScreen') as THREE.Mesh) ?? null;
  interactables.push({
    id: 'tv_sala',
    type: 'tv',
    label: 'TV de Tubo da Sala',
    prompt: '[E] Ligar/Mudar Canal da TV',
    x: 4.8,
    y: 0.7,
    z: -3.2,
    radius: 2.6,
  });

  // Wall Clock + Light Switch
  addBox(0.55, 0.9, 0.2, -1.2, 1.8, -4.75, mats.woodDark, false);
  interactables.push({
    id: 'relogio_sala',
    type: 'clock',
    label: 'Relógio de Pêndulo',
    prompt: '[E] Conferir Relógio de Parede',
    x: -1.2,
    y: 1.5,
    z: -4.5,
    radius: 2.5,
  });
  interactables.push({
    id: 'interruptor_sala',
    type: 'switch',
    label: 'Interruptor da Sala',
    prompt: '[E] Ligar/Desligar Luz da Casa',
    x: -1.4,
    y: 1.3,
    z: -4.7,
    radius: 2.5,
    switchLightId: 'luz_casa_vo',
    activated: true,
  });
  const casaLight = new THREE.PointLight(0xffe4b5, 3.5, 16, 1.6);
  casaLight.position.set(0, 2.8, 0);
  scene.add(casaLight);
  interiorLights.set('luz_casa_vo', casaLight);

  // Candle in Sala
  const candle = buildCandleVoxel();
  candle.position.set(0.4, 0.12, -4.4);
  scene.add(candle);
  interactables.push({
    id: 'vela_oratorio',
    type: 'candle',
    label: 'Vela do Oratório',
    prompt: '[E] Acender Vela Protetora',
    x: 0.4,
    y: 0.4,
    z: -4.4,
    radius: 2.4,
  });

  // Cozinha: Fogão a lenha, Geladeira, Rádio
  addBox(1.4, 0.95, 1.0, 4.6, 0.6, 3.8, mats.stone, true, 'fogao_lenha');
  addBox(0.95, 1.85, 0.95, 5.1, 1.05, 1.2, mats.stuccoWhite, true, 'geladeira');
  addBox(1.6, 0.82, 1.1, 2.2, 0.52, 2.4, mats.woodWarm, true, 'mesa_cozinha');
  addBox(0.45, 0.32, 0.25, 2.2, 1.08, 2.4, mats.woodDark, false);
  interactables.push(
    { id: 'radio_cozinha', type: 'radio', label: 'Rádio Antigo da Cozinha', prompt: '[E] Checar Rádio da Cozinha', x: 2.2, y: 1.1, z: 2.4, radius: 2.6 },
    { id: 'fogao_vo', type: 'stove', label: 'Fogão a Lenha', prompt: '[E] Esquentar Comida / Fazer Café', x: 4.6, y: 1.0, z: 3.8, radius: 2.6 },
    { id: 'geladeira_vo', type: 'fridge', label: 'Geladeira da Vó', prompt: '[E] Abrir Geladeira', x: 5.1, y: 1.1, z: 1.2, radius: 2.6 },
  );

  // Quarto: Bed (Sleep!), Drawer, Wardrobe
  addBox(1.5, 0.65, 2.2, -4.6, 0.45, 3.4, mats.stuccoBlue, true, 'cama_protagonista');
  addBox(0.9, 0.85, 0.6, -2.5, 0.55, 1.4, mats.woodWarm, true, 'comoda_quarto');
  addWardrobe('armario_casa_vo', 'Armário do Quarto', -2.6, 4.1, Math.PI, 'Santa Batata (Casa da Avó)');
  interactables.push(
    { id: 'cama_dormir', type: 'bed', label: 'Cama do Quarto', prompt: '[E] Descansar / Dormir na Cama', x: -4.6, y: 0.6, z: 3.4, radius: 2.6 },
    { id: 'gaveta_vo', type: 'drawer', label: 'Gaveta da Cômoda', prompt: '[E] Vasculhar Gaveta da Cômoda', x: -2.5, y: 0.9, z: 1.4, radius: 2.5 },
  );

  // Banheiro: Sink/Faucet + Mirror
  addBox(0.85, 0.88, 0.6, -5.2, 0.55, -2.2, mats.stuccoWhite, true, 'pia_banho');
  addBox(0.5, 0.52, 0.6, -5.2, 0.38, -3.6, mats.stuccoWhite, true, 'vaso_banho');
  const mirror = buildMirrorVoxel();
  mirror.position.set(-5.78, 1.65, -2.2);
  mirror.rotation.y = Math.PI / 2;
  scene.add(mirror);
  interactables.push(
    { id: 'torneira_banho', type: 'faucet', label: 'Torneira da Pia', prompt: '[E] Beber Água / Fechar Torneira', x: -5.2, y: 0.95, z: -2.2, radius: 2.4 },
    { id: 'espelho_banho', type: 'mirror', label: 'Espelho do Banheiro', prompt: '[E] Olhar no Espelho', x: -5.4, y: 1.5, z: -2.2, radius: 2.4 },
  );

  // Quintal da Avó + Galinheiro + Poço + Pushable Crate
  addBox(0.25, 1.1, 10, -6.0, 0.55, 10.2, mats.woodDark, true, 'quintal_fence_l');
  addBox(0.25, 1.1, 10, 6.0, 0.55, 10.2, mats.woodDark, true, 'quintal_fence_r');
  addBox(4.5, 1.1, 0.25, -3.8, 0.55, 15.2, mats.woodDark, true, 'quintal_fence_bl');
  addBox(4.5, 1.1, 0.25, 3.8, 0.55, 15.2, mats.woodDark, true, 'quintal_fence_br');
  addBox(2.2, 1.6, 2.0, 4.0, 0.8, 12.2, mats.woodWarm, true, 'galinheiro');
  addBox(2.5, 0.2, 2.3, 4.0, 1.7, 12.2, mats.terracotta, false);
  addBox(1.4, 0.9, 1.4, -3.5, 0.45, 11.5, mats.stone, true, 'poco');
  addPushCrate('caixa_quintal', 'Caixote do Quintal', -1.8, 7.6);

  // Casa do Seu Zé (-20, 4)
  addBox(7.2, 0.12, 7.2, -20, 0.06, 4, mats.woodWarm, false, 'viz_floor', false);
  addBox(2.4, 3.0, 0.3, -22.4, 1.5, 0.4, mats.stuccoYellow, true, 'viz_fl');
  addBox(2.4, 3.0, 0.3, -17.6, 1.5, 0.4, mats.stuccoYellow, true, 'viz_fr');
  addDoor('porta_vizinho', 'Porta do Seu Zé', -21.0, 0.12, 0.4, 2.0, 2.3, 'x');
  addBox(7.2, 3.0, 0.3, -20, 1.5, 7.6, mats.stuccoYellow, true, 'viz_back');
  addBox(0.3, 3.0, 7.2, -23.6, 1.5, 4, mats.stuccoYellow, true, 'viz_l');
  addBox(0.3, 3.0, 7.2, -16.4, 1.5, 4, mats.stuccoYellow, true, 'viz_r');
  addBox(8.0, 0.4, 8.0, -20, 3.2, 4, mats.terracotta, false);
  addBox(1.6, 0.85, 0.9, -21.6, 0.54, 5.6, mats.woodDark, true, 'mesa_viz');
  addWardrobe('armario_vizinho', 'Guarda-Roupa do Seu Zé', -17.4, 6.4, -Math.PI / 2, 'Casa do Seu Zé');

  // Mercadinho do Tião (20, -4) + Bicycle outside!
  addBox(8.6, 0.12, 7.6, 20, 0.06, -4, mats.cobble, false, 'merc_floor', false);
  addBox(3.0, 3.2, 0.3, 17.2, 1.6, -7.8, mats.stuccoBlue, true, 'merc_fl');
  addBox(3.0, 3.2, 0.3, 22.8, 1.6, -7.8, mats.stuccoBlue, true, 'merc_fr');
  addDoor('porta_mercadinho', 'Porta do Mercadinho', 19.0, 0.12, -7.8, 2.0, 2.3, 'x');
  addBox(8.6, 3.2, 0.3, 20, 1.6, -0.2, mats.stuccoBlue, true, 'merc_back');
  addBox(0.3, 3.2, 7.6, 15.7, 1.6, -4, mats.stuccoBlue, true, 'merc_l');
  addBox(0.3, 3.2, 7.6, 24.3, 1.6, -4, mats.stuccoBlue, true, 'merc_r');
  addBox(9.2, 0.4, 8.2, 20, 3.4, -4, mats.terracotta, false);
  addBox(4.2, 1.0, 0.9, 20, 0.6, -2.0, mats.woodWarm, true, 'balcao_tiao');
  addSign('placa_mercadinho', 'MERCADINHO DO TIÃO', 'FIADO SÓ QUANDO GALINHA CRIAR DENTE', 'Mercadinho do Tião: Temos fumo de corda, broa de fubá e bicicleta emprestada!', 17.2, -8.4, 0);

  const bikeGroup = buildBikeVoxel();
  bikeGroup.position.set(14.5, 0, -9.2);
  bikeGroup.rotation.y = Math.PI * 0.4;
  scene.add(bikeGroup);
  interactables.push({
    id: 'bicicleta_tiao',
    type: 'bike',
    label: 'Bicicleta do Tião',
    prompt: '[E] Subir/Descer da Bicicleta',
    x: 14.5,
    y: 0.8,
    z: -9.2,
    radius: 2.6,
  });

  // Praça Central (2, -24) + Coreto + Truco Table
  addBox(16, 0.08, 16, 2, 0.04, -24, mats.cobble, false, 'praca_piso', false);
  addBox(4.8, 0.35, 4.8, 2, 0.2, -24, mats.stone, true, 'coreto_base');
  addBox(0.24, 3.0, 0.24, -0.1, 1.8, -26.1, mats.woodWarm, true, 'cor_p1');
  addBox(0.24, 3.0, 0.24, 4.1, 1.8, -26.1, mats.woodWarm, true, 'cor_p2');
  addBox(0.24, 3.0, 0.24, -0.1, 1.8, -21.9, mats.woodWarm, true, 'cor_p3');
  addBox(0.24, 3.0, 0.24, 4.1, 1.8, -21.9, mats.woodWarm, true, 'cor_p4');
  addBox(5.6, 0.4, 5.6, 2, 3.4, -24, mats.terracotta, false);
  addBox(1.4, 0.85, 1.4, 2, 0.78, -24, mats.woodDark, true, 'mesa_coreto');
  interactables.push(
    { id: 'altar_praca_saci', type: 'puzzle', label: 'Mesa do Coreto (Pacto Secreto)', prompt: '[E] Preparar Café da Paz no Coreto', x: 2, y: 1.2, z: -24, radius: 3.0, puzzleId: 'secret_ending_coffee' },
    { id: 'mesa_truco_praca', type: 'minigame', label: 'Mesa de Truco da Praça', prompt: '[E] Jogar Truco / Cartas (Minigame)', x: 7.5, y: 0.9, z: -21, radius: 2.8, minigameId: 'cartas' },
  );
  addBox(1.6, 0.75, 1.0, 7.5, 0.45, -21, mats.woodWarm, true, 'mesa_truco');
  addSign('placa_praca', 'SANTA BATATA - MG', 'POPULAÇÃO: 42 E UMA GALINHA SUSPEITA', 'Monumento Central: "Fundada em 1912. Regra Municipal nº 3: Proibido abrir a porta às 03:00."', -3.8, -17.8, 0);

  // =========================================================================
  // 2. IGREJA VELHA (-24, -30) + Ramp entrance + Sacristy
  // =========================================================================
  addBox(9.2, 0.16, 13.0, -24, 0.08, -30, mats.cobble, false, 'igreja_piso', false);
  addBox(3.4, 4.2, 0.4, -26.9, 2.1, -23.5, mats.stuccoWhite, true, 'igr_fl');
  addBox(3.4, 4.2, 0.4, -21.1, 2.1, -23.5, mats.stuccoWhite, true, 'igr_fr');
  addDoor('porta_igreja', 'Porta da Igreja Velha', -25.0, 0.16, -23.5, 2.0, 2.6, 'x', {
    locked: true,
    requiredItemId: 'chave_igreja',
  });
  addBox(9.2, 4.2, 0.4, -24, 2.1, -36.5, mats.stuccoWhite, true, 'igr_back');
  addBox(0.4, 4.2, 13.0, -28.4, 2.1, -30, mats.stuccoWhite, true, 'igr_l');
  addBox(0.4, 4.2, 13.0, -19.6, 2.1, -30, mats.stuccoWhite, true, 'igr_r');
  addBox(9.8, 0.5, 13.6, -24, 4.45, -30, mats.terracotta, false);
  addBox(3.4, 6.2, 3.4, -24, 7.6, -24.8, mats.stuccoWhite, false);
  addBox(3.7, 0.45, 3.7, -24, 10.7, -24.8, mats.stuccoBlue, false);
  addBox(0.35, 2.2, 0.35, -24, 11.9, -24.8, mats.iron, false);
  addBox(1.3, 0.3, 0.35, -24, 12.3, -24.8, mats.iron, false);
  addBox(2.8, 1.0, 1.2, -24, 0.65, -34.6, mats.woodWarm, true, 'altar_igr');

  // =========================================================================
  // 3. FAZENDA BOA ESPERANÇA & CELEIRO VERMELHO (-36, 28)
  // =========================================================================
  addBox(9.2, 0.12, 10.0, -36, 0.06, 28, mats.woodDark, false, 'cel_floor', false);
  addBox(3.2, 3.8, 0.35, -39.0, 1.9, 23.0, mats.redBarn, true, 'cel_fl');
  addBox(3.2, 3.8, 0.35, -33.0, 1.9, 23.0, mats.redBarn, true, 'cel_fr');
  addDoor('porta_celeiro', 'Portão do Celeiro', -37.2, 0.12, 23.0, 2.4, 2.8, 'x', {
    locked: true,
    requiredItemId: 'chave_celeiro',
  });
  addBox(9.2, 3.8, 0.35, -36, 1.9, 33.0, mats.redBarn, true, 'cel_back');
  addBox(0.35, 3.8, 10.0, -40.5, 1.9, 28, mats.redBarn, true, 'cel_l');
  addBox(0.35, 3.8, 10.0, -31.5, 1.9, 28, mats.redBarn, true, 'cel_r');
  addBox(10.0, 0.45, 10.8, -36, 4.1, 28, mats.woodDark, false);
  addWardrobe('armario_celeiro', 'Caixa de Feno', -33.0, 31.4, -Math.PI, 'Fazenda Boa Esperança');

  // =========================================================================
  // 4. SÍTIO DOS ALVES (42, 22) + MILHARAL
  // =========================================================================
  addBox(8.0, 0.12, 8.0, 42, 0.06, 22, mats.woodDark, false, 'sit_floor', false);
  addBox(2.8, 3.0, 0.3, 39.4, 1.5, 18, mats.clay, true, 'sit_fl');
  addBox(2.8, 3.0, 0.3, 44.6, 1.5, 18, mats.clay, true, 'sit_fr');
  addDoor('porta_sitio', 'Porta do Sítio dos Alves', 41.0, 0.12, 18, 2.0, 2.3, 'x');
  addBox(8.0, 3.0, 0.3, 42, 1.5, 26, mats.clay, true, 'sit_back');
  addBox(0.3, 3.0, 8.0, 38, 1.5, 22, mats.clay, true, 'sit_l');
  addBox(0.3, 3.0, 8.0, 46, 1.5, 22, mats.clay, true, 'sit_r');
  addBox(8.4, 0.3, 4.4, 42, 3.2, 20.2, mats.terracotta, false);
  addWardrobe('armario_sitio', 'Armário dos Alves', 44.6, 24.6, -Math.PI, 'Sítio dos Alves');

  // =========================================================================
  // 5. CEMITÉRIO MUNICIPAL (-48, -18) + CAÇA AO TESOURO
  // =========================================================================
  addBox(14, 0.06, 14, -48, 0.03, -18, mats.dirt, false, 'cem_ground', false);
  addBox(14, 1.4, 0.4, -48, 0.7, -25, mats.stone, true, 'cem_n');
  addBox(14, 1.4, 0.4, -48, 0.7, -11, mats.stone, true, 'cem_s');
  addBox(0.4, 1.4, 14, -55, 0.7, -18, mats.stone, true, 'cem_w');
  addBox(0.4, 1.4, 5.2, -41, 0.7, -22.4, mats.stone, true, 'cem_el');
  addBox(0.4, 1.4, 5.2, -41, 0.7, -13.6, mats.stone, true, 'cem_er');
  for (let gx = -52; gx <= -44; gx += 3.5) {
    for (let gz = -22; gz <= -14; gz += 3.5) {
      addBox(0.75, 1.25, 0.25, gx, 0.62, gz, mats.stone, true, `lapide_${gx}_${gz}`);
    }
  }
  addSign('lapide_principal', 'TÚMULO DE NHÔ BATATA', '1901 - 1987 · PRIMEIRO MORADOR', 'Inscrição: "A Chave da Igreja ficou no Sítio dos Alves. As respostas sobre 1924 dormem na Mina Desativada."', -48, -18, Math.PI / 2);
  interactables.push({
    id: 'enigma_cemiterio_tesouro',
    type: 'minigame',
    label: 'Cripta do Tesouro de Nhô Batata',
    prompt: '[E] Decifrar Caça ao Tesouro (Minigame)',
    x: -51.5,
    y: 1.0,
    z: -18,
    radius: 2.8,
    minigameId: 'caca_tesouro',
  });

  // =========================================================================
  // 6. VILA DOS PESCADORES (44, -38) & REPRESA DE SANTA BATATA (72, -58)
  // =========================================================================
  const waterGeo = new THREE.CircleGeometry(18, 32);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, mats.water);
  waterMesh.position.set(72, -0.25, -58);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  const lakeSmall = new THREE.Mesh(new THREE.CircleGeometry(10.5, 24).rotateX(-Math.PI / 2), mats.water);
  lakeSmall.position.set(40, -0.2, -34);
  scene.add(lakeSmall);

  // Fishing Pier + Fishermen Hut
  addBox(2.4, 0.22, 6.8, 44, 0.22, -36, mats.woodWarm, true, 'pier_pesc');
  addBox(5.2, 2.8, 5.2, 49, 1.4, -41, mats.woodDark, true, 'cabana_pescador');
  addBox(5.8, 0.3, 5.8, 49, 3.0, -41, mats.corrugatedMetal, false);
  // Concrete Dam Wall & Catwalk at Represa (72, -58)
  addBox(28, 3.4, 2.6, 72, 1.5, -45, mats.stone, true, 'paredao_represa');
  addRamp(2.8, 8.0, 56, 0, 3.2, -45, 'x', 1, mats.stone, 'rampa_represa');
  interactables.push(
    { id: 'lago_pista', type: 'puzzle', label: 'Pegadas na Vila dos Pescadores', prompt: '[E] Inspecionar Pegadas no Píer', x: 44, y: 0.6, z: -34, radius: 3.2, puzzleId: 'inspect_lake' },
    { id: 'pesca_spot', type: 'minigame', label: 'Píer de Pesca', prompt: '[E] Pescar com Zé Pescador (Minigame)', x: 44, y: 0.6, z: -38.5, radius: 3.0, minigameId: 'pesca' },
    { id: 'represa_registro', type: 'puzzle', label: 'Comporta da Represa (1987)', prompt: '[E] Examinar Comporta da Represa', x: 72, y: 3.4, z: -45, radius: 3.4, puzzleId: 'inspect_represa' },
  );

  // =========================================================================
  // 7. ESTAÇÃO FERROVIÁRIA (42, -6) + MARIA-FUMAÇA + RAMPA
  // =========================================================================
  addBox(12, 0.6, 6.5, 42, 0.3, -6, mats.cobble, true, 'estacao_plat');
  addRamp(3.0, 2.5, 34.5, 0, 0.6, -6, 'x', 1, mats.stone, 'estacao_rampa');
  addBox(6.4, 3.2, 4.4, 42, 2.2, -7.5, mats.stuccoYellow, true, 'estacao_predio');
  addBox(7.2, 0.4, 5.4, 42, 4.0, -7.5, mats.terracotta, false);
  // Rust rails & voxel locomotive
  addBox(36, 0.12, 0.2, 44, 0.08, -1.6, mats.iron, false);
  addBox(36, 0.12, 0.2, 44, 0.08, -0.4, mats.iron, false);
  addBox(7.0, 2.4, 2.2, 48, 1.3, -1.0, mats.iron, true, 'maria_fumaca');
  addBox(2.2, 3.2, 2.2, 45.5, 1.7, -1.0, mats.redBarn, true, 'maria_cabine');
  addSign('placa_estacao', 'ESTAÇÃO SANTA BATATA', 'ÚLTIMO TREM: 1987 (02:50)', 'Estação Ferroviária: Os trilhos levam à serra. A Chave Mestra do Hospital está no guichê.', 38, -5.2, 0);

  // =========================================================================
  // 8. FAZENDA SANTA LUZIA (76, 18) & BAIRRO ABANDONADO (-48, -56)
  // =========================================================================
  // Fazenda Santa Luzia
  addBox(8.5, 3.4, 8.5, 76, 1.7, 18, mats.stuccoWhite, true, 'faz_sl_body');
  addBox(9.2, 0.4, 9.2, 76, 3.6, 18, mats.terracotta, false);
  addSign('placa_santa_luzia', 'FAZENDA SANTA LUZIA', 'DESDE 1945', 'Sede antiga de Santa Luzia: Registros contam que o gado subiu a serra na Primeira Madrugada.', 70, 18, Math.PI / 2);

  // Bairro Abandonado (3 ruined houses with doors & push crates)
  addBox(6.0, 2.8, 0.3, -48, 1.4, -52, mats.stuccoAged, true, 'bairro_c1_f');
  addBox(6.0, 2.8, 6.0, -48, 1.4, -58, mats.stuccoAged, true, 'bairro_c1_b');
  addBox(5.5, 2.8, 5.5, -56, 1.4, -55, mats.clay, true, 'bairro_c2');
  addPushCrate('caixa_bairro', 'Caixa Empoeirada', -44, -54);

  // =========================================================================
  // 9. TÚNEL DA ESTRADA ANTIGA (-24, -74) & HOSPITAL ABANDONADO (24, -74)
  // =========================================================================
  // Túnel Antigo (Stone arch corridor!)
  addBox(0.8, 3.6, 18, -28.5, 1.8, -74, mats.mineRock, true, 'tunel_w');
  addBox(0.8, 3.6, 18, -19.5, 1.8, -74, mats.mineRock, true, 'tunel_e');
  addBox(9.8, 0.9, 18, -24, 3.9, -74, mats.mineRock, false);
  addSign('placa_tunel', 'TÚNEL ESTRADA ANTIGA', 'CUIDADO: ECO DUPLO', 'Pichação na parede do túnel: "Se ouvir passos atrás de você aqui dentro, NÃO olhe para trás!"', -24, -67, 0);

  // Hospital Municipal Abandonado (2 floors + interior stairs ramp!)
  addBox(12, 0.14, 10, 24, 0.07, -74, mats.hospitalTile, false, 'hosp_piso', false);
  addBox(4.8, 3.6, 0.35, 20.4, 1.8, -69, mats.stuccoWhite, true, 'hosp_fl');
  addBox(4.8, 3.6, 0.35, 27.6, 1.8, -69, mats.stuccoWhite, true, 'hosp_fr');
  addDoor('porta_hospital', 'Porta do Hospital Municipal', 23.0, 0.14, -69, 2.0, 2.5, 'x', {
    locked: true,
    requiredItemId: 'chave_hospital',
  });
  addBox(12, 6.4, 0.35, 24, 3.2, -79, mats.stuccoWhite, true, 'hosp_back');
  addBox(0.35, 6.4, 10, 18, 3.2, -74, mats.stuccoWhite, true, 'hosp_l');
  addBox(0.35, 6.4, 10, 30, 3.2, -74, mats.stuccoWhite, true, 'hosp_r');
  // Second Floor + Stairs Ramp inside Hospital!
  addBox(9.2, 0.24, 9.6, 25.2, 3.3, -74, mats.hospitalTile, true, 'hosp_2nd_floor');
  addRamp(2.4, 7.0, 19.6, 0.1, 3.3, -74, 'z', -1, mats.stone, 'hosp_escada');
  addBox(12.6, 0.4, 10.6, 24, 6.6, -74, mats.corrugatedMetal, false);
  addWardrobe('armario_hospital', 'Armário da Recepção', 28.4, -77.2, Math.PI, 'Hospital Abandonado');
  addPushCrate('maca_hospital', 'Maca Antiga', 23.5, -72.5, '#cbd5e1');

  // =========================================================================
  // 10. SERRA DO SILÊNCIO (-76, 68), CASA PRIMEIRO MORADOR (-74, 16) & MINA (-78, -52)
  // =========================================================================
  // Serra do Silêncio lookout tower (+4.2m elevation + ladder!)
  const serraY = groundHeightAt(-76, 68);
  addBox(4.4, 4.0, 4.4, -76, serraY + 2.0, 68, mats.woodDark, true, 'serra_torre');
  addLadder(-76, serraY, serraY + 4.1, 65.5, 'escada_serra');
  addSign('placa_serra', 'SERRA DO SILÊNCIO', 'ALTITUDE MÁXIMA', 'Mirante da Serra: Daqui se vê todas as luzes de Santa Batata apagarem às 03:00.', -76, 62, 0);

  // Casa do Primeiro Morador (-74, 16)
  addBox(6.8, 2.8, 6.8, -74, 1.4, 16, mats.clay, true, 'primeiro_morador');
  addSign('placa_primeiro', 'PRIMEIRO MORADOR (1912)', 'NHÔ BATATA', 'Ruína de pedra e taipa: "O que cavamos na mina em 1924 não era ouro."', -68.5, 16, Math.PI / 2);

  // Mina Desativada (-78, -52)
  const minaY = groundHeightAt(-78, -52);
  addBox(10, 3.8, 0.5, -78, minaY + 1.9, -58, mats.mineRock, true, 'mina_back');
  addBox(0.5, 3.8, 10, -83, minaY + 1.9, -53, mats.mineRock, true, 'mina_l');
  addBox(0.5, 3.8, 10, -73, minaY + 1.9, -53, mats.mineRock, true, 'mina_r');
  addBox(10.6, 0.6, 10.6, -78, minaY + 3.9, -53, mats.mineRock, false);
  addDoor('porta_mina', 'Cancela da Mina Desativada', -79.2, minaY, -48, 2.4, 2.5, 'x', {
    locked: true,
    requiredItemId: 'chave_mina',
  });

  // =========================================================================
  // 11. COMPLEXO SUBTERRÂNEO SECRETO (72, 68) — PROJETO AURORA-MG 1958
  // =========================================================================
  const compY = groundHeightAt(72, 68);
  addBox(12, 0.2, 12, 72, compY + 0.1, 68, mats.corrugatedMetal, false, 'comp_floor', false);
  addBox(4.8, 3.4, 0.4, 68.4, compY + 1.7, 62, mats.corrugatedMetal, true, 'comp_fl');
  addBox(4.8, 3.4, 0.4, 75.6, compY + 1.7, 62, mats.corrugatedMetal, true, 'comp_fr');
  addDoor('porta_complexo', 'Porta Blindada 1958', 71.0, compY + 0.1, 62, 2.0, 2.6, 'x', {
    locked: true,
    requiredItemId: 'cartao_complexo',
    isSecretPassage: true,
  });
  addBox(12, 3.4, 0.4, 72, compY + 1.7, 74, mats.corrugatedMetal, true, 'comp_back');
  addBox(0.4, 3.4, 12, 66, compY + 1.7, 68, mats.corrugatedMetal, true, 'comp_l');
  addBox(0.4, 3.4, 12, 78, compY + 1.7, 68, mats.corrugatedMetal, true, 'comp_r');
  addBox(12.4, 0.4, 12.4, 72, compY + 3.5, 68, mats.iron, false);
  interactables.push({
    id: 'radio_complexo_enigma',
    type: 'minigame',
    label: 'Terminal de Rádio Aurora-1958',
    prompt: '[E] Decifrar Enigma do Rádio (Minigame)',
    x: 72,
    y: compY + 1.2,
    z: 71.5,
    radius: 3.0,
    minigameId: 'enigma_radio',
  });

  // =========================================================================
  // 12. MILHARAL & FLORESTA DO ESQUECIMENTO (InstancedMesh + Wind Sway)
  // =========================================================================
  const cornCount = 120;
  const cornStalkGeo = new THREE.BoxGeometry(0.24, 2.3, 0.24);
  const cornMesh = new THREE.InstancedMesh(cornStalkGeo, mats.cornLeaf, cornCount);
  const dummy = new THREE.Object3D();
  const colorTmp = new THREE.Color();
  let cIdx = 0;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 12; col++) {
      const cx = 24 + row * 1.55;
      const cz = 14 + col * 1.35;
      if (Math.abs(cx - 31) < 1.2 && Math.abs(cz - 21) < 2.2) dummy.position.set(cx, -10, cz);
      else dummy.position.set(cx, 1.15, cz);
      dummy.rotation.y = ((row * 7 + col * 13) % 6) * 0.5;
      const s = 0.88 + ((row + col) % 4) * 0.08;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      cornMesh.setMatrixAt(cIdx, dummy.matrix);
      colorTmp.setHex(0x5c8a32).offsetHSL(0, 0, ((row + col) % 3 - 1) * 0.04);
      cornMesh.setColorAt(cIdx, colorTmp);
      cIdx++;
    }
  }
  cornMesh.instanceMatrix.needsUpdate = true;
  if (cornMesh.instanceColor) cornMesh.instanceColor.needsUpdate = true;
  cornMesh.computeBoundingSphere();
  scene.add(cornMesh);
  foliageInstances.push(cornMesh);

  // Trees distributed naturally across outer valley & Floresta do Esquecimento
  const treePositions: Array<{ x: number; z: number; isIpe: boolean; scale: number }> = [];
  for (let i = 0; i < 140; i++) {
    const angle = (i / 140) * Math.PI * 2;
    const radius = i < 70 ? 86 + (i % 6) * 6 : 38 + (i % 7) * 6;
    const tx = Math.cos(angle) * radius + Math.sin(i * 3.1) * 3.5;
    const tz = Math.sin(angle) * radius + Math.cos(i * 2.7) * 3.5;
    // Keep clear of all 18 region hubs & main roads
    if (Math.hypot(tx, tz - 52) < 9) continue; // Saci clearing
    if (Math.abs(tx) < 8 && tz < 20) continue;
    if (Math.abs(tz + 12) < 8) continue;
    if (Math.abs(tz + 56) < 8) continue;
    if (Math.hypot(tx + 36, tz - 28) < 12) continue;
    if (Math.hypot(tx - 42, tz - 22) < 12) continue;
    if (Math.hypot(tx + 48, tz + 18) < 12) continue;
    if (Math.hypot(tx - 44, tz + 38) < 13) continue;
    if (Math.hypot(tx - 72, tz + 58) < 20) continue;
    if (Math.hypot(tx - 42, tz + 6) < 12) continue;
    if (Math.hypot(tx + 24, tz + 30) < 12) continue;
    if (Math.hypot(tx - 24, tz + 74) < 13) continue;
    if (Math.hypot(tx + 24, tz + 74) < 13) continue;
    if (Math.hypot(tx + 78, tz + 52) < 14) continue;
    if (Math.hypot(tx - 72, tz - 68) < 14) continue;
    if (Math.hypot(tx + 76, tz - 68) < 14) continue;
    if (Math.hypot(tx + 74, tz - 16) < 12) continue;
    if (Math.hypot(tx - 76, tz - 18) < 12) continue;
    if (Math.hypot(tx + 48, tz + 56) < 14) continue;

    treePositions.push({
      x: tx,
      z: tz,
      isIpe: i % 4 === 0,
      scale: 0.85 + (i % 5) * 0.12,
    });
  }

  const trunkGeo = new THREE.BoxGeometry(0.8, 3.6, 0.8);
  const canopyGeo = new THREE.BoxGeometry(3.2, 2.2, 3.2);
  const crownGeo = new THREE.BoxGeometry(2.0, 1.4, 2.0);
  const trunkInst = new THREE.InstancedMesh(trunkGeo, mats.woodDark, treePositions.length);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, mats.foliageDark, treePositions.length);
  const crownInst = new THREE.InstancedMesh(crownGeo, mats.foliageDark, treePositions.length);
  if (quality !== 'baixo') {
    trunkInst.castShadow = true;
    canopyInst.castShadow = true;
    crownInst.castShadow = true;
  }

  treePositions.forEach((tp, idx) => {
    const gy = groundHeightAt(tp.x, tp.z);
    dummy.position.set(tp.x, gy + 1.8 * tp.scale, tp.z);
    dummy.rotation.y = (idx * 0.7) % Math.PI;
    dummy.scale.set(tp.scale, tp.scale, tp.scale);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(tp.x, gy + 4.1 * tp.scale, tp.z);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(tp.x, gy + 5.7 * tp.scale, tp.z);
    dummy.updateMatrix();
    crownInst.setMatrixAt(idx, dummy.matrix);

    if (tp.isIpe) colorTmp.setHex(0xeab308);
    else colorTmp.setHex(0x2f5d2b).offsetHSL(0, 0, ((idx % 3) - 1) * 0.05);
    canopyInst.setColorAt(idx, colorTmp);
    crownInst.setColorAt(idx, colorTmp.clone().offsetHSL(0, 0, 0.05));

    if (Math.hypot(tp.x, tp.z) < 92) {
      colliders.push({
        id: `tree_${idx}`,
        minX: tp.x - 0.52,
        maxX: tp.x + 0.52,
        minZ: tp.z - 0.52,
        maxZ: tp.z + 0.52,
        minY: gy,
        maxY: gy + 4,
        active: true,
      });
    }
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  canopyInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  scene.add(trunkInst, canopyInst, crownInst);
  foliageInstances.push(trunkInst, canopyInst, crownInst);

  // =========================================================================
  // 13. STREET LAMPS (5 PointLights for budget + extra unlit poles)
  // =========================================================================
  addLampPost(-2.4, -7.8, true);
  addLampPost(4.2, -16, true);
  addLampPost(-16, -12, true);
  addLampPost(16, -12, true);
  addLampPost(0, 26, true);
  addLampPost(-32, -14, false);
  addLampPost(32, -14, false);
  addLampPost(0, -48, false);
  addLampPost(-48, -50, false);

  // =========================================================================
  // 14. ITEMS & LORE PICKUPS ACROSS THE 18 REGIONS
  // =========================================================================
  addPickup('lanterna', 'Lanterna de Pilha Velha', 2.4, 0.68, -1.4);
  addPickup('pao_de_queijo', 'Pão de Queijo da Vó', 2.6, 0.94, 2.2);
  addPickup('milho_bento', 'Espiga de Milho Dourado', 31.0, 0.0, 21.0);
  addPickup('chave_celeiro', 'Chave Enferrujada do Celeiro', 4.0, 0.0, 13.6);
  addPickup('diario_vizinho', 'Caderno de Teorias do Seu Zé', -21.6, 0.96, 5.6);
  addPickup('fumo_saci', 'Fumo de Corda do Tião', 20.0, 1.12, -2.0);
  addPickup('chave_igreja', 'Chave de Bronze da Igreja', 42.0, 0.0, 23.4);
  addPickup('chave_hospital', 'Chave Mestra do Hospital', 42.0, 0.6, -5.0);
  addPickup('chave_mina', 'Chave da Cancela da Mina', -74.0, 0.0, 19.8);
  addPickup('cartao_complexo', 'Cartão Magnético de 1958', -78.0, minaY + 0.1, -55.0);
  addPickup('selo_primeira_madrugada', 'Selo da Primeira Madrugada', -78.0, minaY + 0.1, -52.5);
  addPickup('disco_1958', 'Fita Magnética Projeto Aurora-MG', 72.0, compY + 0.3, 68.0);
  addPickup('cafe_coado', 'Garrafa de Café Coado', -36.0, 0.0, 29.0);
  addPickup('cruz_madeira', 'Cruz de Ipê Bento', -24.0, 1.15, -34.6);
  addPickup('agua_mina', 'Cantil de Água da Serra', -76.0, serraY + 4.05, 68.0);

  // Lore Documents placed across regions
  addLorePickup('lore_1924_mina', 'Relatório da Mina (1924)', -76.0, minaY + 0.1, -51.0);
  addLorePickup('lore_1924_carta_fundador', 'Carta do Primeiro Morador', -72.0, 0.1, 16.0);
  addLorePickup('lore_1958_aurora', 'Memorando Projeto Aurora (1958)', 70.0, compY + 0.25, 67.0);
  addLorePickup('lore_1987_jornal', 'Gazeta de Minas (1987)', -48.0, 0.1, -54.0);
  addLorePickup('lore_1987_hospital', 'Prontuário #404 (Hospital 2º Andar)', 25.0, 3.45, -75.0);
  addLorePickup('lore_1987_estacao', 'Manifesto da Maria-Fumaça', 44.0, 0.65, -4.5);
  addLorePickup('lore_1972_fazenda', 'Livro Caixa Fazenda Santa Luzia', 73.0, 0.1, 18.0);
  addLorePickup('lore_diario_vo', 'Diário da Vó Maria', -4.2, 0.8, 3.2);

  // =========================================================================
  // 15. ALL 7 NPCS & 5 DISTINCT CREATURES
  // =========================================================================
  const avo = buildGrandmaVoxel();
  avo.position.set(1.25, 0.14, -6.2);
  avo.rotation.y = Math.PI;
  scene.add(avo);
  interactables.push({ id: 'npc_avo', type: 'npc', label: 'Vó Maria', prompt: '[E] Conversar com a Vó Maria', x: 1.25, y: 1.2, z: -6.2, radius: 3.4, npcId: 'avo' });

  const vizinho = buildNeighborVoxel();
  vizinho.position.set(-14.5, 0, -2.0);
  scene.add(vizinho);
  interactables.push({ id: 'npc_vizinho', type: 'npc', label: 'Seu Zé (Vizinho)', prompt: '[E] Falar com o Seu Zé', x: -14.5, y: 1.2, z: -2.0, radius: 3.2, npcId: 'vizinho' });

  const tiao = buildTiaoVoxel();
  tiao.position.set(20.0, 0.12, -3.2);
  scene.add(tiao);
  interactables.push({ id: 'npc_tiao', type: 'npc', label: 'Tião do Mercadinho', prompt: '[E] Falar com o Tião', x: 20.0, y: 1.2, z: -3.2, radius: 3.2, npcId: 'tiao' });

  const padre_bento = buildPadreBentoVoxel();
  padre_bento.position.set(-21.5, 0, -20.5);
  scene.add(padre_bento);
  interactables.push({ id: 'npc_padre_bento', type: 'npc', label: 'Padre Bento', prompt: '[E] Conversar com Padre Bento', x: -21.5, y: 1.2, z: -20.5, radius: 3.2, npcId: 'padre_bento' });

  const ze_pescador = buildZePescadorVoxel();
  ze_pescador.position.set(45.5, 0.25, -36.5);
  scene.add(ze_pescador);
  interactables.push({ id: 'npc_ze_pescador', type: 'npc', label: 'Zé Pescador', prompt: '[E] Conversar com Zé Pescador', x: 45.5, y: 1.2, z: -36.5, radius: 3.2, npcId: 'ze_pescador' });

  const dona_clara = buildDonaClaraVoxel();
  dona_clara.position.set(-29.5, 0, 22.0);
  scene.add(dona_clara);
  interactables.push({ id: 'npc_dona_clara', type: 'npc', label: 'Dona Clara', prompt: '[E] Conversar com Dona Clara', x: -29.5, y: 1.2, z: 22.0, radius: 3.2, npcId: 'dona_clara' });

  const saci = buildSaciVoxel();
  saci.position.set(0, 0, 52);
  scene.add(saci);
  interactables.push({ id: 'npc_saci', type: 'npc', label: 'Saci Pererê', prompt: '[E] Conversar com o Saci', x: 0, y: 1.0, z: 52, radius: 3.5, npcId: 'saci' });

  // Creatures
  const galinha = buildChickenVoxel();
  galinha.position.set(2.2, 0, 10.5);
  scene.add(galinha);

  const homem_do_saco = buildHomemDoSacoVoxel();
  homem_do_saco.position.set(42, 0, 12);
  scene.add(homem_do_saco);

  const criatura_floresta = buildCriaturaFlorestaVoxel();
  criatura_floresta.position.set(-14, 0, 56);
  scene.add(criatura_floresta);

  const mula_sem_cabeca = buildMulaSemCabecaVoxel();
  mula_sem_cabeca.position.set(0, 0, -52);
  scene.add(mula_sem_cabeca);

  return {
    colliders,
    doors,
    doorMeshes,
    hidingSpots,
    interactables,
    pickupMeshes,
    pushProps,
    pushPropMeshes,
    npcGroups: {
      avo,
      vizinho,
      tiao,
      padre_bento,
      ze_pescador,
      dona_clara,
      saci,
    },
    creatureGroups: {
      galinha,
      saci,
      homem_do_saco,
      criatura_floresta,
      mula_sem_cabeca,
    },
    lampLights,
    lampBulbs,
    interiorLights,
    puddleMeshes,
    waterMesh,
    bikeGroup,
    tvScreenMesh,
    foliageInstances,
  };
}
