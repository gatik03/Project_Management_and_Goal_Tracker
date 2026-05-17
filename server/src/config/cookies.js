import { env } from "./env.js";

const eightHoursMs = 8 * 60 * 60 * 1000;

export function getAuthCookieOptions() {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : env.JWT_COOKIE_SAME_SITE,
    maxAge: eightHoursMs,
    path: "/"
  };
}
