export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type GraphicsQuality = 'baixo' | 'medio' | 'alto';

export type SaveSlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';

export type RegionId =
  | 'santa_batata'
  | 'estrada_velha'
  | 'fazenda_boa_esperanca'
  | 'floresta_esquecimento'
  | 'sitio_alves'
  | 'cemiterio_municipal'
  | 'bairro_abandonado'
  | 'mina_desativada'
  | 'represa'
  | 'serra_silencio'
  | 'vila_pescadores'
  | 'fazenda_santa_luzia'
  | 'tunel_antigo'
  | 'hospital_abandonado'
  | 'estacao_ferroviaria'
  | 'igreja_velha'
  | 'casa_primeiro_morador'
  | 'complexo_subterraneo';

export type WeatherType = 'limpo' | 'neblina' | 'chuva' | 'tempestade' | 'ventania';

export type EndingType =
  | 'amanhecer_santa_batata'
  | 'cafe_com_saci'
  | 'porta_das_tres'
  | 'segredo_primeira_madrugada'
  | 'pego_homem_do_saco'
  | 'bicado_pela_galinha';

export interface CustomizationConfig {
  shirtColor: string;
  shirtStyle: 'camiseta' | 'xadrez' | 'jaqueta' | 'regata';
  bottomStyle: 'calca' | 'bermuda';
  pantsColor: string;
  shoeStyle: 'tenis' | 'bota';
  shoeColor: string;
  capStyle: 'nenhum' | 'aba_reta' | 'palha' | 'gorro' | 'vaqueiro';
  capColor: string;
  hairStyle: 'curto' | 'moicano' | 'cacheado' | 'longo' | 'careca';
  hairColor: string;
  skinTone: string;
  glasses: 'nenhum' | 'escuros' | 'grau';
  backpack: 'nenhum' | 'viagem' | 'escolar';
  watch: 'nenhum' | 'dourado' | 'digital';
  accessory: 'nenhum' | 'fone' | 'cordao' | 'lenco';
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  muted: boolean;
}

export interface GraphicsSettings {
  quality: GraphicsQuality;
  renderDistance: number; // 55 to 140
  mouseSensitivity: number; // 0.3 to 2.0
  cameraShake: boolean;
  subtitlesEnabled: boolean;
  showMinimap: boolean;
  showDiagnostics: boolean;
  touchControlsMode: 'auto' | 'sempre' | 'desligado';
}

export type ItemCategory =
  | 'chave'
  | 'ferramenta'
  | 'comida'
  | 'bebida'
  | 'documento'
  | 'missao'
  | 'raro'
  | 'secreto';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string;
  quantity: number;
  usable?: boolean;
  rare?: boolean;
}

export type ChapterNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export interface ChapterObjective {
  id: string;
  title: string;
  description: string;
  locationHint: string;
  regionId: RegionId;
  completed: boolean;
}

export interface ChapterDefinition {
  number: ChapterNumber;
  title: string;
  subtitle: string;
  synopsis: string;
  climax: string;
  targetHour: number;
  objectives: Omit<ChapterObjective, 'completed'>[];
}

export interface SideMission {
  id: string;
  title: string;
  giver: string;
  category: 'avo' | 'moradores' | 'criaturas' | 'exploracao' | 'especiais';
  regionId: RegionId;
  description: string;
  rewardText: string;
  requiredItemId?: string;
  minigameTrigger?: MinigameId;
}

export interface LoreEntry {
  id: string;
  title: string;
  year: string;
  kind: 'documento' | 'fotografia' | 'carta' | 'jornal' | 'gravacao' | 'relatorio' | 'mapa';
  regionId: RegionId;
  summary: string;
  content: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  secret?: boolean;
}

export type MinigameId = 'pesca' | 'cartas' | 'memoria' | 'enigma_radio' | 'caca_tesouro';

export interface DialogueChoice {
  label: string;
  nextId?: string;
  action?: string;
  reputationDelta?: number;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  role: string;
  text: string;
  choices?: DialogueChoice[];
  nextId?: string;
  comedyTone?: boolean;
  reputationMin?: number;
}

export interface ColliderBox {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  isDoor?: boolean;
  doorId?: string;
  isRamp?: boolean;
  rampAxis?: 'x' | 'z';
  rampDir?: 1 | -1; // +1 means maxY is at maxAxis
  isLadder?: boolean;
  isWindow?: boolean;
  active?: boolean;
}

export interface DoorState {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  isOpen: boolean;
  locked?: boolean;
  requiredItemId?: string;
  isGrandmaFrontDoor?: boolean;
  isSecretPassage?: boolean;
  angle: number;
  targetAngle: number;
}

export interface HidingSpot {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  exitX: number;
  exitZ: number;
  locationName: string;
}

export interface PushableProp {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  halfW: number;
  halfH: number;
  halfD: number;
  mass: number;
  knocked: boolean;
}

export type CreatureType =
  | 'galinha'
  | 'saci'
  | 'homem_do_saco'
  | 'criatura_floresta'
  | 'mula_sem_cabeca';

export type CreatureBehaviorMode =
  | 'dormindo'
  | 'patrulhando'
  | 'explorando'
  | 'investigando'
  | 'suspeitando'
  | 'perseguindo'
  | 'procurando'
  | 'desistindo'
  | 'retornando'
  | 'interagindo';

export interface CreatureState {
  id: string;
  type: CreatureType;
  name: string;
  x: number;
  y: number;
  z: number;
  homeX: number;
  homeZ: number;
  yaw: number;
  speed: number;
  radius: number;
  mode: CreatureBehaviorMode;
  modeTimer: number;
  windupTimer: number;
  suspicion: number; // 0..100
  lastKnownX: number | null;
  lastKnownZ: number | null;
  path: Array<{ x: number; z: number }>;
  pathRecalcTimer: number;
  active: boolean;
  reactionCooldown: number;
}

export interface NpcState {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  homeX: number;
  homeZ: number;
  workX: number;
  workZ: number;
  plazaX: number;
  plazaZ: number;
  routineLabel: string;
  reputation: number;
  sleeping: boolean;
}

export interface InteractableTarget {
  id: string;
  type:
    | 'npc'
    | 'door'
    | 'item'
    | 'hide'
    | 'sign'
    | 'radio'
    | 'tv'
    | 'fridge'
    | 'stove'
    | 'faucet'
    | 'switch'
    | 'drawer'
    | 'mirror'
    | 'bed'
    | 'clock'
    | 'candle'
    | 'lore'
    | 'minigame'
    | 'puzzle'
    | 'crop'
    | 'shop'
    | 'bike';
  label: string;
  prompt: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  itemId?: string;
  loreId?: string;
  npcId?: string;
  doorId?: string;
  hideId?: string;
  signTitle?: string;
  signText?: string;
  puzzleId?: string;
  minigameId?: MinigameId;
  switchLightId?: string;
  collected?: boolean;
  activated?: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  vy: number;
  yaw: number;
  pitch: number;
  stamina: number;
  maxStamina: number;
  fatigue: number; // 0..100
  hunger: number; // 0..100
  hydration: number; // 0..100
  staminaExhausted: boolean;
  isGrounded: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isHiding: boolean;
  onBike: boolean;
  hidingSpotId: string | null;
  flashlightOn: boolean;
  fearLevel: number;
  stepsWalked: number;
  noiseLevel: number; // 0..100 for AI hearing
}

export interface PlayerStats {
  distanceWalkedMeters: number;
  doorsOpened: number;
  timesHidden: number;
  itemsCollected: number;
  loreFound: number;
  sideMissionsCompleted: number;
  minigamesWon: number;
  deathsCount: number;
  daysSurvived: number;
}

export interface SaveData {
  version: number;
  slotId: SaveSlotId;
  savedAt: string;
  chapter: ChapterNumber;
  completedObjectiveIds: string[];
  completedSideMissionIds: string[];
  discoveredLoreIds: string[];
  discoveredRegions: RegionId[];
  unlockedAchievements: string[];
  seenDialogueIds: string[];
  decisions: Record<string, string>;
  flags: Record<string, boolean>;
  npcReputation: Record<string, number>;
  gameTimeMinutes: number; // 0..1440 (24h full cycle, 0 = 00:00, 180 = 03:00, 1080 = 18:00)
  dayNumber: number;
  weather: WeatherType;
  playerPos: { x: number; y: number; z: number; yaw: number };
  vitals: { stamina: number; fatigue: number; hunger: number; hydration: number };
  inventory: InventoryItem[];
  customization: CustomizationConfig;
  stats: PlayerStats;
  freeExploreAfterCampaign: boolean;
}

export interface RegionInfo {
  id: RegionId;
  name: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  ambienceType: 'vila' | 'estrada' | 'floresta' | 'agua' | 'subterraneo' | 'sombrio';
  dangerLevel: 'baixo' | 'medio' | 'alto' | 'extremo';
}

export interface HudSnapshot {
  gameTimeFormatted: string;
  dayNumber: number;
  periodLabel: string;
  moonPhaseLabel: string;
  weather: WeatherType;
  isThreeAM: boolean;
  isNight: boolean;
  chapter: ChapterNumber;
  chapterTitle: string;
  currentObjective: string;
  regionId: RegionId;
  locationName: string;
  coords: { x: number; y: number; z: number };
  yawDeg: number;
  stamina: number;
  maxStamina: number;
  fatigue: number;
  hunger: number;
  hydration: number;
  fearLevel: number;
  isCrouching: boolean;
  isHiding: boolean;
  onBike: boolean;
  flashlightOn: boolean;
  isIndoors: boolean;
  chasedBy: string | null;
  suspiciousBy: string | null;
  interactPrompt: string | null;
  subtitle: { speaker: string; text: string } | null;
  minimapEntities: Array<{
    kind: 'player' | 'npc' | 'creature' | 'waypoint';
    x: number;
    z: number;
    label?: string;
  }>;
  diagnostics?: {
    fps: number;
    activeColliders: number;
    region: string;
    creatureModes: string;
  };
}
