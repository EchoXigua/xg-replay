// import workerString from "./test";
import workerString from "./worker";

export function getWorkerURL(): string {
  const workerBlob = new Blob([workerString]);
  return URL.createObjectURL(workerBlob);
}
