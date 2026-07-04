import { PRACTICES } from "@/lib/data/practices";
import { SectionHead } from "@/components/sections/SectionHead";
import { Reveal } from "@/components/sections/Reveal";

/**
 * Practices — four ways to come home. Editorial 2x2 grid with internal
 * borders (no rounded corners, no shadows). Hovering a cell nudges its
 * background a half-tone toward sand.
 */
export function Practices() {
  return (
    <section
      id="practices"
      className="relative bg-linen-100 px-8 py-40 max-[960px]:px-6 max-[960px]:py-24"
    >
      <SectionHead
        label="02 · Practices"
        title={
          <>
            Four ways
            <br />
            <em className="font-light italic text-sage-deep">to come home.</em>
          </>
        }
        lead="Each room holds eight mats at most. No music. No mirrors. No teacher calling out corrections from across the room. Just breath, slow movement, and the long quiet that follows."
      />

      <div className="mx-auto mt-24 grid max-w-[1280px] grid-cols-2 border-t border-ink-line max-[960px]:mt-16 max-[960px]:grid-cols-1">
        {PRACTICES.map((practice, i) => (
          <Reveal
            key={practice.id}
            delay={i % 2 === 1 ? 1 : 0}
            className={`relative border-b border-ink-line p-16 transition-colors duration-700 hover:bg-linen-200 ${
              i % 2 === 0 ? "border-r" : ""
            } max-[960px]:border-r-0 max-[960px]:p-12`}
          >
            <article>
              <div className="mb-10 font-sans text-[11px] font-medium uppercase tracking-[0.32em] text-terracotta">
                {practice.num}
              </div>
              <h3
                className="font-serif font-light leading-none tracking-[-0.02em] text-ink"
                style={{
                  fontVariationSettings: '"opsz" 90',
                  fontSize: "clamp(2.4rem, 3.5vw, 3.2rem)",
                }}
              >
                {practice.name}
              </h3>
              <p className="mb-8 mt-2 font-serif text-[1rem] font-light italic text-sage-deep">
                {practice.sanskrit}
              </p>
              <p className="mb-10 max-w-[380px] font-sans text-[0.95rem] leading-[1.75] text-ink-soft">
                {practice.description}
              </p>
              <div className="flex flex-wrap gap-6 font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
                {[
                  practice.meta.duration,
                  practice.meta.room,
                  practice.meta.level,
                ].map((meta) => (
                  <span key={meta} className="flex items-center gap-2">
                    <span className="block h-1 w-1 rounded-full bg-sage" />
                    {meta}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
