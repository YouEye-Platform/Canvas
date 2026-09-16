import packageJson from "../../package.json";

export const APP_ID = process.env.YOUEYE_APP_ID || "ye-myapp";
export const APP_NAME = process.env.YOUEYE_APP_NAME || process.env.APP_NAME || "My App";
export const APP_DESCRIPTION =
  process.env.YOUEYE_APP_DESCRIPTION ||
  "A YouEye native app built with Canvas";
export const APP_ICON = "Star";
export const APP_EXTERNAL_URL_ENV = "APP_EXTERNAL_URL";
export const APP_VERSION = packageJson.version;
