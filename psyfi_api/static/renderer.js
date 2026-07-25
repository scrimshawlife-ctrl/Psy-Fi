/* PsyFi renderer adapters: Worker+Canvas2D baseline, optional WebGPU path. */

(function (global) {
  const state = {
    backend: 'none',
    workerSupported: typeof Worker !== 'undefined',
    webgpuSupported: typeof navigator !== 'undefined' && !!navigator.gpu,
    lastError: null,
  };

  let worker = null;
  let workerJobId = 0;
  let webgpu = null;

  function ensureWorker() {
    if (!state.workerSupported) return null;
    if (!worker) worker = new Worker('/static/render_worker.js');
    return worker;
  }

  function rasterizeOnMainThread(values, width, height) {
    const image = new ImageData(width, height);
    for (let i = 0; i < width * height; i += 1) {
      const row = values[Math.floor(i / width)];
      const v = row ? row[i % width] : 0;
      const t = Math.max(0, Math.min(1, Number(v) || 0));
      const offset = i * 4;
      image.data[offset] = Math.round(62 + (143 - 62) * t);
      image.data[offset + 1] = Math.round(231 + (123 - 231) * t);
      image.data[offset + 2] = Math.round(242 + (255 - 242) * t);
      image.data[offset + 3] = 255;
    }
    return image;
  }

  function rasterizeWithWorker(values, width, height) {
    const active = ensureWorker();
    if (!active) {
      return Promise.resolve(rasterizeOnMainThread(values, width, height));
    }
    const id = (workerJobId += 1);
    return new Promise((resolve, reject) => {
      function onMessage(event) {
        if (!event.data || event.data.id !== id) return;
        active.removeEventListener('message', onMessage);
        if (event.data.type === 'error') {
          reject(new Error(event.data.message || 'Worker rasterize failed'));
          return;
        }
        resolve(new ImageData(new Uint8ClampedArray(event.data.buffer), width, height));
      }
      active.addEventListener('message', onMessage);
      active.postMessage({ id, type: 'rasterize', values, width, height });
    });
  }

  function drawCanvas2D(canvas, imageData, width, height) {
    const ctx = canvas.getContext('2d');
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    off.getContext('2d').putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }

  async function initWebGPU(canvas) {
    if (!state.webgpuSupported) return null;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return null;
      const device = await adapter.requestDevice();
      const context = canvas.getContext('webgpu');
      if (!context) return null;
      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: 'opaque' });

      const shader = device.createShaderModule({
        code: `
struct VertexOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@vertex
fn vs(@builtin(vertex_index) idx: u32) -> VertexOut {
  var pos = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  var uv = array<vec2f, 6>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
    vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
  );
  var out: VertexOut;
  out.position = vec4f(pos[idx], 0.0, 1.0);
  out.uv = uv[idx];
  return out;
}
@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
@fragment
fn fs(input: VertexOut) -> @location(0) vec4f {
  return textureSample(tex, samp, input.uv);
}
`,
      });

      const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: shader, entryPoint: 'vs' },
        fragment: { module: shader, entryPoint: 'fs', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      });
      const sampler = device.createSampler({ magFilter: 'nearest', minFilter: 'nearest' });
      return { device, context, pipeline, sampler };
    } catch (error) {
      state.lastError = error && error.message ? error.message : String(error);
      return null;
    }
  }

  async function renderWebGPU(canvas, imageData, width, height) {
    if (!webgpu) webgpu = await initWebGPU(canvas);
    if (!webgpu) return false;
    const { device, context, pipeline, sampler } = webgpu;
    const texture = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.writeTexture(
      { texture },
      imageData.data,
      { bytesPerRow: width * 4 },
      [width, height]
    );
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: texture.createView() },
        { binding: 1, resource: sampler },
      ],
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.02, g: 0.03, b: 0.04, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
    texture.destroy();
    return true;
  }

  async function renderVisualization(options) {
    const {
      canvas2d,
      canvasGpu,
      visualization,
      preferWebGPU = true,
    } = options || {};

    const values = visualization && visualization.field && visualization.field.values;
    const width = visualization && visualization.field && visualization.field.width;
    const height = visualization && visualization.field && visualization.field.height;
    if (!values || !width || !height || !canvas2d) {
      state.backend = 'none';
      return { ...state };
    }

    let imageData;
    try {
      imageData = await rasterizeWithWorker(values, width, height);
    } catch (error) {
      state.lastError = error.message;
      imageData = rasterizeOnMainThread(values, width, height);
    }

    if (preferWebGPU && canvasGpu && state.webgpuSupported) {
      try {
        const ok = await renderWebGPU(canvasGpu, imageData, width, height);
        if (ok) {
          canvasGpu.hidden = false;
          canvas2d.hidden = true;
          state.backend = 'webgpu';
          return { ...state };
        }
      } catch (error) {
        state.lastError = error && error.message ? error.message : String(error);
        webgpu = null;
      }
    }

    canvas2d.hidden = false;
    if (canvasGpu) canvasGpu.hidden = true;
    drawCanvas2D(canvas2d, imageData, width, height);
    state.backend = state.workerSupported ? 'worker+canvas2d' : 'main+canvas2d';
    return { ...state };
  }

  global.PsyFiRenderer = {
    renderVisualization,
    getRendererState: () => ({ ...state }),
  };
})(window);
