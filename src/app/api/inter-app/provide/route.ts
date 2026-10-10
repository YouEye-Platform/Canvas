import { createInterAppHandler } from "@/lib/routes/inter-app";
import { APP_ID } from "@/lib/app-config";

export const POST = createInterAppHandler(APP_ID, {
  search: async (data) => {
    return { provider: APP_ID, query: data.query ?? null, results: [] };
  },
});
