/* eslint-disable no-unused-vars */
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env.js";

export function notFoundHandler(_request, response) {
  response.status(404).json({ message: "Route not found" });
}

export function errorHandler(error, request, response, _next) {
  let status = error.statusCode ?? 500;
  let message = error.message;

  if (error instanceof z.ZodError) {
    status = 400;
    message = error.errors.map((issue) => issue.message).join(", ");
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    status = ({ P2002: 409, P2003: 409, P2004: 400, P2025: 404, P2034: 409 })[error.code] ?? 500;
    message = ({ P2002: "A record with this value already exists", P2003: "Related record is missing", P2004: "Database constraint was not met", P2025: "Record not found", P2034: "Concurrent update; retry the request" })[error.code];
  }

  if (status >= 500) {
    console.error(JSON.stringify({
      level: "error", event: "request_failed", requestId: request.id,
      name: error.name, code: error.code,
      ...(env.NODE_ENV === "production" ? {} : { message: error.message })
    }));
    message = "The server could not complete the request. Please try again.";
  }
  response.status(status).json({ message: message ?? "Request failed" });
}
