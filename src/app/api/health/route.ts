import { createHealthHandler } from "@/lib/routes/health";
import { APP_ID } from "@/lib/app-config";

export const GET = createHealthHandler({
  appId: APP_ID,
});
