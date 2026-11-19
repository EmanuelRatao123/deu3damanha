import {
  CheckCircle2,
  Circle,
  Home,
  Play,
  Save,
  Trophy,
  VolumeX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  ACHIEVEMENTS,
  CHAPTERS,
  LORE_ENTRIES,
  MAX_BACKPACK_SLOTS,
  OPTIONAL_STORIES,
  SIDE_MISSIONS,
} from '../game/campaign';
import { SAVE_SLOTS } from '../game/storage';
import type {
  AudioSettings,
  ChapterNumber,
  GraphicsQuality,
  GraphicsSettings,
  InventoryItem,
  PlayerStats,
  RegionId,
  SaveSlotId,
  SideMission,
} from '../game/types';

export type PauseTab =
  | 'pausa'
  | 'diario'
  | 'lore'
  | 'inventario'
  | 'conquistas'
  | 'config';

interface Props {
  activeTab: PauseTab;
  inTitleSettingsOnly?: boolean;
  chapter: ChapterNumber;
  completedObjectives: string[];
  completedSideMissions: string[];
  discoveredLore: string[];
  discoveredRegions: RegionId[];
  unlockedAchievements: string[];
  stats: PlayerStats;
  inventory: InventoryItem[];
  audio: AudioSettings;
  graphics: GraphicsSettings;
  activeSlot: SaveSlotId;
  saveFeedback: string | null;
  onChangeTab: (tab: PauseTab) => void;
  onResume: () => void;
  onSaveToSlot: (slotId: SaveSlotId) => void;
  onReturnToTitle: () => void;
  onUseItem: (itemId: string) => void;
  onAudioChange: (next: AudioSettings) => void;
  onGraphicsChange: (next: GraphicsSettings) => void;
}

const SIDE_CAT_LABEL: Record<'todas' | SideMission['category'], string> = {
  todas: 'Todas (45)',
  avo: 'Casa da Vó',
  moradores: 'Moradores',
  criaturas: 'Criaturas',
  exploracao: 'Exploração',
  especiais: 'Especiais',
};

export function PauseModal({
  activeTab,
  inTitleSettingsOnly = false,
  chapter,
  completedObjectives,
  completedSideMissions,
  discoveredLore,
  discoveredRegions,
  unlockedAchievements,
  stats,
  inventory,
  audio,
  graphics,
  activeSlot,
  saveFeedback,
  onChangeTab,
  onResume,
  onSaveToSlot,
  onReturnToTitle,
  onUseItem,
  onAudioChange,
  onGraphicsChange,
}: Props) {
  const [journalView, setJournalView] = useState<'campanha' | 'secundarias'>('campanha');
  const [sideCategory, setSideCategory] = useState<'todas' | SideMission['category']>('todas');
  const [loreView, setLoreView] = useState<'documentos' | 'historias'>('documentos');

  const tabList: Array<{ id: PauseTab; label: string }> = inTitleSettingsOnly
    ? [{ id: 'config', label: 'Configurações' }]
    : [
        { id: 'pausa', label: 'Pausa' },
        { id: 'diario', label: `Diário (${chapter}/15)` },
        { id: 'lore', label: `Lore (${discoveredLore.length}/20)` },
        { id: 'inventario', label: `Mochila (${inventory.length}/${MAX_BACKPACK_SLOTS})` },
        { id: 'conquistas', label: `Troféus (${unlockedAchievements.length}/20)` },
        { id: 'config', label: 'Configurações' },
      ];

  const filteredSideMissions =
    sideCategory === 'todas'
      ? SIDE_MISSIONS
      : SIDE_MISSIONS.filter((m) => m.category === sideCategory);

  return (
    <div
      role="dialog"
      aria-label="Menu do Jogo"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#09080d]/90 p-3 sm:p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#191622] border border-[#3e3229] shadow-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-[#2e2636] px-4 sm:px-5 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {tabList.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs md:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[#d97706] text-[#110e15]'
                    : 'bg-[#231f2e] text-[#cbbca8] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Fechar Menu"
            onClick={onResume}
            className="rounded-lg p-2 text-[#cbbca8] hover:bg-[#2a2536] hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'pausa' && !inTitleSettingsOnly && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#f8f1e5]">
                  Jogo Pausado
                </h2>
                <p className="text-sm text-[#b9ab9a]">
                  Capítulo {chapter}/15 · {discoveredRegions.length}/18 regiões descobertas · {completedSideMissions.length}/45 missões secundárias
                </p>
              </div>

              {saveFeedback && (
                <div className="rounded-xl bg-[#1f2c1f] border border-[#4d7c0f] px-4 py-2.5 text-xs font-semibold text-[#bef264]">
                  {saveFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={onResume}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#d97706] px-4 py-3 text-sm font-bold text-[#110e15] hover:bg-[#f59e0b] cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={() => onSaveToSlot(activeSlot)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#252030] border border-[#43372d] px-4 py-3 text-sm font-semibold text-[#f5efe6] hover:bg-[#312b40] cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#f59e0b]" />
                  Salvar Rápido
                </button>
                <button
                  type="button"
                  onClick={onReturnToTitle}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#252030] border border-[#43372d] px-4 py-3 text-sm font-semibold text-[#e6d8c5] hover:bg-[#312b40] cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Menu Principal
                </button>
              </div>

              {/* Multi-slot Manual Save */}
              <div className="rounded-xl bg-[#201c29] border border-[#332c3d] p-4 space-y-2.5">
                <div className="text-xs font-bold text-[#f59e0b]">Salvar em Slot Específico</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAVE_SLOTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSaveToSlot(s.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer ${
                        activeSlot === s.id
                          ? 'bg-[#2c2538] border-[#f59e0b] text-[#fef3c7]'
                          : 'bg-[#191622] border-[#332c3d] text-[#cbbca8] hover:text-white'
                      }`}
                    >
                      Salvar em {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diario' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-[#f8f1e5]">
                  Diário de Missões
                </h2>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setJournalView('campanha')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      journalView === 'campanha'
                        ? 'bg-[#d97706] text-[#110e15]'
                        : 'bg-[#241f30] text-[#cbbca8]'
                    }`}
                  >
                    15 Capítulos ({chapter}/15)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJournalView('secundarias')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      journalView === 'secundarias'
                        ? 'bg-[#d97706] text-[#110e15]'
                        : 'bg-[#241f30] text-[#cbbca8]'
                    }`}
                  >
                    Secundárias ({completedSideMissions.length}/45)
                  </button>
                </div>
              </div>

              {journalView === 'campanha' ? (
                <div className="space-y-3">
                  {CHAPTERS.map((ch) => {
                    const unlocked = ch.number <= chapter;
                    const isCurrent = ch.number === chapter;
                    return (
                      <div
                        key={ch.number}
                        className={`rounded-xl border p-4 ${
                          isCurrent
                            ? 'bg-[#241f2d] border-[#d97706]'
                            : unlocked
                              ? 'bg-[#1e1a27] border-[#332c3d]'
                              : 'bg-[#16131d] border-[#26212f] opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-base font-bold text-[#f8f1e5]">
                            {ch.title}
                          </h3>
                          <span className="text-xs text-[#cbbca8]">
                            {unlocked ? (isCurrent ? 'Em andamento' : 'Concluído') : 'Bloqueado'}
                          </span>
                        </div>
                        <p className="text-xs text-[#b9ab9a] mt-1">
                          {unlocked ? ch.synopsis : 'Avance na campanha para liberar este capítulo.'}
                        </p>
                        {unlocked && (
                          <ul className="mt-3 space-y-1.5">
                            {ch.objectives.map((obj) => {
                              const done = completedObjectives.includes(obj.id);
                              return (
                                <li
                                  key={obj.id}
                                  className="flex items-start gap-2 text-xs text-[#e6d8c5]"
                                >
                                  {done ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <span className={done ? 'line-through text-[#9ca3af]' : 'font-semibold'}>
                                      {obj.title}
                                    </span>
                                    <span className="text-[#a39482]"> · {obj.locationHint}</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(SIDE_CAT_LABEL) as Array<keyof typeof SIDE_CAT_LABEL>).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSideCategory(cat)}
                        className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                          sideCategory === cat
                            ? 'bg-[#2d263a] border-[#f59e0b] text-[#fef3c7]'
                            : 'bg-[#1c1826] border-[#332c3d] text-[#cbbca8]'
                        }`}
                      >
                        {SIDE_CAT_LABEL[cat]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredSideMissions.map((m) => {
                      const done = completedSideMissions.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className={`rounded-xl border p-3.5 ${
                            done
                              ? 'bg-[#1a241e] border-[#22c55e]/50'
                              : 'bg-[#201c2a] border-[#332c3d]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[#fef3c7]">{m.title}</span>
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#f59e0b] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#cbbca8] mt-1">{m.description}</p>
                          <div className="mt-1.5 text-[10px] text-[#a39482]">
                            {m.giver} · Recompensa: {m.rewardText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-[#f8f1e5]">
                  Arquivo Histórico — A Primeira Madrugada
                </h2>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLoreView('documentos')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      loreView === 'documentos'
                        ? 'bg-[#d97706] text-[#110e15]'
                        : 'bg-[#241f30] text-[#cbbca8]'
                    }`}
                  >
                    Documentos ({discoveredLore.length}/20)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoreView('historias')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      loreView === 'historias'
                        ? 'bg-[#d97706] text-[#110e15]'
                        : 'bg-[#241f30] text-[#cbbca8]'
                    }`}
                  >
                    Contos Locais (20)
                  </button>
                </div>
              </div>

              {loreView === 'documentos' ? (
                <div className="space-y-2.5">
                  {LORE_ENTRIES.map((doc) => {
                    const found = discoveredLore.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={`rounded-xl border p-4 ${
                          found
                            ? 'bg-[#211d2c] border-[#d97706]/60'
                            : 'bg-[#16131d] border-[#26212f] opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-[#fef3c7]">
                            {found ? doc.title : 'Documento Ainda Não Encontrado'}
                          </span>
                          <span className="font-mono-tabular text-xs text-[#f59e0b]">
                            {doc.year} · {doc.kind.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#d4c3af] mt-1.5 leading-relaxed">
                          {found ? doc.content : `Procure pistas na região: ${doc.regionId.replace(/_/g, ' ')}.`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OPTIONAL_STORIES.map((st) => (
                    <div
                      key={st.id}
                      className="rounded-xl bg-[#201c2a] border border-[#342c3e] p-3.5"
                    >
                      <h3 className="text-xs font-bold text-[#fbbf24]">{st.title}</h3>
                      <p className="text-xs text-[#d4c3af] mt-1 leading-relaxed">{st.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventario' && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-bold text-[#f8f1e5]">
                  Mochila de Exploração
                </h2>
                <span className="font-mono-tabular text-xs text-[#f59e0b]">
                  {inventory.length}/{MAX_BACKPACK_SLOTS} espaços
                </span>
              </div>

              {saveFeedback && (
                <div className="rounded-xl bg-[#1f2c1f] border border-[#4d7c0f] px-4 py-2 text-xs font-semibold text-[#bef264]">
                  {saveFeedback}
                </div>
              )}

              {inventory.length === 0 ? (
                <div className="rounded-xl bg-[#211d2a] border border-[#332c3e] p-6 text-center text-sm text-[#b9ab9a]">
                  Sua mochila está vazia! Pegue a lanterna na sala da Vó Maria ou explore Santa Batata.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl bg-[#221d2b] border border-[#3a3040] p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm text-[#fef3c7]">{item.name}</h3>
                          <span className="font-mono-tabular text-xs text-[#f59e0b]">
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] mt-0.5">
                          {item.category}
                          {item.rare ? ' · Raro' : ''}
                        </div>
                        <p className="text-xs text-[#cbbca8] mt-1.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      {item.usable && (
                        <button
                          type="button"
                          onClick={() => onUseItem(item.id)}
                          className="mt-3 rounded-lg bg-[#d97706] px-3 py-1.5 text-xs font-bold text-[#120e16] hover:bg-[#f59e0b] cursor-pointer"
                        >
                          {item.id === 'lanterna'
                            ? 'Ligar / Desligar [F]'
                            : item.id === 'radio_portatil'
                              ? 'Sintonizar Rádio'
                              : 'Usar / Consumir'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'conquistas' && (
            <div className="space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-bold text-[#f8f1e5]">
                  Conquistas & Estatísticas
                </h2>
                <span className="text-xs font-bold text-[#f59e0b]">
                  {unlockedAchievements.length} / 20 desbloqueadas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-[#201c2a] border border-[#332c3d] p-3.5 text-center">
                <div>
                  <div className="text-[10px] text-[#a39482]">Distância</div>
                  <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
                    {Math.round(stats.distanceWalkedMeters)}m
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#a39482]">Regiões</div>
                  <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
                    {discoveredRegions.length}/18
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#a39482]">Lore</div>
                  <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
                    {discoveredLore.length}/20
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#a39482]">Minijogos</div>
                  <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
                    {stats.minigamesWon}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACHIEVEMENTS.map((ach) => {
                  const got = unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                        got
                          ? 'bg-[#231f2d] border-[#f59e0b]'
                          : 'bg-[#17141f] border-[#2a2434] opacity-60'
                      }`}
                    >
                      <Trophy
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          got ? 'text-[#fbbf24]' : 'text-[#5c5368]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-[#fef3c7]">{ach.title}</div>
                        <div className="text-[11px] text-[#cbbca8] mt-0.5">
                          {ach.secret && !got ? 'Conquista secreta — explore mais para revelar!' : ach.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold text-[#f8f1e5]">
                Configurações
              </h2>

              <div className="space-y-3 rounded-xl bg-[#201c29] border border-[#332c3d] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#f59e0b]">Áudio e Paisagem Sonora</h3>
                  <button
                    type="button"
                    onClick={() => onAudioChange({ ...audio, muted: !audio.muted })}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      audio.muted
                        ? 'bg-[#7f1d1d] text-white'
                        : 'bg-[#2c2638] text-[#e6d8c5]'
                    }`}
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    {audio.muted ? 'Silenciado' : 'Silenciar Tudo'}
                  </button>
                </div>

                <label className="block text-xs text-[#d4c3af]">
                  Volume Geral ({Math.round(audio.masterVolume * 100)}%)
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audio.masterVolume}
                    onChange={(e) =>
                      onAudioChange({ ...audio, masterVolume: Number(e.target.value) })
                    }
                    className="mt-1 w-full accent-[#d97706]"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-[#d4c3af]">
                    Efeitos e Passos ({Math.round(audio.sfxVolume * 100)}%)
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={audio.sfxVolume}
                      onChange={(e) =>
                        onAudioChange({ ...audio, sfxVolume: Number(e.target.value) })
                      }
                      className="mt-1 w-full accent-[#d97706]"
                    />
                  </label>
                  <label className="block text-xs text-[#d4c3af]">
                    Ambiente e Viola ({Math.round(audio.ambienceVolume * 100)}%)
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={audio.ambienceVolume}
                      onChange={(e) =>
                        onAudioChange({ ...audio, ambienceVolume: Number(e.target.value) })
                      }
                      className="mt-1 w-full accent-[#d97706]"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-[#201c29] border border-[#332c3d] p-4">
                <h3 className="text-sm font-bold text-[#f59e0b]">
                  Gráficos, Interface e Diagnóstico
                </h3>
                <div>
                  <span className="block text-xs text-[#d4c3af] mb-1.5">Qualidade Gráfica</span>
                  <div className="flex gap-2">
                    {(['baixo', 'medio', 'alto'] as GraphicsQuality[]).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onGraphicsChange({ ...graphics, quality: q })}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize cursor-pointer ${
                          graphics.quality === q
                            ? 'bg-[#d97706] text-[#110e15]'
                            : 'bg-[#2c2638] text-[#cbbca8]'
                        }`}
                      >
                        {q === 'medio' ? 'Médio' : q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-[#d4c3af]">
                    Distância de Renderização ({graphics.renderDistance}m)
                    <input
                      type="range"
                      min={55}
                      max={140}
                      step={5}
                      value={graphics.renderDistance}
                      onChange={(e) =>
                        onGraphicsChange({
                          ...graphics,
                          renderDistance: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full accent-[#d97706]"
                    />
                  </label>
                  <label className="block text-xs text-[#d4c3af]">
                    Sensibilidade da Câmera ({graphics.mouseSensitivity.toFixed(1)}x)
                    <input
                      type="range"
                      min={0.3}
                      max={2.0}
                      step={0.1}
                      value={graphics.mouseSensitivity}
                      onChange={(e) =>
                        onGraphicsChange({
                          ...graphics,
                          mouseSensitivity: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full accent-[#d97706]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(
                    [
                      { key: 'showMinimap', label: 'Minimapa' },
                      { key: 'subtitlesEnabled', label: 'Legendas' },
                      { key: 'cameraShake', label: 'Tremor Câmera' },
                      { key: 'showDiagnostics', label: 'Diagnóstico FPS' },
                    ] as const
                  ).map((tog) => (
                    <button
                      key={tog.key}
                      type="button"
                      onClick={() =>
                        onGraphicsChange({ ...graphics, [tog.key]: !graphics[tog.key] })
                      }
                      className={`rounded-lg px-2.5 py-2 text-xs font-semibold border cursor-pointer ${
                        graphics[tog.key]
                          ? 'bg-[#2d2538] border-[#f59e0b] text-[#fef3c7]'
                          : 'bg-[#181520] border-[#332c3d] text-[#9ca3af]'
                      }`}
                    >
                      {tog.label}: {graphics[tog.key] ? 'ON' : 'OFF'}
                    </button>
                  ))}
                </div>

                <div>
                  <span className="block text-xs text-[#d4c3af] mb-1.5">
                    Controles Virtuais na Tela
                  </span>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'auto', label: 'Automático' },
                        { id: 'sempre', label: 'Sempre Ligado' },
                        { id: 'desligado', label: 'Desligado' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          onGraphicsChange({ ...graphics, touchControlsMode: m.id })
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                          graphics.touchControlsMode === m.id
                            ? 'bg-[#d97706] text-[#110e15]'
                            : 'bg-[#2c2638] text-[#cbbca8]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
