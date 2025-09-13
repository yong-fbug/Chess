import { EvalScore } from "../engine/engine";

type Props = {
  score: EvalScore | null;
  playerSide: "w" | "b";
};

export default function EvalBar({ score, playerSide }: Props) {
  if (!score) return null;

  let cp = score.cp ?? 0;
  let mate = score.mate;

  // Flip for black so perspective is always from player
  if (playerSide === "b") {
    cp = -cp;
    if (mate !== undefined) mate = -mate;
  }

  // Percentage for bar fill
  let percent: number;

  if (mate !== undefined) {
    percent = mate > 0 ? 100 : 0; // full bar if mate
  } else {
    const CLAMP_CP = 1000; // ±10 pawns max
    const clamped = Math.max(-CLAMP_CP, Math.min(CLAMP_CP, cp));
    percent = ((clamped / CLAMP_CP + 1) / 2) * 100;
  }

  return (
    <div className="flex flex-col items-center mb-2 w-[75vmin]">
      <div className="relative w-full h-5 bg-gray-800 rounded-md overflow-hidden shadow-md">
        {/* White side (left fill) */}
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-in-out"
          style={{ width: `${percent}%` }}
        />
        {/* Black side (right remaining) */}
        <div
          className="absolute top-0 right-0 h-full bg-black"
          style={{ width: `${100 - percent}%` }}
        />
      </div>
      <div className="text-xs font-mono text-gray-200 mt-1">
        {mate !== undefined
          ? `M${mate > 0 ? "+" + mate : mate}`
          : cp > 0
          ? `+${(cp / 100).toFixed(1)}`
          : (cp / 100).toFixed(1)}
      </div>
    </div>
  );
}
