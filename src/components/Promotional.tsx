import { useEffect } from "react";

type PromotionModalProps = {
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  side: "w" | "b";
};

export default function PromotionModal({
  onSelect,
  side,
}: PromotionModalProps) {
  // disable background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const pieces: { type: "q" | "r" | "b" | "n"; label: string }[] = [
    { type: "q", label: "Queen" },
    { type: "r", label: "Rook" },
    { type: "b", label: "Bishop" },
    { type: "n", label: "Knight" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-80 text-center">
        <h2 className="text-lg font-semibold mb-4">Promote Pawn</h2>
        <div className="grid grid-cols-2 gap-4">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              <img
                src={`https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${side}${p.type}.png`}
                alt={p.label}
                className="w-12 h-12 mb-1"
              />
              <span className="text-sm">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
