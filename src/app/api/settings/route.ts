import { createSettingsHandlers } from "@/lib/routes/settings";
import { APP_ID } from "@/lib/app-config";

const handlers = createSettingsHandlers(APP_ID);
export const GET = handlers.GET;
export const PUT = handlers.PUT;
