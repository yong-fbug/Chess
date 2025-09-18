// === File: src/App.tsx ===
import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Chess, Move } from "chess.js";
import { Flag, SearchCheckIcon, RotateCcw } from "lucide-react";
import Board from "./components/Board";
import PreGameModal from "./components/PreGameModal";
import EvalBar from "./components/EvalBar";
import { EngineWrapper, EvalScore, getEngine } from "./engine/engine";

export default function App() {
  const chessRef = useRef(new Chess());

  const [fen, setFen] = useState(chessRef.current.fen());
  const [turn, setTurn] = useState<"w" | "b">(chessRef.current.turn());
  const [playerSide, setPlayerSide] = useState<"w" | "b" | null>(null);
  const [aiSide, setAiSide] = useState<"w" | "b" | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [playerFeedback, setPlayerFeedback] = useState<string | null>(null);
  const [engineFeedback, setEngineFeedback] = useState<string | null>(null);
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
  const [showPreGameModal, setShowPreGameModal] = useState(true);

  // --- Initialize Stockfish once via TanStack Query ---
  const {
    data: engine,
    isLoading,
    error,
  } = useQuery<EngineWrapper>({
    queryKey: ["engine"],
    queryFn: getEngine,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // --- AI move mutation ---
  const aiMoveMutation = useMutation({
    mutationFn: async () => {
      const chess = chessRef.current;
      if (!engine || !aiSide || chess.isGameOver() || chess.turn() !== aiSide)
        return;

      setIsAiThinking(true);

      const ai = await engine.getBestAndScore(chess.fen(), aiLevel);
      if (ai.bestFrom && ai.bestTo) {
        const move = chess.move({
          from: ai.bestFrom,
          to: ai.bestTo,
          promotion: "q",
        } as Move);
        if (move) {
          setMoveHistory((prev) => [...prev, move]);
          setFen(chess.fen());
          setTurn(chess.turn());
          setEngineLastMove({ from: move.from, to: move.to });
          setEngineFeedback("Engine played");
        }
      }

      setIsAiThinking(false);
      if (chess.isGameOver()) setGameOver(true);
    },
  });

  // --- Player move ---
  const handlePlayerMove = (from: string, to: string, promotion = "q") => {
    const chess = chessRef.current;
    if (chess.turn() !== playerSide) return false;

    const move = chess.move({ from, to, promotion } as Move);
    if (!move) return false;

    setMoveHistory((prev) => [...prev, move]);
    setFen(chess.fen());
    setTurn(chess.turn());
    setPlayerFeedback("You moved");

    setTimeout(() => aiMoveMutation.mutate(), 200);
    return true;
  };

  // --- Hint ---
  const showHint = async () => {
    if (!engine || !playerSide) return;
    setIsAiThinking(true);
    const analysis = await engine.getBestAndScore(
      chessRef.current.fen(),
      aiLevel
    );
    setIsAiThinking(false);
    if (analysis.bestFrom && analysis.bestTo) {
      setHintMove({ from: analysis.bestFrom, to: analysis.bestTo });
      setTimeout(() => setHintMove(null), 2000);
    }
  };

  // --- Undo ---
  const undoMove = () => {
    const chess = chessRef.current;
    if (moveHistory.length === 0) return;
    chess.undo();
    if (chess.turn() === aiSide && moveHistory.length >= 2) chess.undo();
    setMoveHistory((prev) => prev.slice(0, -2));
    setFen(chess.fen());
    setTurn(chess.turn());
    setPlayerFeedback(null);
    setEngineFeedback(null);
    setGameOver(false);
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
    setPlayerFeedback(null);
    setEngineFeedback(null);
    setGameOver(false);
    setEvalScore(null);
    setHintMove(null);
    setShowPreGameModal(false);

    if (engine && side === "b") aiMoveMutation.mutate();
  };

  // --- Loading / Error handling ---
  if (isLoading) return <p>Loading Stockfish…</p>;
  if (error) return <p>Failed to load engine</p>;

  if (!playerSide || !aiSide || showPreGameModal) {
    return <PreGameModal onStart={handleStartGame} />;
  }

  return (
    <div className="w-full h-auto bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center justify-between">
      {/* Feedback */}
      <div className="flex flex-col items-center w-full max-w-[400px] text-sm space-y-1">
        <EvalBar score={evalScore} playerSide={playerSide} />
        <div className="flex justify-center gap-2">
          <span className="text-white font-semibold">
            You: <span className="text-green-400">{playerFeedback ?? "—"}</span>
          </span>
          <span className="text-white font-semibold">
            Engine:{" "}
            <span className="text-yellow-400">{engineFeedback ?? "—"}</span>
          </span>
        </div>
        {gameOver && (
          <p className="text-red-400 font-semibold mt-1 text-center">
            Game Over
          </p>
        )}
      </div>

      {/* Board */}
      <div className="flex flex-1 justify-center items-center w-full max-w-screen-xl px-4">
        <div className="w-full max-w-[500px] aspect-square">
          <Board
            fen={fen}
            onPlayerMove={handlePlayerMove}
            playerSide={playerSide}
            currentTurn={turn}
            isAiThinking={isAiThinking}
            hintMove={hintMove}
            engineMove={engineLastMove}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2 w-full md:w-auto mt-6">
        <button
          onClick={showHint}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"
          title="Hint"
        >
          <SearchCheckIcon className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={undoMove}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"
          title="Undo"
        >
          <RotateCcw className="w-5 h-5 mx-auto" />
        </button>
        {!gameOver ? (
          <button
            onClick={handleResign}
            className="p-2 bg-red-600 rounded-md hover:bg-red-500"
            title="Resign"
          >
            <Flag className="w-5 h-5 mx-auto" />
          </button>
        ) : (
          <button
            onClick={() => setShowPreGameModal(true)}
            className="p-2 bg-green-600 rounded-md hover:bg-green-500"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
