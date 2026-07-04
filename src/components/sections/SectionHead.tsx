import { Reveal } from "@/components/sections/Reveal";

interface SectionHeadProps {
  label: string;
  title: React.ReactNode;
  lead: string;
  align?: "center" | "left";
}

/**
 * Editorial section header — uppercase terracotta label, large Fraunces
 * title (with optional italic emphasis), italic Fraunces lead paragraph.
 * Center-aligned by default; switch to `align="left"` for two-column
 * sections like First-Class-Free.
 */
export function SectionHead({
  label,
  title,
  lead,
  align = "center",
}: SectionHeadProps) {
  const alignment =
    align === "left"
      ? "mx-0 text-left"
      : "mx-auto text-center";

  return (
    <header className={`max-w-[880px] ${alignment} px-8 max-[960px]:px-0`}>
      <Reveal>
        <span className="mb-8 inline-block font-sans text-[11px] font-medium uppercase tracking-[0.32em] text-terracotta">
          {label}
        </span>
      </Reveal>
      <Reveal delay={1}>
        <h2
          className="mb-8 font-serif font-light leading-[1.05] tracking-[-0.015em] text-ink"
          style={{
            fontVariationSettings: '"opsz" 144',
            fontSize: "clamp(2.6rem, 6vw, 4.6rem)",
          }}
        >
          {title}
        </h2>
      </Reveal>
      <Reveal delay={2}>
        <p
          className={`font-serif text-[clamp(1.05rem,1.4vw,1.2rem)] font-light italic leading-[1.7] text-ink-soft ${
            align === "left" ? "max-w-[580px]" : "mx-auto max-w-[580px]"
          }`}
        >
          {lead}
        </p>
      </Reveal>
    </header>
  );
}
