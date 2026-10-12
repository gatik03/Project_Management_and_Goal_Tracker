import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export function attachRequestContext(request, response, next) {
  const suppliedId = request.get("X-Request-ID");
  request.id = suppliedId && /^[0-9a-f-]{36}$/i.test(suppliedId) ? suppliedId : randomUUID();
  response.setHeader("X-Request-ID", request.id);
  const started = process.hrtime.bigint();

  response.on("finish", () => {
    if (env.NODE_ENV === "test") return;
    console.info(JSON.stringify({
      level: "info", event: "http_request", requestId: request.id,
      method: request.method, path: request.path, status: response.statusCode,
      ip: request.ip,
      durationMs: Number(process.hrtime.bigint() - started) / 1e6
    }));
  });
  next();
}
