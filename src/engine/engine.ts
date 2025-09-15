// engine.ts
export type EvalScore = { cp?: number; mate?: number };

export class EngineWrapper {
  private worker: Worker;
  private pendingResolve: ((value: string) => void) | null = null;
  private lastInfo: string | null = null;

  // --- Queue management ---
  private queue: (() => void)[] = [];
  private busy = false;

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.addEventListener("message", this.onMessage.bind(this));
  }

  // Initialize Stockfish
  async init() {
    return new Promise<void>((resolve) => {
      const listener = (e: MessageEvent) => {
        if (e.data === "readyok") {
          this.worker.removeEventListener("message", listener);
          resolve();
        }
      };
      this.worker.addEventListener("message", listener);
      this.post("uci");
      this.post("isready");
    });
  }

  // Terminate worker safely
  terminate() {
    this.worker.terminate();
  }

  // Send command to Stockfish
  post(cmd: string) {
    this.worker.postMessage(cmd);
  }

  // Handle messages
  private onMessage(e: MessageEvent) {
    const text = e.data as string;
    if (text.startsWith("info")) this.lastInfo = text;
    if (text.startsWith("bestmove") && this.pendingResolve) {
      this.pendingResolve(text);
      this.pendingResolve = null;
    }
  }

  // --- Queue helper ---
  private async runInQueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.busy = false;
          this.queue.shift();
          if (this.queue.length > 0) this.queue[0]!();
        }
      });
      if (!this.busy) {
        this.busy = true;
        this.queue[0]!();
      }
    });
  }

  // --- Request best move & evaluation ---
  async getBestAndScore(fen: string, depth = 12) {
    return this.runInQueue(async () => {
      this.post(`position fen ${fen}`);
      this.post(`go depth ${depth}`);

      const raw = await new Promise<string>((resolve) => {
        this.pendingResolve = resolve;
      });

      const parts = raw.split(" ");
      const bestmove = parts[1] || null;
      const bestFrom = bestmove ? bestmove.slice(0, 2) : null;
      const bestTo = bestmove ? bestmove.slice(2, 4) : null;
      const bestPromotion =
        bestmove && bestmove.length > 4 ? bestmove[4] : undefined;

      return {
        best: bestmove,
        bestFrom,
        bestTo,
        bestPromotion,
        score: this.parseLastInfo(this.lastInfo),
      };
    });
  }

  private parseLastInfo(infoLine: string | null): EvalScore {
    if (!infoLine) return { cp: 0 };
    const mCp = infoLine.match(/score cp (-?\d+)/);
    const mMate = infoLine.match(/score mate (-?\d+)/);
    if (mCp) return { cp: parseInt(mCp[1], 10) };
    if (mMate) return { mate: parseInt(mMate[1], 10) };
    return { cp: 0 };
  }
}

// Singleton pattern to avoid multiple workers

let engineInstance: EngineWrapper | null = null;

export async function getEngine(): Promise<EngineWrapper> {
  if (engineInstance) return engineInstance;

  const worker = new Worker("/stockfish.js");
  engineInstance = new EngineWrapper(worker);
  await engineInstance.init();

  return engineInstance;
}
