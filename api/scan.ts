import type { VercelRequest, VercelResponse } from "@vercel/node";

import { GitHubApiError } from "../src/github.js";
import { serviceMetadata } from "../src/metadata.js";
import { scan, validateRequest } from "../src/service.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method === "GET") return response.status(200).json(serviceMetadata);
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = validateRequest(
      request.body === undefined || request.body === null
        ? { action: "discover", limit: 1 }
        : request.body,
    );
    const result = await scan(body);
    return response.status(200).json(result);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      const status = error.status === 404 ? 404 : error.status === 403 ? 503 : 502;
      return response.status(status).json({
        error: "GitHub data source failed",
        detail: error.message,
      });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return response.status(400).json({ error: message });
  }
}
