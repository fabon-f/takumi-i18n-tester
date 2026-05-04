import "./assets/global.css";
import * as Comlink from "comlink";
import { useState, useRef, useEffect } from "react";

import type { Renderer as SatoriRenderer } from "./satori.worker.tsx";
import type { TakumiRenderer } from "./takumi.worker.tsx";

import SatoriWorker from "./satori.worker.tsx?worker";
import TakumiWorker from "./takumi.worker.tsx?worker";

export function App() {
  const [text, setText] = useState("Hello World!");
  const [satoriResult, setSatoriResult] = useState<PromiseSettledResult<string> | null>(null);
  const [takumiResult, setTakumiResult] = useState<PromiseSettledResult<string> | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [fontFile, setFontFile] = useState<File | null>(null);

  const satoriApiRef = useRef<Comlink.Remote<SatoriRenderer>>(null);
  const takumiApiRef = useRef<Comlink.Remote<TakumiRenderer>>(null);
  const nativeFontFaceRef = useRef<FontFace | null>(null);

  useEffect(() => {
    const sWorker = new SatoriWorker();
    const tWorker = new TakumiWorker();

    satoriApiRef.current = Comlink.wrap<SatoriRenderer>(sWorker);
    takumiApiRef.current = Comlink.wrap<TakumiRenderer>(tWorker);

    return () => {
      sWorker.terminate();
      tWorker.terminate();
    };
  }, []);

  const handleRender = async () => {
    if (!satoriApiRef.current || !takumiApiRef.current || isRendering || !fontFile) return;

    setIsRendering(true);

    const fontData = await fontFile.arrayBuffer();

    // Load native font
    const fontFace = new FontFace("CustomNativeFont", fontData.slice(0));
    await fontFace.load();
    if (nativeFontFaceRef.current) {
      document.fonts.delete(nativeFontFaceRef.current);
    }
    document.fonts.add(fontFace);
    nativeFontFaceRef.current = fontFace;

    // Render in parallel
    const [satoriResult, takumiResult] = await Promise.allSettled([
      satoriApiRef.current.render(text, Comlink.transfer(fontData.slice(0), [fontData.slice(0)])),
      takumiApiRef.current.render(
        text,
        Comlink.transfer(fontData, [fontData]),
        window.devicePixelRatio,
      ),
    ]);
    setSatoriResult(satoriResult);
    setTakumiResult(takumiResult);
    setIsRendering(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Text Renderer Tester</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          Text:
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ height: "100px", padding: "10px" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          Custom Font (required .ttf):
          <input
            type="file"
            accept=".ttf"
            onChange={(e) => {
              setFontFile(e.target.files?.[0] || null);
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleRender}
          disabled={isRendering || !fontFile}
          style={{ padding: "10px", cursor: "pointer" }}
        >
          {isRendering ? "Rendering..." : "Render All Engines"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: 1 }}>
          <h2>Browser Native</h2>
          <div
            style={{
              width: 600,
              height: 400,
              border: "1px solid #ccc",
              background: "white",
              fontFamily: "CustomNativeFont",
              fontSize: "40px",
              padding: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2>Satori (SVG)</h2>
          {satoriResult === null ? (
            <div
              style={{
                width: 600,
                height: 400,
                border: "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Pending...
            </div>
          ) : satoriResult.status === "fulfilled" ? (
            <img
              src={satoriResult.value}
              style={{
                width: 600,
                height: 400,
                border: "1px solid #ccc",
                background: "white",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: 600,
                height: 400,
                border: "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "red",
                fontWeight: "bold",
              }}
            >
              Error: {satoriResult.reason.message}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2>Takumi (PNG)</h2>
          {takumiResult === null ? (
            <div
              style={{
                width: 600,
                height: 400,
                border: "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Pending...
            </div>
          ) : takumiResult.status === "fulfilled" ? (
            <img
              src={takumiResult.value}
              alt="Takumi Render"
              style={{ border: "1px solid #ccc", width: 600, height: 400, display: "block" }}
            />
          ) : (
            <div
              style={{
                width: 600,
                height: 400,
                border: "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "red",
                fontWeight: "bold",
              }}
            >
              Error: {takumiResult.reason.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
