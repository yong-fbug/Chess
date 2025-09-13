import { Chessboard, ChessboardOptions } from "react-chessboard";
import { useState } from "react";

type HintMove = { from: string; to: string } | null;

type Props = {
  fen: string;
  onPlayerMove: (from: string, to: string, promotion?: string) => boolean;
  hintMove?: HintMove;
  engineMove?: HintMove;
  playerSide: "w" | "b";
  currentTurn: "w" | "b";
  isAiThinking: boolean;
};

export default function Board({
  fen,
  onPlayerMove,
  hintMove,
  engineMove,
  playerSide,
  currentTurn,
  isAiThinking,
}: Props) {
  const [invalidMove, setInvalidMove] = useState<HintMove | null>(null);
  const [lastMoveTrail, setLastMoveTrail] = useState<HintMove | null>(null);

  const squareStyles: { [square: string]: { backgroundColor: string } } = {};

  if (engineMove) {
    squareStyles[engineMove.from] = { backgroundColor: "rgba(0,0,255,0.4)" };
    squareStyles[engineMove.to] = { backgroundColor: "rgba(0,0,255,0.4)" };
  }
  // Highlight hint squares
  if (hintMove) {
    squareStyles[hintMove.from] = { backgroundColor: "rgba(0,255,0,0.4)" };
    squareStyles[hintMove.to] = { backgroundColor: "rgba(0,255,0,0.4)" };
  }

  // Highlight invalid move attempt
  if (invalidMove) {
    squareStyles[invalidMove.from] = { backgroundColor: "rgba(255,0,0,0.5)" };
    squareStyles[invalidMove.to] = { backgroundColor: "rgba(255,0,0,0.5)" };
  }

  // Highlight last move trail
  if (lastMoveTrail) {
    squareStyles[lastMoveTrail.from] = {
      backgroundColor: "rgba(255,255,0,0.4)",
    };
    squareStyles[lastMoveTrail.to] = { backgroundColor: "rgba(255,255,0,0.4)" };
  }

  const options: ChessboardOptions = {
    position: fen,
    boardOrientation: playerSide === "w" ? "white" : "black",
    onPieceDrop: ({ sourceSquare, targetSquare, piece }) => {
      if (!piece || !targetSquare) return false;
      if (isAiThinking) return false;
      if (currentTurn !== playerSide) return false;

      let promotion: string | undefined;
      const pieceType = String(piece)[1].toLowerCase();
      if (
        pieceType === "p" &&
        (targetSquare[1] === "8" || targetSquare[1] === "1")
      ) {
        promotion = "q";
      }

      const valid = onPlayerMove(
        sourceSquare.toLowerCase(),
        targetSquare.toLowerCase(),
        promotion
      );

      // Show invalid move red highlight for 0.5s
      if (!valid) {
        setInvalidMove({ from: sourceSquare, to: targetSquare });
        setTimeout(() => setInvalidMove(null), 500);
        return false;
      }

      // Show last move trail yellow
      setLastMoveTrail({ from: sourceSquare, to: targetSquare });
      setTimeout(() => setLastMoveTrail(null), 1000);

      return true;
    },
    squareStyles,
    darkSquareStyle: { backgroundColor: "#b58863" },
    lightSquareStyle: { backgroundColor: "#f0d9b5" },
  };

  return (
    <div className="w-[73vmin] aspect-square mx-auto">
      <Chessboard options={options} />
    </div>
  );
}
