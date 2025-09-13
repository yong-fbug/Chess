import { useEffect, useRef, useState } from "react";
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
  const [gameOver, setGameOver] = useState(false);
  const [aiLevel, setAiLevel] = useState(6);
  const [evalScore, setEvalScore] = useState<EvalScore | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [hintMove, setHintMove] = useState<{ from: string; to: string } | null>(
    null
  );
  const [showPreGameModal, setShowPreGameModal] = useState(false);

  // Initialize Stockfish
  useEffect(() => {
    let mounted = true;
    (async () => {
      const wrapper = await createStockfishWorker();
      if (!mounted) return;
      engineRef.current = wrapper;
      setEngineReady(true);
      console.log("Engine ready!");
    })();
    return () => {
      mounted = false;
      engineRef.current?.terminate();
    };
  }, []);

  // Update evaluation
  const updateEval = async () => {
    if (!engineRef.current || !playerSide) return;
    const analysis = await engineRef.current.getBestAndScore(
      chessRef.current.fen(),
      Math.max(6, aiLevel)
    );
    // Flip score if player is black
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
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (engineReady && aiSide && turn === aiSide && !gameOver) {
      maybeAiMove();
    }
  }, [engineReady, aiSide, turn, gameOver]);

  const maybeAiMove = async () => {
    const chess = chessRef.current;
    if (!engineRef.current || !aiSide || chess.isGameOver()) return;
    if (chess.turn() !== aiSide) return;

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
      if (move) setMoveHistory((prev) => [...prev, move]);
      setFen(chess.fen());
      setTurn(chess.turn());
      setLastMoveLabel(ai.best || null);
      await updateEval();
    }

    if (chess.isGameOver()) setGameOver(true);
  };

  const classifyAndMaybeAi = async (
    from: string,
    to: string,
    promotion?: string
  ) => {
    if (!playerSide || !engineReady || gameOver) return;
    const chess = chessRef.current;
    if (chess.turn() !== playerSide) return;

    const move = chess.move({ from, to, promotion } as Move);
    if (!move) return;

    setMoveHistory((prev) => [...prev, move]);
    setFen(chess.fen());
    setTurn(chess.turn());
    setLastMoveLabel(move.san);
    await updateEval();
    setTimeout(() => maybeAiMove(), 500);
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
    setGameOver(false);
    setEvalScore(null);
    setHintMove(null);
    setShowPreGameModal(false);

    const waitForEngine = async () => {
      while (!engineRef.current) await new Promise((r) => setTimeout(r, 50));
      if (side === "b") maybeAiMove();
    };
    waitForEngine();
  };

  if (!playerSide || !aiSide || showPreGameModal) {
    return <PreGameModal onStart={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6 tracking-[5vmin] uppercase font-serif">
        <span className="flex-1 text-black">fch</span>
        <span className="flex-1 text-white">ees</span>
      </h1>

      {/* Eval Bar */}
      <EvalBar score={evalScore} playerSide={playerSide} />

      {/* Last Move / Game Over */}
      <p className="mt-2">
        <span className="font-medium">Last Move:</span> {lastMoveLabel ?? "—"}
      </p>
      {gameOver && <p className="text-red-400 font-semibold">Game Over</p>}

      {/* Chessboard */}
      <div className="flex justify-center items-center mt-2">
        <Board
          fen={fen}
          onPlayerMove={classifyAndMaybeAi}
          playerSide={playerSide}
          currentTurn={turn}
          isAiThinking={isAiThinking}
          hintMove={hintMove}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-center items-center w-fit mt-3 gap-2">
        <button
          onClick={showHint}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 flex-1"
          title="Hint"
        >
          <Pen className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={undoMove}
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 flex-1"
          title="Undo"
        >
          <Undo className="w-5 h-5 mx-auto" />
        </button>
        {!gameOver ? (
          <button
            onClick={handleResign}
            className="p-2 bg-red-600 rounded-md hover:bg-red-500 flex-1"
            title="Resign"
          >
            <Flag className="w-5 h-5 mx-auto" />
          </button>
        ) : (
          <button
            onClick={() => setShowPreGameModal(true)}
            className="p-2 bg-green-600 rounded-md hover:bg-green-500 flex-1 w-fit"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
