import { useEffect, useRef, useState } from "react";
import { Chess, Move } from "chess.js";
import Board from "./components/Board";
import Controls from "./components/Controls";
import PreGameModal from "./components/PreGameModal";
import { EngineWrapper, createStockfishWorker } from "./engine/engine";

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

  // Let AI move when it’s its turn
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
    const start = performance.now();

    const ai = await engineRef.current.getBestAndScore(
      chess.fen(),
      Math.max(6, aiLevel)
    );

    const end = performance.now();
    console.log(`AI calculation took ${(end - start).toFixed(2)} ms`);
    setIsAiThinking(false);

    if (ai.bestFrom && ai.bestTo) {
      chess.move({
        from: ai.bestFrom,
        to: ai.bestTo,
        promotion: ai.bestPromotion,
      } as Move);
      setFen(chess.fen());
      setTurn(chess.turn());
      setLastMoveLabel(ai.best || null);
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

    setFen(chess.fen());
    setTurn(chess.turn());
    setLastMoveLabel(move.san);

    setTimeout(() => maybeAiMove(), 500);
  };

  if (!playerSide || !aiSide) {
    return (
      <PreGameModal
        onStart={(side, level) => {
          setAiLevel(level);
          setPlayerSide(side);
          setAiSide(side === "w" ? "b" : "w");
          setTurn(chessRef.current.turn());
          if (side === "b") setTimeout(() => maybeAiMove(), 100);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center p-6">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">♟️ Offline Chess</h1>
      {/* //here put evalbbar */}
      {/* Main Content */}
      <div className="grid md:grid-cols-[auto,300px] gap-6 w-full max-w-6xl">
        {/* Chessboard */}
        <div className="flex justify-center items-center">
          <Board
            fen={fen}
            onPlayerMove={classifyAndMaybeAi}
            playerSide={playerSide}
            currentTurn={turn}
            isAiThinking={isAiThinking}
          />
        </div>

        {/* Sidebar / Game Info */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">
            Game Info
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Engine:</span>{" "}
              {engineReady ? "✅ Ready" : "⏳ Loading..."}
            </p>
            <p>
              <span className="font-medium">Turn:</span>{" "}
              {turn === "w" ? "White" : "Black"}{" "}
              {turn === aiSide && !gameOver ? "(AI's turn)" : ""}
            </p>
            <p>
              <span className="font-medium">Player:</span>{" "}
              {playerSide === "w" ? "White" : "Black"}
            </p>
            <p>
              <span className="font-medium">AI:</span>{" "}
              {aiSide === "w" ? "White" : "Black"}
            </p>
            <p>
              <span className="font-medium">Last Move:</span>{" "}
              {lastMoveLabel ?? "—"}
            </p>
            <p>
              <span className="font-medium">AI Thinking:</span>{" "}
              {isAiThinking ? "🤔 Yes" : "No"}
            </p>
            {gameOver && (
              <p className="text-red-400 font-semibold">Game Over</p>
            )}
          </div>

          {/* Controls */}
          <Controls
            onHint={() => {}}
            onUndo={() => {}}
            onReset={() => window.location.reload()}
            onResign={() => setGameOver(true)}
            aiLevel={aiLevel}
          />
        </div>
      </div>
    </div>
  );
}
