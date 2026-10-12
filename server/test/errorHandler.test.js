import express from "express";
import request from "supertest";
import { expect, it, vi } from "vitest";
import { errorHandler } from "../src/middleware/errorHandler.js";

it("keeps internal database errors out of API responses", async () => {
  const app = express();
  app.get("/failure", (_request, _response, next) => next(new Error("Database connection string is private")));
  app.use(errorHandler);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const response = await request(app).get("/failure");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "The server could not complete the request. Please try again." });
    expect(response.text).not.toContain("connection string");
  } finally {
    log.mockRestore();
  }
});
