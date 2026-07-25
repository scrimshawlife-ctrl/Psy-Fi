/* PsyFi visualization rasterizer worker (Canvas/ImageData path). */

function rasterizeMagnitude(values, width, height) {
  const buffer = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const row = values[Math.floor(i / width)];
    const v = row ? row[i % width] : 0;
    const t = Math.max(0, Math.min(1, Number(v) || 0));
    // Cyan → violet brand ramp
    const r = Math.round(62 + (143 - 62) * t);
    const g = Math.round(231 + (123 - 231) * t);
    const b = Math.round(242 + (255 - 242) * t);
    const offset = i * 4;
    buffer[offset] = r;
    buffer[offset + 1] = g;
    buffer[offset + 2] = b;
    buffer[offset + 3] = 255;
  }
  return buffer;
}

self.onmessage = (event) => {
  const { id, type, values, width, height } = event.data || {};
  try {
    if (type !== 'rasterize') {
      throw new Error(`Unknown worker message type: ${type}`);
    }
    if (!values || !width || !height) {
      throw new Error('rasterize requires values, width, and height');
    }
    const buffer = rasterizeMagnitude(values, width, height);
    self.postMessage(
      { id, type: 'rasterized', width, height, buffer },
      [buffer.buffer]
    );
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      message: error && error.message ? error.message : String(error),
    });
  }
};
