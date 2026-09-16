import { createCanvasMiddleware } from "@/lib/middleware";
import { initSession } from "@/lib/auth";
import { APP_ID } from "@/lib/app-config";

initSession(APP_ID);

export const middleware = createCanvasMiddleware({
  appId: APP_ID,
  publicRoutes: ["/embed/"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons).*)"],
};
