import { EvalScore } from "../engine/engine";
import { useEffect, useState } from "react";

type Props = {
  score: EvalScore | null;
  playerSide: "w" | "b";
};

export default function EvalBar({ score, playerSide }: Props) {
  const [percent, setPercent] = useState(50);

  useEffect(() => {
    if (!score) {
      setPercent(50);
      return;
    }

    let cp = score.cp ?? 0;
    let mate = score.mate;

    if (playerSide === "b") {
      cp = -cp;
      if (mate !== undefined) mate = -mate;
    }

    let newPercent: number;
    if (mate !== undefined) {
      newPercent = mate > 0 ? 100 : 0;
    } else {
      const CLAMP_CP = 1000;
      const clamped = Math.max(-CLAMP_CP, Math.min(CLAMP_CP, cp));
      newPercent = ((clamped / CLAMP_CP + 1) / 2) * 100;
    }

    setPercent(newPercent);
  }, [score, playerSide]);

  return (
    <div className="flex flex-col items-center mb-2 h-full">
      <div className="relative h-full w-5 bg-gray-800 rounded-md overflow-hidden shadow-md">
        {playerSide === "w" ? (
          <>
            {/* White at bottom */}
            <div
              className="absolute bottom-0 left-0 w-full bg-white transition-all duration-500 ease-in-out"
              style={{ height: `${percent}%` }}
            />
            <div
              className="absolute top-0 left-0 w-full bg-black transition-all duration-500 ease-in-out"
              style={{ height: `${100 - percent}%` }}
            />
          </>
        ) : (
          <>
            {/* Black at bottom */}
            <div
              className="absolute bottom-0 left-0 w-full bg-black transition-all duration-500 ease-in-out"
              style={{ height: `${100 - percent}%` }}
            />
            <div
              className="absolute top-0 left-0 w-full bg-white transition-all duration-500 ease-in-out"
              style={{ height: `${percent}%` }}
            />
          </>
        )}
      </div>
      <div className="text-xs font-mono text-gray-200 mt-1">
        {score?.mate !== undefined
          ? `M${score.mate > 0 ? "+" + score.mate : score.mate}`
          : score?.cp
          ? score.cp > 0
            ? `+${(score.cp / 100).toFixed(1)}`
            : (score.cp / 100).toFixed(1)
          : "—"}
      </div>
    </div>
  );
}
