importScripts("stockfish.js");

// Forward messages between worker <-> main thread
onmessage = (e) => {
  if (self.STOCKFISH) {
    STOCKFISH.postMessage(e.data);
  }
};

if (typeof STOCKFISH !== "undefined") {
  STOCKFISH.onmessage = (event) => {
    postMessage(event.data);
  };
}
