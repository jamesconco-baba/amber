"use client";

import { useEffect, useRef, useState } from "react";
import { Waveform } from "./brand";
import { Button } from "./ui";
import { blobToDataUrl, formatDuration } from "@/lib/media";

export interface RecordedAudio {
  dataUrl: string;
  mimeType: string;
  durationSec: number;
}

export function Recorder({ onCapture }: { onCapture: (a: RecordedAudio) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "done" | "error">("idle");
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<RecordedAudio | null>(null);
  const [message, setMessage] = useState("");

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async () => {
    setMessage("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setMessage("This browser can't access the microphone. You can upload an audio file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        const captured = { dataUrl, mimeType: rec.mimeType || "audio/webm", durationSec: seconds };
        setPreview(captured);
        setState("done");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recRef.current = rec;
      rec.start();
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setState("error");
      setMessage("Microphone permission was declined. You can upload an audio file instead.");
    }
  };

  const stop = () => {
    timerRef.current && clearInterval(timerRef.current);
    recRef.current?.stop();
  };

  const reset = () => {
    setPreview(null);
    setSeconds(0);
    setState("idle");
  };

  return (
    <div className="rounded-xl2 border border-ink/10 bg-parchment/50 p-5 text-center">
      {state === "idle" && (
        <div className="space-y-4">
          <div className="text-sage">
            <Waveform bars={32} className="mx-auto text-amber-soft" />
          </div>
          <p className="text-sm text-sage">Speak the way you really would. You can re-record as often as you like.</p>
          <Button onClick={start}>Start recording</Button>
        </div>
      )}

      {state === "recording" && (
        <div className="space-y-4">
          <div className="text-clay">
            <Waveform bars={32} live className="mx-auto" />
          </div>
          <div className="font-display text-2xl tabular-nums text-ink">{formatDuration(seconds)}</div>
          <div className="flex items-center justify-center gap-2 text-sm text-clay">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-clay" />
            Recording
          </div>
          <Button onClick={stop}>Stop</Button>
        </div>
      )}

      {state === "done" && preview && (
        <div className="space-y-4">
          <audio controls src={preview.dataUrl} className="mx-auto w-full" />
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              Re-record
            </Button>
            <Button size="sm" onClick={() => onCapture(preview)}>
              Use this recording
            </Button>
          </div>
        </div>
      )}

      {state === "error" && <p className="text-sm text-clay">{message}</p>}
    </div>
  );
}
