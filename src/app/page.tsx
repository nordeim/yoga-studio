import { LinenGrain } from "@/components/layout/LinenGrain";
import { Footer } from "@/components/layout/Footer";
import { HomeChrome } from "@/components/layout/HomeChrome";
import { Hero } from "@/components/sections/Hero";
import { Practices } from "@/components/sections/Practices";
import { Teachers } from "@/components/sections/Teachers";
import { Schedule } from "@/components/sections/Schedule";
import { FirstClassFree } from "@/components/sections/FirstClassFree";

/**
 * Stillwater — homepage.
 *
 * One route, one page, six sections — composed in the order a visitor
 * reads them: hero, practices, teachers, schedule, first-class-free,
 * footer. The Topbar, BreathGuide, and SoundToast live in a single
 * client orchestrator (`HomeChrome`) so they can share the sound-enabled
 * state without prop-drilling through the server-rendered tree.
 *
 * Server-rendered by default; only the interactive leaves carry
 * `'use client'` (Hero, Teachers, Schedule, FirstClassFree, HomeChrome).
 */
export default function Home() {
  return (
    <>
      <LinenGrain />
      <HomeChrome />

      <main id="main-content">
        <Hero />
        <Practices />
        <Teachers />
        <Schedule />
        <FirstClassFree />
      </main>

      <Footer />
    </>
  );
}
