import { Check, RotateCcw } from 'lucide-react';
import { DEFAULT_CUSTOMIZATION } from '../game/storage';
import type { CustomizationConfig } from '../game/types';
import { CharacterPreview3D } from './CharacterPreview3D';

interface Props {
  config: CustomizationConfig;
  onChange: (next: CustomizationConfig) => void;
  onClose: () => void;
}

const SHIRT_COLORS = [
  { label: 'Mostarda', hex: '#d97706' },
  { label: 'Verde Brasil', hex: '#15803d' },
  { label: 'Vermelho Roça', hex: '#b91c1c' },
  { label: 'Azul Celeste', hex: '#1d4ed8' },
  { label: 'Preto', hex: '#18181b' },
  { label: 'Branco', hex: '#e7e5e4' },
];

const PANTS_COLORS = [
  { label: 'Jeans', hex: '#1e3a5f' },
  { label: 'Cáqui', hex: '#92704b' },
  { label: 'Preto', hex: '#1c1917' },
  { label: 'Cinza', hex: '#4b5563' },
];

const SHOE_COLORS = [
  { label: 'Branco', hex: '#f5f5f4' },
  { label: 'Couro Marrom', hex: '#5c3a21' },
  { label: 'Preto', hex: '#18181b' },
  { label: 'Vermelho', hex: '#dc2626' },
];

const SKIN_TONES = [
  { label: 'Claro', hex: '#f2c9a5' },
  { label: 'Pardo Claro', hex: '#d6a37a' },
  { label: 'Pardo', hex: '#a46e48' },
  { label: 'Negro', hex: '#593722' },
];

const HAIR_COLORS = [
  { label: 'Castanho Escuro', hex: '#1f1612' },
  { label: 'Castanho', hex: '#5c3a21' },
  { label: 'Loiro', hex: '#eab308' },
  { label: 'Ruivo', hex: '#b45309' },
  { label: 'Grisalho', hex: '#9ca3af' },
];

const CAP_COLORS = [
  { label: 'Vermelho', hex: '#b91c1c' },
  { label: 'Azul', hex: '#1d4ed8' },
  { label: 'Palha/Marrom', hex: '#92400e' },
  { label: 'Preto', hex: '#18181b' },
];

export function CustomizationModal({ config, onChange, onClose }: Props) {
  const update = <K extends keyof CustomizationConfig>(key: K, val: CustomizationConfig[K]) => {
    onChange({ ...config, [key]: val });
  };

  return (
    <div
      role="dialog"
      aria-label="Personalizar Protagonista"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#09080d]/92 p-3 sm:p-4"
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#1a1721] border border-[#3e3229] p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2e2636] pb-4 mb-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#f8f1e5]">
              Personalizar Protagonista
            </h2>
            <p className="text-xs sm:text-sm text-[#b9ab9a]">
              Roupas, calçados, chapéus, acessórios e mochila em tempo real 3D
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_CUSTOMIZATION })}
              className="flex items-center gap-1.5 rounded-lg border border-[#3e3229] bg-[#24202e] px-3 py-2 text-xs font-medium text-[#e4d7c5] hover:bg-[#2f293b] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Padrão
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg bg-[#d97706] px-4 py-2 text-sm font-semibold text-[#110e15] hover:bg-[#f59e0b] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Visual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-5 h-[320px] md:h-auto min-h-[320px]">
            <CharacterPreview3D config={config} />
          </div>

          <div className="md:col-span-7 space-y-4">
            {/* Parte de cima: Estilo & Cor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Estilo da Parte Superior
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'camiseta', label: 'Camiseta' },
                      { id: 'xadrez', label: 'Camisa Xadrez' },
                      { id: 'jaqueta', label: 'Jaqueta' },
                      { id: 'regata', label: 'Regata' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => update('shirtStyle', st.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs border cursor-pointer ${
                        config.shirtStyle === st.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Cor da Roupa
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SHIRT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => update('shirtColor', c.hex)}
                      className={`w-7 h-7 rounded-lg border-2 cursor-pointer ${
                        config.shirtColor === c.hex ? 'border-[#f59e0b]' : 'border-[#332c3e]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Parte de baixo & Calçado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Calça / Bermuda
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      { id: 'calca', label: 'Calça Comprida' },
                      { id: 'bermuda', label: 'Bermuda' },
                    ] as const
                  ).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => update('bottomStyle', b.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs border cursor-pointer ${
                        config.bottomStyle === b.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PANTS_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => update('pantsColor', c.hex)}
                      className={`w-7 h-7 rounded-lg border-2 cursor-pointer ${
                        config.pantsColor === c.hex ? 'border-[#f59e0b]' : 'border-[#332c3e]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Calçado
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      { id: 'tenis', label: 'Tênis' },
                      { id: 'bota', label: 'Botina Mineira' },
                    ] as const
                  ).map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => update('shoeStyle', sh.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs border cursor-pointer ${
                        config.shoeStyle === sh.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SHOE_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => update('shoeColor', c.hex)}
                      className={`w-7 h-7 rounded-lg border-2 cursor-pointer ${
                        config.shoeColor === c.hex ? 'border-[#f59e0b]' : 'border-[#332c3e]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Chapéu */}
            <div>
              <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                Boné / Chapéu & Cor
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'aba_reta', label: 'Boné' },
                    { id: 'palha', label: 'Palha' },
                    { id: 'vaqueiro', label: 'Vaqueiro' },
                    { id: 'gorro', label: 'Gorro' },
                    { id: 'nenhum', label: 'Nenhum' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update('capStyle', opt.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs border cursor-pointer ${
                      config.capStyle === opt.id
                        ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                        : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-1">
                  {CAP_COLORS.map((cc) => (
                    <button
                      key={cc.hex}
                      type="button"
                      title={cc.label}
                      onClick={() => update('capColor', cc.hex)}
                      className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
                        config.capColor === cc.hex ? 'border-[#f59e0b]' : 'border-[#332c3e]'
                      }`}
                      style={{ backgroundColor: cc.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cabelo & Pele */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Cabelo & Cor
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      { id: 'curto', label: 'Curto' },
                      { id: 'cacheado', label: 'Cacheado' },
                      { id: 'moicano', label: 'Moicano' },
                      { id: 'longo', label: 'Longo' },
                      { id: 'careca', label: 'Careca' },
                    ] as const
                  ).map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => update('hairStyle', h.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs border cursor-pointer ${
                        config.hairStyle === h.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HAIR_COLORS.map((hc) => (
                    <button
                      key={hc.hex}
                      type="button"
                      title={hc.label}
                      onClick={() => update('hairColor', hc.hex)}
                      className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
                        config.hairColor === hc.hex ? 'border-[#f59e0b]' : 'border-[#332c3e]'
                      }`}
                      style={{ backgroundColor: hc.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Tom de Pele
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map((s) => (
                    <button
                      key={s.hex}
                      type="button"
                      aria-label={`Tom de pele ${s.label}`}
                      onClick={() => update('skinTone', s.hex)}
                      className={`w-8 h-8 rounded-lg border-2 cursor-pointer ${
                        config.skinTone === s.hex ? 'border-[#f59e0b]' : 'border-[#332c3e]'
                      }`}
                      style={{ backgroundColor: s.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Óculos, Mochila, Relógio & Acessório */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Óculos & Relógio
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      { id: 'nenhum', label: 'Sem Óculos' },
                      { id: 'escuros', label: 'Escuros' },
                      { id: 'grau', label: 'De Grau' },
                    ] as const
                  ).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => update('glasses', g.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                        config.glasses === g.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'nenhum', label: 'Sem Relógio' },
                      { id: 'digital', label: 'Digital' },
                      { id: 'dourado', label: 'Dourado' },
                    ] as const
                  ).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => update('watch', w.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                        config.watch === w.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4c3af] mb-1.5">
                  Mochila & Acessório Extra
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      { id: 'viagem', label: 'Mochila Viagem' },
                      { id: 'escolar', label: 'Escolar' },
                      { id: 'nenhum', label: 'Sem Mochila' },
                    ] as const
                  ).map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => update('backpack', bp.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                        config.backpack === bp.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'nenhum', label: 'Nenhum' },
                      { id: 'fone', label: 'Fone' },
                      { id: 'cordao', label: 'Cordão' },
                      { id: 'lenco', label: 'Lenço Caipira' },
                    ] as const
                  ).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => update('accessory', acc.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                        config.accessory === acc.id
                          ? 'border-[#f59e0b] bg-[#2c2536] text-white'
                          : 'border-[#332c3e] bg-[#211d2a] text-[#cbbca8]'
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
