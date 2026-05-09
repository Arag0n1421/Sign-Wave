"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Hand, Save, Square, Wand2 } from "lucide-react";
import { combineHandFeatures, HAND_CONNECTIONS, landmarksToAngleFeatures, matchTemplate } from "@/lib/dtw";
import {
  ASL_ALPHABET,
  createLetterTemplate,
  DEFAULT_ASL_TEMPLATES,
  getDemoGlosses,
  LOCAL_TEMPLATE_STORAGE_KEY,
  mergeTemplates
} from "@/lib/templates";
import type { Landmark, SignTemplate } from "@/lib/types";

type RecognitionStatus = "idle" | "loading" | "ready" | "error";

type HandLandmarkerResult = {
  landmarks?: Landmark[][];
  handednesses?: Array<Array<{ categoryName?: string }>>;
};

type HandLandmarkerInstance = {
  detectForVideo(videoFrame: HTMLVideoElement, timestamp: number): HandLandmarkerResult;
  close?: () => void;
};

type MediaPipeVisionModule = {
  FilesetResolver: {
    forVisionTasks: (path: string) => Promise<unknown>;
  };
  HandLandmarker: {
    createFromOptions: (
      fileset: unknown,
      options: {
        baseOptions: {
          modelAssetPath: string;
          delegate: "GPU" | "CPU";
        };
        runningMode: "VIDEO";
        numHands: number;
        minHandDetectionConfidence: number;
        minHandPresenceConfidence: number;
        minTrackingConfidence: number;
      }
    ) => Promise<HandLandmarkerInstance>;
  };
};

type Props = {
  onGloss: (gloss: string, confidence: number) => void;
};

export function SignRecognizer({ onGloss }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarkerInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameBufferRef = useRef<number[][]>([]);
  const animationRef = useRef<number | null>(null);
  const templatesRef = useRef<SignTemplate[]>(DEFAULT_ASL_TEMPLATES);
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [lastResult, setLastResult] = useState("No sign captured");
  const [topResult, setTopResult] = useState("No template match");
  const [handCount, setHandCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [localTemplates, setLocalTemplates] = useState<SignTemplate[]>([]);

  const templates = useMemo(
    () => mergeTemplates(DEFAULT_ASL_TEMPLATES, localTemplates),
    [localTemplates]
  );
  const trainedLetters = useMemo(
    () =>
      new Set(
        templates
          .filter((template) => template.examples.length > 0)
          .map((template) => template.gloss)
      ),
    [templates]
  );

  useEffect(() => {
    setLocalTemplates(loadLocalTemplates());

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  async function startCamera() {
    if (!videoRef.current || status === "loading") {
      return;
    }

    setStatus("loading");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 540 }
        },
        audio: false
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (!landmarkerRef.current) {
        const vision = await loadMediaPipeVision();
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
        );
        landmarkerRef.current = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      setStatus("ready");
      loop();
    } catch (error) {
      setStatus("error");
      setLastResult(error instanceof Error ? error.message : "Camera failed");
    }
  }

  function stopCamera() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    frameBufferRef.current = [];
    setFrameCount(0);
    setStatus((current) => (current === "error" ? "error" : "idle"));
  }

  function loop() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(loop);
      return;
    }

    const result = landmarker.detectForVideo(video, performance.now());
    setHandCount(result.landmarks?.length ?? 0);
    drawHandOverlay(result);
    const features = resultToFeatures(result);

    if (features.length) {
      frameBufferRef.current = [...frameBufferRef.current.slice(-42), features];
      setFrameCount(frameBufferRef.current.length);
      updateTopResult();
    }

    animationRef.current = requestAnimationFrame(loop);
  }

  function captureSign() {
    const match = matchTemplate(frameBufferRef.current, templatesRef.current);

    if (!match) {
      setLastResult("UNKNOWN");
      onGloss("UNKNOWN LETTER", 0);
      return;
    }

    const confidence = Math.round(match.confidence * 100);
    setLastResult(`${match.gloss} (${confidence}%)`);
    onGloss(match.gloss, match.confidence);
    frameBufferRef.current = [];
    setFrameCount(0);
  }

  function recordSelectedLetter() {
    const example = frameBufferRef.current.slice(-24);

    if (example.length < 8) {
      setLastResult("Need more frames before saving");
      return;
    }

    const current = loadLocalTemplates();
    const existing = current.find((template) => template.gloss === selectedLetter);
    const updatedTemplate = existing
      ? {
          ...existing,
          examples: [...existing.examples, example]
        }
      : createLetterTemplate(selectedLetter, [example]);
    const updated = [
      ...current.filter((template) => template.gloss !== selectedLetter),
      updatedTemplate
    ].sort((a, b) => a.gloss.localeCompare(b.gloss));

    window.localStorage.setItem(LOCAL_TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
    setLocalTemplates(updated);
    setLastResult(`Saved template for ${selectedLetter}`);
  }

  function clearLocalTemplates() {
    window.localStorage.removeItem(LOCAL_TEMPLATE_STORAGE_KEY);
    setLocalTemplates([]);
    setLastResult("Local letter templates cleared");
  }

  function updateTopResult() {
    const match = matchTemplate(frameBufferRef.current, templatesRef.current);

    if (!match) {
      setTopResult("No trained match");
      return;
    }

    setTopResult(`${match.gloss} ${Math.round(match.confidence * 100)}%`);
  }

  function drawHandOverlay(result: HandLandmarkerResult) {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    const width = video.videoWidth || canvas.clientWidth;
    const height = video.videoHeight || canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);

    (result.landmarks ?? []).forEach((landmarks, index) => {
      const handedness = result.handednesses?.[index]?.[0]?.categoryName ?? "Right";
      const color = handedness === "Left" ? "#e85d45" : "#0f766e";
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = 4;

      for (const [from, to] of HAND_CONNECTIONS) {
        const a = landmarks[from];
        const b = landmarks[to];
        context.beginPath();
        context.moveTo((1 - a.x) * width, a.y * height);
        context.lineTo((1 - b.x) * width, b.y * height);
        context.stroke();
      }

      for (const landmark of landmarks) {
        context.beginPath();
        context.arc((1 - landmark.x) * width, landmark.y * height, 5, 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-ink">
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-bold text-ink">
          {status}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void startCamera();
          }}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-clinical px-3 font-semibold text-white hover:bg-teal-800"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Camera
        </button>
        <button
          type="button"
          onClick={captureSign}
          disabled={status !== "ready"}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-clinical bg-white px-3 font-semibold text-clinical disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Hand className="h-4 w-4" aria-hidden="true" />
          Capture letter
        </button>
        <button
          type="button"
          onClick={recordSelectedLetter}
          disabled={status !== "ready"}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-signal bg-white px-3 font-semibold text-signal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save template
        </button>
        <button
          type="button"
          onClick={stopCamera}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-ink hover:bg-slate-100"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
          Stop
        </button>
      </div>
      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-600">
          Training letter
          <select
            value={selectedLetter}
            onChange={(event) => setSelectedLetter(event.target.value)}
            className="focus-ring min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-ink"
          >
            {ASL_ALPHABET.map((letter) => (
              <option key={letter} value={letter}>
                {letter} {trainedLetters.has(letter) ? "trained" : "untrained"}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Frames</span>
          <span className="font-bold text-ink">{frameCount}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Hands</span>
          <span className="font-bold text-ink">{handCount}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Top</span>
          <span className="font-bold text-ink">{topResult}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Last</span>
          <span className="font-bold text-ink">{lastResult}</span>
        </div>
        <button
          type="button"
          onClick={clearLocalTemplates}
          className="focus-ring min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-ink hover:bg-slate-100"
        >
          Clear local templates
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {getDemoGlosses().map((item) => (
          <button
            type="button"
            key={item.gloss}
            onClick={() => onGloss(item.gloss, 1)}
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-ink hover:border-clinical hover:bg-calm"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            {item.gloss}
          </button>
        ))}
      </div>
    </div>
  );
}

async function loadMediaPipeVision() {
  const cdnUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs";
  const importer = new Function("url", "return import(url)") as (
    url: string
  ) => Promise<MediaPipeVisionModule>;

  return importer(cdnUrl);
}

function loadLocalTemplates() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_TEMPLATE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SignTemplate[]) : [];

    return Array.isArray(parsed) ? parsed.filter(isSignTemplate) : [];
  } catch {
    return [];
  }
}

function isSignTemplate(value: unknown): value is SignTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as SignTemplate;

  return (
    typeof template.id === "string" &&
    typeof template.gloss === "string" &&
    typeof template.label === "string" &&
    Array.isArray(template.tags) &&
    Array.isArray(template.examples)
  );
}

function resultToFeatures(result: HandLandmarkerResult) {
  const hands = result.landmarks ?? [];
  const handednesses = result.handednesses ?? [];
  let left: number[] = [];
  let right: number[] = [];

  hands.forEach((landmarks, index) => {
    const handedness = handednesses[index]?.[0]?.categoryName ?? (index === 0 ? "Left" : "Right");
    const features = landmarksToAngleFeatures(landmarks);

    if (handedness === "Left") {
      left = features;
    } else {
      right = features;
    }
  });

  if (!left.length && !right.length) {
    return [];
  }

  return combineHandFeatures(left, right);
}
