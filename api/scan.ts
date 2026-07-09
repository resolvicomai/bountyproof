import { getCache } from "@vercel/functions";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { GitHubApiError } from "../src/github.js";
import { serviceMetadata } from "../src/metadata.js";
import { scan, validateRequest } from "../src/service.js";
import type { ScanResponse, SupportedAction } from "../src/types.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const RUNTIME_FRESH_TTL_SECONDS: Record<SupportedAction, number> = {
  discover: 5 * 60,
  verify: 15 * 60,
};
const RUNTIME_STALE_TTL_SECONDS: Record<SupportedAction, number> = {
  discover: 60 * 60,
  verify: 24 * 60 * 60,
};
const runtimeCache = getCache({ namespace: "bountyproof-scan-v1" });
const resultCache = new Map<
  string,
  { expiresAt: number; value: Awaited<ReturnType<typeof scan>> }
>();

function withCacheState(
  value: ScanResponse,
  cacheState: NonNullable<ScanResponse["diagnostics"]["cacheState"]>,
): ScanResponse {
  return {
    ...value,
    diagnostics: { ...value.diagnostics, cacheState },
  };
}

async function readRuntimeCache(key: string): Promise<ScanResponse | null> {
  try {
    return (await runtimeCache.get(key)) as ScanResponse | null;
  } catch {
    return null;
  }
}

async function writeRuntimeCache(
  key: string,
  value: ScanResponse,
  action: SupportedAction,
): Promise<void> {
  try {
    await Promise.all([
      runtimeCache.set(`fresh:${key}`, value, {
        name: `bountyproof-${action}-fresh`,
        tags: ["bountyproof", `bountyproof-${action}`],
        ttl: RUNTIME_FRESH_TTL_SECONDS[action],
      }),
      runtimeCache.set(`stale:${key}`, value, {
        name: `bountyproof-${action}-stale`,
        tags: ["bountyproof", `bountyproof-${action}`],
        ttl: RUNTIME_STALE_TTL_SECONDS[action],
      }),
    ]);
  } catch {
    // A cache failure must not make the scanner unavailable.
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Expose-Headers", "X-BountyProof-Cache");
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
    const cacheKey = JSON.stringify(body);
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      response.setHeader("X-BountyProof-Cache", "HIT");
      return response.status(200).json(withCacheState(cached.value, "fresh"));
    }
    if (cached) resultCache.delete(cacheKey);

    const runtimeFresh = await readRuntimeCache(`fresh:${cacheKey}`);
    if (runtimeFresh) {
      resultCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        value: runtimeFresh,
      });
      response.setHeader("X-BountyProof-Cache", "HIT");
      return response.status(200).json(withCacheState(runtimeFresh, "fresh"));
    }

    try {
      const result = await scan(body);
      if (resultCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = resultCache.keys().next().value as string | undefined;
        if (oldestKey) resultCache.delete(oldestKey);
      }
      resultCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        value: result,
      });
      await writeRuntimeCache(cacheKey, result, body.action);
      response.setHeader("X-BountyProof-Cache", "MISS");
      return response.status(200).json(withCacheState(result, "miss"));
    } catch (error) {
      if (error instanceof GitHubApiError && error.status !== 404) {
        const stale = await readRuntimeCache(`stale:${cacheKey}`);
        if (stale) {
          response.setHeader("Warning", '110 - "Response is stale"');
          response.setHeader("X-BountyProof-Cache", "STALE");
          return response.status(200).json(withCacheState(stale, "stale"));
        }
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof GitHubApiError) {
      const status = error.status === 404 ? 404 : error.status === 403 ? 503 : 502;
      if (error.retryAfterSeconds !== null) {
        response.setHeader("Retry-After", String(error.retryAfterSeconds));
      }
      return response.status(status).json({
        error: "GitHub data source failed",
        detail: error.message,
      });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return response.status(400).json({ error: message });
  }
}
