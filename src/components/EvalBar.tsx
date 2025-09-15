import { EvalScore } from "../engine/engine";

type Props = {
  score: EvalScore | null;
  playerSide: "w" | "b";
};

export default function EvalBar({ score, playerSide }: Props) {
  if (!score) {
    // Neutral bar when no score yet
    return (
      <div className="flex flex-col items-center mb-2 h-[73vmin]">
        <div className="relative h-full w-5 bg-gray-800 rounded-md overflow-hidden shadow-md">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white" />
          <div className="absolute top-0 left-0 w-full h-1/2 bg-black" />
        </div>
        <div className="text-xs font-mono text-gray-200 mt-1">—</div>
      </div>
    );
  }

  let cp = score.cp ?? 0;
  let mate = score.mate;

  // Flip eval numbers for black player
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
    <div className="flex flex-col items-center mb-2 h-[73vmin]">
      <div className="relative h-full w-5 bg-gray-800 rounded-md overflow-hidden shadow-md">
        {playerSide === "w" ? (
          <>
            {/* White at bottom */}
            <div
              className="absolute bottom-0 left-0 w-full bg-white transition-all duration-300 ease-in-out"
              style={{ height: `${percent}%` }}
            />
            <div
              className="absolute top-0 left-0 w-full bg-black"
              style={{ height: `${100 - percent}%` }}
            />
          </>
        ) : (
          <>
            {/* Black at bottom */}
            <div
              className="absolute bottom-0 left-0 w-full bg-black transition-all duration-300 ease-in-out"
              style={{ height: `${100 - percent}%` }}
            />
            <div
              className="absolute top-0 left-0 w-full bg-white"
              style={{ height: `${percent}%` }}
            />
          </>
        )}
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
