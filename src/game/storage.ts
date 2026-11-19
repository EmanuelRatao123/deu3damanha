import type {
  AudioSettings,
  CustomizationConfig,
  GraphicsSettings,
  SaveData,
  SaveSlotId,
} from './types';

const SLOT_PREFIX = 'rt_deu_3_da_manha_slot_v2_';
const SETTINGS_KEY = 'rt_deu_3_da_manha_settings_v2';

export const SAVE_SLOTS: Array<{ id: SaveSlotId; label: string }> = [
  { id: 'auto', label: 'Salvamento Automático' },
  { id: 'slot1', label: 'Slot 1' },
  { id: 'slot2', label: 'Slot 2' },
  { id: 'slot3', label: 'Slot 3' },
];

export const DEFAULT_CUSTOMIZATION: CustomizationConfig = {
  shirtColor: '#d97706',
  shirtStyle: 'camiseta',
  bottomStyle: 'calca',
  pantsColor: '#1e3a5f',
  shoeStyle: 'tenis',
  shoeColor: '#f5f5f4',
  capStyle: 'aba_reta',
  capColor: '#b91c1c',
  hairStyle: 'curto',
  hairColor: '#1f1612',
  skinTone: '#d6a37a',
  glasses: 'nenhum',
  backpack: 'viagem',
  watch: 'digital',
  accessory: 'nenhum',
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.75,
  sfxVolume: 0.85,
  ambienceVolume: 0.65,
  muted: false,
};

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  quality: 'medio',
  renderDistance: 95,
  mouseSensitivity: 1.0,
  cameraShake: true,
  subtitlesEnabled: true,
  showMinimap: true,
  showDiagnostics: false,
  touchControlsMode: 'auto',
};

export function createInitialSave(
  customization?: CustomizationConfig,
  slotId: SaveSlotId = 'auto',
): SaveData {
  return {
    version: 2,
    slotId,
    savedAt: new Date().toISOString(),
    chapter: 1,
    completedObjectiveIds: [],
    completedSideMissionIds: [],
    discoveredLoreIds: [],
    discoveredRegions: ['santa_batata'],
    unlockedAchievements: [],
    seenDialogueIds: [],
    decisions: {},
    flags: {},
    npcReputation: {
      avo: 50,
      vizinho: 20,
      tiao: 25,
      padre_bento: 30,
      ze_pescador: 20,
      dona_clara: 30,
      saci: 10,
    },
    gameTimeMinutes: 1095, // 18:15 entardecer (0..1440 full 24h cycle)
    dayNumber: 1,
    weather: 'limpo',
    playerPos: { x: 0.6, y: 0, z: -8.8, yaw: Math.PI + 0.22 },
    vitals: { stamina: 100, fatigue: 0, hunger: 100, hydration: 100 },
    inventory: [],
    customization: { ...DEFAULT_CUSTOMIZATION, ...(customization ?? {}) },
    stats: {
      distanceWalkedMeters: 0,
      doorsOpened: 0,
      timesHidden: 0,
      itemsCollected: 0,
      loreFound: 0,
      sideMissionsCompleted: 0,
      minigamesWon: 0,
      deathsCount: 0,
      daysSurvived: 0,
    },
    freeExploreAfterCampaign: false,
  };
}

/**
 * Validates and repairs SaveData against corrupted JSON or missing fields.
 */
export function validateAndRepairSave(rawObj: unknown, fallbackSlot: SaveSlotId): SaveData | null {
  if (!rawObj || typeof rawObj !== 'object') return null;
  const obj = rawObj as Partial<SaveData>;
  if (typeof obj.chapter !== 'number' || obj.chapter < 1 || obj.chapter > 15) return null;
  if (!obj.playerPos || typeof obj.playerPos.x !== 'number' || !Number.isFinite(obj.playerPos.x)) {
    return null;
  }

  const base = createInitialSave(undefined, obj.slotId ?? fallbackSlot);
  return {
    ...base,
    ...obj,
    version: 2,
    slotId: obj.slotId ?? fallbackSlot,
    completedObjectiveIds: Array.isArray(obj.completedObjectiveIds) ? obj.completedObjectiveIds : [],
    completedSideMissionIds: Array.isArray(obj.completedSideMissionIds) ? obj.completedSideMissionIds : [],
    discoveredLoreIds: Array.isArray(obj.discoveredLoreIds) ? obj.discoveredLoreIds : [],
    discoveredRegions: Array.isArray(obj.discoveredRegions) && obj.discoveredRegions.length > 0
      ? obj.discoveredRegions
      : ['santa_batata'],
    unlockedAchievements: Array.isArray(obj.unlockedAchievements) ? obj.unlockedAchievements : [],
    seenDialogueIds: Array.isArray(obj.seenDialogueIds) ? obj.seenDialogueIds : [],
    decisions: obj.decisions && typeof obj.decisions === 'object' ? obj.decisions : {},
    flags: obj.flags && typeof obj.flags === 'object' ? obj.flags : {},
    npcReputation: { ...base.npcReputation, ...(obj.npcReputation ?? {}) },
    vitals: { ...base.vitals, ...(obj.vitals ?? {}) },
    inventory: Array.isArray(obj.inventory) ? obj.inventory : [],
    customization: { ...DEFAULT_CUSTOMIZATION, ...(obj.customization ?? {}) },
    stats: { ...base.stats, ...(obj.stats ?? {}) },
  };
}

export function saveGameToSlot(data: SaveData, slotId: SaveSlotId = data.slotId): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const payload: SaveData = {
      ...data,
      slotId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadGameFromSlot(slotId: SaveSlotId): SaveData | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateAndRepairSave(parsed, slotId);
  } catch {
    return null;
  }
}

export function clearSaveSlot(slotId: SaveSlotId): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
    }
  } catch {
    // ignore
  }
}

export function listSaveSlots(): Array<{ slotId: SaveSlotId; label: string; save: SaveData | null }> {
  return SAVE_SLOTS.map((s) => ({
    slotId: s.id,
    label: s.label,
    save: loadGameFromSlot(s.id),
  }));
}

// Backward-compatible default helpers
export function saveGameProgress(data: SaveData): boolean {
  return saveGameToSlot(data, data.slotId || 'auto');
}

export function loadGameProgress(): SaveData | null {
  return (
    loadGameFromSlot('auto') ??
    loadGameFromSlot('slot1') ??
    loadGameFromSlot('slot2') ??
    loadGameFromSlot('slot3')
  );
}

export function clearGameProgress(): void {
  SAVE_SLOTS.forEach((s) => clearSaveSlot(s.id));
}

export function saveUserSettings(
  audio: AudioSettings,
  graphics: GraphicsSettings,
  customization: CustomizationConfig,
): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ audio, graphics, customization }));
  } catch {
    // ignore
  }
}

export function loadUserSettings(): {
  audio: AudioSettings;
  graphics: GraphicsSettings;
  customization: CustomizationConfig;
} {
  try {
    if (typeof localStorage === 'undefined') {
      return {
        audio: { ...DEFAULT_AUDIO_SETTINGS },
        graphics: { ...DEFAULT_GRAPHICS_SETTINGS },
        customization: { ...DEFAULT_CUSTOMIZATION },
      };
    }
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        audio: { ...DEFAULT_AUDIO_SETTINGS },
        graphics: { ...DEFAULT_GRAPHICS_SETTINGS },
        customization: { ...DEFAULT_CUSTOMIZATION },
      };
    }
    const parsed = JSON.parse(raw);
    return {
      audio: { ...DEFAULT_AUDIO_SETTINGS, ...(parsed.audio ?? {}) },
      graphics: { ...DEFAULT_GRAPHICS_SETTINGS, ...(parsed.graphics ?? {}) },
      customization: { ...DEFAULT_CUSTOMIZATION, ...(parsed.customization ?? {}) },
    };
  } catch {
    return {
      audio: { ...DEFAULT_AUDIO_SETTINGS },
      graphics: { ...DEFAULT_GRAPHICS_SETTINGS },
      customization: { ...DEFAULT_CUSTOMIZATION },
    };
  }
}
