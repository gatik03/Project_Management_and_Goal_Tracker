import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.info(JSON.stringify({
    level: "info", event: "server_started", port: env.PORT,
    trustProxyHops: app.get("trust proxy"), cookieSameSite: env.JWT_COOKIE_SAME_SITE
  }));
});
