importScripts("/stockfish.js");

let STOCKFISH;

// Initialize Stockfish safely
function initStockfish() {
  if (STOCKFISH) return;

  // Some builds require new STOCKFISH() constructor
  STOCKFISH =
    STOCKFISH ||
    new STOCKFISH({
      // Optional: explicitly pass memory limits (64KiB pages)
      wasmMemory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
      locateFile: (file) => `/stockfish.wasm`, // ensure WASM loads correctly
    });

  // Limit memory usage for browser
  STOCKFISH.postMessage("uci"); // init UCI
  STOCKFISH.postMessage("setoption name Threads value 1"); // 1 thread only
  STOCKFISH.postMessage("setoption name Hash value 16"); // 16MB hash (browser safe)

  // Relay Stockfish messages to main thread
  STOCKFISH.onmessage = (event) => {
    postMessage(event.data);
  };
}

// Initialize immediately
initStockfish();

// Receive commands from main thread
onmessage = function (e) {
  if (!STOCKFISH) initStockfish();
  STOCKFISH.postMessage(e.data);
};
