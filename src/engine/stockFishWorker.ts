// export function createStockfishWorker(): Worker {
//   const code = `
//     importScripts('/stockfish.js');

//     // Tell Stockfish where the WASM file is
//     if (typeof Module !== 'undefined') {
//       Module.locateFile = (path) => '/stockfish.wasm';
//     }

//     const engine = stockfish();

//     engine.onmessage = (e) => postMessage(e.data);

//     self.onmessage = (e) => engine.postMessage(e.data);
//   `;

//   const blob = new Blob([code], { type: "application/javascript" });
//   const url = URL.createObjectURL(blob);
//   return new Worker(url);
// }
