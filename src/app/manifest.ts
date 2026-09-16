import { createAppManifest } from "@/lib/pwa/manifest-factory";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-config";

export default function manifest() {
  return createAppManifest({
    appName: APP_NAME,
    description: APP_DESCRIPTION,
    themeColor: "#2563eb",
  });
}
