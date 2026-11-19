import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gameAudio } from './audio';
import {
  ITEM_CATALOG,
  LORE_ENTRIES,
  MAX_BACKPACK_SLOTS,
  getChapterByNumber,
} from './campaign';
import { selectNpcDialogue } from './dialogues';
import {
  BIKE_SPEED,
  CROUCH_SPEED,
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_EYE_CROUCH,
  PLAYER_EYE_STAND,
  PLAYER_HEIGHT_CROUCH,
  PLAYER_HEIGHT_STAND,
  SPRINT_SPEED,
  WALK_SPEED,
  buildNavGrid,
  formatGameClock,
  getRegionAt,
  pickNextWeather,
  resolveEntityCollisions,
  supportHeightAt,
  updatePushableProps,
  updateStamina,
  type NavGrid,
} from './physics';
import { pickSpecialEvent, updateCreatureAI, updateNpcRoutines } from './simulation';
import { createMaterialPalette, type MaterialPalette } from './textures';
import type {
  ChapterNumber,
  CreatureState,
  CustomizationConfig,
  EndingType,
  GameState,
  GraphicsSettings,
  HudSnapshot,
  InteractableTarget,
  InventoryItem,
  MinigameId,
  NpcState,
  PlayerState,
  PlayerStats,
  RegionId,
  SaveData,
  SaveSlotId,
  WeatherType,
} from './types';
import { buildSantaBatataWorld, type BuiltWorld } from './worldBuilder';

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onOpenDialogue: (npcId: string, lineId: string) => void;
  onOpenMinigame: (minigameId: MinigameId) => void;
  onShowNotice: (title: string, text: string) => void;
  onInventoryChange: (items: InventoryItem[]) => void;
  onProgressChange: (progress: {
    chapter: ChapterNumber;
    completedObjectives: string[];
    completedSideMissions: string[];
    discoveredLore: string[];
    discoveredRegions: RegionId[];
    unlockedAchievements: string[];
    stats: PlayerStats;
    flags: Record<string, boolean>;
  }) => void;
  onGameOver: (
    ending: EndingType,
    stats: { chapter: ChapterNumber; time: string; itemsCount: number; loreCount: number },
  ) => void;
  onRequestPause: () => void;
  onRequestMap: () => void;
}

export interface TouchInputState {
  moveX: number;
  moveY: number;
  lookDeltaX: number;
  lookDeltaY: number;
  sprint: boolean;
  crouch: boolean;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _skyDay = new THREE.Color(0x7fb4dc);
const _skySunset = new THREE.Color(0xd97736);
const _skyNight = new THREE.Color(0x0b1020);
const _skyThree = new THREE.Color(0x160919);
const _skyCurr = new THREE.Color();

export function detectSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class SantaBatataEngine {
  private container: HTMLElement;
  private callbacks: React.MutableRefObject<EngineCallbacks>;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private fog: THREE.FogExp2;
  private palette: MaterialPalette;
  private world: BuiltWorld;
  private navGrid: NavGrid;
  private isSoftwareGl: boolean;

  private gameState: GameState = 'title';
  private graphics: GraphicsSettings;
  private customization: CustomizationConfig;
  private slotId: SaveSlotId = 'auto';

  private chapter: ChapterNumber = 1;
  private completedObjectives = new Set<string>();
  private completedSideMissions = new Set<string>();
  private discoveredLore = new Set<string>();
  private discoveredRegions = new Set<RegionId>(['santa_batata']);
  private unlockedAchievements = new Set<string>();
  private seenDialogueIds = new Set<string>();
  private decisions: Record<string, string> = {};
  private flags: Record<string, boolean> = {};
  private npcReputation: Record<string, number> = {
    avo: 50,
    vizinho: 20,
    tiao: 25,
    padre_bento: 30,
    ze_pescador: 20,
    dona_clara: 30,
    saci: 10,
  };
  private inventory: InventoryItem[] = [];
  private gameTimeMinutes = 1095; // 18:15
  private dayNumber = 1;
  private weather: WeatherType = 'limpo';
  private weatherTimer = 95;
  private freeExploreAfterCampaign = false;

  private stats: PlayerStats = {
    distanceWalkedMeters: 0,
    doorsOpened: 0,
    timesHidden: 0,
    itemsCollected: 0,
    loreFound: 0,
    sideMissionsCompleted: 0,
    minigamesWon: 0,
    deathsCount: 0,
    daysSurvived: 0,
  };

  private player: PlayerState = {
    x: 0.6,
    y: 0,
    z: -8.8,
    vy: 0,
    yaw: Math.PI - 0.22,
    pitch: 0.02,
    stamina: 100,
    maxStamina: 100,
    fatigue: 0,
    hunger: 100,
    hydration: 100,
    staminaExhausted: false,
    isGrounded: true,
    isCrouching: false,
    isSprinting: false,
    isHiding: false,
    onBike: false,
    hidingSpotId: null,
    flashlightOn: false,
    fearLevel: 0,
    stepsWalked: 0,
    noiseLevel: 0,
  };

  private creatures: CreatureState[] = [];
  private npcs: NpcState[] = [];
  private disturbancePos: { x: number; z: number } | null = null;
  private disturbanceTimer = 0;
  private waypoint: { x: number; z: number; label: string } | null = null;

  // Particles
  private particleMesh: THREE.InstancedMesh;
  private particlePositions: Float32Array;
  private particleCount = 60;
  private rainMesh: THREE.InstancedMesh;
  private rainPositions: Float32Array;
  private rainCount = 180;
  private lightningTimer = 14;
  private lightningFlash = 0;

  // Input
  private keysHeld = new Set<string>();
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;
  private isPointerDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  public touchInput: TouchInputState = {
    moveX: 0,
    moveY: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    sprint: false,
    crouch: false,
  };

  // Loop
  private frameId = 0;
  private lastTimeMs = performance.now();
  private disposed = false;
  private hudSyncTimer = 0;
  private randomEventTimer = 14;
  private subtitleTimer = 0;
  private currentSubtitle: { speaker: string; text: string } | null = null;
  private trauma = 0;
  private hitstopTimer = 0;
  private footstepAccum = 0;
  private clockThreeChimed = false;
  private activeTarget: InteractableTarget | null = null;
  private dialogueOpen = false;
  private fpsAvg = 60;
  private tvChannel = 0;

  constructor(
    container: HTMLElement,
    callbacksRef: React.MutableRefObject<EngineCallbacks>,
    initialGraphics: GraphicsSettings,
    initialCustomization: CustomizationConfig,
  ) {
    this.container = container;
    this.callbacks = callbacksRef;
    this.graphics = { ...initialGraphics };
    this.customization = { ...initialCustomization };
    this.isSoftwareGl = detectSoftwareWebGL();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && initialGraphics.quality !== 'baixo',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl
        ? 1
        : Math.min(window.devicePixelRatio, initialGraphics.quality === 'alto' ? 2 : 1.5),
    );
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight,
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && initialGraphics.quality !== 'baixo';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = _skySunset.clone();
    this.fog = new THREE.FogExp2(0xd97736, 0.012);
    this.scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(
      72,
      aspect,
      0.12,
      this.graphics.renderDistance + 40,
    );

    this.hemiLight = new THREE.HemisphereLight(0x8bb6e8, 0x3b2a1e, 0.72);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfb0, 1.45);
    this.sunLight.position.set(32, 42, -28);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 130;
    const d = 46;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.flashlight = new THREE.SpotLight(0xfff4d6, 0, 32, Math.PI / 5.2, 0.45, 1.35);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -5);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.camera);

    this.palette = createMaterialPalette(this.renderer, this.isSoftwareGl);
    this.world = buildSantaBatataWorld(this.scene, this.palette, initialGraphics.quality);
    this.navGrid = buildNavGrid(this.world.colliders);

    // Fireflies
    const pGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.particleCount);
    this.particleMesh.frustumCulled = false;
    this.particlePositions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions[i * 3] = (Math.random() - 0.5) * 120;
      this.particlePositions[i * 3 + 1] = 0.6 + Math.random() * 3.5;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    this.scene.add(this.particleMesh);

    // Rain Particle Pool
    const rGeo = new THREE.BoxGeometry(0.03, 0.45, 0.03);
    const rMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.55,
    });
    this.rainMesh = new THREE.InstancedMesh(rGeo, rMat, this.rainCount);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = false;
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 34;
      this.rainPositions[i * 3 + 1] = Math.random() * 14;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    this.scene.add(this.rainMesh);

    this.initEntities();
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.lastTimeMs = performance.now();
    this.tick();
  }

  private initEntities(): void {
    this.creatures = [
      {
        id: 'galinha',
        type: 'galinha',
        name: 'Galinha Gertrudes',
        x: 2.2,
        y: 0,
        z: 10.5,
        homeX: 2.2,
        homeZ: 10.5,
        yaw: 0,
        speed: 3.2,
        radius: 0.34,
        mode: 'patrulhando',
        modeTimer: 4,
        windupTimer: 0,
        suspicion: 0,
        lastKnownX: null,
        lastKnownZ: null,
        path: [],
        pathRecalcTimer: 0,
        active: true,
        reactionCooldown: 0,
      },
      {
        id: 'saci',
        type: 'saci',
        name: 'Saci Pererê',
        x: 0,
        y: 0,
        z: 52,
        homeX: 0,
        homeZ: 52,
        yaw: 0,
        speed: 4.3,
        radius: 0.36,
        mode: 'patrulhando',
        modeTimer: 4,
        windupTimer: 0,
        suspicion: 0,
        lastKnownX: null,
        lastKnownZ: null,
        path: [],
        pathRecalcTimer: 0,
        active: true,
        reactionCooldown: 0,
      },
      {
        id: 'homem_do_saco',
        type: 'homem_do_saco',
        name: 'Homem do Saco',
        x: 42,
        y: 0,
        z: 12,
        homeX: 42,
        homeZ: 12,
        yaw: 0,
        speed: 3.7,
        radius: 0.45,
        mode: 'patrulhando',
        modeTimer: 5,
        windupTimer: 0,
        suspicion: 0,
        lastKnownX: null,
        lastKnownZ: null,
        path: [],
        pathRecalcTimer: 0,
        active: true,
        reactionCooldown: 0,
      },
      {
        id: 'criatura_floresta',
        type: 'criatura_floresta',
        name: 'Criatura da Floresta',
        x: -14,
        y: 0,
        z: 56,
        homeX: -14,
        homeZ: 56,
        yaw: 0,
        speed: 3.9,
        radius: 0.45,
        mode: 'patrulhando',
        modeTimer: 5,
        windupTimer: 0,
        suspicion: 0,
        lastKnownX: null,
        lastKnownZ: null,
        path: [],
        pathRecalcTimer: 0,
        active: true,
        reactionCooldown: 0,
      },
      {
        id: 'mula_sem_cabeca',
        type: 'mula_sem_cabeca',
        name: 'Mula-sem-Cabeça',
        x: 0,
        y: 0,
        z: -52,
        homeX: 0,
        homeZ: -52,
        yaw: 0,
        speed: 4.7,
        radius: 0.48,
        mode: 'explorando',
        modeTimer: 5,
        windupTimer: 0,
        suspicion: 0,
        lastKnownX: null,
        lastKnownZ: null,
        path: [],
        pathRecalcTimer: 0,
        active: true,
        reactionCooldown: 0,
      },
    ];

    this.npcs = [
      { id: 'avo', name: 'Vó Maria', role: 'Avó Mineira', x: 1.25, y: 0.14, z: -6.2, yaw: Math.PI, homeX: 1.25, homeZ: 2.0, workX: 1.25, workZ: -6.2, plazaX: 1.25, plazaZ: -6.2, routineLabel: 'Na Varanda', reputation: this.npcReputation.avo ?? 50, sleeping: false },
      { id: 'vizinho', name: 'Seu Zé', role: 'Vizinho Fofoqueiro', x: -14.5, y: 0, z: -2.0, yaw: 0.6, homeX: -19.5, homeZ: 3.5, workX: -14.5, workZ: -2.0, plazaX: -2.5, plazaZ: -20.5, routineLabel: 'Fofocando', reputation: this.npcReputation.vizinho ?? 20, sleeping: false },
      { id: 'tiao', name: 'Tião', role: 'Mercadinho', x: 20.0, y: 0.12, z: -3.2, yaw: Math.PI, homeX: 20.0, homeZ: -3.2, workX: 20.0, workZ: -3.2, plazaX: 6.5, plazaZ: -20.5, routineLabel: 'Atendendo', reputation: this.npcReputation.tiao ?? 25, sleeping: false },
      { id: 'padre_bento', name: 'Padre Bento', role: 'Igreja Velha', x: -21.5, y: 0, z: -20.5, yaw: 0, homeX: -24.0, homeZ: -27.0, workX: -21.5, workZ: -20.5, plazaX: -0.5, plazaZ: -21.0, routineLabel: 'Na Igreja', reputation: this.npcReputation.padre_bento ?? 30, sleeping: false },
      { id: 'ze_pescador', name: 'Zé Pescador', role: 'Represa', x: 45.5, y: 0.25, z: -36.5, yaw: 0, homeX: 48.0, homeZ: -38.0, workX: 45.5, workZ: -36.5, plazaX: 4.5, plazaZ: -22.0, routineLabel: 'Pescando', reputation: this.npcReputation.ze_pescador ?? 20, sleeping: false },
      { id: 'dona_clara', name: 'Dona Clara', role: 'Quitandeira', x: -29.5, y: 0, z: 22.0, yaw: 0.5, homeX: -32.0, homeZ: 24.0, workX: -29.5, workZ: 22.0, plazaX: 2.0, plazaZ: -19.0, routineLabel: 'Fazenda', reputation: this.npcReputation.dona_clara ?? 30, sleeping: false },
      { id: 'saci', name: 'Saci Pererê', role: 'Folclore', x: 0, y: 0, z: 52, yaw: 0, homeX: 0, homeZ: 52, workX: 0, workZ: 52, plazaX: 0, plazaZ: 52, routineLabel: 'Na Floresta', reputation: this.npcReputation.saci ?? 10, sleeping: false },
    ];
  }

  private rebuildNavGrid(): void {
    this.navGrid = buildNavGrid(this.world.colliders);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.gameState !== 'playing') return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      this.callbacks.current.onRequestPause();
      return;
    }
    if (e.code === 'Tab' || e.code === 'KeyM') {
      if (!this.dialogueOpen) {
        e.preventDefault();
        this.callbacks.current.onRequestMap();
        return;
      }
    }
    if (this.dialogueOpen) return;

    this.keysHeld.add(e.code);
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      this.jumpBufferTimer = 0.14;
    }
    if (e.code === 'KeyE' && !e.repeat) {
      this.triggerInteract();
    }
    if (e.code === 'KeyF' && !e.repeat) {
      this.toggleFlashlight();
    }
    if ((e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyC') && !e.repeat) {
      this.player.isCrouching = !this.player.isCrouching;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
    if (e.code === 'Space' && this.player.vy > 0) {
      this.player.vy *= 0.45;
    }
  };

  private onBlur = () => {
    this.keysHeld.clear();
    this.isPointerDragging = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.gameState !== 'playing' || this.dialogueOpen) return;
    gameAudio.init();
    if (e.target === this.renderer.domElement) {
      this.isPointerDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      try {
        if (document.pointerLockElement !== this.renderer.domElement) {
          this.renderer.domElement.requestPointerLock?.();
        }
      } catch {
        // fallback drag look
      }
    }
  };

  private onMouseUp = () => {
    this.isPointerDragging = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.gameState !== 'playing' || this.dialogueOpen) return;
    const sens = 0.0024 * this.graphics.mouseSensitivity;
    if (document.pointerLockElement === this.renderer.domElement) {
      this.player.yaw -= e.movementX * sens;
      this.player.pitch = THREE.MathUtils.clamp(this.player.pitch - e.movementY * sens, -1.35, 1.35);
    } else if (this.isPointerDragging) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.player.yaw -= dx * sens * 1.4;
      this.player.pitch = THREE.MathUtils.clamp(this.player.pitch - dy * sens * 1.4, -1.35, 1.35);
    }
  };

  private onResize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.render(this.scene, this.camera);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public setGameState(next: GameState): void {
    this.gameState = next;
    this.keysHeld.clear();
    this.isPointerDragging = false;
    if (next !== 'playing') {
      if (document.pointerLockElement) document.exitPointerLock?.();
      gameAudio.setWorldState(false, false, 0);
    } else {
      gameAudio.init();
      this.camera.position.set(this.player.x, this.player.y + PLAYER_EYE_STAND, this.player.z);
      this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');
      this.updateInteractableScan();
      const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
      const reg = getRegionAt(this.player.x, this.player.z);
      gameAudio.setWorldState(true, clk.isNight, 0.2, reg.ambienceType, this.weather, this.isIndoors());
      this.pushHudNow();
    }
  }

  public setDialogueOpen(open: boolean): void {
    this.dialogueOpen = open;
    if (open && document.pointerLockElement) document.exitPointerLock?.();
    this.keysHeld.clear();
  }

  public applyGraphicsSettings(next: GraphicsSettings): void {
    this.graphics = { ...next };
    this.camera.far = next.renderDistance + 40;
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && next.quality !== 'baixo';
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, next.quality === 'alto' ? 2 : 1.5),
    );
  }

  public applyCustomization(next: CustomizationConfig): void {
    this.customization = { ...next };
  }

  public setWaypoint(x: number, z: number, label: string): void {
    this.waypoint = { x, z, label };
    this.setSubtitle('Mapa', `Marcador definido em: ${label}`);
    this.pushHudNow();
  }

  public enterFreeExploreAfterCampaign(): void {
    this.freeExploreAfterCampaign = true;
    this.player.x = 0.6;
    this.player.z = -8.8;
    this.player.y = 0;
    this.setGameState('playing');
    this.setSubtitle('Santa Batata', 'Modo Exploração Livre ativado! Todas as 18 regiões estão abertas.', 5.5);
  }

  public loadFromSave(save: SaveData): void {
    this.slotId = save.slotId;
    this.chapter = save.chapter;
    this.completedObjectives = new Set(save.completedObjectiveIds);
    this.completedSideMissions = new Set(save.completedSideMissionIds);
    this.discoveredLore = new Set(save.discoveredLoreIds);
    this.discoveredRegions = new Set(save.discoveredRegions);
    this.unlockedAchievements = new Set(save.unlockedAchievements);
    this.seenDialogueIds = new Set(save.seenDialogueIds);
    this.decisions = { ...save.decisions };
    this.flags = { ...save.flags };
    this.npcReputation = { ...save.npcReputation };
    this.inventory = save.inventory.map((i) => ({ ...i }));
    this.customization = { ...save.customization };
    this.gameTimeMinutes = save.gameTimeMinutes;
    this.dayNumber = save.dayNumber;
    this.weather = save.weather;
    this.stats = { ...save.stats };
    this.freeExploreAfterCampaign = save.freeExploreAfterCampaign;
    this.clockThreeChimed = formatGameClock(save.gameTimeMinutes, save.dayNumber).isThreeAM;

    this.player.x = save.playerPos.x;
    this.player.y = save.playerPos.y;
    this.player.z = save.playerPos.z;
    this.player.yaw = save.playerPos.yaw;
    this.player.pitch = 0.02;
    this.player.stamina = save.vitals.stamina;
    this.player.fatigue = save.vitals.fatigue;
    this.player.hunger = save.vitals.hunger;
    this.player.hydration = save.vitals.hydration;
    this.player.isHiding = false;
    this.player.onBike = false;
    this.player.hidingSpotId = null;
    this.player.flashlightOn = this.hasItem('lanterna');

    this.world.interactables.forEach((it) => {
      if (it.type === 'item' && it.itemId) {
        const collected = this.hasItem(it.itemId) || !!this.flags[`picked_${it.itemId}`];
        it.collected = collected;
        const mesh = this.world.pickupMeshes.get(it.itemId);
        if (mesh) mesh.visible = !collected;
      } else if (it.type === 'lore' && it.loreId) {
        const found = this.discoveredLore.has(it.loreId);
        it.collected = found;
        const mesh = this.world.pickupMeshes.get(it.loreId);
        if (mesh) mesh.visible = !found;
      }
    });

    this.initEntities();
    this.rebuildNavGrid();
    for (const n of this.npcs) {
      const grp = this.world.npcGroups[n.id as keyof BuiltWorld['npcGroups']];
      if (grp) {
        grp.position.set(n.x, n.y, n.z);
        grp.rotation.y = n.yaw;
      }
    }
    this.camera.position.set(this.player.x, this.player.y + PLAYER_EYE_STAND, this.player.z);
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');
    this.updateInteractableScan();
    this.callbacks.current.onInventoryChange([...this.inventory]);
    this.syncProgressCallback();
    this.pushHudNow();
  }

  public exportSaveData(targetSlot: SaveSlotId = this.slotId): SaveData {
    return {
      version: 2,
      slotId: targetSlot,
      savedAt: new Date().toISOString(),
      chapter: this.chapter,
      completedObjectiveIds: Array.from(this.completedObjectives),
      completedSideMissionIds: Array.from(this.completedSideMissions),
      discoveredLoreIds: Array.from(this.discoveredLore),
      discoveredRegions: Array.from(this.discoveredRegions),
      unlockedAchievements: Array.from(this.unlockedAchievements),
      seenDialogueIds: Array.from(this.seenDialogueIds),
      decisions: { ...this.decisions },
      flags: { ...this.flags },
      npcReputation: { ...this.npcReputation },
      gameTimeMinutes: this.gameTimeMinutes,
      dayNumber: this.dayNumber,
      weather: this.weather,
      playerPos: {
        x: this.player.x,
        y: this.player.y,
        z: this.player.z,
        yaw: this.player.yaw,
      },
      vitals: {
        stamina: Math.round(this.player.stamina),
        fatigue: Math.round(this.player.fatigue),
        hunger: Math.round(this.player.hunger),
        hydration: Math.round(this.player.hydration),
      },
      inventory: this.inventory.map((i) => ({ ...i })),
      customization: { ...this.customization },
      stats: { ...this.stats },
      freeExploreAfterCampaign: this.freeExploreAfterCampaign,
    };
  }

  private syncProgressCallback(): void {
    this.callbacks.current.onProgressChange({
      chapter: this.chapter,
      completedObjectives: Array.from(this.completedObjectives),
      completedSideMissions: Array.from(this.completedSideMissions),
      discoveredLore: Array.from(this.discoveredLore),
      discoveredRegions: Array.from(this.discoveredRegions),
      unlockedAchievements: Array.from(this.unlockedAchievements),
      stats: { ...this.stats },
      flags: { ...this.flags },
    });
  }

  public hasItem(id: string): boolean {
    return this.inventory.some((it) => it.id === id && it.quantity > 0);
  }

  public addItem(id: string): boolean {
    const def = ITEM_CATALOG[id];
    if (!def) return false;
    const existing = this.inventory.find((it) => it.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      if (this.inventory.length >= MAX_BACKPACK_SLOTS) {
        this.setSubtitle('Mochila Cheia', 'Sua mochila atingiu 24 espaços! Consuma alimentos para abrir vaga.');
        return false;
      }
      this.inventory.push({ ...def, quantity: 1 });
    }
    this.flags[`picked_${id}`] = true;
    this.stats.itemsCollected += 1;
    gameAudio.playPickup();
    this.callbacks.current.onInventoryChange([...this.inventory]);
    this.syncProgressCallback();
    return true;
  }

  public useInventoryItem(id: string): string {
    if (id === 'lanterna') {
      this.toggleFlashlight();
      return this.player.flashlightOn ? 'Lanterna ligada!' : 'Lanterna desligada.';
    }
    if (id === 'pao_de_queijo' || id === 'broa_fuba' || id === 'peixe_dourado') {
      this.player.stamina = this.player.maxStamina;
      this.player.staminaExhausted = false;
      this.player.hunger = Math.min(100, this.player.hunger + 45);
      this.player.fatigue = Math.max(0, this.player.fatigue - 20);
      this.player.fearLevel = Math.max(0, this.player.fearLevel - 35);
      this.consumeOneItem(id);
      gameAudio.playPickup();
      this.setSubtitle('Protagonista', 'Delícia mineira! Energia e fome recuperadas.');
      return 'Energia e fome restauradas!';
    }
    if (id === 'agua_mina' || id === 'caldo_cana' || id === 'cafe_coado') {
      this.player.hydration = Math.min(100, this.player.hydration + 50);
      this.player.fatigue = Math.max(0, this.player.fatigue - 35);
      this.player.stamina = this.player.maxStamina;
      if (id !== 'cafe_coado') this.consumeOneItem(id);
      gameAudio.playPickup();
      return 'Hidratação e disposição restauradas!';
    }
    if (id === 'radio_portatil') {
      this.callbacks.current.onOpenMinigame('enigma_radio');
      return 'Abrindo sintonizador do rádio...';
    }
    return 'Item de missão pronto para usar no local apropriado.';
  }

  private consumeOneItem(id: string): void {
    const idx = this.inventory.findIndex((i) => i.id === id);
    if (idx === -1) return;
    if (this.inventory[idx].quantity > 1) this.inventory[idx].quantity -= 1;
    else this.inventory.splice(idx, 1);
    this.callbacks.current.onInventoryChange([...this.inventory]);
  }

  public toggleFlashlight(): void {
    if (!this.hasItem('lanterna')) {
      this.setSubtitle('Protagonista', 'Ainda preciso pegar a lanterna lá na sala da Vó!');
      return;
    }
    this.player.flashlightOn = !this.player.flashlightOn;
    gameAudio.playUiClick();
    this.pushHudNow();
  }

  public toggleCrouch(): void {
    this.player.isCrouching = !this.player.isCrouching;
    this.pushHudNow();
  }

  public triggerJump(): void {
    this.jumpBufferTimer = 0.14;
  }

  public unlockAchievement(id: string): void {
    if (this.unlockedAchievements.has(id)) return;
    this.unlockedAchievements.add(id);
    gameAudio.playAchievement();
    this.setSubtitle('Conquista Desbloqueada!', `Troféu obtido: ${id.replace('ach_', '').toUpperCase()}`);
    this.syncProgressCallback();
  }

  public completeSideMission(id: string): void {
    if (this.completedSideMissions.has(id)) return;
    this.completedSideMissions.add(id);
    this.stats.sideMissionsCompleted = this.completedSideMissions.size;
    if (this.completedSideMissions.size >= 10) this.unlockAchievement('ach_missao10');
    gameAudio.playPickup();
    this.syncProgressCallback();
  }

  public discoverLore(loreId: string): void {
    const entry = LORE_ENTRIES.find((l) => l.id === loreId);
    if (!entry) return;
    if (!this.discoveredLore.has(loreId)) {
      this.discoveredLore.add(loreId);
      this.stats.loreFound = this.discoveredLore.size;
      if (this.discoveredLore.size >= 10) {
        this.unlockAchievement('ach_historiador');
        this.completeSideMission('sm_esp_5');
      }
      this.syncProgressCallback();
    }
    this.callbacks.current.onShowNotice(`${entry.title} (${entry.year})`, entry.content);
  }

  public completeMinigame(id: MinigameId, won: boolean): void {
    if (!won) return;
    this.stats.minigamesWon += 1;
    gameAudio.playAchievement();
    if (id === 'pesca') {
      this.addItem('peixe_dourado');
      this.completeSideMission('sm_mor_4');
      this.unlockAchievement('ach_pescador');
    } else if (id === 'cartas') {
      this.completeSideMission('sm_mor_3');
      this.unlockAchievement('ach_truco');
    } else if (id === 'memoria') {
      this.addItem('amuleto_ipe');
      this.completeSideMission('sm_cri_3');
      this.unlockAchievement('ach_memoria');
    } else if (id === 'enigma_radio') {
      this.completeSideMission('sm_mor_9');
      this.unlockAchievement('ach_radio');
    } else if (id === 'caca_tesouro') {
      this.addItem('relogio_prata');
      this.completeSideMission('sm_esp_1');
      this.unlockAchievement('ach_tesouro');
    }
    this.syncProgressCallback();
  }

  public triggerInteract(): void {
    if (this.player.isHiding) {
      const spot = this.world.hidingSpots.find((h) => h.id === this.player.hidingSpotId);
      this.player.isHiding = false;
      this.player.hidingSpotId = null;
      if (spot) {
        this.player.x = spot.exitX;
        this.player.z = spot.exitZ;
      }
      gameAudio.playDoorCreak(true);
      this.pushHudNow();
      return;
    }

    if (!this.activeTarget) return;
    const t = this.activeTarget;

    if (t.type === 'item' && t.itemId && !t.collected) {
      if (this.addItem(t.itemId)) {
        t.collected = true;
        const mesh = this.world.pickupMeshes.get(t.itemId);
        if (mesh) mesh.visible = false;
        this.handleItemPickupProgress(t.itemId);
      }
    } else if (t.type === 'lore' && t.loreId) {
      t.collected = true;
      const mesh = this.world.pickupMeshes.get(t.loreId);
      if (mesh) mesh.visible = false;
      this.discoverLore(t.loreId);
    } else if (t.type === 'door' && t.doorId) {
      this.handleDoorInteraction(t.doorId);
    } else if (t.type === 'hide' && t.hideId) {
      const spot = this.world.hidingSpots.find((h) => h.id === t.hideId);
      if (spot) {
        this.player.isHiding = true;
        this.player.hidingSpotId = spot.id;
        this.player.flashlightOn = false;
        this.stats.timesHidden += 1;
        if (this.stats.timesHidden >= 3) this.unlockAchievement('ach_escondido');
        this.completeSideMission('sm_cri_4');
        gameAudio.playDoorCreak(false);
        this.setSubtitle('Protagonista', `Escondido em ${spot.label}. Fique quieto...`);
      }
    } else if (t.type === 'npc' && t.npcId) {
      this.openNpcDialogue(t.npcId);
    } else if (t.type === 'sign') {
      if (t.id === 'lapide_principal') {
        this.completeObjective('cap8_cemiterio');
        this.discoverLore('lore_cemiterio_1901');
      } else if (t.id === 'placa_tunel') {
        this.completeObjective('cap9_tunel');
        this.completeSideMission('sm_exp_7');
        this.discoverLore('lore_tunel');
      } else if (t.id === 'placa_santa_luzia') {
        this.completeObjective('cap7_santa_luzia');
        this.completeSideMission('sm_exp_8');
      } else if (t.id === 'placa_estacao') {
        this.completeObjective('cap5_estacao');
        this.completeSideMission('sm_mor_8');
      } else if (t.id === 'placa_serra') {
        this.completeObjective('cap11_serra');
        this.completeSideMission('sm_exp_4');
      }
      this.callbacks.current.onShowNotice(t.signTitle || 'Placa', t.signText || '');
    } else if (t.type === 'radio') {
      this.completeObjective('cap2_check_cozinha');
      gameAudio.playViolaNote();
      this.setSubtitle('Rádio da Cozinha', 'Chiado... "Panelas caem sozinhas quando a Primeira Madrugada se aproxima..."');
    } else if (t.type === 'tv') {
      this.tvChannel = (this.tvChannel + 1) % 3;
      const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
      if (this.world.tvScreenMesh) {
        const mat = this.world.tvScreenMesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = this.tvChannel === 0 ? 0.05 : 1.3;
        mat.emissive.setHex(this.tvChannel === 2 ? 0xef4444 : 0x38bdf8);
      }
      if (this.tvChannel === 2 && clk.isThreeAM) {
        this.completeSideMission('sm_esp_2');
        this.setSubtitle('TV Canal 3 (03:00)', '"TRANSMISSÃO DE 1958: FECHE A PORTA AGORA!"');
      } else {
        this.setSubtitle('TV de Tubo', this.tvChannel === 0 ? 'TV desligada.' : `Canal ${this.tvChannel}: Jornal de Minas com chiado.`);
      }
      gameAudio.playUiClick();
    } else if (t.type === 'fridge') {
      this.completeSideMission('sm_vo_4');
      this.addItem('agua_mina');
      this.setSubtitle('Geladeira da Vó', 'Você pegou um cantil gelado de água da serra.');
    } else if (t.type === 'stove') {
      this.completeSideMission('sm_vo_9');
      this.player.hunger = 100;
      this.player.fatigue = Math.max(0, this.player.fatigue - 30);
      gameAudio.playPickup();
      this.setSubtitle('Fogão a Lenha', 'Café passado e comida quentinha! Fome zerada.');
    } else if (t.type === 'faucet') {
      this.completeSideMission('sm_vo_3');
      this.player.hydration = 100;
      gameAudio.playPickup();
      this.setSubtitle('Pia do Banheiro', 'Você bebeu água e fechou a torneira que pingava.');
    } else if (t.type === 'switch' && t.switchLightId) {
      t.activated = !t.activated;
      const light = this.world.interiorLights.get(t.switchLightId);
      if (light) light.intensity = t.activated ? 3.5 : 0;
      gameAudio.playUiClick();
      this.setSubtitle('Interruptor', t.activated ? 'Luz da sala acesa.' : 'Luz da sala apagada (menos visível!).');
    } else if (t.type === 'mirror') {
      this.completeSideMission('sm_vo_6');
      const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
      this.setSubtitle('Espelho', clk.isNight ? 'Por um segundo pareceu ter alguém atrás de você no reflexo!' : 'Seu visual voxel está impecável.');
    } else if (t.type === 'bed') {
      this.completeSideMission('sm_esp_3');
      this.player.fatigue = 0;
      this.player.stamina = this.player.maxStamina;
      this.gameTimeMinutes = (this.gameTimeMinutes + 120) % 1440;
      gameAudio.playPickup();
      this.setSubtitle('Descanso', 'Você tirou um cochilo rápido. Fadiga restaurada!');
    } else if (t.type === 'clock') {
      this.completeSideMission('sm_vo_7');
      const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
      this.setSubtitle('Relógio de Pêndulo', `São ${clk.formatted} — ${clk.moonPhaseLabel}.`);
    } else if (t.type === 'candle') {
      this.completeSideMission('sm_vo_2');
      this.player.fearLevel = Math.max(0, this.player.fearLevel - 40);
      gameAudio.playPickup();
      this.setSubtitle('Vela do Oratório', 'A chama aquece a sala e reduz o medo.');
    } else if (t.type === 'drawer') {
      this.completeSideMission('sm_vo_8');
      this.discoverLore('lore_foto_praca');
    } else if (t.type === 'bike') {
      this.player.onBike = !this.player.onBike;
      this.world.bikeGroup.visible = !this.player.onBike;
      if (this.player.onBike) {
        this.completeSideMission('sm_mor_10');
        this.unlockAchievement('ach_bike');
      } else {
        this.world.bikeGroup.position.set(this.player.x, this.player.y, this.player.z);
      }
      gameAudio.playUiClick();
      this.setSubtitle('Bicicleta do Tião', this.player.onBike ? 'Subiu na bicicleta! Velocidade aumentada.' : 'Desceu da bicicleta.');
    } else if (t.type === 'minigame' && t.minigameId) {
      this.setDialogueOpen(true);
      this.callbacks.current.onOpenMinigame(t.minigameId);
    } else if (t.type === 'puzzle') {
      this.handlePuzzleInteraction(t.puzzleId || '');
    }
    this.pushHudNow();
  }

  private handleItemPickupProgress(itemId: string): void {
    if (itemId === 'lanterna') {
      this.player.flashlightOn = true;
      this.completeObjective('cap1_get_lanterna');
      this.unlockAchievement('ach_luz');
    } else if (itemId === 'milho_bento') {
      this.completeObjective('cap3_find_milho');
    } else if (itemId === 'chave_celeiro') {
      this.completeObjective('cap3_chave_celeiro');
      this.unlockAchievement('ach_galinha');
    } else if (itemId === 'diario_vizinho') {
      this.completeObjective('cap4_casa_vizinho');
    } else if (itemId === 'fumo_saci') {
      this.completeObjective('cap4_mercadinho');
    } else if (itemId === 'chave_igreja') {
      this.completeObjective('cap7_sitio');
    } else if (itemId === 'chave_hospital') {
      this.completeObjective('cap10_chave_hosp');
    } else if (itemId === 'chave_mina') {
      this.completeObjective('cap11_primeiro');
    } else if (itemId === 'selo_primeira_madrugada' || itemId === 'cartao_complexo') {
      if (this.hasItem('selo_primeira_madrugada') && this.hasItem('cartao_complexo')) {
        this.completeObjective('cap12_mina');
      }
    } else if (itemId === 'disco_1958') {
      this.completeObjective('cap13_complexo');
    } else if (itemId === 'cafe_coado') {
      this.completeObjective('cap14_celeiro');
    } else if (itemId === 'cruz_madeira') {
      this.completeObjective('cap14_igreja');
    } else if (itemId === 'pao_de_queijo') {
      this.completeSideMission('sm_vo_1');
    }
  }

  private handleDoorInteraction(doorId: string): void {
    const door = this.world.doors.find((d) => d.id === doorId);
    if (!door) return;

    if (door.locked) {
      if (door.requiredItemId && this.hasItem(door.requiredItemId)) {
        door.locked = false;
        this.setSubtitle('Protagonista', `Destranquei ${door.label}!`);
      } else {
        gameAudio.playWoodCreak();
        this.setSubtitle('Protagonista', `${door.label} está trancada! Preciso da chave certa.`);
        return;
      }
    }

    const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
    if (door.isGrandmaFrontDoor && clk.isThreeAM && !door.isOpen && this.chapter >= 14 && !this.freeExploreAfterCampaign) {
      this.unlockAchievement('ach_curioso');
      gameAudio.playSpookySting();
      this.triggerEnding('porta_das_tres');
      return;
    }

    door.isOpen = !door.isOpen;
    door.targetAngle = door.isOpen ? Math.PI * 0.48 : 0;
    const col = this.world.colliders.find((c) => c.doorId === door.id);
    if (col) col.active = !door.isOpen;
    this.stats.doorsOpened += 1;
    this.rebuildNavGrid();
    gameAudio.playDoorCreak(door.isOpen);
  }

  private handlePuzzleInteraction(puzzleId: string): void {
    if (puzzleId === 'inspect_lake') {
      this.completeObjective('cap6_lago');
      this.discoverLore('lore_pescadores');
      gameAudio.playFrogCroak();
    } else if (puzzleId === 'inspect_represa') {
      this.completeObjective('cap6_represa');
      this.discoverLore('lore_1987_represa');
    } else if (puzzleId === 'secret_ending_coffee') {
      if (this.hasItem('cafe_coado') && this.hasItem('milho_bento') && this.chapter >= 14) {
        this.unlockAchievement('ach_final_secreto');
        this.triggerEnding('cafe_com_saci');
      } else {
        this.setSubtitle('Coreto', 'Falta Café Coado (do Celeiro) e Milho Dourado para o pacto!');
      }
    }
  }

  private openNpcDialogue(npcId: string): void {
    const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
    const invIds = new Set(this.inventory.map((i) => i.id));
    const lineId = selectNpcDialogue({
      npcId,
      chapter: this.chapter,
      hour24: clk.hour24,
      weather: this.weather,
      reputation: this.npcReputation[npcId] ?? 20,
      completedObjectives: this.completedObjectives,
      seenDialogueIds: this.seenDialogueIds,
      inventoryIds: invIds,
    });
    this.seenDialogueIds.add(`${npcId}_${lineId}`);
    this.setDialogueOpen(true);
    this.callbacks.current.onOpenDialogue(npcId, lineId);
  }

  public executeDialogueAction(action: string, npcId?: string, repDelta = 0): void {
    if (npcId && repDelta !== 0) {
      this.npcReputation[npcId] = (this.npcReputation[npcId] ?? 20) + repDelta;
    }

    if (action === 'complete_cap1_vo') {
      this.completeObjective('cap1_talk_vo');
      this.unlockAchievement('ach_chegada');
    } else if (action === 'complete_cap1_vizinho') {
      this.completeObjective('cap1_visit_praca');
    } else if (action === 'complete_cap2_vo') {
      this.completeObjective('cap2_talk_vo_regra');
    } else if (action === 'give_fumo_saci') {
      if (this.hasItem('fumo_saci')) {
        gameAudio.playSaciWhistle();
        this.completeObjective('cap5_meet_saci');
        this.completeSideMission('sm_cri_2');
        this.unlockAchievement('ach_saci');
      } else {
        this.setSubtitle('Saci Pererê', 'Cê nem tem fumo do Tião! Passa no Mercadinho primeiro!');
      }
    } else if (action === 'complete_cap5_saci') {
      this.completeObjective('cap5_meet_saci');
    } else if (action === 'gift_broa') {
      this.addItem('broa_fuba');
      this.completeSideMission('sm_mor_6');
    } else if (action.startsWith('start_minigame_')) {
      const mId = action.replace('start_minigame_', '') as MinigameId;
      this.setDialogueOpen(true);
      this.callbacks.current.onOpenMinigame(mId);
    } else if (action === 'ending_good') {
      this.unlockAchievement('ach_final_bom');
      this.triggerEnding('amanhecer_santa_batata');
    } else if (action === 'ending_secret') {
      this.unlockAchievement('ach_final_secreto');
      this.triggerEnding('cafe_com_saci');
    } else if (action === 'ending_true') {
      if (this.hasItem('disco_1958') && this.hasItem('selo_primeira_madrugada') && this.hasItem('cruz_madeira')) {
        this.unlockAchievement('ach_final_verdadeiro');
        this.triggerEnding('segredo_primeira_madrugada');
      } else {
        this.setSubtitle('Vó Maria', 'Ainda faltam a Fita de 1958, o Selo da Mina ou a Cruz de Ipê!');
      }
    }
  }

  public completeObjective(objId: string): void {
    if (this.completedObjectives.has(objId)) return;
    this.completedObjectives.add(objId);

    const chDef = getChapterByNumber(this.chapter);
    const allDone = chDef.objectives.every((o) => this.completedObjectives.has(o.id));
    if (allDone && this.chapter < 15) {
      this.chapter = (this.chapter + 1) as ChapterNumber;
      const nextDef = getChapterByNumber(this.chapter);
      gameAudio.playPickup();
      this.setSubtitle('Campanha', `${nextDef.title} — ${nextDef.subtitle}`);
    }
    this.syncProgressCallback();
  }

  private triggerEnding(ending: EndingType): void {
    const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
    this.setGameState('gameover');
    this.callbacks.current.onGameOver(ending, {
      chapter: this.chapter,
      time: clk.formatted,
      itemsCount: this.inventory.length,
      loreCount: this.discoveredLore.size,
    });
  }

  private setSubtitle(speaker: string, text: string, duration = 4.6): void {
    if (!this.graphics.subtitlesEnabled) return;
    this.currentSubtitle = { speaker, text };
    this.subtitleTimer = duration;
  }

  private isIndoors(): boolean {
    const x = this.player.x;
    const z = this.player.z;
    const inGrandma = Math.abs(x) < 6 && Math.abs(z) < 5;
    const inHospital = x > 18 && x < 30 && z < -69 && z > -79;
    const inComplex = x > 66 && x < 78 && z > 62 && z < 74;
    return inGrandma || inHospital || inComplex;
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTimeMs) / 1000;
    this.lastTimeMs = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.fpsAvg = THREE.MathUtils.lerp(this.fpsAvg, 1 / Math.max(0.001, rawDt), 0.08);

    this.updateScene(dt, now * 0.001);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateScene(dt: number, elapsed: number): void {
    this.palette.windUniform.value = elapsed;

    // 24h Day/Night clock advance (wrap 1440 -> dayNumber++)
    if (this.gameState === 'playing' && !this.dialogueOpen) {
      this.gameTimeMinutes += dt * 1.4;
      if (this.gameTimeMinutes >= 1440) {
        this.gameTimeMinutes -= 1440;
        this.dayNumber += 1;
        this.stats.daysSurvived += 1;
      }

      // Dynamic Weather shifts
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 85 + Math.random() * 60;
        const clkTmp = formatGameClock(this.gameTimeMinutes, this.dayNumber);
        this.weather = pickNextWeather(this.weather, clkTmp.hour24, Math.random());
        if (this.weather === 'tempestade') {
          this.completeSideMission('sm_esp_4');
        }
      }
    }

    const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
    if (clk.isThreeAM && !this.clockThreeChimed && this.gameState === 'playing') {
      this.clockThreeChimed = true;
      gameAudio.playClockThreeAM();
      this.trauma = 0.45;
      this.unlockAchievement('ach_regra3');
      this.setSubtitle('Relógio', 'DONG... DONG... DONG... Deu 3 da manhã! NÃO abra a porta da frente!', 6.0);
    }
    if (!clk.isThreeAM) this.clockThreeChimed = false;

    // 24h Sky color & sun light curve
    const hourFloat = clk.hour24 + clk.minute / 60;
    let nightBlend = 0;
    if (hourFloat >= 19 || hourFloat < 5) nightBlend = 1;
    else if (hourFloat >= 17 && hourFloat < 19) nightBlend = (hourFloat - 17) / 2;
    else if (hourFloat >= 5 && hourFloat < 7) nightBlend = 1 - (hourFloat - 5) / 2;

    if (clk.isThreeAM) {
      _skyCurr.copy(_skyNight).lerp(_skyThree, 0.72);
    } else if (hourFloat >= 17 && hourFloat < 19.5) {
      _skyCurr.copy(_skySunset).lerp(_skyNight, nightBlend);
    } else {
      _skyCurr.copy(_skyDay).lerp(_skyNight, nightBlend);
    }

    // Lightning flash during storm
    const isRaining = this.weather === 'chuva' || this.weather === 'tempestade';
    if (this.weather === 'tempestade' && this.gameState === 'playing') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 11 + Math.random() * 14;
        this.lightningFlash = 1.0;
        gameAudio.playThunder();
      }
    }
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.5);
    if (this.lightningFlash > 0.05) {
      _skyCurr.lerp(new THREE.Color(0xe0f2fe), this.lightningFlash * 0.65);
    }

    (this.scene.background as THREE.Color).copy(_skyCurr);
    this.fog.color.copy(_skyCurr);
    const weatherFog = this.weather === 'neblina' ? 0.012 : isRaining ? 0.007 : 0;
    this.fog.density = 0.009 + nightBlend * 0.014 + weatherFog + (clk.isThreeAM ? 0.007 : 0);

    this.sunLight.intensity = THREE.MathUtils.lerp(1.5, 0.3, nightBlend) + this.lightningFlash * 2.2;
    this.sunLight.color.setHex(nightBlend > 0.6 ? 0x7c97c9 : 0xffdfb0);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.76, 0.28, nightBlend);

    // Street lamps + Puddles
    const lampFlicker = clk.isThreeAM && Math.sin(elapsed * 23) > 0.88 ? 0.25 : 1.0;
    this.world.lampLights.forEach((pl, idx) => {
      pl.intensity = (1.0 + nightBlend * 5.2) * (idx === 0 ? lampFlicker : 1);
    });
    this.world.puddleMeshes.forEach((p) => {
      p.visible = isRaining;
    });

    // Water & Doors & Pickups
    this.world.waterMesh.position.y = -0.25 + Math.sin(elapsed * 1.4) * 0.03;
    this.world.doors.forEach((door) => {
      door.angle = THREE.MathUtils.damp(door.angle, door.targetAngle, 8, dt);
      const pivot = this.world.doorMeshes.get(door.id);
      if (pivot) pivot.rotation.y = door.angle;
    });
    this.world.pickupMeshes.forEach((mesh, idxName) => {
      if (mesh.visible) {
        mesh.rotation.y += dt * 1.5;
        mesh.position.y += Math.sin(elapsed * 3 + idxName.length) * 0.0008;
      }
    });

    // Fireflies
    for (let i = 0; i < this.particleCount; i++) {
      const ix = i * 3;
      this.particlePositions[ix + 1] += Math.sin(elapsed * 1.5 + i) * 0.15 * dt;
      _dummy.position.set(
        this.particlePositions[ix] + Math.sin(elapsed * 0.5 + i) * 0.5,
        this.particlePositions[ix + 1],
        this.particlePositions[ix + 2] + Math.cos(elapsed * 0.5 + i) * 0.5,
      );
      const s = nightBlend > 0.3 && !isRaining ? 0.8 + Math.sin(elapsed * 4 + i) * 0.4 : 0.01;
      _dummy.scale.setScalar(Math.max(0.01, s));
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;

    // Rain Particles centered around camera
    this.rainMesh.visible = isRaining && !this.isIndoors();
    if (this.rainMesh.visible) {
      for (let i = 0; i < this.rainCount; i++) {
        const ix = i * 3;
        this.rainPositions[ix + 1] -= 18 * dt;
        if (this.rainPositions[ix + 1] < 0) this.rainPositions[ix + 1] = 13 + Math.random() * 2;
        _dummy.position.set(
          this.player.x + this.rainPositions[ix],
          this.player.y + this.rainPositions[ix + 1],
          this.player.z + this.rainPositions[ix + 2],
        );
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        this.rainMesh.setMatrixAt(i, _dummy.matrix);
      }
      this.rainMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.gameState === 'title') {
      const angle = elapsed * 0.14;
      this.camera.position.set(Math.sin(angle) * 24, 9.5 + Math.sin(elapsed * 0.3) * 1.2, -18 + Math.cos(angle) * 18);
      this.camera.lookAt(0, 2.2, -10);
      this.flashlight.intensity = 0;
      return;
    }

    if (this.gameState !== 'playing') return;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (!this.dialogueOpen) {
      this.updatePlayerMovement(dt, clk.isThreeAM);
      this.updateNpcs(dt, clk.hour24);
      this.updateCreatures(dt, clk.isNight, clk.isThreeAM, clk.hour24, elapsed);
      this.updateRandomEvents(dt, clk.isNight);
    }

    if (this.disturbanceTimer > 0) {
      this.disturbanceTimer -= dt;
      if (this.disturbanceTimer <= 0) this.disturbancePos = null;
    }
    if (this.subtitleTimer > 0) {
      this.subtitleTimer -= dt;
      if (this.subtitleTimer <= 0) this.currentSubtitle = null;
    }

    const flick = clk.isThreeAM && Math.sin(elapsed * 37) > 0.94 ? 0.3 : 1.0;
    this.flashlight.intensity = this.player.flashlightOn && !this.player.isHiding ? 19 * flick : 0;
    this.trauma = Math.max(0, this.trauma - dt * 1.4);

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.1) {
      this.hudSyncTimer = 0;
      this.pushHudNow();
    }
  }

  private updatePlayerMovement(dt: number, isThreeAM: boolean): void {
    if (this.touchInput.lookDeltaX !== 0 || this.touchInput.lookDeltaY !== 0) {
      const sens = 0.004 * this.graphics.mouseSensitivity;
      this.player.yaw -= this.touchInput.lookDeltaX * sens;
      this.player.pitch = THREE.MathUtils.clamp(this.player.pitch - this.touchInput.lookDeltaY * sens, -1.35, 1.35);
      this.touchInput.lookDeltaX = 0;
      this.touchInput.lookDeltaY = 0;
    }

    if (this.player.isHiding) {
      const spot = this.world.hidingSpots.find((h) => h.id === this.player.hidingSpotId);
      if (spot) {
        this.camera.position.set(spot.x, spot.y + 0.3, spot.z);
        this.camera.rotation.set(this.player.pitch * 0.4, this.player.yaw, 0, 'YXZ');
      }
      this.player.noiseLevel = 0;
      this.updateInteractableScan();
      return;
    }

    let forward = 0;
    let strafe = 0;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) forward += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) forward -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) strafe += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) strafe -= 1;
    forward += this.touchInput.moveY;
    strafe += this.touchInput.moveX;

    const len = Math.hypot(forward, strafe);
    const isMoving = len > 0.08;
    if (len > 1) {
      forward /= len;
      strafe /= len;
    }

    const crouchHeld =
      !this.player.onBike &&
      (this.player.isCrouching ||
        this.touchInput.crouch ||
        this.keysHeld.has('ControlLeft') ||
        this.keysHeld.has('ControlRight'));

    const wantsSprint =
      !crouchHeld &&
      (this.keysHeld.has('ShiftLeft') || this.keysHeld.has('ShiftRight') || this.touchInput.sprint);

    const sprinting = updateStamina(this.player, wantsSprint, isMoving, dt);
    const baseSpeed = this.player.onBike
      ? BIKE_SPEED
      : crouchHeld
        ? CROUCH_SPEED
        : sprinting
          ? SPRINT_SPEED
          : WALK_SPEED;
    const speed = this.player.fatigue > 80 ? baseSpeed * 0.82 : baseSpeed;

    // Update vitals slowly
    this.player.fatigue = Math.min(100, this.player.fatigue + dt * (sprinting ? 0.5 : 0.15));
    this.player.hunger = Math.max(0, this.player.hunger - dt * 0.12);
    this.player.hydration = Math.max(0, this.player.hydration - dt * (sprinting ? 0.25 : 0.14));

    const sinY = Math.sin(this.player.yaw);
    const cosY = Math.cos(this.player.yaw);
    const moveX = (-sinY * forward + cosY * strafe) * speed * dt;
    const moveZ = (-cosY * forward - sinY * strafe) * speed * dt;

    const playerHeight = crouchHeld ? PLAYER_HEIGHT_CROUCH : PLAYER_HEIGHT_STAND;
    const resolved = resolveEntityCollisions(
      this.player.x + moveX,
      this.player.z + moveZ,
      this.player.y,
      playerHeight,
      this.world.colliders,
    );

    const distMoved = Math.hypot(resolved.x - this.player.x, resolved.z - this.player.z);
    this.player.x = resolved.x;
    this.player.z = resolved.z;
    this.player.stepsWalked += distMoved;
    this.stats.distanceWalkedMeters += distMoved;

    // Noise calculation for AI hearing
    const targetNoise = !isMoving ? 4 : crouchHeld ? 16 : sprinting || this.player.onBike ? 82 : 42;
    this.player.noiseLevel = THREE.MathUtils.lerp(this.player.noiseLevel, targetNoise, dt * 6);

    // Pushable props collision + AI noise trigger
    const pushed = updatePushableProps(
      this.world.pushProps,
      this.player.x,
      this.player.y,
      this.player.z,
      0.36,
      this.world.colliders,
      dt,
    );
    if (pushed) {
      this.disturbancePos = { x: this.player.x, z: this.player.z };
      this.disturbanceTimer = 6.0;
      this.completeSideMission('sm_cri_9');
    }
    this.world.pushProps.forEach((p) => {
      const m = this.world.pushPropMeshes.get(p.id);
      if (m) m.position.set(p.x, p.y, p.z);
    });

    // Discover Regions
    const reg = getRegionAt(this.player.x, this.player.z);
    if (!this.discoveredRegions.has(reg.id)) {
      this.discoveredRegions.add(reg.id);
      this.setSubtitle('Nova Região Descoberta', `${reg.name} — ${reg.subtitle}`);
      if (reg.id === 'estrada_velha') this.completeSideMission('sm_exp_1');
      if (this.discoveredRegions.size >= 12) this.unlockAchievement('ach_atlas');
      if (this.discoveredRegions.size >= 18) {
        this.unlockAchievement('ach_turista18');
        this.completeSideMission('sm_exp_10');
      }
      this.syncProgressCallback();
    }
    if (reg.id === 'hospital_abandonado' && this.player.y > 2.5) {
      this.completeSideMission('sm_exp_2');
    }
    if (reg.id === 'estacao_ferroviaria' && this.player.y > 0.4) {
      this.completeSideMission('sm_exp_3');
    }
    if (reg.id === 'represa' && this.player.y > 2.0) {
      this.completeSideMission('sm_exp_5');
    }
    if (reg.id === 'mina_desativada' && isThreeAM) {
      this.completeSideMission('sm_cri_10');
    }

    // Footsteps
    if (this.player.isGrounded && distMoved > 0.005) {
      this.footstepAccum += distMoved;
      const stride = sprinting ? 1.55 : 1.9;
      if (this.footstepAccum >= stride) {
        this.footstepAccum = 0;
        const surf =
          reg.ambienceType === 'agua' && this.player.y < 0.05
            ? 'water'
            : reg.ambienceType === 'subterraneo'
              ? 'stone'
              : this.isIndoors()
                ? 'wood'
                : reg.ambienceType === 'estrada'
                  ? 'dirt'
                  : 'grass';
        gameAudio.playFootstep(surf, sprinting);
      }
    }

    // Jump + Stairs/Ramps/Ladders Gravity
    if (this.player.isGrounded) this.coyoteTimer = 0.1;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      if (this.coyoteTimer > 0) {
        this.player.vy = JUMP_VELOCITY;
        this.player.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
      }
    }

    this.player.vy -= GRAVITY * dt;
    this.player.y += this.player.vy * dt;
    const floorY = supportHeightAt(this.player.x, this.player.z, this.player.y, this.world.colliders);
    if (this.player.y <= floorY) {
      this.player.y = floorY;
      this.player.vy = 0;
      this.player.isGrounded = true;
    } else {
      this.player.isGrounded = false;
    }

    const targetEye = (crouchHeld ? PLAYER_EYE_CROUCH : PLAYER_EYE_STAND) + (this.player.onBike ? 0.35 : 0);
    const bob =
      this.player.isGrounded && isMoving
        ? Math.sin(this.player.stepsWalked * 2.6) * (sprinting ? 0.07 : 0.04)
        : 0;
    const shake = this.graphics.cameraShake ? this.trauma * this.trauma * 0.12 : 0;
    const shakeX = shake > 0.001 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0.001 ? (Math.random() - 0.5) * shake : 0;

    this.camera.position.set(this.player.x + shakeX, this.player.y + targetEye + bob + shakeY, this.player.z);
    this.camera.rotation.set(this.player.pitch + shakeX * 0.4, this.player.yaw + shakeY * 0.4, 0, 'YXZ');

    this.updateInteractableScan();
  }

  private updateInteractableScan(): void {
    let best: InteractableTarget | null = null;
    let bestScore = Infinity;

    _vec3A.set(0, 0, -1).applyEuler(this.camera.rotation).normalize();
    for (const item of this.world.interactables) {
      if (item.collected) continue;
      // Sync NPC interactable coords dynamically!
      if (item.npcId) {
        const npc = this.npcs.find((n) => n.id === item.npcId);
        if (npc) {
          item.x = npc.x;
          item.y = npc.y + 1.2;
          item.z = npc.z;
        }
      }
      const dx = item.x - this.player.x;
      const dz = item.z - this.player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > item.radius) continue;
      _vec3B.set(dx, item.y - this.camera.position.y, dz).normalize();
      const dot = _vec3A.dot(_vec3B);
      if (dot < 0.25 && dist > 1.35) continue;
      const score = dist - dot * 0.8;
      if (score < bestScore) {
        bestScore = score;
        best = item;
      }
    }
    this.activeTarget = best;
  }

  private updateNpcs(dt: number, hour24: number): void {
    updateNpcRoutines(this.npcs, hour24, this.weather, this.world.colliders, dt);
    for (const n of this.npcs) {
      const grp = this.world.npcGroups[n.id as keyof BuiltWorld['npcGroups']];
      if (grp) {
        grp.position.set(n.x, n.y, n.z);
        grp.rotation.y = n.yaw;
      }
    }
  }

  private updateCreatures(
    dt: number,
    isNight: boolean,
    isThreeAM: boolean,
    hour24: number,
    elapsed: number,
  ): void {
    const hasCorn = this.hasItem('milho_bento');
    const hasAmulet = this.hasItem('amuleto_ipe');
    let maxThreat = 0;

    for (const c of this.creatures) {
      const res = updateCreatureAI(
        c,
        {
          player: this.player,
          isNight,
          isThreeAM,
          hour24,
          hasCornDistraction: hasCorn,
          hasAmulet,
          disturbancePos: this.disturbancePos,
          colliders: this.world.colliders,
          navGrid: this.navGrid,
        },
        dt,
        elapsed,
      );

      const grp = this.world.creatureGroups[c.type];
      if (grp) {
        let hopY = 0;
        if (c.type === 'saci') hopY = Math.abs(Math.sin(elapsed * 8)) * 0.35;
        else if (c.type === 'galinha') {
          hopY = c.mode === 'perseguindo' ? Math.abs(Math.sin(elapsed * 16)) * 0.18 : 0;
          const wingL = grp.getObjectByName('wingL');
          const wingR = grp.getObjectByName('wingR');
          if (wingL && wingR) {
            const flap = c.mode === 'perseguindo' || c.mode === 'suspeitando' ? Math.sin(elapsed * 22) * 0.6 : 0;
            wingL.rotation.z = flap;
            wingR.rotation.z = -flap;
          }
        } else if (c.mode === 'perseguindo' || c.mode === 'suspeitando') {
          hopY = Math.abs(Math.sin(elapsed * 10)) * 0.12;
        }
        grp.position.set(c.x, c.y + hopY, c.z);
        grp.rotation.y = c.yaw;
        grp.visible = c.mode !== 'dormindo';
      }

      const dist = Math.hypot(this.player.x - c.x, this.player.z - c.z);
      if (c.mode === 'perseguindo') maxThreat = Math.max(maxThreat, 1);
      else if (c.mode === 'suspeitando' || c.mode === 'investigando') maxThreat = Math.max(maxThreat, 0.55);
      else if (dist < 18 && isNight && c.mode !== 'dormindo') maxThreat = Math.max(maxThreat, 1 - dist / 18);

      if (res.triggeredLaugh) {
        gameAudio.playChickenSquawk();
        this.setSubtitle('Galinha Gertrudes', 'CÓ-CÓ-CÓÓÓ! (Ela notou você!)');
      }
      if (res.triggeredSteal) {
        gameAudio.playSaciWhistle();
        this.setSubtitle('Saci Pererê', 'Fiu-fiu! Quase roubei seu boné, bobão!');
      }
      if (res.triggeredKnockDoor) {
        gameAudio.playDoorKnock();
        this.setSubtitle('Batida na Porta', `${c.name} bateu com força na porta fechada!`);
      }
      if (res.caughtPlayer && !this.freeExploreAfterCampaign) {
        this.stats.deathsCount += 1;
        this.hitstopTimer = 0.06;
        this.trauma = 0.9;
        gameAudio.playSpookySting();
        this.triggerEnding(c.type === 'galinha' ? 'bicado_pela_galinha' : 'pego_homem_do_saco');
        return;
      }
    }

    this.player.fearLevel = THREE.MathUtils.lerp(this.player.fearLevel, maxThreat * 100, dt * 2.5);
    const reg = getRegionAt(this.player.x, this.player.z);
    gameAudio.setWorldState(true, isNight, maxThreat, reg.ambienceType, this.weather, this.isIndoors());
  }

  private updateRandomEvents(dt: number, isNight: boolean): void {
    this.randomEventTimer -= dt;
    if (this.randomEventTimer > 0) return;
    this.randomEventTimer = isNight ? 14 + Math.random() * 12 : 22 + Math.random() * 14;

    const ev = pickSpecialEvent(this.player.x, this.player.z, isNight, Math.random());
    if (!this.currentSubtitle) {
      this.setSubtitle(ev.title, ev.subtitle, 4.2);
    }
    if (ev.sound === 'wood') gameAudio.playWoodCreak();
    else if (ev.sound === 'viola') gameAudio.playViolaNote();
    else if (ev.sound === 'thunder') gameAudio.playThunder();
    else if (ev.sound === 'chicken') gameAudio.playChickenSquawk();
    else if (ev.sound === 'saci') gameAudio.playSaciWhistle();
    else if (ev.sound === 'spooky') gameAudio.playSpookySting();
    else gameAudio.playCricketChirp();
  }

  public pushHudNow(): void {
    const clk = formatGameClock(this.gameTimeMinutes, this.dayNumber);
    const chDef = getChapterByNumber(this.chapter);
    const nextObj = chDef.objectives.find((o) => !this.completedObjectives.has(o.id)) ?? chDef.objectives[0];
    const chaser = this.creatures.find((c) => c.mode === 'perseguindo');
    const suspecter = this.creatures.find((c) => c.mode === 'suspeitando' || c.mode === 'investigando');
    const region = getRegionAt(this.player.x, this.player.z);

    let prompt = this.activeTarget?.prompt ?? null;
    if (this.player.isHiding) prompt = '[E] Sair do Esconderijo';

    const yawDeg = ((((-this.player.yaw * 180) / Math.PI) % 360) + 360) % 360;

    const minimapEntities: HudSnapshot['minimapEntities'] = [
      { kind: 'player', x: this.player.x, z: this.player.z, label: 'Você' },
      ...this.npcs.map((n) => ({ kind: 'npc' as const, x: n.x, z: n.z, label: n.name })),
      ...this.creatures
        .filter((c) => c.mode !== 'dormindo')
        .map((c) => ({ kind: 'creature' as const, x: c.x, z: c.z, label: c.name })),
    ];
    if (this.waypoint) {
      minimapEntities.push({ kind: 'waypoint', x: this.waypoint.x, z: this.waypoint.z, label: this.waypoint.label });
    }

    this.callbacks.current.onHudUpdate({
      gameTimeFormatted: clk.formatted,
      dayNumber: this.dayNumber,
      periodLabel: clk.periodLabel,
      moonPhaseLabel: clk.moonPhaseLabel,
      weather: this.weather,
      isThreeAM: clk.isThreeAM,
      isNight: clk.isNight,
      chapter: this.chapter,
      chapterTitle: chDef.title,
      currentObjective: nextObj?.title ?? 'Decidir o destino de Santa Batata',
      regionId: region.id,
      locationName: region.name,
      coords: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y * 10) / 10,
        z: Math.round(this.player.z),
      },
      yawDeg: Math.round(yawDeg),
      stamina: Math.round(this.player.stamina),
      maxStamina: this.player.maxStamina,
      fatigue: Math.round(this.player.fatigue),
      hunger: Math.round(this.player.hunger),
      hydration: Math.round(this.player.hydration),
      fearLevel: Math.round(this.player.fearLevel),
      isCrouching: this.player.isCrouching,
      isHiding: this.player.isHiding,
      onBike: this.player.onBike,
      flashlightOn: this.player.flashlightOn,
      isIndoors: this.isIndoors(),
      chasedBy: chaser ? chaser.name : null,
      suspiciousBy: suspecter ? suspecter.name : null,
      interactPrompt: prompt,
      subtitle: this.currentSubtitle,
      minimapEntities,
      diagnostics: this.graphics.showDiagnostics
        ? {
            fps: Math.round(this.fpsAvg),
            activeColliders: this.world.colliders.filter((c) => c.active !== false).length,
            region: region.id,
            creatureModes: this.creatures.map((c) => `${c.type}:${c.mode}`).join(' | '),
          }
        : undefined,
    });
  }
}
