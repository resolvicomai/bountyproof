export const serviceMetadata = {
  service: "BountyProof",
  version: "0.1.0",
  description:
    "Verifies and ranks paid GitHub coding opportunities using payment evidence, visible competition, repository legitimacy, freshness, stack fit, and expected value.",
  endpoint: "/api/scan",
  method: "POST",
  pricing: "free",
  actions: {
    verify: {
      required: ["action", "issueUrl"],
      example: {
        action: "verify",
        issueUrl: "https://github.com/Expensify/App/issues/95742",
        languages: ["TypeScript", "Python", "MCP"],
      },
    },
    discover: {
      required: ["action"],
      example: {
        action: "discover",
        languages: ["TypeScript", "Python", "MCP"],
        minRewardUsd: 100,
        limit: 5,
      },
    },
  },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "BountyProof API",
    version: "0.1.0",
    description: serviceMetadata.description,
  },
  paths: {
    "/api/health": {
      get: {
        operationId: "health",
        summary: "Check service health",
        responses: { "200": { description: "Service is healthy" } },
      },
    },
    "/api/scan": {
      get: {
        operationId: "describeBountyProof",
        summary: "Return service metadata and request examples",
        responses: { "200": { description: "Service metadata" } },
      },
      post: {
        operationId: "scanPaidCodingOpportunities",
        summary: "Verify one GitHub issue or discover paid coding opportunities",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", enum: ["verify", "discover"] },
                  issueUrl: { type: "string", format: "uri" },
                  languages: { type: "array", items: { type: "string" } },
                  minRewardUsd: { type: "number", minimum: 0 },
                  limit: { type: "integer", minimum: 1, maximum: 10 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Ranked opportunity evidence" },
          "400": { description: "Invalid request" },
          "502": { description: "GitHub data source failed" },
        },
      },
    },
  },
} as const;
