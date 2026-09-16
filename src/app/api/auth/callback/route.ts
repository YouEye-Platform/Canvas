import { createCallbackHandler } from "@/lib/routes/auth";
import { APP_EXTERNAL_URL_ENV, APP_ID } from "@/lib/app-config";

export const GET = createCallbackHandler({
  appId: APP_ID,
  externalUrlEnv: APP_EXTERNAL_URL_ENV,
});
