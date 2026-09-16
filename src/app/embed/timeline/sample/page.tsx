export default async function SampleTimelineCard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const title = first(params.title) || "Canvas timeline event";
  const detail = first(params.detail) || "A fork can render any timeline entry here.";

  return (
    <article className="rounded-xl border border-border/60 bg-card/90 p-4 text-card-foreground shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Timeline card
      </p>
      <h2 className="mt-2 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        Trigger: myapp.sample.created
      </div>
    </article>
  );
}

function first(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
