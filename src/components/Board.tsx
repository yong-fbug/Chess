import { Chessboard, ChessboardOptions } from "react-chessboard";
import { useState } from "react";
import PromotionModal from "./Promotional";

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
  const [promotionSquare, setPromotionSquare] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const [invalidMove, setInvalidMove] = useState<HintMove | null>(null);
  const [lastMoveTrail, setLastMoveTrail] = useState<HintMove | null>(null);

  const squareStyles: { [square: string]: { backgroundColor: string } } = {};

  if (engineMove) {
    squareStyles[engineMove.from] = { backgroundColor: "rgba(0,0,255,0.4)" };
    squareStyles[engineMove.to] = { backgroundColor: "rgba(0,0,255,0.4)" };
  }
  if (hintMove) {
    squareStyles[hintMove.from] = { backgroundColor: "rgba(0,255,0,0.4)" };
    squareStyles[hintMove.to] = { backgroundColor: "rgba(0,255,0,0.4)" };
  }
  if (invalidMove) {
    squareStyles[invalidMove.from] = { backgroundColor: "rgba(255,0,0,0.5)" };
    squareStyles[invalidMove.to] = { backgroundColor: "rgba(255,0,0,0.5)" };
  }
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

      const pieceType = String(piece)[1].toLowerCase();
      if (
        pieceType === "p" &&
        (targetSquare[1] === "8" || targetSquare[1] === "1")
      ) {
        setPromotionSquare({ from: sourceSquare, to: targetSquare });
        return false; // wait for modal
      }

      const valid = onPlayerMove(
        sourceSquare.toLowerCase(),
        targetSquare.toLowerCase()
      );

      if (!valid) {
        setInvalidMove({ from: sourceSquare, to: targetSquare });
        setTimeout(() => setInvalidMove(null), 500);
        return false;
      }

      setLastMoveTrail({ from: sourceSquare, to: targetSquare });
      setTimeout(() => setLastMoveTrail(null), 1000);

      return true;
    },
    squareStyles,
    darkSquareStyle: { backgroundColor: "#b58863" },
    lightSquareStyle: { backgroundColor: "#f0d9b5" },
  };

  return (
    <>
      <Chessboard options={options} />
      {promotionSquare && (
        <PromotionModal
          side={playerSide}
          onSelect={(piece) => {
            onPlayerMove(
              promotionSquare.from.toLowerCase(),
              promotionSquare.to.toLowerCase(),
              piece
            );
            setPromotionSquare(null);
          }}
        />
      )}
    </>
  );
}
