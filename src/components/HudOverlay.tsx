import {
  Backpack,
  Bike,
  BookOpen,
  CloudRain,
  Flashlight,
  Map as MapIcon,
  Pause,
  Save,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DialogueLine, GraphicsSettings, HudSnapshot, WeatherType } from '../game/types';
import type { TouchInputState } from '../game/worldEngine';

interface Props {
  hud: HudSnapshot;
  muted: boolean;
  dialogue: DialogueLine | null;
  notice: { title: string; text: string } | null;
  graphics: GraphicsSettings;
  onToggleMute: () => void;
  onOpenMap: () => void;
  onOpenPause: (tab?: 'pausa' | 'diario' | 'lore' | 'inventario' | 'conquistas' | 'config') => void;
  onQuickSave: () => void;
  onDialogueChoice: (nextId?: string, action?: string, repDelta?: number) => void;
  onCloseDialogue: () => void;
  onCloseNotice: () => void;
  onTouchInputUpdate: (patch: Partial<TouchInputState>) => void;
  onTouchInteract: () => void;
  onTouchJump: () => void;
  onTouchCrouch: () => void;
  onTouchFlashlight: () => void;
}

const WEATHER_LABEL: Record<WeatherType, string> = {
  limpo: 'Limpo',
  neblina: 'Neblina',
  chuva: 'Chuva',
  tempestade: 'Tempestade',
  ventania: 'Ventania',
};

function compassCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export function HudOverlay({
  hud,
  muted,
  dialogue,
  notice,
  graphics,
  onToggleMute,
  onOpenMap,
  onOpenPause,
  onQuickSave,
  onDialogueChoice,
  onCloseDialogue,
  onCloseNotice,
  onTouchInputUpdate,
  onTouchInteract,
  onTouchJump,
  onTouchCrouch,
  onTouchFlashlight,
}: Props) {
  const [isTouchViewport, setIsTouchViewport] = useState(false);
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });
  const joyOrigin = useRef<{ x: number; y: number } | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lookPrev = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const check = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const small = window.innerWidth < 900;
      if (graphics.touchControlsMode === 'sempre') setIsTouchViewport(true);
      else if (graphics.touchControlsMode === 'desligado') setIsTouchViewport(false);
      else setIsTouchViewport(hasTouch || small);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [graphics.touchControlsMode]);

  // Render live 2D Minimap canvas
  useEffect(() => {
    if (!graphics.showMinimap) return;
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const half = size / 2;
    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#120f19';
    ctx.fillRect(0, 0, size, size);

    // Crosshairs
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, size);
    ctx.moveTo(0, half);
    ctx.lineTo(size, half);
    ctx.stroke();

    const px = hud.coords.x;
    const pz = hud.coords.z;
    const scale = 1.45;

    for (const ent of hud.minimapEntities) {
      if (ent.kind === 'player') continue;
      const dx = (ent.x - px) * scale;
      const dz = (ent.z - pz) * scale;
      const sx = Math.max(5, Math.min(size - 5, half + dx));
      const sy = Math.max(5, Math.min(size - 5, half + dz));

      ctx.beginPath();
      if (ent.kind === 'waypoint') {
        ctx.fillStyle = '#fbbf24';
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      } else if (ent.kind === 'creature') {
        ctx.fillStyle = '#ef4444';
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = '#22c55e';
        ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Center Player Triangle
    const rad = (hud.yawDeg * Math.PI) / 180;
    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(rad);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [graphics.showMinimap, hud.coords.x, hud.coords.z, hud.minimapEntities, hud.yawDeg]);

  const staminaPct = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Subtle fear/3AM peripheral vignette */}
      {(hud.fearLevel > 15 || hud.isThreeAM) && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 ${hud.chasedBy ? 140 : 80}px rgba(${
              hud.chasedBy ? '185, 28, 28' : '15, 10, 26'
            }, ${hud.chasedBy ? 0.55 : 0.35})`,
          }}
        />
      )}

      {/* Top Bar: Clock + Chapter (Left), Compass (Center desktop), Utility Buttons (Right) */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex items-start justify-between gap-2">
        <div className="max-w-[195px] sm:max-w-[310px] rounded-xl bg-[#13101a]/92 border border-[#3a2f28] px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-lg">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              data-testid="hud-clock"
              className={`font-mono-tabular text-xl sm:text-2xl font-bold leading-none ${
                hud.isThreeAM ? 'text-[#ef4444]' : 'text-[#fbbf24]'
              }`}
            >
              {hud.gameTimeFormatted}
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#cbbca8] truncate">
              Dia {hud.dayNumber} · {hud.periodLabel}
            </span>
          </div>
          <div className="mt-1 text-[11px] sm:text-xs font-bold text-[#f7efe4] truncate">
            {hud.chapterTitle}
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#f59e0b] leading-snug line-clamp-2">
            {hud.currentObjective}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-medium text-[#a39482]">
            <span className="truncate">{hud.locationName}</span>
            <span className="hidden sm:inline-flex items-center gap-1 shrink-0">
              {hud.weather === 'chuva' || hud.weather === 'tempestade' ? (
                <CloudRain className="w-3 h-3 text-[#38bdf8]" />
              ) : (
                <Sun className="w-3 h-3 text-[#fbbf24]" />
              )}
              {WEATHER_LABEL[hud.weather]}
            </span>
          </div>
        </div>

        {/* Center Compass (Desktop/Tablet) */}
        <div className="hidden md:flex flex-col items-center rounded-xl bg-[#13101a]/88 border border-[#3a2f28] px-4 py-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-[#fef3c7]">
            <span className="text-[#f59e0b]">{compassCardinal(hud.yawDeg)}</span>
            <span className="font-mono-tabular text-[11px] text-[#cbbca8]">
              {hud.yawDeg}°
            </span>
            <span className="text-[10px] text-[#a39482]">· {hud.moonPhaseLabel}</span>
          </div>
          <div className="text-[10px] font-mono-tabular text-[#9ca3af]">
            X:{hud.coords.x} · Y:{hud.coords.y} · Z:{hud.coords.z}
          </div>
        </div>

        {/* Right Utility Buttons */}
        <div className="flex flex-wrap justify-end items-center gap-1 sm:gap-1.5 max-w-[165px] sm:max-w-none pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Mapa Regional"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenMap();
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#13101a]/90 border border-[#3a2f28] text-[#f59e0b] hover:bg-[#262033] cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Diário de Missões"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenPause('diario');
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#13101a]/90 border border-[#3a2f28] text-[#f3eadc] hover:bg-[#262033] cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Mochila"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenPause('inventario');
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#13101a]/90 border border-[#3a2f28] text-[#f3eadc] hover:bg-[#262033] cursor-pointer"
          >
            <Backpack className="w-4 h-4" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Salvar Progresso"
            onClick={(e) => {
              e.currentTarget.blur();
              onQuickSave();
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#13101a]/90 border border-[#3a2f28] text-[#f3eadc] hover:bg-[#262033] cursor-pointer"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Ativar Som' : 'Silenciar Som'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#13101a]/90 border border-[#3a2f28] text-[#f3eadc] hover:bg-[#262033] cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-[#ef4444]" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Pausar Jogo"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenPause('pausa');
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#13101a]/90 border border-[#3a2f28] text-[#f3eadc] hover:bg-[#262033] cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chase / Suspicion Warning */}
      {hud.chasedBy ? (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 rounded-lg bg-[#7f1d1d]/95 border border-[#ef4444] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
          CORRA! {hud.chasedBy} está te perseguindo!
        </div>
      ) : hud.suspiciousBy ? (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 rounded-lg bg-[#78350f]/92 border border-[#f59e0b] px-4 py-1.5 text-xs font-bold text-[#fef3c7] shadow-lg">
          CUIDADO! {hud.suspiciousBy} ouviu ou suspeitou de você...
        </div>
      ) : null}

      {/* Optional Diagnostics */}
      {graphics.showDiagnostics && hud.diagnostics && (
        <div className="hidden sm:block absolute top-20 left-4 rounded-lg bg-[#0d0b12]/90 border border-[#332c3d] px-3 py-2 text-[10px] font-mono-tabular text-[#cbd5e1] space-y-0.5">
          <div>FPS: {hud.diagnostics.fps} · Colisores: {hud.diagnostics.activeColliders}</div>
          <div>Região: {hud.diagnostics.region}</div>
          <div className="max-w-xs truncate">{hud.diagnostics.creatureModes}</div>
        </div>
      )}

      {/* Center Crosshair */}
      {!dialogue && !notice && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#fff7ed]/85 shadow" />
      )}

      {/* Interaction Prompt */}
      {hud.interactPrompt && !dialogue && !notice && (
        <div className="fixed left-1/2 top-[56%] -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={onTouchInteract}
            className="rounded-lg bg-[#14111c]/92 border border-[#d97706] px-4 py-2 text-xs font-bold text-[#fef3c7] shadow-lg cursor-pointer"
          >
            {hud.interactPrompt}
          </button>
        </div>
      )}

      {/* Subtitle Bar */}
      {hud.subtitle && !dialogue && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-lg w-[90vw] rounded-xl bg-[#110e17]/92 border border-[#3b2f28] px-4 py-2.5 text-center shadow-lg">
          <span className="text-xs font-bold text-[#f59e0b] mr-2">{hud.subtitle.speaker}:</span>
          <span className="text-sm text-[#f7efe4]">{hud.subtitle.text}</span>
        </div>
      )}

      {/* Bottom-Left Stamina + Vitals + States */}
      <div
        className={`absolute ${
          isTouchViewport ? 'bottom-40' : 'bottom-4'
        } left-4 w-52 sm:w-56 rounded-xl bg-[#13101a]/90 border border-[#3a2f28] px-3 py-2 shadow-lg`}
      >
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#d4c3af] mb-1">
          <span>Energia</span>
          <span className="font-mono-tabular">{hud.stamina}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#272230] overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              staminaPct < 25 ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'
            }`}
            style={{ width: `${staminaPct}%` }}
          />
        </div>

        {/* Hunger / Hydration / Fatigue Mini Bars */}
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-[9px] text-[#b9ab9a]">
          <div>
            <div className="flex justify-between">
              <span>Fome</span>
              <span>{hud.hunger}%</span>
            </div>
            <div className="h-1 rounded bg-[#272230] overflow-hidden mt-0.5">
              <div className="h-full bg-[#22c55e]" style={{ width: `${hud.hunger}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <span>Sede</span>
              <span>{hud.hydration}%</span>
            </div>
            <div className="h-1 rounded bg-[#272230] overflow-hidden mt-0.5">
              <div className="h-full bg-[#38bdf8]" style={{ width: `${hud.hydration}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <span>Sono</span>
              <span>{hud.fatigue}%</span>
            </div>
            <div className="h-1 rounded bg-[#272230] overflow-hidden mt-0.5">
              <div className="h-full bg-[#a855f7]" style={{ width: `${hud.fatigue}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#cbbca8]">
          <span>{hud.flashlightOn ? 'Lanterna: Acesa' : 'Lanterna: [F]'}</span>
          {hud.isCrouching && <span>· Agachado</span>}
          {hud.isHiding && <span className="text-[#fbbf24]">· Escondido</span>}
          {hud.onBike && (
            <span className="inline-flex items-center gap-0.5 text-[#38bdf8]">
              · <Bike className="w-3 h-3" /> Bike
            </span>
          )}
        </div>
      </div>

      {/* Bottom-Right Live Minimap (Desktop / Non-touch) */}
      {graphics.showMinimap && !isTouchViewport && (
        <div className="hidden sm:flex flex-col items-center absolute bottom-4 right-4 rounded-xl bg-[#13101a]/92 border border-[#3a2f28] p-2 shadow-lg pointer-events-auto">
          <canvas
            ref={minimapCanvasRef}
            width={118}
            height={118}
            className="rounded-lg border border-[#2a2333]"
          />
          <button
            type="button"
            onClick={onOpenMap}
            className="mt-1.5 text-[10px] font-semibold text-[#fbbf24] hover:underline cursor-pointer"
          >
            [M] Mapa Completo
          </button>
        </div>
      )}

      {/* NPC Dialogue Modal */}
      {dialogue && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 pointer-events-auto">
          <div
            role="dialog"
            aria-label={`Conversa com ${dialogue.speaker}`}
            className="w-full max-w-2xl rounded-2xl bg-[#16131d]/96 border border-[#d97706] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-display text-lg font-bold text-[#f59e0b]">
                  {dialogue.speaker}
                </span>
                <span className="ml-2 text-xs text-[#b9ab9a]">· {dialogue.role}</span>
              </div>
              <button
                type="button"
                onClick={onCloseDialogue}
                className="text-xs text-[#cbbca8] hover:text-white cursor-pointer"
              >
                Fechar
              </button>
            </div>
            <p className="text-sm md:text-base text-[#f8f1e5] leading-relaxed mb-4">
              "{dialogue.text}"
            </p>
            <div className="flex flex-wrap gap-2">
              {dialogue.choices?.map((ch, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onDialogueChoice(ch.nextId, ch.action, ch.reputationDelta)}
                  className="rounded-xl bg-[#272133] border border-[#4b3c31] hover:border-[#f59e0b] px-4 py-2 text-xs md:text-sm font-semibold text-[#fef3c7] cursor-pointer"
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sign / Lore Notice */}
      {notice && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#09080d]/70 p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-label={notice.title}
            className="w-full max-w-md rounded-2xl bg-[#1d1826] border border-[#d97706] p-5 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-[#fbbf24] mb-2">
              {notice.title}
            </h3>
            <p className="text-sm text-[#f5efe6] leading-relaxed mb-4">{notice.text}</p>
            <button
              type="button"
              onClick={onCloseNotice}
              className="w-full rounded-xl bg-[#d97706] py-2.5 text-sm font-bold text-[#120e16] hover:bg-[#f59e0b] cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Mobile / Touch Controls */}
      {isTouchViewport && !dialogue && !notice && (
        <>
          <div
            className="fixed top-20 right-0 bottom-36 left-1/2 pointer-events-auto"
            onTouchStart={(e) => {
              const t = e.changedTouches[0];
              lookTouchId.current = t.identifier;
              lookPrev.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchMove={(e) => {
              for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === lookTouchId.current) {
                  const dx = t.clientX - lookPrev.current.x;
                  const dy = t.clientY - lookPrev.current.y;
                  lookPrev.current = { x: t.clientX, y: t.clientY };
                  onTouchInputUpdate({ lookDeltaX: dx * 1.3, lookDeltaY: dy * 1.3 });
                }
              }
            }}
            onTouchEnd={() => {
              lookTouchId.current = null;
            }}
          />

          <div
            aria-label="Joystick Virtual"
            className="fixed bottom-5 left-5 w-28 h-28 rounded-full bg-[#15121c]/80 border-2 border-[#4f3e32] pointer-events-auto flex items-center justify-center"
            onTouchStart={(e) => {
              const t = e.changedTouches[0];
              joyOrigin.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchMove={(e) => {
              if (!joyOrigin.current) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - joyOrigin.current.x;
              const dy = t.clientY - joyOrigin.current.y;
              const maxR = 40;
              const dist = Math.hypot(dx, dy);
              const clamped = dist > maxR ? maxR / dist : 1;
              const kx = dx * clamped;
              const ky = dy * clamped;
              setJoystickKnob({ x: kx, y: ky });
              onTouchInputUpdate({ moveX: kx / maxR, moveY: -ky / maxR });
            }}
            onTouchEnd={() => {
              joyOrigin.current = null;
              setJoystickKnob({ x: 0, y: 0 });
              onTouchInputUpdate({ moveX: 0, moveY: 0 });
            }}
          >
            <div
              className="w-11 h-11 rounded-full bg-[#d97706] border-2 border-[#fef3c7]"
              style={{
                transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
              }}
            />
          </div>

          <div className="fixed bottom-5 right-5 grid grid-cols-2 gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={onTouchInteract}
              className="h-12 px-3 rounded-xl bg-[#d97706] text-[#110e15] text-xs font-bold shadow-lg"
            >
              Interagir
            </button>
            <button
              type="button"
              onClick={onTouchFlashlight}
              className="h-12 px-3 rounded-xl bg-[#1b1724]/92 border border-[#4a3a2f] text-[#fef3c7] text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Flashlight className="w-3.5 h-3.5" /> Luz
            </button>
            <button
              type="button"
              onTouchStart={() => onTouchInputUpdate({ sprint: true })}
              onTouchEnd={() => onTouchInputUpdate({ sprint: false })}
              className="h-11 px-3 rounded-xl bg-[#1b1724]/92 border border-[#4a3a2f] text-[#fef3c7] text-xs font-semibold"
            >
              Correr
            </button>
            <button
              type="button"
              onClick={onTouchJump}
              className="h-11 px-3 rounded-xl bg-[#1b1724]/92 border border-[#4a3a2f] text-[#fef3c7] text-xs font-semibold"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={onTouchCrouch}
              className="col-span-2 h-10 rounded-xl bg-[#1b1724]/92 border border-[#4a3a2f] text-[#cbbca8] text-xs font-semibold"
            >
              Agachar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
