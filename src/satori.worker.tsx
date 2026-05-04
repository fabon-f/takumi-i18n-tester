import * as Comlink from "comlink";
import satori from "satori";

const renderer = {
  async render(text: string, fontData: ArrayBuffer): Promise<string> {
    if (!fontData) {
      throw new Error("Font data is required.");
    }

    const svg = await satori(
      <div
        style={{
          display: "flex",
          fontSize: 40,
          color: "black",
          backgroundColor: "white",
          width: "100%",
          height: "100%",
          padding: 40,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {text}
      </div>,
      {
        width: 600,
        height: 400,
        fonts: [
          {
            name: "CustomFont",
            data: fontData,
            weight: 400,
            style: "normal",
          },
        ],
      },
    );
    return svg;
  },
};

export type Renderer = typeof renderer;

Comlink.expose(renderer);
