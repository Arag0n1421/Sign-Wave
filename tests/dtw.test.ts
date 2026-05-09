import { describe, expect, it } from "vitest";
import { combineHandFeatures, dtwDistance, HAND_FEATURE_SIZE, landmarksToAngleFeatures, matchTemplate } from "@/lib/dtw";
import type { SignTemplate } from "@/lib/types";

const templates: SignTemplate[] = [
  {
    id: "a",
    gloss: "PAIN",
    label: "Pain",
    tags: ["demo"],
    examples: [
      [
        [0.1, 0.2, 0.3],
        [0.2, 0.3, 0.4],
        [0.3, 0.4, 0.5]
      ]
    ]
  },
  {
    id: "b",
    gloss: "HELP",
    label: "Help",
    tags: ["demo"],
    examples: [
      [
        [0.8, 0.7, 0.6],
        [0.7, 0.6, 0.5],
        [0.6, 0.5, 0.4]
      ]
    ]
  }
];

describe("dtw recognition helpers", () => {
  it("scores identical sequences at zero distance", () => {
    const sequence = [
      [0.1, 0.2],
      [0.2, 0.3]
    ];

    expect(dtwDistance(sequence, sequence)).toBe(0);
  });

  it("matches the closest template despite mild timing variation", () => {
    const match = matchTemplate(
      [
        [0.1, 0.2, 0.3],
        [0.1, 0.2, 0.3],
        [0.2, 0.3, 0.4],
        [0.3, 0.4, 0.5]
      ],
      templates
    );

    expect(match?.gloss).toBe("PAIN");
    expect(match?.confidence).toBeGreaterThan(0.7);
  });

  it("builds gabguerin-style pairwise hand-angle features", () => {
    const landmarks = Array.from({ length: 21 }, (_, index) => ({
      x: index / 20,
      y: (index % 5) / 5,
      z: 0
    }));

    expect(landmarksToAngleFeatures(landmarks)).toHaveLength(HAND_FEATURE_SIZE);
    expect(combineHandFeatures([], landmarksToAngleFeatures(landmarks))).toHaveLength(
      HAND_FEATURE_SIZE * 2
    );
  });

  it("rejects unknown sequences when no templates contain examples", () => {
    const match = matchTemplate(
      [
        [0.1, 0.2],
        [0.2, 0.3]
      ],
      [
        {
          id: "empty",
          gloss: "A",
          label: "Letter A",
          tags: ["asl"],
          examples: []
        }
      ]
    );

    expect(match).toBeNull();
  });
});
