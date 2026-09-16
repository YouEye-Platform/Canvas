export default async function WidgetPage({
  params,
}: {
  params: Promise<{ widgetId: string }>;
}) {
  const { widgetId } = await params;

  return (
    <div className="flex h-full min-h-40 flex-col justify-between rounded-xl border border-border/60 bg-card/80 p-4 text-card-foreground shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Canvas widget
        </p>
        <h2 className="mt-2 text-lg font-semibold">Sample status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Replace this with live app data. This embed already sends
          youeye:ready and debounced youeye:resize through the shared embed
          layout.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border/60 bg-background/70 p-3">
          <p className="text-xs text-muted-foreground">Widget id</p>
          <p className="mt-1 font-medium">{widgetId}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-3">
          <p className="text-xs text-muted-foreground">API route</p>
          <p className="mt-1 font-medium">/api/widgets/sample-widget/data</p>
        </div>
      </div>
    </div>
  );
}
