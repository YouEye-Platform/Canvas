import { getSession } from "@/lib/auth";
import { APP_NAME } from "@/lib/app-config";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession().catch(() => null);
  if (!session) redirect("/api/auth/sso");

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-3xl font-bold mb-4">Welcome to {APP_NAME}</h1>
      <p className="text-muted-foreground">
        This is a YouEye Canvas starter app. Fork this repo and build your own
        app.
      </p>
    </div>
  );
}
