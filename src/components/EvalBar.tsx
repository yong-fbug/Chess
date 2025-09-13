import { EvalScore } from "../engine/engine";

export default function EvalBar({ score }: { score: EvalScore }) {
  const cp = score.cp ?? 0;
  const normalized = Math.max(-5000, Math.min(5000, cp)) / 5000;
  const percent = ((normalized + 1) / 2) * 100;

  return (
    <div className="flex flex-col items-center w-10 h-full bg-gray-800 rounded-md overflow-hidden shadow-md">
      {/* Eval Track */}
      <div className="relative flex-1 w-full">
        {/* White side (top fill) */}
        <div
          className="absolute bottom-0 left-0 w-full bg-white transition-all duration-300 ease-in-out"
          style={{ height: `${percent}%` }}
        />
        {/* Black side (remaining) */}
        <div
          className="absolute top-0 left-0 w-full bg-black"
          style={{ height: `${100 - percent}%` }}
        />
      </div>

      {/* Eval Text */}
      <div className="text-xs font-mono text-center text-gray-200 py-1 bg-gray-900 w-full border-t border-gray-700">
        {scoreToString(score)}
      </div>
    </div>
  );
}

function scoreToString(score: EvalScore) {
  if (score.mate !== undefined) {
    return `M${score.mate}`;
  }
  return (score.cp ?? 0) > 0
    ? `+${((score.cp ?? 0) / 100).toFixed(1)}`
    : `${((score.cp ?? 0) / 100).toFixed(1)}`;
}
