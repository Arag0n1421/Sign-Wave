import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import { DisclaimerBanner } from "./DisclaimerBanner";

export function SignWaveApp() {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clinical">
              Emergency Intake MVP
            </p>
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">Sign Wave</h1>
          </div>
          <Link
            href="/learn"
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-clinical bg-white px-4 py-2 font-semibold text-clinical shadow-panel transition hover:bg-calm"
          >
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            Learn
          </Link>
        </header>
        <DisclaimerBanner />
        <ChatInterface />
      </div>
    </main>
  );
}
