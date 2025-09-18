// === File: src/engine/engine.ts ===
export interface EvalScore {
  type: "cp" | "mate";
  value: number;
}

export class EngineWrapper {
  private worker: Worker;
  private listeners: ((line: string) => void)[] = [];

  constructor(worker: Worker) {
    this.worker = worker;

    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      this.listeners.forEach((cb) => cb(line));
    };
  }

  async init(): Promise<void> {
    // simple ready wait
    return new Promise((resolve) => {
      const checkReady = (line: string) => {
        if (line.includes("uciok")) {
          this.removeListener(checkReady);
          resolve();
        }
      };
      this.addListener(checkReady);
      this.post("uci");
    });
  }

  post(cmd: string) {
    this.worker.postMessage(cmd);
  }

  addListener(cb: (line: string) => void) {
    this.listeners.push(cb);
  }

  removeListener(cb: (line: string) => void) {
    this.listeners = this.listeners.filter((f) => f !== cb);
  }

  async getBestAndScore(
    fen: string,
    level: number
  ): Promise<{ bestFrom?: string; bestTo?: string; score?: EvalScore }> {
    return new Promise((resolve) => {
      let bestFrom: string | undefined;
      let bestTo: string | undefined;
      let score: EvalScore | undefined;

      const handler = (line: string) => {
        if (line.startsWith("info depth")) {
          const parts = line.split(" ");
          const idx = parts.indexOf("score");
          if (idx !== -1) {
            const type = parts[idx + 1] as "cp" | "mate";
            const value = parseInt(parts[idx + 2], 10);
            score = { type, value };
          }
        } else if (line.startsWith("bestmove")) {
          const parts = line.split(" ");
          const move = parts[1];
          if (move && move !== "(none)") {
            bestFrom = move.substring(0, 2);
            bestTo = move.substring(2, 4);
          }
          this.removeListener(handler);
          resolve({ bestFrom, bestTo, score });
        }
      };

      this.addListener(handler);
      this.post(`setoption name Skill Level value ${level}`);
      this.post(`position fen ${fen}`);
      this.post("go movetime 1000"); // 1 sec per move
    });
  }

  // ✅ cleanup to avoid memory leaks
  terminate() {
    this.worker.terminate();
    this.listeners = [];
  }
}
