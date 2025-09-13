import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  onStart: (side: "w" | "b", aiLevel: number) => void;
};

const LEVELS = [
  { rating: 200, label: "Beginner", depth: 1 },
  { rating: 400, label: "Casual", depth: 2 },
  { rating: 600, label: "Levy", depth: 3 },
  { rating: 800, label: "Club", depth: 4 },
  { rating: 1000, label: "Intermediate", depth: 6 },
  { rating: 1500, label: "Strong", depth: 8 },
  { rating: 2000, label: "Expert", depth: 12 },
  { rating: 2500, label: "Master", depth: 16 },
  { rating: 3000, label: "Stockfish Max", depth: 20 },
];

export default function PreGameModal({ onStart }: Props) {
  const [selectedLevel, setSelectedLevel] = useState(6);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1a1c2c] rounded-2xl shadow-2xl p-8 w-[90%] max-w-md border border-[#2e3247]"
        >
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xl font-bold text-white tracking-wide">
              ♟️ ChessForge™
            </span>
          </div>

          {/* AI Level Selection */}
          <h2 className="text-lg font-semibold text-gray-200 mb-2">
            Choose AI Level
          </h2>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(Number(e.target.value))}
            className="w-full bg-[#222536] text-gray-200 p-3 rounded-lg border border-[#2e3247] focus:ring-2 focus:ring-purple-500 outline-none mb-6"
          >
            {LEVELS.map((lvl) => (
              <option
                key={lvl.depth}
                value={lvl.depth}
                className="bg-[#222536] text-gray-200"
              >
                {lvl.rating} – {lvl.label}
              </option>
            ))}
          </select>

          {/* Side Selection */}
          <h2 className="text-lg font-semibold text-gray-200 mb-2">
            Choose Your Side
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => onStart("w", selectedLevel)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold shadow-md hover:opacity-90 transition"
            >
              Play as White
            </button>
            <button
              onClick={() => onStart("b", selectedLevel)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold shadow-md hover:opacity-90 transition"
            >
              Play as Black
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
