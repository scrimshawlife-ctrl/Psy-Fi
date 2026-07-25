/**
 * Device sensor probe + opt-in meters for ParameterField modulators.
 * Feature-detects without prompting; acquisition is always user-initiated.
 * Never writes to shaders — only normalized 0..1 channels for modulators.
 */
(function (global) {
  'use strict';

  function clamp01(v) {
    return Math.max(0, Math.min(1, Number(v) || 0));
  }

  function probeSensorCapabilities() {
    const motionNeedsGesture =
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function';
    const orientationNeedsGesture =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function';
    return {
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      deviceMotion: typeof DeviceMotionEvent !== 'undefined',
      deviceOrientation: typeof DeviceOrientationEvent !== 'undefined',
      motionNeedsGesture,
      orientationNeedsGesture,
      ambientLight: typeof global.AmbientLightSensor === 'function',
      webMidi: typeof navigator.requestMIDIAccess === 'function',
      gamepad: typeof navigator.getGamepads === 'function',
      vibrate: typeof navigator.vibrate === 'function',
      battery: typeof navigator.getBattery === 'function',
      // Explicitly not used as a modulator (privacy); reported for transparency only.
      geolocation: !!navigator.geolocation,
    };
  }

  /** Display / monitor probe (no permission). Used by launch scan + capabilities. */
  function probeMonitor() {
    const s = global.screen || {};
    const width = Number(s.width) || Number(global.innerWidth) || 0;
    const height = Number(s.height) || Number(global.innerHeight) || 0;
    const availWidth = Number(s.availWidth) || width;
    const availHeight = Number(s.availHeight) || height;
    const dpr = Number(global.devicePixelRatio) || 1;
    const colorDepth = Number(s.colorDepth) || 0;
    const orientation =
      (s.orientation && s.orientation.type) ||
      (width >= height ? 'landscape' : 'portrait');
    const ok = width > 0 && height > 0;
    const detail = ok
      ? `${width}×${height} · ${dpr.toFixed(2)}× DPR` +
        (colorDepth ? ` · ${colorDepth}-bit` : '') +
        (orientation ? ` · ${orientation}` : '')
      : 'display metrics unavailable';
    return {
      ok,
      width,
      height,
      availWidth,
      availHeight,
      dpr,
      colorDepth,
      orientation,
      detail,
    };
  }

  /**
   * GPU adapter probe — WebGPU requestAdapter + WebGL renderer string.
   * Feature-detect only; does not keep a device alive.
   */
  async function probeGpu() {
    let webgpu = false;
    let adapterLabel = '';
    if (navigator.gpu && typeof navigator.gpu.requestAdapter === 'function') {
      try {
        const adapter = await Promise.race([
          navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }),
          new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
        if (adapter) {
          webgpu = true;
          let info = adapter.info || null;
          if (!info && typeof adapter.requestAdapterInfo === 'function') {
            try {
              info = await adapter.requestAdapterInfo();
            } catch (_e) {
              info = null;
            }
          }
          if (info) {
            adapterLabel = [info.vendor, info.architecture || info.device || info.description]
              .filter(Boolean)
              .join(' ')
              .trim();
          }
        }
      } catch (_e) {
        webgpu = false;
      }
    }

    let webgl = false;
    let glRenderer = '';
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('experimental-webgl');
      if (gl) {
        webgl = true;
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          glRenderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
        } else {
          glRenderer = String(gl.getParameter(gl.RENDERER) || 'WebGL');
        }
      }
    } catch (_e) {
      webgl = false;
    }

    const ok = webgpu || webgl;
    const parts = [];
    if (webgpu) parts.push(adapterLabel ? `WebGPU · ${adapterLabel}` : 'WebGPU adapter');
    else parts.push('WebGPU absent');
    if (webgl && glRenderer) parts.push(glRenderer);
    else if (webgl) parts.push('WebGL');
    else parts.push('WebGL absent');
    return {
      ok,
      webgpu,
      webgl,
      adapterLabel,
      glRenderer,
      detail: parts.join(' · '),
    };
  }

  class DeviceSensorHub {
    /**
     * @param {{ onChannels?: (ch: object) => void, status?: (msg: string) => void }} opts
     */
    constructor(opts) {
      this.onChannels = opts && opts.onChannels ? opts.onChannels : function () {};
      this.status = opts && opts.status ? opts.status : function () {};
      this.caps = probeSensorCapabilities();
      this.channels = {
        camera: 0,
        motion: 0,
        midi: 0,
        audio: 0,
        haptics: 0,
      };
      this.active = {
        camera: false,
        motion: false,
        orientation: false,
        audio: false,
        webMidi: false,
        gamepad: false,
        ambient: false,
        haptics: false,
      };
      this._cameraStream = null;
      this._cameraRaf = 0;
      this._audioStream = null;
      this._audioCtx = null;
      this._audioRaf = 0;
      this._motionHandler = null;
      this._orientationHandler = null;
      this._gamepadTimer = null;
      this._hapticsTimer = 0;
      this._hapticsOn = false;
      this._midiAccess = null;
      this._ambientSensor = null;
      this._motionAccel = 0;
      this._motionOrient = 0;
      this._ambient = 0;
    }

    getCapabilities() {
      return { ...this.caps };
    }

    getChannels() {
      return { ...this.channels };
    }

    _emit() {
      // Blend orientation + ambient into existing freeze-safe channels.
      const motion = clamp01(Math.max(this._motionAccel, this._motionOrient * 0.85));
      const camera = clamp01(Math.max(this.channels.camera, this._ambient * 0.7));
      this.channels.motion = motion;
      this.channels.camera = camera;
      this.onChannels({ ...this.channels });
    }

    _setChannel(name, value) {
      this.channels[name] = clamp01(value);
      this._emit();
    }

    async enableCamera() {
      if (!this.caps.camera) throw new Error('Camera API unavailable');
      if (this.active.camera) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      this._cameraStream = stream;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();
      const meter = document.createElement('canvas');
      meter.width = 32;
      meter.height = 32;
      const mctx = meter.getContext('2d', { willReadFrequently: true });
      this.active.camera = true;
      const tick = () => {
        if (!this.active.camera || !this._cameraStream) return;
        try {
          mctx.drawImage(video, 0, 0, 32, 32);
          const px = mctx.getImageData(0, 0, 32, 32).data;
          let sum = 0;
          for (let i = 0; i < px.length; i += 4) sum += (px[i] + px[i + 1] + px[i + 2]) / 3;
          this._setChannel('camera', sum / (255 * (px.length / 4)));
        } catch (_e) {
          /* ignore draw races */
        }
        this._cameraRaf = requestAnimationFrame(tick);
      };
      tick();
      this.status('Camera meter active → ParameterField');
    }

    disableCamera() {
      this.active.camera = false;
      if (this._cameraRaf) cancelAnimationFrame(this._cameraRaf);
      this._cameraRaf = 0;
      if (this._cameraStream) {
        this._cameraStream.getTracks().forEach((t) => t.stop());
        this._cameraStream = null;
      }
      this._setChannel('camera', 0);
    }

    async enableMotion() {
      if (!this.caps.deviceMotion && !this.caps.deviceOrientation) {
        throw new Error('Motion/orientation APIs unavailable');
      }
      if (this.caps.deviceMotion && this.caps.motionNeedsGesture) {
        const state = await DeviceMotionEvent.requestPermission();
        if (state !== 'granted') throw new Error('Motion permission denied');
      }
      if (this.caps.deviceOrientation && this.caps.orientationNeedsGesture) {
        try {
          const state = await DeviceOrientationEvent.requestPermission();
          if (state !== 'granted') {
            // Orientation optional if accel granted.
          }
        } catch (_e) {
          /* some browsers only gate motion */
        }
      }

      if (this.caps.deviceMotion && !this.active.motion) {
        this._motionHandler = (event) => {
          const x = Math.abs(event.accelerationIncludingGravity?.x || event.acceleration?.x || 0);
          const y = Math.abs(event.accelerationIncludingGravity?.y || event.acceleration?.y || 0);
          const z = Math.abs(event.accelerationIncludingGravity?.z || event.acceleration?.z || 0);
          this._motionAccel = clamp01(Math.sqrt(x * x + y * y + z * z) / 20);
          this._emit();
        };
        window.addEventListener('devicemotion', this._motionHandler);
        this.active.motion = true;
      }

      if (this.caps.deviceOrientation && !this.active.orientation) {
        this._orientationHandler = (event) => {
          const beta = Math.abs(event.beta || 0) / 90;
          const gamma = Math.abs(event.gamma || 0) / 90;
          this._motionOrient = clamp01(0.55 * beta + 0.45 * gamma);
          this._emit();
        };
        window.addEventListener('deviceorientation', this._orientationHandler);
        this.active.orientation = true;
      }
      this.status('Motion/orientation meters active → ParameterField');
    }

    disableMotion() {
      if (this._motionHandler) {
        window.removeEventListener('devicemotion', this._motionHandler);
        this._motionHandler = null;
      }
      if (this._orientationHandler) {
        window.removeEventListener('deviceorientation', this._orientationHandler);
        this._orientationHandler = null;
      }
      this.active.motion = false;
      this.active.orientation = false;
      this._motionAccel = 0;
      this._motionOrient = 0;
      this._setChannel('motion', 0);
    }

    async enableAudio() {
      if (!this.caps.microphone) throw new Error('Microphone API unavailable');
      if (this.active.audio) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this._audioStream = stream;
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = this._audioCtx.createMediaStreamSource(stream);
      const analyser = this._audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      this.active.audio = true;
      const tick = () => {
        if (!this.active.audio) return;
        analyser.getByteFrequencyData(data);
        // Emphasize low/mid energy for a more responsive field coupling.
        let bass = 0;
        let mid = 0;
        const n = data.length;
        const bassEnd = Math.max(2, Math.floor(n * 0.18));
        const midEnd = Math.max(bassEnd + 1, Math.floor(n * 0.55));
        for (let i = 0; i < bassEnd; i++) bass += data[i];
        for (let i = bassEnd; i < midEnd; i++) mid += data[i];
        const level = clamp01(
          (bass / (255 * bassEnd)) * 0.65 + (mid / (255 * (midEnd - bassEnd))) * 0.55,
        );
        this._setChannel('audio', level);
        this._audioRaf = requestAnimationFrame(tick);
      };
      tick();
      this.status('Audio meter active → ParameterField');
    }

    disableAudio() {
      this.active.audio = false;
      if (this._audioRaf) cancelAnimationFrame(this._audioRaf);
      this._audioRaf = 0;
      if (this._audioStream) {
        this._audioStream.getTracks().forEach((t) => t.stop());
        this._audioStream = null;
      }
      if (this._audioCtx) {
        try {
          this._audioCtx.close();
        } catch (_e) {
          /* ignore */
        }
        this._audioCtx = null;
      }
      this._setChannel('audio', 0);
    }

    async enableWebMidi() {
      if (!this.caps.webMidi) throw new Error('Web MIDI unavailable');
      if (this.active.webMidi) return;
      const access = await navigator.requestMIDIAccess({ sysex: false });
      this._midiAccess = access;
      let activity = 0;
      const onMessage = (ev) => {
        const data = ev.data || [];
        const status = data[0] & 0xf0;
        if (status === 0x90 && (data[2] || 0) > 0) {
          activity = clamp01((data[2] || 0) / 127);
        } else if (status === 0xb0) {
          activity = clamp01(Math.max(activity * 0.7, (data[2] || 0) / 127));
        } else {
          activity = clamp01(activity * 0.92);
        }
        this._setChannel('midi', Math.max(this.channels.midi * 0.5, activity));
      };
      access.inputs.forEach((input) => input.addEventListener('midimessage', onMessage));
      access.onstatechange = () => {
        access.inputs.forEach((input) => {
          input.removeEventListener('midimessage', onMessage);
          input.addEventListener('midimessage', onMessage);
        });
      };
      this.active.webMidi = true;
      this.status('Web MIDI meter active → ParameterField');
    }

    disableWebMidi() {
      this.active.webMidi = false;
      this._midiAccess = null;
      this._setChannel('midi', 0);
    }

    enableGamepad() {
      if (!this.caps.gamepad) throw new Error('Gamepad API unavailable');
      if (this.active.gamepad) return;
      this.active.gamepad = true;
      const tick = () => {
        if (!this.active.gamepad) return;
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        let mag = 0;
        for (let i = 0; i < pads.length; i++) {
          const p = pads[i];
          if (!p) continue;
          for (let a = 0; a < p.axes.length; a++) mag = Math.max(mag, Math.abs(p.axes[a]));
          for (let b = 0; b < p.buttons.length; b++) {
            const btn = p.buttons[b];
            mag = Math.max(mag, btn.value || (btn.pressed ? 1 : 0));
          }
        }
        // Feed gamepad into motion (freeze-safe existing channel).
        this._motionOrient = clamp01(Math.max(this._motionOrient * 0.85, mag));
        this._emit();
        this._gamepadTimer = setTimeout(tick, 50);
      };
      tick();
      this.status('Gamepad meter active → ParameterField (motion channel)');
    }

    disableGamepad() {
      this.active.gamepad = false;
      if (this._gamepadTimer) clearTimeout(this._gamepadTimer);
      this._gamepadTimer = null;
      this._emit();
    }

    enableAmbientLight() {
      if (!this.caps.ambientLight) throw new Error('AmbientLightSensor unavailable');
      if (this.active.ambient) return;
      const sensor = new global.AmbientLightSensor({ frequency: 2 });
      sensor.addEventListener('reading', () => {
        // Typical indoor 50–500 lux; normalize softly.
        const lux = Number(sensor.illuminance || 0);
        this._ambient = clamp01(Math.log10(1 + lux) / 3.2);
        this._emit();
      });
      sensor.addEventListener('error', () => {
        this.disableAmbientLight();
      });
      sensor.start();
      this._ambientSensor = sensor;
      this.active.ambient = true;
      this.status('Ambient light meter active → ParameterField (camera channel)');
    }

    disableAmbientLight() {
      this.active.ambient = false;
      if (this._ambientSensor) {
        try {
          this._ambientSensor.stop();
        } catch (_e) {
          /* ignore */
        }
        this._ambientSensor = null;
      }
      this._ambient = 0;
      this._emit();
    }

    enableHaptics() {
      if (!this.caps.vibrate) throw new Error('Vibration API unavailable');
      if (this.active.haptics) return;
      this.active.haptics = true;
      this._hapticsOn = true;
      const pulse = () => {
        if (!this._hapticsOn || !this.active.haptics) return;
        const level = Math.max(0.2, this.channels.haptics || 0.35);
        this._setChannel('haptics', level);
        const ms = Math.max(10, Math.floor(20 + level * 60));
        try {
          navigator.vibrate(ms);
        } catch (_e) {
          /* ignore */
        }
        this._hapticsTimer = setTimeout(pulse, 420);
      };
      pulse();
      this.status('Haptics pulse active → ParameterField');
    }

    disableHaptics() {
      this.active.haptics = false;
      this._hapticsOn = false;
      if (this._hapticsTimer) clearTimeout(this._hapticsTimer);
      this._hapticsTimer = 0;
      try {
        navigator.vibrate(0);
      } catch (_e) {
        /* ignore */
      }
      this._setChannel('haptics', 0);
    }

    /** Enable every sensor that is available (still requires user gesture for gated APIs). */
    async enableAvailable() {
      const enabled = [];
      const skipped = [];
      const tryEnable = async (name, fn) => {
        try {
          await fn();
          enabled.push(name);
        } catch (_e) {
          skipped.push(name);
        }
      };
      if (this.caps.camera) await tryEnable('camera', () => this.enableCamera());
      else skipped.push('camera');
      if (this.caps.microphone) await tryEnable('audio', () => this.enableAudio());
      else skipped.push('audio');
      if (this.caps.deviceMotion || this.caps.deviceOrientation) {
        await tryEnable('motion', () => this.enableMotion());
      } else skipped.push('motion');
      if (this.caps.webMidi) await tryEnable('webMidi', () => this.enableWebMidi());
      else skipped.push('webMidi');
      if (this.caps.gamepad) await tryEnable('gamepad', () => this.enableGamepad());
      else skipped.push('gamepad');
      if (this.caps.ambientLight) await tryEnable('ambient', () => this.enableAmbientLight());
      else skipped.push('ambient');
      if (this.caps.vibrate) await tryEnable('haptics', () => this.enableHaptics());
      else skipped.push('haptics');
      this.status(
        enabled.length
          ? `Sensors feeding field: ${enabled.join(', ')}`
          : 'No device sensors could be enabled',
      );
      return { enabled, skipped };
    }

    disableAll() {
      this.disableCamera();
      this.disableMotion();
      this.disableAudio();
      this.disableWebMidi();
      this.disableGamepad();
      this.disableAmbientLight();
      this.disableHaptics();
      this.status('All sensor meters stopped');
    }
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.probeSensorCapabilities = probeSensorCapabilities;
  global.PsyFiViz.probeMonitor = probeMonitor;
  global.PsyFiViz.probeGpu = probeGpu;
  global.PsyFiViz.DeviceSensorHub = DeviceSensorHub;
})(window);
