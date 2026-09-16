import { createLogoutHandler } from "@/lib/routes/auth";
import { APP_EXTERNAL_URL_ENV, APP_ID } from "@/lib/app-config";

export const POST = createLogoutHandler({
  appId: APP_ID,
  externalUrlEnv: APP_EXTERNAL_URL_ENV,
});
