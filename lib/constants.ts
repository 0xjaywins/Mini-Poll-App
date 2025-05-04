export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day
export const APP_URL = process.env.NEXT_PUBLIC_URL || "https://mini-poll-7ae0f4h19-jays-projects-283f15a3.vercel.app";
if (!APP_URL) {
  throw new Error("NEXT_PUBLIC_URL is not set");
}
