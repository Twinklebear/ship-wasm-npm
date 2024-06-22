import CppApp from "./cpp/app.js";

export async function runWasm(canvas: string) {
  const app = await CppApp();
  app.callMain([canvas]);
}
