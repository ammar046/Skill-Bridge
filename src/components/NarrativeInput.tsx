import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import type { Locale } from "@/lib/locales";

type MicState = "idle" | "listening" | "done" | "error";

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  locale: Locale;
}

// Web Speech API types (not in TS stdlib)
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognitionImpl extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionImpl;
}
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor | undefined;
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
  }
}

function getLang(locale: Locale): string {
  const map: Record<string, string> = { GH: "en-GH", PK: "en-PK" };
  return map[locale.code] ?? "en-US";
}

function getSR(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function NarrativeInput({ value, onChange, placeholder, locale }: Props) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");

  // Use refs to avoid stale closures inside speech event handlers
  const recognitionRef = useRef<SpeechRecognitionImpl | null>(null);
  const hadErrorRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const SR = getSR();

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function startListening() {
    if (!SR) return;
    setMicError(null);
    hadErrorRef.current = false;

    const rec = new SR();
    rec.lang = getLang(locale);
    rec.continuous = true;       // keep listening until user clicks stop
    rec.interimResults = true;   // stream partial transcript in real time

    rec.onstart = () => {
      setMicState("listening");
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalChunk += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalChunk) {
        const current = valueRef.current;
        onChange(current ? `${current} ${finalChunk}`.trim() : finalChunk.trim());
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      hadErrorRef.current = true;
      setInterim("");
      const friendly: Record<string, string> = {
        "not-allowed":
          "Microphone access denied. Click the 🔒 icon in your browser address bar → allow microphone → refresh.",
        "no-speech":
          "No speech detected. Make sure your microphone is working and try again.",
        "network":
          "Network error. Speech recognition needs internet — try Chrome at http://localhost:5174.",
        "aborted": "Stopped.",
        "audio-capture":
          "No microphone found. Check that a mic is connected and not muted.",
        "service-not-allowed":
          "Speech service blocked. Open the app on http://localhost (not 127.0.0.1) and use Chrome or Edge.",
      };
      setMicError(friendly[e.error] ?? `Mic error: ${e.error}`);
      setMicState("error");
    };

    rec.onend = () => {
      setInterim("");
      if (!hadErrorRef.current) {
        setMicState("done");
        setTimeout(() => setMicState("idle"), 2000);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      setMicError(`Could not start microphone: ${String(err)}`);
      setMicState("error");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  const isListening = micState === "listening";

  return (
    <div className="relative">
      <textarea
        rows={5}
        autoFocus
        value={value + (isListening && interim ? ` ${interim}` : "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent pr-12 text-sm leading-relaxed outline-none placeholder:text-foreground/40"
      />

      {SR ? (
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          aria-label={isListening ? "Stop recording" : "Start voice input"}
          title={isListening ? "Click to stop recording" : "Click to speak"}
          className={
            "absolute right-0 top-0 rounded-full border p-2 transition-all " +
            (isListening
              ? "border-red-500 bg-red-500 text-white ripple-active"
              : micState === "done"
                ? "border-green-500 bg-green-50 text-green-600"
                : micState === "error"
                  ? "border-orange-400 bg-orange-50 text-orange-500"
                  : "border-hairline bg-background text-foreground hover:bg-muted")
          }
        >
          {isListening ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      ) : (
        <div
          title="Voice input requires Chrome or Edge"
          className="absolute right-0 top-0 cursor-not-allowed rounded-full border border-hairline p-2 text-muted-foreground/30"
        >
          <MicOff className="h-4 w-4" />
        </div>
      )}

      {/* Live waveform while listening */}
      {isListening && (
        <div className="mt-2 flex items-center gap-2 animate-fade-up">
          <span className="flex items-end gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="inline-block w-1 rounded-full bg-red-500 wave-bar"
                style={{ height: "12px", animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
          <span className="text-xs font-medium text-red-500">Listening…</span>
          <span className="text-xs text-muted-foreground">
            speak freely, click ■ when done
          </span>
        </div>
      )}

      {interim && isListening && (
        <p className="mt-1 text-xs italic text-muted-foreground animate-fade-up">
          {interim}
        </p>
      )}

      {micState === "done" && (
        <p className="mt-1 text-xs font-medium text-green-600 animate-fade-up">
          ✓ Got it! You can edit the text above.
        </p>
      )}

      {micState === "error" && micError && (
        <p className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs leading-snug text-orange-700 animate-fade-up">
          ⚠ {micError}
        </p>
      )}

      {!SR && (
        <p className="mt-1 text-xs text-muted-foreground">
          Voice input requires Chrome or Edge.
        </p>
      )}
    </div>
  );
}
