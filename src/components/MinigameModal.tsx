import { Award, Fish, Grid, Radio, Spade, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MinigameId } from '../game/types';

interface Props {
  minigameId: MinigameId;
  onFinish: (id: MinigameId, won: boolean) => void;
  onClose: () => void;
}

const TITLES: Record<MinigameId, string> = {
  pesca: 'Pescaria na Vila dos Pescadores',
  cartas: 'Truco Mineiro na Praça Central',
  memoria: 'Jogo da Memória do Folclore',
  enigma_radio: 'Sintonizador de 1958 (Frequência Aurora)',
  caca_tesouro: 'Cofrinho de Relíquias de Nhô Batata',
};

export function MinigameModal({ minigameId, onFinish, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-label={TITLES[minigameId]}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09080d]/88 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1721] border border-[#d97706] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-[#2e2636] pb-3 mb-4">
          <h3 className="font-display text-lg font-bold text-[#fbbf24]">
            {TITLES[minigameId]}
          </h3>
          <button
            type="button"
            aria-label="Sair do minijogo"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#cbbca8] hover:bg-[#2a2536] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {minigameId === 'pesca' && <PescaGame onWin={() => onFinish('pesca', true)} onLose={onClose} />}
        {minigameId === 'cartas' && <TrucoGame onWin={() => onFinish('cartas', true)} />}
        {minigameId === 'memoria' && <MemoriaGame onWin={() => onFinish('memoria', true)} />}
        {minigameId === 'enigma_radio' && <RadioGame onWin={() => onFinish('enigma_radio', true)} />}
        {minigameId === 'caca_tesouro' && <TesouroGame onWin={() => onFinish('caca_tesouro', true)} />}
      </div>
    </div>
  );
}

function PescaGame({ onWin, onLose }: { onWin: () => void; onLose: () => void }) {
  const [pos, setPos] = useState(15);
  const [caught, setCaught] = useState(0);
  const [msg, setMsg] = useState('Aperte "Puxar Linha" quando o peixe estiver na zona dourada (42%–62%)!');

  useEffect(() => {
    const id = window.setInterval(() => {
      setPos((p) => {
        const next = p + 6;
        return next > 95 ? 5 : next;
      });
    }, 65);
    return () => window.clearInterval(id);
  }, []);

  const pull = () => {
    if (pos >= 40 && pos <= 64) {
      const next = caught + 1;
      setCaught(next);
      if (next >= 3) {
        onWin();
      } else {
        setMsg(`Boa! Fisgou ${next}/3. Puxe mais!`);
      }
    } else {
      setMsg('Quase! Espere o peixe passar na faixa dourada!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#e6d8c5]">
        <Fish className="w-5 h-5 text-[#38bdf8]" />
        <span>Peixes fisgados: <strong>{caught}/3</strong></span>
      </div>
      <p className="text-xs text-[#cbbca8]">{msg}</p>

      <div className="relative h-8 w-full rounded-lg bg-[#110e17] border border-[#3e3229] overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-[#d97706]/35 border-x-2 border-[#f59e0b]"
          style={{ left: '40%', width: '24%' }}
        />
        <div
          className="absolute top-1 bottom-1 w-3 rounded bg-[#38bdf8] shadow"
          style={{ left: `${pos}%` }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={pull}
          className="flex-1 rounded-xl bg-[#d97706] py-2.5 text-sm font-bold text-[#110e15] hover:bg-[#f59e0b] cursor-pointer"
        >
          Puxar Linha!
        </button>
        <button
          type="button"
          onClick={onLose}
          className="rounded-xl bg-[#252030] border border-[#42362d] px-4 py-2.5 text-xs font-semibold text-[#cbbca8] cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TrucoGame({ onWin }: { onWin: () => void }) {
  const [pts, setPts] = useState(0);
  const [oppPts, setOppPts] = useState(0);
  const [log, setLog] = useState('Seu Zé e Tião apostaram um saco de milho. Escolha sua carta!');
  const cards = [
    { name: '4 de Paus (ZAP)', power: 10 },
    { name: '7 de Copas', power: 8 },
    { name: 'Ás de Espadas', power: 7 },
  ];

  const playCard = (power: number, label: string) => {
    const cpu = [5, 6, 9][Math.floor(Math.random() * 3)];
    if (power >= cpu) {
      const next = pts + 3;
      setPts(next);
      setLog(`Você jogou ${label} e venceu a mão (+3 tentos)!`);
      if (next >= 6) onWin();
    } else {
      const nextO = oppPts + 3;
      setOppPts(nextO);
      setLog(`Tião gritou TRUCO e levou a rodada! Continue tentando!`);
      if (nextO >= 9) {
        setPts(0);
        setOppPts(0);
        setLog('Nova melhor de 6 tentos iniciada!');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[#e6d8c5]">
        <span className="flex items-center gap-1.5">
          <Spade className="w-4 h-4 text-[#f59e0b]" /> Você: <strong>{pts}/6</strong>
        </span>
        <span>Tião: <strong>{oppPts}/9</strong></span>
      </div>
      <p className="text-xs text-[#cbbca8]">{log}</p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => playCard(c.power, c.name)}
            className="rounded-xl bg-[#241f30] border border-[#4a3b30] hover:border-[#f59e0b] p-3 text-center text-xs font-bold text-[#fef3c7] cursor-pointer"
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoriaGame({ onWin }: { onWin: () => void }) {
  const symbols = ['🌽', '☕', '🕯️', '🐔', '👒', '📻'];
  const [deck] = useState(() =>
    [...symbols, ...symbols].sort(() => Math.random() - 0.5),
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  const clickCard = (idx: number) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next;
      if (deck[a] === deck[b]) {
        const nextMatched = [...matched, a, b];
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === deck.length) {
          window.setTimeout(onWin, 300);
        }
      } else {
        window.setTimeout(() => setFlipped([]), 520);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-[#cbbca8]">
        <Grid className="w-4 h-4 text-[#f59e0b]" />
        Combine os 6 pares folclóricos do Saci para ganhar o Amuleto de Ipê!
      </div>
      <div className="grid grid-cols-4 gap-2">
        {deck.map((sym, i) => {
          const open = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => clickCard(i)}
              className={`h-14 rounded-xl border text-xl font-bold cursor-pointer ${
                open
                  ? 'bg-[#2c2538] border-[#f59e0b]'
                  : 'bg-[#1c1826] border-[#3a312c] text-[#8b7d6b]'
              }`}
            >
              {open ? sym : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGame({ onWin }: { onWin: () => void }) {
  const [freq, setFreq] = useState(500);
  const target = 300;
  const dist = Math.abs(freq - target);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#cbbca8]">
        <Radio className="w-4 h-4 text-[#f59e0b]" />
        Ajuste o dial exatamente para a frequência da Primeira Madrugada (300 kHz).
      </div>
      <div className="rounded-xl bg-[#121018] border border-[#3a312c] p-4 text-center">
        <div className="font-mono-tabular text-3xl font-bold text-[#fbbf24]">{freq} kHz</div>
        <div className="text-xs text-[#a39482] mt-1">
          {dist <= 5 ? 'SINAL LÍMPIDO DE 1958 DETECTADO!' : dist < 50 ? 'Chiado quase sumindo...' : 'Muita estática na linha...'}
        </div>
      </div>
      <input
        type="range"
        min={100}
        max={900}
        step={5}
        value={freq}
        onChange={(e) => setFreq(Number(e.target.value))}
        className="w-full accent-[#d97706]"
      />
      <button
        type="button"
        disabled={dist > 5}
        onClick={onWin}
        className={`w-full rounded-xl py-2.5 text-sm font-bold ${
          dist <= 5
            ? 'bg-[#d97706] text-[#110e15] hover:bg-[#f59e0b] cursor-pointer'
            : 'bg-[#252030] text-[#7c7166] cursor-not-allowed'
        }`}
      >
        Gravar Transmissão Oculta
      </button>
    </div>
  );
}

function TesouroGame({ onWin }: { onWin: () => void }) {
  const [code, setCode] = useState([1, 0, 0, 0]);
  const target = [1, 9, 2, 4];
  const isOk = code.every((v, i) => v === target[i]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#cbbca8]">
        <Award className="w-4 h-4 text-[#f59e0b]" />
        Insira o ano de fundação da Mina Desativada (1924) para abrir o cofre de Nhô Batata.
      </div>
      <div className="grid grid-cols-4 gap-2">
        {code.map((digit, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() =>
              setCode((prev) => prev.map((d, i) => (i === idx ? (d + 1) % 10 : d)))
            }
            className="h-16 rounded-xl bg-[#241f30] border border-[#d97706] font-mono-tabular text-2xl font-bold text-[#fef3c7] cursor-pointer"
          >
            {digit}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!isOk}
        onClick={onWin}
        className={`w-full rounded-xl py-2.5 text-sm font-bold ${
          isOk
            ? 'bg-[#d97706] text-[#110e15] hover:bg-[#f59e0b] cursor-pointer'
            : 'bg-[#252030] text-[#7c7166] cursor-not-allowed'
        }`}
      >
        Destravar Relíquia
      </button>
    </div>
  );
}
