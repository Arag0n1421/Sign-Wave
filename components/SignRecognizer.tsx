"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Hand, Square, Wand2 } from "lucide-react";
import { combineHandFeatures, landmarksToAngleFeatures, matchTemplate } from "@/lib/dtw";
import { DEFAULT_ASL_TEMPLATES, getDemoGlosses } from "@/lib/templates";
import type { Landmark } from "@/lib/types";

type RecognitionStatus = "idle" | "loading" | "ready" | "error";

type HandLandmarkerResult = {
  landmarks?: Landmark[][];
  handednesses?: Array<Array<{ categoryName?: string }>>;
};

type HandLandmarkerInstance = {
  detectForVideo(videoFrame: HTMLVideoElement, timestamp: number): HandLandmarkerResult;
  close?: () => void;
};

type Props = {
  onGloss: (gloss: string, confidence: number) => void;
};

export function SignRecognizer({ onGloss }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarkerInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameBufferRef = useRef<number[][]>([]);
  const animationRef = useRef<number | null>(null);
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [lastResult, setLastResult] = useState("No sign captured");
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
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
    const features = resultToFeatures(result);

    if (features.length) {
      frameBufferRef.current = [...frameBufferRef.current.slice(-42), features];
      setFrameCount(frameBufferRef.current.length);
    }

    animationRef.current = requestAnimationFrame(loop);
  }

  function captureSign() {
    const match = matchTemplate(frameBufferRef.current, DEFAULT_ASL_TEMPLATES);

    if (!match) {
      setLastResult("UNKNOWN");
      onGloss("UNKNOWN SIGN", 0);
      return;
    }

    const confidence = Math.round(match.confidence * 100);
    setLastResult(`${match.gloss} (${confidence}%)`);
    onGloss(match.gloss, match.confidence);
    frameBufferRef.current = [];
    setFrameCount(0);
  }

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-ink">
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
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
          Capture
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
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Frames</span>
          <span className="font-bold text-ink">{frameCount}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Last</span>
          <span className="font-bold text-ink">{lastResult}</span>
        </div>
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
            {item.label}
          </button>
        ))}
      </div>
    </div>
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
