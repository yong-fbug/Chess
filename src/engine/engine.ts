export type EvalScore = { cp?: number; mate?: number };

export class EngineWrapper {
  private worker: Worker;
  private pendingResolve: ((value: string) => void) | null = null;
  private lastInfo: string | null = null;

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.addEventListener("message", this.onMessage.bind(this));
  }

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

  terminate() {
    this.worker.terminate();
  }

  post(cmd: string) {
    this.worker.postMessage(cmd);
  }

  private onMessage(e: MessageEvent) {
    const text = e.data as string;
    if (text.startsWith("info")) this.lastInfo = text;
    if (text.startsWith("bestmove") && this.pendingResolve) {
      this.pendingResolve(text);
      this.pendingResolve = null;
    }
  }

  async getBestAndScore(fen: string, depth = 12) {
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

export async function createStockfishWorker(): Promise<EngineWrapper> {
  const worker = new Worker("/stockfish.js");
  const wrapper = new EngineWrapper(worker);
  await wrapper.init(); // <-- critical to actually initialize
  return wrapper;
}
