import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  return response.status(200).json({
    service: "BountyProof",
    status: "ok",
    version: "0.1.0",
  });
}
