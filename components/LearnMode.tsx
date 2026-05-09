"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { SignRecognizer } from "./SignRecognizer";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { getDemoGlosses } from "@/lib/templates";

export function LearnMode() {
  const deck = useMemo(() => getDemoGlosses(), []);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "try-again">("idle");
  const current = deck[index] ?? deck[0];

  function nextCard() {
    setFeedback("idle");
    setIndex((currentIndex) => (currentIndex + 1) % deck.length);
  }

  function reset() {
    setIndex(0);
    setStreak(0);
    setFeedback("idle");
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-4">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clinical">
              Practice Mode
            </p>
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">Learn ASL Demo Set</h1>
          </div>
          <Link
            href="/"
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-clinical bg-white px-4 py-2 font-semibold text-clinical shadow-panel hover:bg-calm"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Chat
          </Link>
        </header>
        <DisclaimerBanner />
        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-lg border border-teal-100 bg-white p-5 shadow-panel">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Card {index + 1} / {deck.length}
            </p>
            <h2 className="mt-3 text-5xl font-bold text-ink">{current.label}</h2>
            <p className="mt-3 text-lg font-semibold text-clinical">{current.gloss}</p>
            <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Streak</span>
                <span className="text-2xl font-bold text-ink">{streak}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {feedback === "correct" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-clinical" aria-hidden="true" />
                    Correct
                  </>
                ) : feedback === "try-again" ? (
                  <>
                    <XCircle className="h-5 w-5 text-signal" aria-hidden="true" />
                    Try again
                  </>
                ) : (
                  "Ready"
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={nextCard}
                className="focus-ring min-h-11 rounded-lg bg-clinical px-4 font-semibold text-white hover:bg-teal-800"
              >
                Next
              </button>
              <button
                type="button"
                onClick={reset}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-ink hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </article>
          <article className="rounded-lg border border-teal-100 bg-white p-4 shadow-panel">
            <SignRecognizer
              onGloss={(gloss) => {
                if (gloss === current.gloss) {
                  setFeedback("correct");
                  setStreak((value) => value + 1);
                  return;
                }

                setFeedback("try-again");
                setStreak(0);
              }}
            />
          </article>
        </section>
      </div>
    </main>
  );
}
