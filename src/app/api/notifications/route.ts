import { createNotificationsHandler } from "@/lib/routes/notifications";
import { APP_ID } from "@/lib/app-config";

export const GET = createNotificationsHandler(APP_ID);
