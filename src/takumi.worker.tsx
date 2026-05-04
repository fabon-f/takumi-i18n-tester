import * as Comlink from "comlink";
import { fromJsx } from "takumi-js/helpers/jsx";
import wasm, { init, Renderer } from "takumi-js/wasm";

let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  await init({ module_or_path: wasm });
  isInitialized = true;
}

const takumiRenderer = {
  async render(text: string, fontData: ArrayBuffer, devicePixelRatio: number): Promise<string> {
    await ensureInitialized();
    const renderer = new Renderer({
      fonts: [
        {
          name: "CustomFont",
          data: fontData,
        },
      ],
    });

    const { node, stylesheets } = await fromJsx(
      <div
        style={{
          display: "flex",
          fontSize: "40px",
          color: "black",
          backgroundColor: "white",
          width: "100%",
          height: "100%",
          padding: "40px",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "CustomFont",
        }}
      >
        {text}
      </div>,
    );

    const outputBuffer = renderer.render(node, {
      width: 600 * devicePixelRatio,
      height: 400 * devicePixelRatio,
      devicePixelRatio,
      format: "png",
      stylesheets,
    }) as Uint8Array<ArrayBuffer>;

    const blob = new Blob([outputBuffer], { type: "image/png" });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  },
};

export type TakumiRenderer = typeof takumiRenderer;

Comlink.expose(takumiRenderer);
