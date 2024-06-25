import { runWasm } from "@twinklebear/wasm_demo_package";

function sharedArrayBufferSupport() {
  try {
    var s = new SharedArrayBuffer(1024);
    if (s === undefined) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

(async () => {
  if (!sharedArrayBufferSupport()) {
    console.error("No sharedArrayBufferSupport");
  } else {
    console.log("have sharedArrayBufferSupport");
  }
  await runWasm("#my-canvas");
})();
