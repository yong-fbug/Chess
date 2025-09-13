import { Chessboard, ChessboardOptions } from "react-chessboard";

type HintMove = { from: string; to: string } | null;

type Props = {
  fen: string;
  onPlayerMove: (from: string, to: string, promotion?: string) => void;
  hintMove?: HintMove;
  playerSide: "w" | "b";
  currentTurn: "w" | "b";
  isAiThinking: boolean;
};

export default function Board({
  fen,
  onPlayerMove,
  hintMove,
  playerSide,
  currentTurn,
  isAiThinking,
}: Props) {
  const squareStyles: { [square: string]: { backgroundColor: string } } = {};

  // Highlight hint squares
  if (hintMove) {
    squareStyles[hintMove.from] = { backgroundColor: "rgba(0,255,0,0.4)" };
    squareStyles[hintMove.to] = { backgroundColor: "rgba(0,255,0,0.4)" };
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

      onPlayerMove(
        sourceSquare.toLowerCase(),
        targetSquare.toLowerCase(),
        promotion
      );
      return true;
    },
    squareStyles, // ✅ use this prop
    darkSquareStyle: { backgroundColor: "#b58863" },
    lightSquareStyle: { backgroundColor: "#f0d9b5" },
  };

  return (
    <div className="w-[73vmin] aspect-square mx-auto">
      <Chessboard options={options} />
    </div>
  );
}
