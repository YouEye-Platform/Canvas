export default async function SampleNotification({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const title = first(params.title) || "Canvas notification";
  const message = first(params.message) || "A fork can render notification details here.";

  return (
    <article className="rounded-xl border border-border/60 bg-card/90 p-4 text-card-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
    </article>
  );
}

function first(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
