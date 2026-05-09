import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <section className="flex items-start gap-3 rounded-lg border border-signal/35 bg-white px-4 py-3 text-sm text-ink shadow-panel">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-signal" aria-hidden="true" />
      <p>
        Prototype communication aid only. Confirm every recognized sign and generated note with the
        patient; use certified interpreter and clinical triage protocols for real care.
      </p>
    </section>
  );
}
