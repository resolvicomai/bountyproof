import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { GitHubApiError } from "../src/github.js";
import { scan, validateRequest } from "../src/service.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const MAX_BODY_BYTES = 64 * 1024;

function send(response: ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body exceeds 64 KiB");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) throw new Error("Request body is required");
  return JSON.parse(raw) as unknown;
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, null);
  if (request.method === "GET" && request.url === "/api/health") {
    return send(response, 200, {
      service: "BountyProof",
      status: "ok",
      version: "0.1.0",
    });
  }
  if (request.method !== "POST" || request.url !== "/api/scan") {
    return send(response, 404, { error: "Not found" });
  }

  try {
    const body = validateRequest(await readJson(request));
    return send(response, 200, await scan(body));
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return send(response, error.status === 404 ? 404 : 502, {
        error: "GitHub data source failed",
        detail: error.message,
      });
    }
    return send(response, 400, {
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
});

server.listen(port, host, () => {
  console.log(`BountyProof listening on http://${host}:${port}`);
});
