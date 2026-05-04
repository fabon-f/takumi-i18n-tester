import satori from 'satori';

onmessage = async (e: MessageEvent<{ text: string; fontData?: ArrayBuffer }>) => {
  const { text, fontData } = e.data;
  try {
    if (!fontData) {
      throw new Error('Font data is required.');
    }

    const svg = await satori(
      <div
        style={{
          display: 'flex',
          fontSize: 40,
          color: 'black',
          backgroundColor: 'white',
          width: '100%',
          height: '100%',
          padding: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {text}
      </div>,
      {
        width: 600,
        height: 400,
        fonts: [
          {
            name: 'CustomFont',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );
    postMessage({ type: 'success', svg });
  } catch (error) {
    postMessage({ type: 'error', error: String(error) });
  }
};
