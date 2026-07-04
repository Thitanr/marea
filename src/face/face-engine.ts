/* ==========================================================================
   MAREA — Face Engine
   Camera + MediaPipe FaceLandmarker (the exact same model KAI uses),
   loaded lazily and served 100% same-origin:
     /mediapipe/wasm/*  — WASM runtime (bundled locally, no CDN)
     /models/face_landmarker.task — 478-landmark + blendshapes model
   Frames never leave the device: video is processed in-memory and discarded.
   ========================================================================== */

import { extractSignals, type SignalFrame } from './face-signals.js';

export type FaceEngineError = 'camera' | 'assets';

export class FaceEngineException extends Error {
  code: FaceEngineError;
  constructor(code: FaceEngineError, message: string) {
    super(message);
    this.code = code;
  }
}

type FrameListener = (f: SignalFrame) => void;

const TARGET_INTERVAL_MS = 66; // ~15 fps — plenty for gestures, kind to low-end phones

class FaceEngine {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private landmarker: { detectForVideo(v: HTMLVideoElement, t: number): unknown; close(): void } | null = null;
  private rafId = 0;
  private lastT = 0;
  private refCount = 0;
  private starting: Promise<void> | null = null;
  private listeners = new Set<FrameListener>();

  onFrame(cb: FrameListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  get running(): boolean {
    return this.refCount > 0;
  }

  /** Ref-counted start — Face Control and Neurofeedback can share the camera. */
  async acquire(): Promise<void> {
    this.refCount++;
    if (this.refCount > 1) {
      // Another consumer may still be starting up
      if (this.starting) await this.starting;
      return;
    }
    this.starting = this.startInternal();
    try {
      await this.starting;
    } catch (err) {
      this.refCount = 0;
      this.starting = null;
      throw err;
    }
    this.starting = null;
  }

  release(): void {
    if (this.refCount === 0) return;
    this.refCount--;
    if (this.refCount === 0) this.stopInternal();
  }

  private async startInternal(): Promise<void> {
    // 1. Load the vision runtime + model (cached offline by the SW after first use)
    let landmarker;
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
      const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate },
        runningMode: 'VIDEO' as const,
        numFaces: 1,
        outputFaceBlendshapes: true,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
      });
      try {
        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, options('GPU'));
      } catch {
        // Older/low-end phones without WebGL2 for the GPU delegate
        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, options('CPU'));
      }
    } catch (err) {
      throw new FaceEngineException('assets', String(err));
    }

    // 2. Front camera — modest resolution keeps detection fast
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch (err) {
      landmarker.close();
      throw new FaceEngineException('camera', String(err));
    }

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.srcObject = stream;
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;';
    document.body.appendChild(video);
    await video.play();

    this.video = video;
    this.stream = stream;
    this.landmarker = landmarker as typeof this.landmarker;
    this.lastT = 0;
    this.loop();
  }

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop);
    const video = this.video;
    const landmarker = this.landmarker;
    if (!video || !landmarker || video.readyState < 2) return;

    const now = performance.now();
    if (now - this.lastT < TARGET_INTERVAL_MS) return;
    this.lastT = now;

    let frame: SignalFrame;
    try {
      const result = landmarker.detectForVideo(video, now) as {
        faceBlendshapes?: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
      };
      frame = extractSignals(result.faceBlendshapes?.[0]?.categories, now);
    } catch {
      return; // transient detector hiccup — skip the frame
    }
    this.listeners.forEach(cb => cb(frame));
  };

  private stopInternal(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.video?.remove();
    this.video = null;
    this.landmarker?.close();
    this.landmarker = null;
  }
}

/** Shared singleton — one camera, many consumers. */
export const faceEngine = new FaceEngine();
