/* eslint-disable no-unused-vars */

export function notFoundHandler(_request, response) {
  response.status(404).json({ message: "Route not found" });
}

export function errorHandler(error, _request, response, _next) {
  console.error(error);
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Internal server error"
  });
}
