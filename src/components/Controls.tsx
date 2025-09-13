import { Cpu, Undo, Flag } from "lucide-react";

type Props = {
  onHint: () => void;
  onUndo: () => void;
  onResign: () => void;
};

export default function Controls({ onHint, onUndo, onResign }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      <button
        onClick={onHint}
        className="flex-1 min-w-[60px] sm:min-w-[80px] p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition"
        title="Hint"
      >
        <Cpu className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
      </button>

      <button
        onClick={onUndo}
        className="flex-1 min-w-[60px] sm:min-w-[80px] p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition"
        title="Undo"
      >
        <Undo className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
      </button>

      <button
        onClick={onResign}
        className="flex-1 min-w-[60px] sm:min-w-[80px] p-2 bg-red-600 rounded-md hover:bg-red-500 transition"
        title="Resign"
      >
        <Flag className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
      </button>
    </div>
  );
}
