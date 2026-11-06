export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="relative mb-12 overflow-hidden rounded-2xl border border-border bg-surface px-6 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 60%), radial-gradient(500px 180px at 100% 0%, color-mix(in oklab, var(--secondary) 16%, transparent), transparent 55%)",
        }}
      />
      <div className="relative max-w-3xl">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <div className="mt-4 h-1 w-14 rounded-full bg-secondary" />
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
