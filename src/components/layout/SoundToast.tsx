"use client";

import { useEffect, useState } from "react";

interface SoundToastProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * One-time opt-in toast that asks the visitor if they want a single
 * soft chime to play on first scroll. Two stacked triangle waves at
 * A4 (440 Hz) + E5 (659.25 Hz) — a perfect fifth, the most consonant
 * interval in Western music — plus a sub-octave A3 for warmth.
 *
 * Browsers correctly block autoplay, so we never instantiate
 * `AudioContext` until the visitor explicitly opts in. Silence is
 * part of the brand.
 */
export function SoundToast({ onAccept, onDecline }: SoundToastProps) {
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const showT = window.setTimeout(() => setShown(true), 2400);
    const hideT = window.setTimeout(() => setShown(false), 14000);
    return () => {
      window.clearTimeout(showT);
      window.clearTimeout(hideT);
    };
  }, []);

  const handleAccept = () => {
    setDismissed(true);
    setShown(false);
    onAccept();
  };
  const handleDecline = () => {
    setDismissed(true);
    setShown(false);
    onDecline();
  };

  if (dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Ambient sound opt-in"
      aria-hidden={!shown}
      className={`fixed bottom-6 left-1/2 z-[200] flex max-w-[calc(100%-2rem)] items-center gap-4 rounded-full bg-ink py-3.5 pl-7 pr-3.5 text-linen-50 shadow-[0_18px_40px_-15px_rgba(44,38,32,0.4)] transition-transform duration-800 ${
        shown ? "translate-x-[-50%] translate-y-0" : "translate-x-[-50%] translate-y-[140%]"
      }`}
      style={{ transitionTimingFunction: "var(--ease-emphasis)" }}
    >
      <span className="font-serif text-[0.92rem] italic leading-tight">
        A single soft chime on first scroll — opt in?
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDecline}
          className="rounded-full border border-linen-50/20 bg-transparent px-4 py-2 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-linen-50/70 transition-all duration-400 hover:bg-linen-50/10 hover:text-linen-50"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={handleAccept}
          autoFocus
          className="rounded-full bg-linen-50 px-4 py-2 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-ink transition-all duration-400 hover:bg-terracotta hover:text-linen-50"
        >
          Enable
        </button>
      </div>
    </div>
  );
}

/** Plays the chime — two triangle waves at A4 + E5, sub-octave A3 for warmth. */
export function playChime(): void {
  try {
    const AudioCtor: typeof AudioContext =
      window.AudioContext ||
      // @ts-expect-error - webkit prefix for older Safari
      (window.webkitAudioContext);
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;

    const tones = [
      { freq: 440.0, gain: 0.08, delay: 0.0 },
      { freq: 659.25, gain: 0.05, delay: 0.04 },
      { freq: 220.0, gain: 0.04, delay: 0.1 },
    ];

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = t.freq;

      gain.gain.setValueAtTime(0, now + t.delay);
      gain.gain.linearRampToValueAtTime(t.gain, now + t.delay + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.delay + 2.8);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t.delay);
      osc.stop(now + t.delay + 3.0);
    }
  } catch {
    // Audio failed — silent fail. This is optional.
  }
}
