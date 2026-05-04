import { useState, useRef, useEffect } from "react";

export function App() {
  const [text, setText] = useState('Hello Satori!');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const workerRef = useRef<Worker>(null);

  useEffect(() => {
    const worker = new Worker(new URL('./render.worker.tsx', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { type, svg, error } = e.data;
      if (type === 'success') {
        setSvg(svg);
        setError(null);
      } else {
        console.error('Rendering error:', error);
        setError(error);
        setSvg(null);
      }
      setIsRendering(false);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const handleRender = async () => {
    if (!workerRef.current || isRendering) return;

    if (!fontFile) {
      setError('Please select a font file (.ttf) first.');
      setSvg(null);
      return;
    }

    setError(null);
    setIsRendering(true);

    const fontData = await fontFile.arrayBuffer();

    workerRef.current.postMessage(
      { text, fontData },
      [fontData]
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Satori Text to Image</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Text:
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ height: '100px', padding: '10px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
          style={{ padding: '10px', cursor: 'pointer' }}
        >
          {isRendering ? 'Rendering...' : 'Render to Image'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '20px', color: 'red', fontWeight: 'bold' }}>
          Error: {error}
        </div>
      )}


      <div style={{ marginTop: "20px" }}>
        <h2>Output:</h2>
        {svg ? (
          <div
            style={{ border: "1px solid #ccc", display: "inline-block" }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <p>No image rendered yet.</p>
        )}
      </div>
    </div>
  );
}
