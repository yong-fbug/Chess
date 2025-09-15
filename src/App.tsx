import { useEffect, useRef, useState, useCallback } from "react";
import { Chess, Move } from "chess.js";
import { Undo, Flag, Pen } from "lucide-react";
import Board from "./components/Board";
import PreGameModal from "./components/PreGameModal";
import EvalBar from "./components/EvalBar";
import {
  EngineWrapper,
  createStockfishWorker,
  EvalScore,
} from "./engine/engine";

export default function App() {
  const chessRef = useRef(new Chess());
  const engineRef = useRef<EngineWrapper | null>(null);

  const [fen, setFen] = useState(chessRef.current.fen());
  const [turn, setTurn] = useState<"w" | "b">(chessRef.current.turn());
  const [playerSide, setPlayerSide] = useState<"w" | "b" | null>(null);
  const [aiSide, setAiSide] = useState<"w" | "b" | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMoveLabel, setLastMoveLabel] = useState<string | null>(null);
  const [lastMoveFeedback, setLastMoveFeedback] = useState<string | null>(null);
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
    const ai = await engineRef.current.getBestAndScore(
      chess.fen(),
      Math.max(6, aiLevel)
    );
    setIsAiThinking(false);

    if (ai.bestFrom && ai.bestTo) {
      const move = chess.move({
        from: ai.bestFrom,
        to: ai.bestTo,
        promotion: ai.bestPromotion,
      } as Move);
      if (move) {
        setMoveHistory((prev) => [...prev, move]);
        setFen(chess.fen());
        setTurn(chess.turn());
        setLastMoveLabel(move.san);
        setEngineLastMove({ from: ai.bestFrom, to: ai.bestTo });
        setTimeout(() => setEngineLastMove(null), 1000);
        await updateEval();
      }
    }

    if (chess.isGameOver()) setGameOver(true);
  }, [aiSide, aiLevel, updateEval]);

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
        return `Missed Mate in ${mateBest}`;
      return `Mate in ${matePlayed}`;
    }

    const delta = cpBest - cpPlayed;
    if (delta <= 10) return "Best move";
    if (delta <= 30) return "Excellent";
    if (delta <= 50) return "Good";
    if (delta <= 150) return "Inaccuracy";
    if (delta <= 300) return "Mistake";
    return "Blunder";
  };

  // --- First AI move if player picks black ---
  useEffect(() => {
    if (playerSide === "b" && aiSide === "w" && engineReady) maybeAiMove();
  }, [playerSide, aiSide, engineReady, maybeAiMove]);

  // --- Player move handler (sync for TS, async internally) ---
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

    // Async feedback & AI
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
        setLastMoveFeedback(feedback);
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
    setLastMoveFeedback(null);
    setGameOver(false);
    setEvalScore(null);
    setHintMove(null);
    setShowPreGameModal(false);
  };

  if (!playerSide || !aiSide || showPreGameModal)
    return <PreGameModal onStart={handleStartGame} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center p-6 transition-all duration-500">
      <h1 className="text-3xl font-bold mb-6 tracking-[5vmin] uppercase font-serif text-teal-600 animate-pulse">
        fchees
      </h1>

      <p className="mt-2 transition-all duration-300">
        <span className="font-medium">Last Move:</span> {lastMoveLabel ?? "—"}
      </p>
      {lastMoveFeedback && (
        <p className="mt-1 text-yellow-400 font-semibold transition-all duration-300">
          {lastMoveFeedback}
        </p>
      )}
      {gameOver && (
        <p className="text-red-400 font-semibold transition-all duration-300">
          Game Over
        </p>
      )}

      <div className="flex justify-center items-center mt-2">
        <div className="mr-2 transition-all duration-300">
          <EvalBar score={evalScore} playerSide={playerSide} />
        </div>
        <div className="w-[73vmin] aspect-square mx-auto transition-all duration-300 scale-100 hover:scale-105">
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

      <div className="flex justify-center items-center w-fit mt-3 gap-2 transition-all duration-300">
        <button
          onClick={showHint}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 flex-1 transition-colors duration-200"
          title="Hint"
        >
          <Pen className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={undoMove}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 flex-1 transition-colors duration-200"
          title="Undo"
        >
          <Undo className="w-5 h-5 mx-auto" />
        </button>
        {!gameOver ? (
          <button
            onClick={handleResign}
            className="p-2 bg-red-600 rounded-md hover:bg-red-500 flex-1 transition-colors duration-200"
            title="Resign"
          >
            <Flag className="w-5 h-5 mx-auto" />
          </button>
        ) : (
          <button
            onClick={() => setShowPreGameModal(true)}
            className="p-2 bg-green-600 rounded-md hover:bg-green-500 flex-1 w-fit transition-colors duration-200"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
