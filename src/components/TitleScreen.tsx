import { FolderOpen, Info, Play, RotateCw, Settings, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import type { SaveData, SaveSlotId } from '../game/types';

interface SlotEntry {
  slotId: SaveSlotId;
  label: string;
  save: SaveData | null;
}

interface Props {
  slots: SlotEntry[];
  activeSlot: SaveSlotId;
  onSelectSlot: (slotId: SaveSlotId) => void;
  onNewGame: (slotId: SaveSlotId) => void;
  onContinue: (slotId: SaveSlotId) => void;
  onDeleteSlot: (slotId: SaveSlotId) => void;
  onOpenCustomize: () => void;
  onOpenSettings: () => void;
}

export function TitleScreen({
  slots,
  activeSlot,
  onSelectSlot,
  onNewGame,
  onContinue,
  onDeleteSlot,
  onOpenCustomize,
  onOpenSettings,
}: Props) {
  const [showCredits, setShowCredits] = useState(false);
  const [showSlots, setShowSlots] = useState(false);

  const selectedEntry = slots.find((s) => s.slotId === activeSlot) ?? slots[0];
  const anySave = slots.find((s) => s.save !== null)?.save ?? null;
  const primarySave = selectedEntry?.save ?? anySave;
  const primarySlotId = selectedEntry?.save ? selectedEntry.slotId : (anySave?.slotId ?? activeSlot);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-5 md:p-12 bg-gradient-to-r from-[#0b090f]/92 via-[#0b090f]/50 to-transparent pointer-events-none">
      {/* Top quiet brand line */}
      <div className="flex items-center justify-between pointer-events-auto">
        <span className="text-xs font-medium tracking-wide text-[#cbbca8]">
          Santa Batata · Minas Gerais · Edição 2.0
        </span>
        <button
          type="button"
          onClick={() => setShowCredits(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#191622]/90 border border-[#3a312c] px-3 py-1.5 text-xs font-medium text-[#e6d8c5] hover:bg-[#262133] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          Créditos
        </button>
      </div>

      {/* Left-third Title Lockup & Menu */}
      <div className="max-w-lg my-auto pointer-events-auto">
        <svg
          viewBox="0 0 460 155"
          className="w-full max-w-[430px] h-auto mb-5"
          role="img"
          aria-label="RT: Deu 3 da Manhã"
        >
          <rect
            x="4"
            y="8"
            width="452"
            height="138"
            rx="12"
            fill="#14111b"
            fillOpacity="0.90"
            stroke="#d97706"
            strokeWidth="2.5"
          />
          <rect
            x="12"
            y="16"
            width="436"
            height="122"
            rx="8"
            fill="none"
            stroke="#5c3a21"
            strokeWidth="1.5"
          />
          <circle cx="52" cy="76" r="24" fill="#291d16" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="52" y1="76" x2="52" y2="60" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
          <line x1="52" y1="76" x2="64" y2="76" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <circle cx="52" cy="76" r="3" fill="#fff" />

          <text
            x="92"
            y="56"
            fill="#f59e0b"
            fontFamily="Bricolage Grotesque, sans-serif"
            fontWeight="800"
            fontSize="24"
            letterSpacing="2"
          >
            RT:
          </text>
          <text
            x="92"
            y="102"
            fill="#fbf5eb"
            fontFamily="Bricolage Grotesque, sans-serif"
            fontWeight="800"
            fontSize="40"
          >
            DEU 3 DA MANHÃ
          </text>
          <text
            x="94"
            y="126"
            fill="#cbbca8"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="500"
            fontSize="13"
          >
            18 regiões · 15 capítulos · Não abra a porta às 03:00.
          </text>
        </svg>

        <div className="flex flex-col gap-2.5 max-w-xs">
          {primarySave ? (
            <>
              <button
                type="button"
                data-start="true"
                onClick={() => onContinue(primarySlotId)}
                className="flex items-center justify-between rounded-xl bg-[#d97706] px-5 py-3.5 text-base font-bold text-[#120e16] hover:bg-[#f59e0b] transition-colors shadow-lg cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCw className="w-5 h-5" />
                  Continuar (Cap. {primarySave.chapter}/15)
                </span>
                <span className="text-xs font-semibold opacity-80">Enter</span>
              </button>
              <button
                type="button"
                onClick={() => onNewGame(activeSlot)}
                className="flex items-center justify-between rounded-xl bg-[#211d2b]/95 border border-[#42362d] px-5 py-3 text-sm font-semibold text-[#f3eadc] hover:bg-[#2d273a] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-[#f59e0b]" />
                  Novo Jogo
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={() => onNewGame(activeSlot)}
              className="flex items-center justify-between rounded-xl bg-[#d97706] px-5 py-3.5 text-base font-bold text-[#120e16] hover:bg-[#f59e0b] transition-colors shadow-lg cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-5 h-5" />
                Novo Jogo
              </span>
              <span className="text-xs font-semibold opacity-80">Enter</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowSlots(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a1723]/95 border border-[#3c312a] px-3 py-2.5 text-xs font-medium text-[#ede2d2] hover:bg-[#282334] whitespace-nowrap cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#f59e0b]" />
              Slots
            </button>
            <button
              type="button"
              onClick={onOpenCustomize}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a1723]/95 border border-[#3c312a] px-3 py-2.5 text-xs font-medium text-[#ede2d2] hover:bg-[#282334] whitespace-nowrap cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#f59e0b]" />
              Visual
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a1723]/95 border border-[#3c312a] px-3 py-2.5 text-xs font-medium text-[#ede2d2] hover:bg-[#282334] whitespace-nowrap cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#f59e0b]" />
              Opções
            </button>
          </div>
        </div>
      </div>

      {/* Flat control hint line */}
      <div className="pointer-events-none text-xs text-[#cbbca8]">
        WASD Mover · Mouse Câmera · E Interagir · F Lanterna · M Mapa · J Diário · I Mochila · Shift Correr · Espaço Pular · Ctrl Agachar · Esc Pausar
      </div>

      {/* Save Slots Dialog */}
      {showSlots && (
        <div
          role="dialog"
          aria-label="Slots de Salvamento"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09080d]/85 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#1a1721] border border-[#3e3229] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-[#f8f1e5]">
                Slots de Salvamento
              </h3>
              <button
                type="button"
                aria-label="Fechar slots"
                onClick={() => setShowSlots(false)}
                className="rounded-lg p-1.5 text-[#cbbca8] hover:bg-[#2b2535] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {slots.map((slot) => (
                <div
                  key={slot.slotId}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${
                    activeSlot === slot.slotId
                      ? 'bg-[#262033] border-[#d97706]'
                      : 'bg-[#1f1b28] border-[#332c3d]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#fef3c7]">{slot.label}</div>
                    {slot.save ? (
                      <div className="text-xs text-[#cbbca8] truncate">
                        Capítulo {slot.save.chapter}/15 · Dia {slot.save.dayNumber} · {slot.save.discoveredRegions.length}/18 regiões
                      </div>
                    ) : (
                      <div className="text-xs text-[#8a7c6b]">Slot vazio</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {slot.save ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSlot(slot.slotId);
                            setShowSlots(false);
                            onContinue(slot.slotId);
                          }}
                          className="rounded-lg bg-[#d97706] px-3 py-1.5 text-xs font-bold text-[#120e16] hover:bg-[#f59e0b] cursor-pointer"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          aria-label={`Apagar ${slot.label}`}
                          onClick={() => onDeleteSlot(slot.slotId)}
                          className="rounded-lg bg-[#2c2228] p-1.5 text-[#fca5a5] hover:bg-[#7f1d1d] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSlot(slot.slotId);
                          setShowSlots(false);
                          onNewGame(slot.slotId);
                        }}
                        className="rounded-lg bg-[#2b2538] border border-[#4a3b30] px-3 py-1.5 text-xs font-semibold text-[#f3eadc] hover:bg-[#3a314a] cursor-pointer"
                      >
                        Iniciar Aqui
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credits Dialog */}
      {showCredits && (
        <div
          role="dialog"
          aria-label="Créditos"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09080d]/85 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#1a1721] border border-[#3e3229] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-[#f8f1e5]">Créditos</h3>
              <button
                type="button"
                aria-label="Fechar créditos"
                onClick={() => setShowCredits(false)}
                className="rounded-lg p-1.5 text-[#cbbca8] hover:bg-[#2b2535] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-[#d6c9b8]">
              <p>
                <strong className="text-[#f59e0b]">RT: Deu 3 da Manhã (Edição 2.0)</strong> — Aventura voxel 3D de terror e comédia ambientada em Santa Batata, Minas Gerais.
              </p>
              <p>
                Mundo aberto contínuo com 18 regiões conectadas, ciclo completo de 24 horas, clima dinâmico, 15 capítulos, 45 missões secundárias, 20 documentos históricos, 5 minijogos e 6 finais.
              </p>
              <p className="text-xs text-[#a39482]">
                Dica da Vó Maria: Nunca abra a porta da frente depois das 03:00 sem a Cruz de Ipê Bento ou a Fita de 1958!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
