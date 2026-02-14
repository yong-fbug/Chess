// stockfish.worker.js
importScripts("/stockfish.js");

let STOCKFISH;

function initStockfish() {
  // Create the Stockfish instance
  STOCKFISH = STOCKFISH || new STOCKFISH(); // some builds export as function

  // Optional: Reduce memory usage
  STOCKFISH.postMessage("uci"); // initialize
  STOCKFISH.postMessage("setoption name Threads value 1"); // 1 thread only
  STOCKFISH.postMessage("setoption name Hash value 32"); // 32MB hash (default 128+ is heavy)

  STOCKFISH.onmessage = (event) => {
    postMessage(event.data);
  };
}

initStockfish();

onmessage = function (e) {
  if (!STOCKFISH) initStockfish();
  STOCKFISH.postMessage(e.data);
};
