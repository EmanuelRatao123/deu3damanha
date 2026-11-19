import { Compass, MapPin, Navigation, X } from 'lucide-react';
import { useState } from 'react';
import { REGIONS_18 } from '../game/physics';
import type { RegionId, RegionInfo } from '../game/types';

interface Props {
  playerCoords: { x: number; y: number; z: number };
  currentRegionId: RegionId;
  discoveredRegions: RegionId[];
  onSetWaypoint: (x: number, z: number, label: string) => void;
  onClose: () => void;
}

const DANGER_BADGE: Record<RegionInfo['dangerLevel'], { label: string; color: string }> = {
  baixo: { label: 'Risco Baixo', color: 'text-[#86efac] border-[#166534] bg-[#14532d]/40' },
  medio: { label: 'Risco Médio', color: 'text-[#fde047] border-[#854d0e] bg-[#713f12]/40' },
  alto: { label: 'Risco Alto', color: 'text-[#fdba74] border-[#9a3412] bg-[#7c2d12]/40' },
  extremo: { label: 'Perigo Extremo', color: 'text-[#fca5a5] border-[#991b1b] bg-[#7f1d1d]/50' },
};

export function InteractiveMapModal({
  playerCoords,
  currentRegionId,
  discoveredRegions,
  onSetWaypoint,
  onClose,
}: Props) {
  const initialRegion = REGIONS_18.find((r) => r.id === currentRegionId) ?? REGIONS_18[0];
  const [selected, setSelected] = useState<RegionInfo>(initialRegion);

  // World spans roughly -115..+115 in both X and Z
  const toPct = (val: number) => Math.max(6, Math.min(94, ((val + 115) / 230) * 100));

  const isDiscovered = (id: RegionId) => discoveredRegions.includes(id);

  return (
    <div
      role="dialog"
      aria-label="Mapa Interativo de Santa Batata"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#09080d]/92 p-3 sm:p-5"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#191622] border border-[#3e3229] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#2e2636] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#f8f1e5]">
                Mapa Regional de Santa Batata
              </h2>
              <p className="text-xs text-[#b9ab9a]">
                {discoveredRegions.length} de 18 regiões descobertas · Clique em uma região para marcar no radar
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar Mapa"
            onClick={onClose}
            className="rounded-lg p-2 text-[#cbbca8] hover:bg-[#2a2536] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5 overflow-y-auto">
          {/* Interactive Map Canvas */}
          <div className="lg:col-span-8 relative aspect-square max-h-[64vh] w-full rounded-xl bg-[#121018] border border-[#342a24] overflow-hidden">
            {/* Cardinal Labels */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#8b7d6b]">
              NORTE (Z-)
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#8b7d6b]">
              SUL (Z+)
            </span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8b7d6b]">
              OESTE
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8b7d6b]">
              LESTE
            </span>

            {/* Grid Lines */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #5c4938 1px, transparent 1px), linear-gradient(to bottom, #5c4938 1px, transparent 1px)',
                backgroundSize: '12.5% 12.5%',
              }}
            />

            {/* Road cross lines */}
            <div
              className="absolute bg-[#6b4f34]/35 pointer-events-none"
              style={{ left: '49%', width: '2%', top: '8%', height: '84%' }}
            />
            <div
              className="absolute bg-[#6b4f34]/35 pointer-events-none"
              style={{ top: '44%', height: '2%', left: '8%', width: '84%' }}
            />

            {/* 18 Region Pins */}
            {REGIONS_18.map((reg) => {
              const found = isDiscovered(reg.id);
              const isSelected = selected.id === reg.id;
              const isHere = reg.id === currentRegionId;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setSelected(reg)}
                  style={{
                    left: `${toPct(reg.x)}%`,
                    top: `${toPct(reg.z)}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center cursor-pointer ${
                    isSelected ? 'z-20' : 'z-10'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-bold transition-transform ${
                      isHere
                        ? 'bg-[#22c55e] border-white text-[#08120c] scale-110'
                        : isSelected
                          ? 'bg-[#f59e0b] border-white text-[#120e16] scale-110'
                          : found
                            ? 'bg-[#2a2335] border-[#d97706] text-[#fef3c7]'
                            : 'bg-[#1c1824] border-[#4b3e33] text-[#9ca3af]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <span
                    className={`mt-2 rounded px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#f59e0b] text-[#110e15]'
                        : 'bg-[#110e17]/92 text-[#e6d8c5]'
                    }`}
                  >
                    {reg.name.replace(' (Centro)', '')}
                  </span>
                </button>
              );
            })}

            {/* Player Dot */}
            <div
              style={{
                left: `${toPct(playerCoords.x)}%`,
                top: `${toPct(playerCoords.z)}%`,
              }}
              title="Sua posição atual"
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
            >
              <span className="block w-3 h-3 rounded-full bg-[#38bdf8] border-2 border-white shadow-lg" />
            </div>
          </div>

          {/* Selected Region Inspector */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4 rounded-xl bg-[#201c2a] border border-[#362e42] p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                    DANGER_BADGE[selected.dangerLevel].color
                  }`}
                >
                  {DANGER_BADGE[selected.dangerLevel].label}
                </span>
                <span className="font-mono-tabular text-xs text-[#a39482]">
                  X: {selected.x} · Z: {selected.z}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-[#fef3c7]">
                  {selected.name}
                </h3>
                <p className="text-xs text-[#cbbca8] mt-1 leading-relaxed">
                  {selected.subtitle}
                </p>
              </div>

              <div className="rounded-lg bg-[#16131d] border border-[#2d2638] p-3 text-xs space-y-1">
                <div className="text-[#a39482]">
                  Situação:{' '}
                  <strong className="text-[#f5efe6]">
                    {isDiscovered(selected.id) ? 'Região Explorada' : 'Ainda não visitada'}
                  </strong>
                </div>
                <div className="text-[#a39482]">
                  Distância de você:{' '}
                  <strong className="font-mono-tabular text-[#fbbf24]">
                    {Math.round(Math.hypot(selected.x - playerCoords.x, selected.z - playerCoords.z))}m
                  </strong>
                </div>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-[#a39482]">Acesso Rápido (18 Regiões)</div>
                <div className="grid grid-cols-1 gap-1">
                  {REGIONS_18.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1 text-left text-[11px] cursor-pointer ${
                        selected.id === r.id
                          ? 'bg-[#d97706] text-[#110e15] font-bold'
                          : 'bg-[#191622] text-[#d4c3af] hover:bg-[#2a2436]'
                      }`}
                    >
                      <span className="truncate">{r.name}</span>
                      <span>{isDiscovered(r.id) ? '✓' : '·'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onSetWaypoint(selected.x, selected.z, selected.name);
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#d97706] px-4 py-3 text-sm font-bold text-[#110e15] hover:bg-[#f59e0b] cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Marcar Destino no Radar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
