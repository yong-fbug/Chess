type Props = {
  onHint: () => void;
  onUndo: () => void;
  onReset: () => void;
  onResign: () => void;
  aiLevel: number;
};

export default function Controls({
  onHint,
  onUndo,
  onReset,
  onResign,
  aiLevel,
}: Props) {
  return (
    <div className="controls">
      <div className="control-row">
        <button onClick={onHint}>Hint</button>
        <button onClick={onUndo}>Undo</button>
        <button onClick={onReset}>Reset</button>
      </div>

      <div className="control-row">
        <span>AI Level: {aiLevel}</span>
      </div>

      <button onClick={onResign}>Resign</button>
    </div>
  );
}
