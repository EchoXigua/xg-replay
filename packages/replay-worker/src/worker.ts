import workerCode from "./_worker.ts?raw";

// 这段代码在构建时会被 _worker.ts 的内容替换，并且会被包装成一个字符串
// export default "";
export default workerCode;
