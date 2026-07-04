"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TopbarProps {
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

/**
 * Fixed top bar — brand mark (slow-breathing terracotta dot), nav,
 * sound toggle. Background condenses from 86% to 94% opacity after
 * 60px of scroll. On mobile (< 960px) the nav links hide.
 */
export function Topbar({ soundEnabled, onSoundToggle }: TopbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[100] border-b border-ink-line-soft backdrop-blur-md transition-colors duration-700"
      style={{
        backgroundColor: scrolled
          ? "rgba(244, 237, 224, 0.94)"
          : "rgba(244, 237, 224, 0.86)",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-8 py-4 max-[960px]:px-6 max-[960px]:py-3.5">
        <Link
          href="#top"
          className="flex items-center gap-3 text-ink no-underline"
        >
          <span
            className="relative grid h-[22px] w-[22px] place-items-center rounded-full border border-ink"
            aria-hidden="true"
          >
            <span
              className="block h-[14px] w-[14px] rounded-full bg-terracotta"
              style={{ animation: "var(--animate-brand-breath)" }}
            />
          </span>
          <span
            className="font-serif text-[1.15rem] font-normal tracking-[0.01em]"
            style={{ fontVariationSettings: '"opsz" 14' }}
          >
            Stillwater
          </span>
        </Link>

        <nav className="flex gap-9 max-[960px]:hidden" aria-label="Primary">
          {[
            { href: "#practices", label: "Practices" },
            { href: "#teachers", label: "Teachers" },
            { href: "#schedule", label: "Schedule" },
            { href: "#signup", label: "First Class" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative text-[12px] font-normal uppercase tracking-[0.16em] text-ink-soft transition-colors duration-500 hover:text-ink"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 right-0 h-px origin-left scale-x-0 bg-terracotta transition-transform duration-500 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={onSoundToggle}
          aria-pressed={soundEnabled}
          aria-label={
            soundEnabled ? "Turn ambient sound off" : "Turn ambient sound on"
          }
          className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-500 max-[960px]:px-2 ${
            soundEnabled
              ? "border-terracotta bg-terracotta text-linen-50"
              : "border-ink-line text-ink-soft hover:border-terracotta hover:text-terracotta"
          }`}
        >
          <SoundIcon on={soundEnabled} />
          <span className="max-[960px]:hidden">
            Sound · {soundEnabled ? "On" : "Off"}
          </span>
        </button>
      </div>
    </header>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="block"
    >
      <path d="M2 5 L2 9 L5 9 L8 12 L8 2 L5 5 Z" fill="currentColor" />
      <path
        d="M9.8 4 Q11.5 7 9.8 10"
        stroke="currentColor"
        fill="none"
        strokeWidth="0.8"
        strokeLinecap="round"
        className={on ? "opacity-100" : "opacity-0"}
        style={on ? { animation: "var(--animate-sound-wave)" } : undefined}
      />
      <path
        d="M11.5 2.4 Q14 7 11.5 11.6"
        stroke="currentColor"
        fill="none"
        strokeWidth="0.8"
        strokeLinecap="round"
        className={on ? "opacity-100" : "opacity-0"}
        style={
          on
            ? { animation: "var(--animate-sound-wave)", animationDelay: "0.2s" }
            : undefined
        }
      />
    </svg>
  );
}
