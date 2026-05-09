"use client";

import { FormEvent, useMemo, useState } from "react";
import { Send, Stethoscope, UserRound, Volume2 } from "lucide-react";
import { SignRecognizer } from "./SignRecognizer";
import { fallbackTriageNotes, normalizeGloss } from "@/lib/llm";
import type { ChatMessage, MessageSource, TriageNotes } from "@/lib/types";

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [patientText, setPatientText] = useState("");
  const [clinicianText, setClinicianText] = useState("");
  const [isRephrasing, setIsRephrasing] = useState(false);

  const patientMessages = useMemo(
    () => messages.filter((message) => message.role === "patient"),
    [messages]
  );
  const clinicianMessages = useMemo(
    () => messages.filter((message) => message.role === "clinician"),
    [messages]
  );
  const latestNotes = [...patientMessages].reverse().find((message) => message.notes)?.notes;

  async function submitPatientMessage(text: string, source: MessageSource) {
    const gloss = normalizeGloss(text);

    if (!gloss) {
      return;
    }

    const patientMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "patient",
      source,
      text: gloss,
      gloss,
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, patientMessage]);
    setPatientText("");
    setIsRephrasing(true);

    const notes = await requestTriageNotes(gloss);

    setMessages((current) =>
      current.map((message) =>
        message.id === patientMessage.id
          ? {
              ...message,
              notes
            }
          : message
      )
    );
    setIsRephrasing(false);
  }

  function submitPatientForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPatientMessage(patientText, "typed");
  }

  function submitClinicianForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = clinicianText.trim();

    if (!text) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "clinician",
        source: "clinician",
        text,
        createdAt: new Date().toISOString()
      }
    ]);
    setClinicianText("");
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className="grid min-h-[70vh] gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex min-h-[42rem] flex-col gap-4 rounded-lg border border-teal-100 bg-white p-4 shadow-panel">
        <PanelHeading icon={<UserRound className="h-5 w-5" />} title="Patient Side" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <SignRecognizer
            onGloss={(gloss) => {
              void submitPatientMessage(gloss, "signed");
            }}
          />
        </div>
        <form className="flex gap-2" onSubmit={submitPatientForm}>
          <input
            aria-label="Patient message"
            value={patientText}
            onChange={(event) => setPatientText(event.target.value)}
            placeholder="Type patient message or gloss"
            className="focus-ring min-h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3"
          />
          <button
            type="submit"
            className="focus-ring inline-flex min-h-12 w-12 items-center justify-center rounded-lg bg-clinical text-white transition hover:bg-teal-800"
            aria-label="Send patient message"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
        <MessageColumn title="Clinician replies" messages={clinicianMessages} empty="No replies yet." />
      </div>

      <div className="flex min-h-[42rem] flex-col gap-4 rounded-lg border border-teal-100 bg-white p-4 shadow-panel">
        <PanelHeading icon={<Stethoscope className="h-5 w-5" />} title="Clinician Side" />
        <MessageColumn
          title="Patient inputs"
          messages={patientMessages}
          empty="Waiting for patient input."
        />
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Triage Notes</h2>
            {latestNotes ? (
              <button
                type="button"
                onClick={() => speak(latestNotes.clinicianNotes.en)}
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-clinical bg-white px-3 font-semibold text-clinical hover:bg-calm"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                Speak
              </button>
            ) : null}
          </div>
          {isRephrasing ? (
            <p className="text-sm text-slate-600">Preparing notes...</p>
          ) : latestNotes ? (
            <TriageNotesView notes={latestNotes} />
          ) : (
            <p className="text-sm text-slate-600">Notes appear after the patient sends a message.</p>
          )}
        </section>
        <form className="flex gap-2" onSubmit={submitClinicianForm}>
          <input
            aria-label="Clinician reply"
            value={clinicianText}
            onChange={(event) => setClinicianText(event.target.value)}
            placeholder="Question or recommendation for patient"
            className="focus-ring min-h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3"
          />
          <button
            type="submit"
            className="focus-ring inline-flex min-h-12 w-12 items-center justify-center rounded-lg bg-ink text-white transition hover:bg-slate-800"
            aria-label="Send clinician reply"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}

function PanelHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-ink">
      <span className="text-clinical" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}

function MessageColumn({
  title,
  messages,
  empty
}: {
  title: string;
  messages: ChatMessage[];
  empty: string;
}) {
  return (
    <section className="min-h-36 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      {messages.length ? (
        <ol className="flex flex-col gap-2">
          {messages.map((message) => (
            <li key={message.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-clinical">{message.source}</p>
              <p className="text-base text-ink">{message.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-600">{empty}</p>
      )}
    </section>
  );
}

function TriageNotesView({ notes }: { notes: TriageNotes }) {
  const languageLabels: Array<[keyof TriageNotes["clinicianNotes"], string]> = [
    ["en", "English"],
    ["lv", "Latvian"],
    ["ru", "Russian"],
    ["sv", "Swedish"]
  ];

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-sm font-semibold text-slate-500">Gloss</p>
        <p className="text-lg font-bold text-ink">{notes.inputGloss}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {languageLabels.map(([key, label]) => (
          <article key={key} className="rounded-lg border border-slate-200 bg-white p-3">
            <h4 className="text-sm font-bold text-clinical">{label}</h4>
            <p className="text-sm leading-6 text-ink">{notes.clinicianNotes[key]}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="text-sm font-bold text-signal">Flags</h4>
          <p className="text-sm text-ink">
            {notes.safetyFlags.length ? notes.safetyFlags.join(", ") : "No automatic flags."}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-3">
          <h4 className="text-sm font-bold text-clinical">Questions</h4>
          <p className="text-sm text-ink">{notes.suggestedClarifyingQuestions.join(" / ")}</p>
        </article>
      </div>
    </div>
  );
}

async function requestTriageNotes(gloss: string) {
  try {
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ gloss })
    });

    if (!response.ok) {
      return fallbackTriageNotes(gloss);
    }

    const data = (await response.json()) as { notes?: TriageNotes };
    return data.notes ?? fallbackTriageNotes(gloss);
  } catch {
    return fallbackTriageNotes(gloss);
  }
}
