import { Compass, Home, RotateCcw } from 'lucide-react';
import { ENDING_DETAILS } from '../game/campaign';
import type { ChapterNumber, EndingType } from '../game/types';

interface Props {
  ending: EndingType;
  stats: { chapter: ChapterNumber; time: string; itemsCount: number; loreCount: number };
  onPlayAgain: () => void;
  onFreeExplore: () => void;
  onReturnToTitle: () => void;
}

export function EndScreen({
  ending,
  stats,
  onPlayAgain,
  onFreeExplore,
  onReturnToTitle,
}: Props) {
  const detail = ENDING_DETAILS[ending];

  return (
    <div
      role="dialog"
      aria-label={detail.title}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#08070c]/92 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1721] border border-[#d97706] p-7 shadow-2xl">
        <div className="text-xs font-bold tracking-wider text-[#f59e0b]">
          {detail.badge}
        </div>
        <h2 className="font-display text-3xl font-extrabold text-[#fbf5eb] mt-1">
          {detail.title}
        </h2>
        <p className="text-sm font-semibold text-[#cbbca8] mt-1">{detail.subtitle}</p>

        <p className="text-sm text-[#e8dfd2] leading-relaxed mt-4">{detail.description}</p>

        <div className="grid grid-cols-4 gap-2.5 mt-6 rounded-xl bg-[#13101a] border border-[#322a38] p-3.5 text-center">
          <div>
            <div className="text-[11px] text-[#a39482]">Capítulo</div>
            <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
              {stats.chapter}/15
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#a39482]">Relógio</div>
            <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
              {stats.time}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#a39482]">Itens</div>
            <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
              {stats.itemsCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#a39482]">Lore</div>
            <div className="font-mono-tabular text-base font-bold text-[#fbbf24]">
              {stats.loreCount}/20
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mt-6">
          {detail.victory && (
            <button
              type="button"
              onClick={onFreeExplore}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#15803d] px-5 py-3 text-sm font-bold text-white hover:bg-[#16a34a] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Explorar Livremente (Pós-Campanha · 18 Regiões)
            </button>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#d97706] px-5 py-3 text-sm font-bold text-[#120e16] hover:bg-[#f59e0b] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Jogar Novamente
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#252030] border border-[#42362d] px-5 py-3 text-sm font-semibold text-[#f5efe6] hover:bg-[#312a3f] cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
