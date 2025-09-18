import { EngineWrapper } from "./engine";

// engineSingleton.ts
let globalEngine: EngineWrapper | null =
  (globalThis as any).__stockfishEngine || null;

export async function getEngine(): Promise<EngineWrapper> {
  if (globalEngine) return globalEngine;
  const worker = new Worker("/stockfish.js");
  const wrapper = new EngineWrapper(worker);
  await wrapper.init();
  (globalThis as any).__stockfishEngine = wrapper; // survive hot reload
  globalEngine = wrapper;
  return wrapper;
}
