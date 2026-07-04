"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { SCHEDULE } from "@/lib/data/schedule";
import type { ScheduleClass } from "@/lib/data/schedule";
import { SectionHead } from "@/components/sections/SectionHead";
import { Reveal } from "@/components/sections/Reveal";

/**
 * Schedule — expandable rows driven by Radix Accordion primitives
 * (keyboard accessible, ARIA-wired). Each row shows day, time, class,
 * teacher, and a mala-bead dot indicator for seat availability.
 * Expanding reveals room, what to bring, and how to prepare.
 *
 * Click (not hover) — touchscreens need this. We render our own circled
 * "+" indicator that rotates 45° into an "×" on open, instead of the
 * default chevron, so the visual matches the original mockup.
 *
 * Two layouts live inside ONE trigger (Radix requires exactly one):
 *  - Desktop (≥ 960px): 6-column grid
 *  - Mobile  (< 960px): vertical flex stack
 */
export function Schedule() {
  return (
    <section
      id="schedule"
      className="relative bg-linen-100 px-8 py-40 max-[960px]:px-6 max-[960px]:py-24"
    >
      <SectionHead
        label="04 · Week of October 14"
        title={
          <>
            This week
            <br />
            <em className="font-light italic text-sage-deep">
              at Stillwater.
            </em>
          </>
        }
        lead="Eight mats per class. Six in restorative. Tap a row to see the room and what to bring."
      />

      <Reveal
        delay={1}
        className="mx-auto mt-24 max-w-[1180px] max-[960px]:mt-16"
      >
        <AccordionPrimitive.Root
          type="single"
          collapsible
          className="border-t border-ink-line"
        >
          {/* Column header (desktop only) */}
          <div
            className="hidden grid-cols-[100px_110px_1fr_130px_180px_44px] gap-6 border-b border-ink-line-soft px-6 py-4 font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-ink-mute max-[960px]:hidden"
            aria-hidden="true"
          >
            <div>Day</div>
            <div>Time</div>
            <div>Class</div>
            <div>Teacher</div>
            <div>Seats</div>
            <div />
          </div>

          {SCHEDULE.map((cls) => (
            <ScheduleRow key={cls.id} cls={cls} />
          ))}
        </AccordionPrimitive.Root>
      </Reveal>
    </section>
  );
}

function ScheduleRow({ cls }: { cls: ScheduleClass }) {
  const isFull = cls.taken >= cls.total;
  const isLow = !isFull && cls.total - cls.taken <= 2;
  const seatsClass = isFull || isLow ? "text-terracotta" : "text-ink-mute";
  const seatsLabel = `${cls.taken} / ${cls.total}${isFull ? " · waitlist" : ""}`;

  return (
    <AccordionPrimitive.Item
      value={cls.id}
      className="group border-b border-ink-line-soft transition-colors duration-500 data-[state=open]:bg-linen-200 hover:bg-linen-200"
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger
          className="block w-full text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-linen-100"
          aria-label={`${cls.day} ${cls.time} ${cls.className} with ${cls.teacher}, ${cls.taken} of ${cls.total} mats ${isFull ? "taken — waitlist only" : "available"} — expand for room details`}
        >
          {/* Desktop 6-col grid */}
          <div className="grid grid-cols-[100px_110px_1fr_130px_180px_44px] items-center gap-6 px-6 py-7 max-[960px]:hidden">
            <div className="font-serif text-[1.15rem] font-normal text-ink">
              {cls.day}
            </div>
            <div className="font-sans text-[13px] font-normal tracking-[0.02em] text-ink-soft tabular-nums">
              {cls.time}
            </div>
            <div className="font-serif text-[1.2rem] font-normal leading-[1.2] text-ink">
              {cls.className}
              {cls.classNote && (
                <em className="ml-1.5 font-light italic text-ink-mute text-[0.85rem]">
                  {cls.classNote}
                </em>
              )}
            </div>
            <div className="font-sans text-[12px] tracking-[0.04em] text-ink-soft">
              {cls.teacher}
            </div>
            <div className="flex items-center gap-3">
              <SeatDots taken={cls.taken} total={cls.total} />
              <span
                className={`font-sans text-[11px] tracking-[0.06em] tabular-nums ${seatsClass}`}
              >
                {seatsLabel}
              </span>
            </div>
            <ExpandIcon />
          </div>

          {/* Mobile vertical stack */}
          <div className="hidden flex-col gap-2.5 px-4 py-5 max-[960px]:flex">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[1rem] font-normal text-ink">
                {cls.day}
              </span>
              <span className="font-serif text-[1.05rem] font-normal leading-[1.2] text-ink">
                {cls.className}
                {cls.classNote && (
                  <em className="ml-1.5 font-light italic text-ink-mute text-[0.8rem]">
                    {cls.classNote}
                  </em>
                )}
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-sans text-[12px] text-ink-soft">
              <span className="tabular-nums">{cls.time}</span>
              <span aria-hidden="true">·</span>
              <span className="tracking-[0.04em]">{cls.teacher}</span>
            </div>
            <div className="flex items-center gap-3">
              <SeatDots taken={cls.taken} total={cls.total} />
              <span
                className={`font-sans text-[11px] tracking-[0.06em] tabular-nums ${seatsClass}`}
              >
                {seatsLabel}
              </span>
            </div>
            <ExpandIcon className="mt-1 self-start" />
          </div>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>

      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <dl className="grid grid-cols-[100px_1fr] gap-x-12 gap-y-4 border-t border-dashed border-ink-line-soft px-6 pb-10 pt-6 max-[960px]:grid-cols-1 max-[960px]:px-4 max-[960px]:gap-y-1.5">
          <DetailRow label="Room">
            {cls.room}
            {cls.roomNote && (
              <em className="font-light italic text-sage-deep">
                {" · "}
                {cls.roomNote}
              </em>
            )}
          </DetailRow>
          <DetailRow label="Bring">
            {cls.bring}
            {cls.bringNote && (
              <em className="font-light italic text-sage-deep">
                {" "}
                {cls.bringNote}
              </em>
            )}
          </DetailRow>
          <DetailRow label="Prep">{cls.prep}</DetailRow>
        </dl>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

function ExpandIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-7 w-7 place-items-center rounded-full border border-ink-line text-ink-soft transition-all duration-500 group-hover:border-terracotta group-hover:text-terracotta group-data-[state=open]:rotate-45 group-data-[state=open]:border-terracotta group-data-[state=open]:bg-terracotta group-data-[state=open]:text-linen-50 ${className}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1.5 V10.5 M1.5 6 H10.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="pt-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-ink-mute max-[960px]:pt-2">
        {label}
      </dt>
      <dd className="font-serif text-[1rem] font-light leading-[1.55] text-ink">
        {children}
      </dd>
    </>
  );
}

function SeatDots({ taken, total }: { taken: number; total: number }) {
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i
          key={i}
          className={`block h-[7px] w-[7px] rounded-full ${
            i < taken
              ? "bg-sage"
              : "m-[1px] h-[5px] w-[5px] border border-ink-line bg-transparent"
          }`}
        />
      ))}
    </span>
  );
}
