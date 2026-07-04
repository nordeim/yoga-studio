import Link from "next/link";

/**
 * Footer — ink-on-cream, four-column editorial. Studio blurb in the
 * brand column; visit/hours/quietly columns for logistics.
 */
export function Footer() {
  return (
    <footer className="relative bg-ink text-linen-100 px-8 pb-8 pt-24 max-[960px]:px-6">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 border-b border-linen-100/10 pb-16 max-[960px]:grid-cols-2 max-[960px]:gap-8">
        <div>
          <div
            className="font-serif text-[2.4rem] font-light leading-none tracking-[-0.02em]"
            style={{ fontVariationSettings: '"opsz" 90' }}
          >
            Stillwater
          </div>
          <p className="mt-6 max-w-[320px] font-serif text-[0.95rem] font-light italic leading-[1.7] text-linen-100/70">
            A small yoga studio on Henry Street, between a bakery and a
            bookshop. Two rooms. Eight mats each. Open since the autumn of
            2014.
          </p>
        </div>

        <FooterColumn heading="Visit">
          <li>116 Henry Street</li>
          <li>Cobble Hill, Brooklyn</li>
          <li className="italic text-linen-100/60 text-[0.88rem]">NY 11201</li>
          <li className="italic text-linen-100/60 text-[0.88rem] tabular-nums">
            718 · 555 · 0142
          </li>
        </FooterColumn>

        <FooterColumn heading="Hours">
          <li className="tabular-nums">Mon–Fri · 6:30a–8:30p</li>
          <li className="tabular-nums">Saturday · 8:00a–6:00p</li>
          <li className="tabular-nums">Sunday · 8:00a–4:00p</li>
          <li className="italic text-linen-100/60 text-[0.88rem]">
            Closed in August
          </li>
        </FooterColumn>

        <FooterColumn heading="Quietly">
          <li>
            <Link
              href="#"
              className="transition-colors duration-500 hover:text-terracotta"
            >
              Instagram
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="transition-colors duration-500 hover:text-terracotta"
            >
              Substack · letters
            </Link>
          </li>
          <li className="italic text-linen-100/60 text-[0.88rem]">
            No apps. No push.
          </li>
        </FooterColumn>
      </div>

      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 pt-8 font-sans text-[11px] uppercase tracking-[0.14em] text-linen-100/40">
        <span>© Stillwater Studio · MMXIV</span>
        <span className="hidden sm:inline">
          Two rooms · Eight mats · One breath
        </span>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-6 font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-linen-100/50">
        {heading}
      </h4>
      <ul className="space-y-0 font-serif text-[1rem] font-light leading-[1.9] text-linen-100/85">
        {children}
      </ul>
    </div>
  );
}
