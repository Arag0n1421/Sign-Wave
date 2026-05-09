import type { Landmark, MatchResult, SignTemplate } from "./types";

export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20]
];

export const HAND_FEATURE_SIZE = HAND_CONNECTIONS.length * HAND_CONNECTIONS.length;

export function landmarksToAngleFeatures(landmarks: Landmark[]) {
  if (landmarks.length < 21) {
    return [];
  }

  const vectors = HAND_CONNECTIONS.map(([from, to]) => {
    const a = landmarks[from];
    const b = landmarks[to];
    return [b.x - a.x, b.y - a.y, (b.z ?? 0) - (a.z ?? 0)] as const;
  });

  return vectors.flatMap((fromVector) =>
    vectors.map((toVector) => roundFeature(vectorAngle(fromVector, toVector)))
  );
}

export function combineHandFeatures(left: number[], right: number[]) {
  const size = HAND_FEATURE_SIZE;
  const paddedLeft = pad(left, size);
  const paddedRight = pad(right, size);

  return [...paddedLeft, ...paddedRight];
}

export function dtwDistance(a: number[][], b: number[][]) {
  if (!a.length || !b.length) {
    return Number.POSITIVE_INFINITY;
  }

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(Number.POSITIVE_INFINITY));
  matrix[0][0] = 0;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = frameDistance(a[i - 1], b[j - 1]);
      matrix[i][j] = cost + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }

  return matrix[a.length][b.length] / (a.length + b.length);
}

export function matchTemplate(
  sequence: number[][],
  templates: SignTemplate[],
  threshold = 0.65
): MatchResult | null {
  const cleaned = trimSequence(sequence);

  if (!cleaned.length) {
    return null;
  }

  let best: MatchResult | null = null;

  for (const template of templates) {
    for (const example of template.examples) {
      if (!example.length) {
        continue;
      }

      const distance = dtwDistance(cleaned, example);
      const confidence = clamp(1 - distance / threshold, 0, 1);

      if (!best || distance < best.distance) {
        best = {
          template,
          gloss: template.gloss,
          distance,
          confidence
        };
      }
    }
  }

  return best && best.confidence > 0.15 ? best : null;
}

export function trimSequence(sequence: number[][]) {
  return sequence.filter((frame) => frame.some((value) => Math.abs(value) > 0.0001));
}

function frameDistance(a: number[], b: number[]) {
  const size = Math.max(a.length, b.length);
  let sum = 0;

  for (let i = 0; i < size; i += 1) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0);
    sum += delta * delta;
  }

  return Math.sqrt(sum / Math.max(size, 1));
}

function vectorAngle(a: readonly [number, number, number], b: readonly [number, number, number]) {
  const magnitude = Math.hypot(...a) * Math.hypot(...b);

  if (magnitude < 0.000001) {
    return 0;
  }

  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const normalized = clamp(dot / magnitude, -1, 1);

  return Math.acos(normalized) / Math.PI;
}

function pad(values: number[], size: number) {
  return Array.from({ length: size }, (_, index) => values[index] ?? 0);
}

function roundFeature(value: number) {
  return Number(value.toFixed(5));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
