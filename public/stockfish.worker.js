// stockfish.worker.js
importScripts("/stockfish.js");

let STOCKFISH;

function initStockfish() {
  if (STOCKFISH) return;

  STOCKFISH =
    STOCKFISH ||
    new STOCKFISH({
      wasmMemory: new WebAssembly.Memory({
        initial: 128,
        maximum: 256,
        shared: false,
      }),
      locateFile: (file) => `/stockfish.wasm`,
    });

  STOCKFISH.postMessage("uci");
  STOCKFISH.postMessage("setoption name Threads value 1");
  STOCKFISH.postMessage("setoption name Hash value 16");

  STOCKFISH.onmessage = (event) => postMessage(event.data);
}

initStockfish();

onmessage = (e) => {
  if (!STOCKFISH) initStockfish();
  STOCKFISH.postMessage(e.data);
};
