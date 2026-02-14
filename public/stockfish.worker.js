// stockfish.worker.js
importScripts("/stockfish.js");

let STOCKFISH;

function initStockfish() {
  if (STOCKFISH) return;

  // Use constructor if needed
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

  // Reduce memory usage for browser
  STOCKFISH.postMessage("uci");
  STOCKFISH.postMessage("setoption name Threads value 1"); // single thread
  STOCKFISH.postMessage("setoption name Hash value 16"); // 16MB hash

  // Relay messages to main thread
  STOCKFISH.onmessage = (event) => postMessage(event.data);
}

// Initialize immediately
initStockfish();

// Relay main thread messages
onmessage = function (e) {
  if (!STOCKFISH) initStockfish();
  STOCKFISH.postMessage(e.data);
};
