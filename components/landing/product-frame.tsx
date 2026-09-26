import Image from 'next/image';

/** A real screenshot of the Overview page in a plain browser frame. */
export function ProductFrame() {
  return (
    <div className="overflow-hidden rounded-panel border bg-surface shadow-overlay">
      <div className="flex items-center gap-1.5 border-b bg-canvas px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/10" />
        <span className="ml-2 truncate rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-xs text-ink-faint">
          skillproof.app/overview
        </span>
      </div>
      <Image
        src="/product-overview.png"
        alt="The SkillProof overview page, showing a readiness score of 47 percent with the skills that make it up"
        width={1600}
        height={1000}
        className="w-full"
        priority
      />
    </div>
  );
}
