import type { VercelRequest, VercelResponse } from "@vercel/node";

import { openApiDocument } from "../src/metadata.js";

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }
  response.setHeader("Cache-Control", "public, max-age=300");
  return response.status(200).json(openApiDocument);
}
