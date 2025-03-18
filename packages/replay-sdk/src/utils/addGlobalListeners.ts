import type { ReplayContainer } from "../types";

export function addGlobalListeners(replay: ReplayContainer) {
  window.addEventListener("error", () => {
    setTimeout(() => {
      replay.sendBufferedReplayOrFlush();
    });
  });
}
