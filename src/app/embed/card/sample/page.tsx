export default async function SampleInfoCard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const targetUrl = first(params.url) || "https://example.com/";
  const host = safeHost(targetUrl);

  return (
    <article className="rounded-xl border border-border/60 bg-card/90 p-4 text-card-foreground shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Info card
      </p>
      <h2 className="mt-2 text-base font-semibold">{host}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This starter card is matched by the sample info-card triggers in
        youeye-app.yaml. Replace it with a context renderer for URLs or app
        objects your fork understands.
      </p>
      <p className="mt-4 truncate rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        {targetUrl}
      </p>
    </article>
  );
}

function first(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function safeHost(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "Example target";
  }
}
