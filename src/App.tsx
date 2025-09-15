import { useEffect, useRef, useState, useCallback } from "react";
import { Chess, Move } from "chess.js";
import { Flag, SearchCheckIcon, RotateCcw } from "lucide-react";
import Board from "./components/Board";
import PreGameModal from "./components/PreGameModal";
import EvalBar from "./components/EvalBar";
import {
  createStockfishWorker,
  EngineWrapper,
  EvalScore,
} from "./engine/engine";

// --- Simple opening book ---
const openingBook: Record<
  string,
  { from: string; to: string; promotion?: string }[]
> = {
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": [
    { from: "e2", to: "e4" },
    { from: "d2", to: "d4" },
    { from: "c2", to: "c4" },
    { from: "g1", to: "f3" },
  ],
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1": [
    { from: "e7", to: "e5" },
    { from: "c7", to: "c5" },
  ],
};

export default function App() {
  const chessRef = useRef(new Chess());
  const engineRef = useRef<EngineWrapper | null>(null);

  const [fen, setFen] = useState(chessRef.current.fen());
  const [turn, setTurn] = useState<"w" | "b">(chessRef.current.turn());
  const [playerSide, setPlayerSide] = useState<"w" | "b" | null>(null);
  const [aiSide, setAiSide] = useState<"w" | "b" | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [_, setLastMoveLabel] = useState<string | null>(null);
  const [playerLastMoveFeedback, setPlayerLastMoveFeedback] = useState<{
    label: string;
    color: string;
  } | null>(null);
  const [engineLastMoveFeedback, setEngineLastMoveFeedback] = useState<{
    label: string;
    color: string;
  } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [aiLevel, setAiLevel] = useState(6);
  const [evalScore, setEvalScore] = useState<EvalScore | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [hintMove, setHintMove] = useState<{ from: string; to: string } | null>(
    null
  );
  const [engineLastMove, setEngineLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [showPreGameModal, setShowPreGameModal] = useState(false);

  // --- Initialize Stockfish ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      const wrapper = await createStockfishWorker();
      if (!mounted) return;
      engineRef.current = wrapper;
      setEngineReady(true);
    })();
    return () => {
      mounted = false;
      engineRef.current?.terminate();
    };
  }, []);

  // --- Update evaluation ---
  const updateEval = useCallback(async () => {
    if (!engineRef.current || !playerSide) return;
    const analysis = await engineRef.current.getBestAndScore(
      chessRef.current.fen(),
      Math.max(6, aiLevel)
    );
    const score =
      playerSide === "w"
        ? analysis.score
        : {
            cp:
              analysis.score.cp !== undefined ? -analysis.score.cp : undefined,
            mate:
              analysis.score.mate !== undefined
                ? -analysis.score.mate
                : undefined,
          };
    setEvalScore(score);
  }, [playerSide, aiLevel]);

  // --- Feedback logic ---
  const getMoveFeedback = (
    playedScore: EvalScore,
    bestScore: EvalScore,
    side: "w" | "b"
  ) => {
    let cpPlayed = playedScore.cp ?? 0;
    let cpBest = bestScore.cp ?? 0;
    let matePlayed = playedScore.mate;
    let mateBest = bestScore.mate;

    if (side === "b") {
      cpPlayed = -cpPlayed;
      cpBest = -cpBest;
      matePlayed = matePlayed !== undefined ? -matePlayed : undefined;
      mateBest = mateBest !== undefined ? -mateBest : undefined;
    }

    if (matePlayed !== undefined) {
      if (mateBest !== undefined && matePlayed !== mateBest)
        return {
          label: `Missed Mate in ${mateBest}`,
          color: "text-orange-500",
        };
      return { label: `Mate in ${matePlayed}`, color: "text-red-500" };
    }

    const delta = cpBest - cpPlayed;
    if (delta <= 10) return { label: "Best move", color: "text-cyan-400" };
    if (delta <= 30) return { label: "Excellent", color: "text-green-400" };
    if (delta <= 50) return { label: "Good", color: "text-lime-400" };
    if (delta <= 100) return { label: "Inaccuracy", color: "text-yellow-400" };
    if (delta <= 300) return { label: "Mistake", color: "text-orange-400" };
    return { label: "Blunder", color: "text-red-400" };
  };

  // --- AI move ---
  const maybeAiMove = useCallback(async () => {
    const chess = chessRef.current;
    if (
      !engineRef.current ||
      !aiSide ||
      chess.isGameOver() ||
      chess.turn() !== aiSide
    )
      return;
    setIsAiThinking(true);

    const bookMoves = openingBook[chess.fen()];
    let move;
    let feedback: { label: string; color: string } = { label: "", color: "" };
    if (bookMoves && bookMoves.length > 0) {
      const bookMove = bookMoves[Math.floor(Math.random() * bookMoves.length)];
      move = chess.move(bookMove as Move);
      feedback = { label: "(Book)", color: "text-blue-400" };
    } else {
      const ai = await engineRef.current.getBestAndScore(
        chess.fen(),
        Math.max(6, aiLevel)
      );
      if (ai.bestFrom && ai.bestTo) {
        move = chess.move({
          from: ai.bestFrom,
          to: ai.bestTo,
          promotion: ai.bestPromotion,
        } as Move);
        if (move) feedback = getMoveFeedback({ cp: 0 }, ai.score, aiSide!);
      }
    }

    setIsAiThinking(false);

    if (move) {
      setMoveHistory((prev) => [...prev, move]);
      setFen(chess.fen());
      setTurn(chess.turn());
      setEngineLastMove({ from: move.from, to: move.to });
      setEngineLastMoveFeedback(feedback);
    }

    if (chess.isGameOver()) setGameOver(true);
  }, [aiSide, aiLevel]);

  useEffect(() => {
    if (playerSide === "b" && aiSide === "w" && engineReady) maybeAiMove();
  }, [playerSide, aiSide, engineReady, maybeAiMove]);

  // --- Player move handler ---
  const classifyAndMaybeAi = (
    from: string,
    to: string,
    promotion: string = "q"
  ): boolean => {
    const chess = chessRef.current;
    if (chess.turn() !== playerSide) return false;

    const move = chess.move({ from, to, promotion } as Move);
    if (!move) return false;

    setMoveHistory((prev) => [...prev, move]);
    setFen(chess.fen());
    setTurn(chess.turn());
    setLastMoveLabel(move.san);

    void (async () => {
      if (engineRef.current) {
        const analysis = await engineRef.current.getBestAndScore(
          chess.fen(),
          Math.max(6, aiLevel)
        );
        const feedback = getMoveFeedback(
          { cp: 0 },
          analysis.score,
          playerSide!
        );
        setPlayerLastMoveFeedback(feedback);
        setEvalScore(
          playerSide === "w"
            ? analysis.score
            : {
                cp: -analysis.score.cp!,
                mate: analysis.score.mate ? -analysis.score.mate : undefined,
              }
        );
      }
      setTimeout(() => maybeAiMove(), 500);
    })();

    return true;
  };

  const showHint = async () => {
    if (!engineRef.current || !playerSide) return;
    setIsAiThinking(true);
    const analysis = await engineRef.current.getBestAndScore(
      chessRef.current.fen(),
      Math.max(6, aiLevel)
    );
    setIsAiThinking(false);
    if (analysis.bestFrom && analysis.bestTo) {
      setHintMove({ from: analysis.bestFrom, to: analysis.bestTo });
      setTimeout(() => setHintMove(null), 3000);
    }
  };

  const undoMove = async () => {
    const chess = chessRef.current;
    if (moveHistory.length === 0 || gameOver) return;
    chess.undo();
    if (chess.turn() === aiSide && moveHistory.length >= 2) chess.undo();
    setMoveHistory((prev) => prev.slice(0, -2));
    setFen(chess.fen());
    setTurn(chess.turn());
    setLastMoveLabel(
      moveHistory.length >= 2 ? moveHistory[moveHistory.length - 2].san : null
    );
    setPlayerLastMoveFeedback(null);
    setEngineLastMoveFeedback(null);
    setGameOver(false);
    await updateEval();
  };

  const handleResign = () => setGameOver(true);

  const handleStartGame = (side: "w" | "b", level: number) => {
    chessRef.current.reset();
    setAiLevel(level);
    setPlayerSide(side);
    setAiSide(side === "w" ? "b" : "w");
    setTurn(chessRef.current.turn());
    setFen(chessRef.current.fen());
    setMoveHistory([]);
    setLastMoveLabel(null);
    setPlayerLastMoveFeedback(null);
    setEngineLastMoveFeedback(null);
    setGameOver(false);
    setEvalScore(null);
    setHintMove(null);
    setShowPreGameModal(false);
  };

  if (!playerSide || !aiSide || showPreGameModal)
    return <PreGameModal onStart={handleStartGame} />;

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center justify-between overflow-hidden">
      {/* Feedback */}

      <div className="flex justify-center gap-4 mt-1 text-sm w-[400px] flex-shrink-0">
        <span className="text-white font-semibold">
          You:{" "}
          <span className={playerLastMoveFeedback?.color ?? "text-white"}>
            {playerLastMoveFeedback?.label ?? "—"}
          </span>
        </span>
        <span className="text-white font-semibold">
          Engine:{" "}
          <span className={engineLastMoveFeedback?.color ?? "text-white"}>
            {engineLastMoveFeedback?.label ?? "—"}
          </span>
        </span>
      </div>
      {gameOver && (
        <p className="text-red-400 font-semibold transition-all duration-300 mt-2">
          Game Over
        </p>
      )}

      {/* Board + EvalBar */}
      <div className="flex flex-1 justify-center items-center w-full max-w-screen-xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-center w-full gap-4">
          <div className="flex-shrink-0 h-[50vmin] md:h-[60vmin]">
            <EvalBar score={evalScore} playerSide={playerSide} />
          </div>
          <div className="w-full max-w-[500px] aspect-square">
            <Board
              fen={fen}
              onPlayerMove={classifyAndMaybeAi}
              playerSide={playerSide}
              currentTurn={turn}
              isAiThinking={isAiThinking}
              hintMove={hintMove}
              engineMove={engineLastMove}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center md:justify-center gap-2 w-full md:w-auto mt-6">
        <button
          onClick={showHint}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 flex-1 md:flex-none transition-colors duration-200"
          title="Hint"
        >
          <SearchCheckIcon className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={undoMove}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 flex-1 md:flex-none transition-colors duration-200"
          title="Undo"
        >
          <RotateCcw className="w-5 h-5 mx-auto" />
        </button>
        {!gameOver ? (
          <button
            onClick={handleResign}
            className="p-2 bg-red-600 rounded-md hover:bg-red-500 flex-1 md:flex-none transition-colors duration-200"
            title="Resign"
          >
            <Flag className="w-5 h-5 mx-auto" />
          </button>
        ) : (
          <button
            onClick={() => setShowPreGameModal(true)}
            className="p-2 bg-green-600 rounded-md hover:bg-green-500 flex-1 md:flex-none transition-colors duration-200"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
