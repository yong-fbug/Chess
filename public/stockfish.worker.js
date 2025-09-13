// Worker runs in its own context, so no exports here!
importScripts("/stockfish.js");

onmessage = function (e) {
  if (self.STOCKFISH) {
    STOCKFISH.postMessage(e.data);
  }
};

if (typeof STOCKFISH !== "undefined") {
  STOCKFISH.onmessage = function (event) {
    postMessage(event.data);
  };
}
