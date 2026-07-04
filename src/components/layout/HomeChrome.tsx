"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { BreathGuide } from "@/components/layout/BreathGuide";
import { SoundToast, playChime } from "@/components/layout/SoundToast";

/**
 * Client orchestrator for the homepage's persistent UI: the Topbar
 * (with sound toggle), the BreathGuide orb, and the opt-in SoundToast.
 *
 * The chime is gated behind an explicit user gesture because browsers
 * correctly block autoplay — silence is part of the brand. Once
 * enabled, a single chime fires on first scroll.
 */
export function HomeChrome() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toastVisible, setToastVisible] = useState(true);
  const chimePlayedRef = useRef(false);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Prime the audio context with a user gesture, then play a
        // confirmation chime so the visitor knows it worked.
        setTimeout(playChime, 200);
      }
      return next;
    });
  }, []);

  const handleAccept = useCallback(() => {
    setToastVisible(false);
    setSoundEnabled(true);
    setTimeout(playChime, 200);
  }, []);

  const handleDecline = useCallback(() => {
    setToastVisible(false);
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;
    const onScroll = () => {
      if (chimePlayedRef.current) return;
      chimePlayedRef.current = true;
      playChime();
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [soundEnabled]);

  return (
    <>
      <Topbar soundEnabled={soundEnabled} onSoundToggle={handleSoundToggle} />
      <BreathGuide />
      {toastVisible && (
        <SoundToast onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </>
  );
}
