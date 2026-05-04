import * as Comlink from "comlink";
import { useState, useRef, useEffect } from "react";

import type { Renderer as SatoriRenderer } from "./satori.worker.tsx";
import type { TakumiRenderer } from "./takumi.worker.tsx";

import SatoriWorker from "./satori.worker.tsx?worker";
import TakumiWorker from "./takumi.worker.tsx?worker";

export function App() {
  const [text, setText] = useState("Hello World!");
  const [satoriSvg, setSatoriSvg] = useState<string | null>(null);
  const [takumiImage, setTakumiImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [fontFile, setFontFile] = useState<File | null>(null);

  const satoriApiRef = useRef<Comlink.Remote<SatoriRenderer>>(null);
  const takumiApiRef = useRef<Comlink.Remote<TakumiRenderer>>(null);

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
    if (!satoriApiRef.current || !takumiApiRef.current || isRendering) return;

    if (!fontFile) {
      setError("Please select a font file (.ttf) first.");
      return;
    }

    setError(null);
    setIsRendering(true);

    try {
      const fontData = await fontFile.arrayBuffer();

      // Render in parallel
      const [sSvg, tImage] = await Promise.all([
        satoriApiRef.current.render(text, Comlink.transfer(fontData.slice(0), [fontData.slice(0)])),
        takumiApiRef.current.render(
          text,
          Comlink.transfer(fontData, [fontData]),
          window.devicePixelRatio,
        ),
      ]);

      setSatoriSvg(sSvg);
      setTakumiImage(tImage);
    } catch (err) {
      console.error("Rendering error:", err);
      setError(String(err));
    } finally {
      setIsRendering(false);
    }
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
              setError(null);
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleRender}
          disabled={isRendering}
          style={{ padding: "10px", cursor: "pointer" }}
        >
          {isRendering ? "Rendering..." : "Render Both Engines"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: "20px", color: "red", fontWeight: "bold" }}>Error: {error}</div>
      )}

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: 1 }}>
          <h2>Satori (SVG)</h2>
          {satoriSvg ? (
            <div
              style={{ border: "1px solid #ccc", background: "white" }}
              dangerouslySetInnerHTML={{ __html: satoriSvg }}
            />
          ) : (
            <div
              style={{
                height: "400px",
                border: "1px dashed #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Pending...
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2>Takumi (PNG)</h2>
          {takumiImage ? (
            <img
              src={takumiImage}
              alt="Takumi Render"
              style={{ border: "1px solid #ccc", width: 600, height: 400, display: "block" }}
            />
          ) : (
            <div
              style={{
                height: "400px",
                border: "1px dashed #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Pending...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
