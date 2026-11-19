import { useCallback, useEffect, useRef, useState } from 'react';
import { CustomizationModal } from './components/CustomizationModal';
import { EndScreen } from './components/EndScreen';
import { HudOverlay } from './components/HudOverlay';
import { InteractiveMapModal } from './components/InteractiveMapModal';
import { MinigameModal } from './components/MinigameModal';
import { PauseModal, type PauseTab } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { gameAudio } from './game/audio';
import { DIALOGUE_LINES } from './game/dialogues';
import {
  clearSaveSlot,
  createInitialSave,
  listSaveSlots,
  loadGameFromSlot,
  loadUserSettings,
  saveGameToSlot,
  saveUserSettings,
} from './game/storage';
import type {
  AudioSettings,
  ChapterNumber,
  CustomizationConfig,
  DialogueLine,
  EndingType,
  GameState,
  GraphicsSettings,
  HudSnapshot,
  InventoryItem,
  MinigameId,
  PlayerStats,
  RegionId,
  SaveSlotId,
} from './game/types';
import { SantaBatataEngine, type EngineCallbacks, type TouchInputState } from './game/worldEngine';

const INITIAL_HUD: HudSnapshot = {
  gameTimeFormatted: '18:15',
  dayNumber: 1,
  periodLabel: 'Entardecer na Roça',
  moonPhaseLabel: 'Lua Nova',
  weather: 'limpo',
  isThreeAM: false,
  isNight: false,
  chapter: 1,
  chapterTitle: 'Capítulo 1: Chegada em Santa Batata',
  currentObjective: 'Conversar com a Vó Maria',
  regionId: 'santa_batata',
  locationName: 'Santa Batata (Centro)',
  coords: { x: 1, y: 0, z: -9 },
  yawDeg: 180,
  stamina: 100,
  maxStamina: 100,
  fatigue: 0,
  hunger: 100,
  hydration: 100,
  fearLevel: 0,
  isCrouching: false,
  isHiding: false,
  onBike: false,
  flashlightOn: false,
  isIndoors: false,
  chasedBy: null,
  suspiciousBy: null,
  interactPrompt: null,
  subtitle: null,
  minimapEntities: [],
};

const INITIAL_STATS: PlayerStats = {
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

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SantaBatataEngine | null>(null);

  const initialSettings = useRef(loadUserSettings());
  const [gameState, setGameState] = useState<GameState>('title');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [customization, setCustomization] = useState<CustomizationConfig>(
    initialSettings.current.customization,
  );
  const [audio, setAudio] = useState<AudioSettings>(initialSettings.current.audio);
  const [graphics, setGraphics] = useState<GraphicsSettings>(initialSettings.current.graphics);

  const [activeSlot, setActiveSlot] = useState<SaveSlotId>('auto');
  const [slots, setSlots] = useState(() => listSaveSlots());

  const [showCustomize, setShowCustomize] = useState(false);
  const [showTitleSettings, setShowTitleSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [activeMinigame, setActiveMinigame] = useState<MinigameId | null>(null);
  const [pauseTab, setPauseTab] = useState<PauseTab>('pausa');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const [chapter, setChapter] = useState<ChapterNumber>(1);
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([]);
  const [completedSideMissions, setCompletedSideMissions] = useState<string[]>([]);
  const [discoveredLore, setDiscoveredLore] = useState<string[]>([]);
  const [discoveredRegions, setDiscoveredRegions] = useState<RegionId[]>(['santa_batata']);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dialogueContext, setDialogueContext] = useState<{
    npcId: string;
    line: DialogueLine;
  } | null>(null);
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(null);
  const [endingResult, setEndingResult] = useState<{
    ending: EndingType;
    stats: { chapter: ChapterNumber; time: string; itemsCount: number; loreCount: number };
  } | null>(null);

  // Keep body[data-state] synced with GameState
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const callbacksRef = useRef<EngineCallbacks>({
    onHudUpdate: (nextHud) => setHud(nextHud),
    onOpenDialogue: (npcId, lineId) => {
      const npcLines = DIALOGUE_LINES[npcId];
      const line = npcLines?.[lineId] ?? npcLines?.idle;
      if (line) {
        setDialogueContext({ npcId, line });
      } else {
        engineRef.current?.setDialogueOpen(false);
      }
    },
    onOpenMinigame: (minigameId) => {
      setDialogueContext(null);
      engineRef.current?.setDialogueOpen(true);
      setActiveMinigame(minigameId);
    },
    onShowNotice: (title, text) => {
      engineRef.current?.setDialogueOpen(true);
      setNotice({ title, text });
    },
    onInventoryChange: (items) => setInventory(items),
    onProgressChange: (progress) => {
      setChapter(progress.chapter);
      setCompletedObjectives(progress.completedObjectives);
      setCompletedSideMissions(progress.completedSideMissions);
      setDiscoveredLore(progress.discoveredLore);
      setDiscoveredRegions(progress.discoveredRegions);
      setUnlockedAchievements(progress.unlockedAchievements);
      setStats(progress.stats);
    },
    onGameOver: (ending, endStats) => {
      setDialogueContext(null);
      setNotice(null);
      setShowMap(false);
      setActiveMinigame(null);
      setEndingResult({ ending, stats: endStats });
      setGameState('gameover');
    },
    onRequestPause: () => {
      setShowMap(false);
      setPauseTab('pausa');
      setSaveFeedback(null);
      engineRef.current?.setGameState('paused');
      setGameState('paused');
    },
    onRequestMap: () => {
      setShowMap((prev) => {
        const next = !prev;
        engineRef.current?.setDialogueOpen(next);
        return next;
      });
    },
  });

  const refreshSlots = useCallback(() => {
    setSlots(listSaveSlots());
  }, []);

  const startNewGame = useCallback(
    (slotId: SaveSlotId = activeSlot) => {
      const fresh = createInitialSave(customization, slotId);
      setActiveSlot(slotId);
      setEndingResult(null);
      setDialogueContext(null);
      setNotice(null);
      setShowMap(false);
      setActiveMinigame(null);
      setShowCustomize(false);
      setShowTitleSettings(false);
      (document.activeElement as HTMLElement | null)?.blur?.();
      engineRef.current?.loadFromSave(fresh);
      engineRef.current?.setGameState('playing');
      setGameState('playing');
      saveGameToSlot(fresh, slotId);
      refreshSlots();
    },
    [activeSlot, customization, refreshSlots],
  );

  const continueSavedGame = useCallback(
    (slotId: SaveSlotId = activeSlot) => {
      const save = loadGameFromSlot(slotId);
      if (!save) {
        startNewGame(slotId);
        return;
      }
      setActiveSlot(slotId);
      setEndingResult(null);
      setDialogueContext(null);
      setNotice(null);
      setShowMap(false);
      setActiveMinigame(null);
      (document.activeElement as HTMLElement | null)?.blur?.();
      engineRef.current?.loadFromSave(save);
      engineRef.current?.setGameState('playing');
      setGameState('playing');
    },
    [activeSlot, startNewGame],
  );

  // Initialize Three.js engine once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    gameAudio.updateSettings(initialSettings.current.audio);
    const engine = new SantaBatataEngine(
      el,
      callbacksRef,
      initialSettings.current.graphics,
      initialSettings.current.customization,
    );
    engineRef.current = engine;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const fresh = createInitialSave(initialSettings.current.customization, 'auto');
      engine.loadFromSave(fresh);
      engine.setGameState('playing');
      setGameState('playing');
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Global keyboard shortcuts (Title Enter/Space, Playing J/I/L, Paused Esc)
  // Note: KeyM & Tab are handled inside SantaBatataEngine -> onRequestMap()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState === 'title' && !showCustomize && !showTitleSettings) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          const hasAny = slots.find((s) => s.save !== null);
          if (hasAny) continueSavedGame(hasAny.slotId);
          else startNewGame(activeSlot);
        }
      } else if (gameState === 'playing' && !dialogueContext && !notice && !activeMinigame) {
        if (showMap && e.code === 'Escape') {
          e.preventDefault();
          setShowMap(false);
          engineRef.current?.setDialogueOpen(false);
          return;
        }
        if (e.code === 'KeyJ') {
          e.preventDefault();
          setShowMap(false);
          setPauseTab('diario');
          engineRef.current?.setGameState('paused');
          setGameState('paused');
        } else if (e.code === 'KeyI') {
          e.preventDefault();
          setShowMap(false);
          setPauseTab('inventario');
          engineRef.current?.setGameState('paused');
          setGameState('paused');
        } else if (e.code === 'KeyL') {
          e.preventDefault();
          setShowMap(false);
          setPauseTab('lore');
          engineRef.current?.setGameState('paused');
          setGameState('paused');
        }
      } else if (gameState === 'paused' && e.code === 'Escape') {
        e.preventDefault();
        engineRef.current?.setGameState('playing');
        setGameState('playing');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    gameState,
    showCustomize,
    showTitleSettings,
    showMap,
    activeMinigame,
    slots,
    activeSlot,
    dialogueContext,
    notice,
    continueSavedGame,
    startNewGame,
  ]);

  const handleAudioChange = (next: AudioSettings) => {
    setAudio(next);
    gameAudio.updateSettings(next);
    saveUserSettings(next, graphics, customization);
  };

  const handleGraphicsChange = (next: GraphicsSettings) => {
    setGraphics(next);
    engineRef.current?.applyGraphicsSettings(next);
    saveUserSettings(audio, next, customization);
  };

  const handleCustomizationChange = (next: CustomizationConfig) => {
    setCustomization(next);
    engineRef.current?.applyCustomization(next);
    saveUserSettings(audio, graphics, next);
  };

  const handleSaveToSlot = (targetSlot: SaveSlotId = activeSlot) => {
    if (!engineRef.current) return;
    const data = engineRef.current.exportSaveData(targetSlot);
    const ok = saveGameToSlot(data, targetSlot);
    if (ok) {
      setActiveSlot(targetSlot);
      refreshSlots();
      setSaveFeedback(`Progresso salvo em ${targetSlot.toUpperCase()}!`);
      window.setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleReturnToTitle = () => {
    setDialogueContext(null);
    setNotice(null);
    setShowMap(false);
    setActiveMinigame(null);
    setEndingResult(null);
    refreshSlots();
    engineRef.current?.setGameState('title');
    setGameState('title');
  };

  const handleDialogueChoice = (nextId?: string, action?: string, repDelta = 0) => {
    if (action) {
      engineRef.current?.executeDialogueAction(action, dialogueContext?.npcId, repDelta);
      setDialogueContext(null);
      engineRef.current?.setDialogueOpen(false);
      return;
    }
    if (!nextId || nextId === 'fechar') {
      setDialogueContext(null);
      engineRef.current?.setDialogueOpen(false);
      return;
    }
    if (dialogueContext) {
      const nextLine = DIALOGUE_LINES[dialogueContext.npcId]?.[nextId];
      if (nextLine) {
        setDialogueContext({ npcId: dialogueContext.npcId, line: nextLine });
        return;
      }
    }
    setDialogueContext(null);
    engineRef.current?.setDialogueOpen(false);
  };

  const handleTouchUpdate = (patch: Partial<TouchInputState>) => {
    if (!engineRef.current) return;
    Object.assign(engineRef.current.touchInput, patch);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d0c11]">
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        data-testid="game-canvas-container"
        className="fixed inset-0 w-full h-full"
      />

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          slots={slots}
          activeSlot={activeSlot}
          onSelectSlot={setActiveSlot}
          onNewGame={(s) => startNewGame(s)}
          onContinue={(s) => continueSavedGame(s)}
          onDeleteSlot={(s) => {
            clearSaveSlot(s);
            refreshSlots();
          }}
          onOpenCustomize={() => setShowCustomize(true)}
          onOpenSettings={() => {
            setPauseTab('config');
            setShowTitleSettings(true);
          }}
        />
      )}

      {/* Customization Modal */}
      {showCustomize && (
        <CustomizationModal
          config={customization}
          onChange={handleCustomizationChange}
          onClose={() => setShowCustomize(false)}
        />
      )}

      {/* Title Settings Modal */}
      {gameState === 'title' && showTitleSettings && (
        <PauseModal
          activeTab="config"
          inTitleSettingsOnly
          chapter={chapter}
          completedObjectives={completedObjectives}
          completedSideMissions={completedSideMissions}
          discoveredLore={discoveredLore}
          discoveredRegions={discoveredRegions}
          unlockedAchievements={unlockedAchievements}
          stats={stats}
          inventory={inventory}
          audio={audio}
          graphics={graphics}
          activeSlot={activeSlot}
          saveFeedback={null}
          onChangeTab={() => {}}
          onResume={() => setShowTitleSettings(false)}
          onSaveToSlot={() => {}}
          onReturnToTitle={() => setShowTitleSettings(false)}
          onUseItem={() => {}}
          onAudioChange={handleAudioChange}
          onGraphicsChange={handleGraphicsChange}
        />
      )}

      {/* Playing HUD */}
      {gameState === 'playing' && (
        <HudOverlay
          hud={hud}
          muted={audio.muted}
          dialogue={dialogueContext?.line ?? null}
          notice={notice}
          graphics={graphics}
          onToggleMute={() => handleAudioChange({ ...audio, muted: !audio.muted })}
          onOpenMap={() => {
            setShowMap(true);
            engineRef.current?.setDialogueOpen(true);
          }}
          onOpenPause={(tab = 'pausa') => {
            setShowMap(false);
            setPauseTab(tab);
            setSaveFeedback(null);
            engineRef.current?.setGameState('paused');
            setGameState('paused');
          }}
          onQuickSave={() => handleSaveToSlot(activeSlot)}
          onDialogueChoice={handleDialogueChoice}
          onCloseDialogue={() => {
            setDialogueContext(null);
            engineRef.current?.setDialogueOpen(false);
          }}
          onCloseNotice={() => {
            setNotice(null);
            engineRef.current?.setDialogueOpen(false);
          }}
          onTouchInputUpdate={handleTouchUpdate}
          onTouchInteract={() => engineRef.current?.triggerInteract()}
          onTouchJump={() => engineRef.current?.triggerJump()}
          onTouchCrouch={() => engineRef.current?.toggleCrouch()}
          onTouchFlashlight={() => engineRef.current?.toggleFlashlight()}
        />
      )}

      {/* Interactive 18-Region Map */}
      {gameState === 'playing' && showMap && (
        <InteractiveMapModal
          playerCoords={hud.coords}
          currentRegionId={hud.regionId}
          discoveredRegions={discoveredRegions}
          onSetWaypoint={(x, z, label) => engineRef.current?.setWaypoint(x, z, label)}
          onClose={() => {
            setShowMap(false);
            engineRef.current?.setDialogueOpen(false);
          }}
        />
      )}

      {/* Playable Minigame Modal */}
      {gameState === 'playing' && activeMinigame && (
        <MinigameModal
          minigameId={activeMinigame}
          onFinish={(id, won) => {
            engineRef.current?.completeMinigame(id, won);
            setActiveMinigame(null);
            engineRef.current?.setDialogueOpen(false);
          }}
          onClose={() => {
            setActiveMinigame(null);
            engineRef.current?.setDialogueOpen(false);
          }}
        />
      )}

      {/* Pause / Journal / Lore / Inventory / Achievements / Settings Modal */}
      {gameState === 'paused' && (
        <PauseModal
          activeTab={pauseTab}
          chapter={chapter}
          completedObjectives={completedObjectives}
          completedSideMissions={completedSideMissions}
          discoveredLore={discoveredLore}
          discoveredRegions={discoveredRegions}
          unlockedAchievements={unlockedAchievements}
          stats={stats}
          inventory={inventory}
          audio={audio}
          graphics={graphics}
          activeSlot={activeSlot}
          saveFeedback={saveFeedback}
          onChangeTab={setPauseTab}
          onResume={() => {
            engineRef.current?.setGameState('playing');
            setGameState('playing');
          }}
          onSaveToSlot={handleSaveToSlot}
          onReturnToTitle={handleReturnToTitle}
          onUseItem={(itemId) => {
            const msg = engineRef.current?.useInventoryItem(itemId);
            if (msg) setSaveFeedback(msg);
          }}
          onAudioChange={handleAudioChange}
          onGraphicsChange={handleGraphicsChange}
        />
      )}

      {/* Victory / Multiple Endings / Game Over */}
      {gameState === 'gameover' && endingResult && (
        <EndScreen
          ending={endingResult.ending}
          stats={endingResult.stats}
          onPlayAgain={() => startNewGame(activeSlot)}
          onFreeExplore={() => {
            setEndingResult(null);
            engineRef.current?.enterFreeExploreAfterCampaign();
            setGameState('playing');
          }}
          onReturnToTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
