import { describe, expect, it } from "vitest";

import { extractCompetition, scoreOpportunity } from "../src/scoring.js";
import type { CompetitionEvidence } from "../src/types.js";
import { NOW, comment, issue, repository, reward } from "./fixtures.js";

const noCompetition: CompetitionEvidence = {
  attempts: 0,
  claims: 0,
  linkedPullRequests: 0,
  uniqueCompetitors: 0,
};

function score(
  overrides: Partial<Parameters<typeof scoreOpportunity>[0]> = {},
) {
  return scoreOpportunity({
    now: NOW,
    issue: issue(),
    repository: repository(),
    comments: [comment()],
    reward: reward(),
    competition: noCompetition,
    preferredLanguages: ["TypeScript", "Python", "MCP"],
    ...overrides,
  });
}

describe("scoreOpportunity", () => {
  it("scores a fresh, funded MCP/TypeScript bounty highly", () => {
    const result = score();
    expect(result.score.total).toBe(97);
    expect(result.recommendation).toBe("pursue");
  });

  it("gives a Python API almost the same fit", () => {
    const result = score({
      repository: repository({
        language: "Python",
        description: "A Python FastAPI service",
      }),
      issue: issue({
        title: "[$500] Fix the agent API",
        body: issue().body?.replace("TypeScript MCP", "Python agent") ?? null,
      }),
    });
    expect(result.score.total).toBe(96);
  });

  it("makes a closed issue ineligible", () => {
    const result = score({ issue: issue({ state: "closed" }) });
    expect(result.score.total).toBe(0);
    expect(result.flags).toContain("closed");
    expect(result.recommendation).toBe("skip");
  });

  it("makes a pool without a guaranteed reward ineligible", () => {
    const result = score({ reward: reward({ amountUsd: null, confidence: 0.2 }) });
    expect(result.score.total).toBe(0);
    expect(result.flags).toContain("no-guaranteed-reward");
  });

  it("caps an unverified third-party promise at 45", () => {
    const result = score({
      reward: reward({ provider: "unknown", confidence: 0.2 }),
    });
    expect(result.score.total).toBeLessThanOrEqual(45);
    expect(result.flags).toContain("reward-unverified");
  });

  it.each([
    [4, 89],
    [5, 60],
    [9, 60],
    [10, 45],
  ])("caps competition with %i competitors", (count, expectedMaximum) => {
    const result = score({
      competition: { ...noCompetition, uniqueCompetitors: count },
    });
    expect(result.score.total).toBeLessThanOrEqual(expectedMaximum);
  });

  it("caps a stale opportunity", () => {
    const staleDate = "2026-03-01T00:00:00.000Z";
    const result = score({
      issue: issue({ created_at: staleDate, updated_at: staleDate }),
      comments: [],
    });
    expect(result.score.total).toBeLessThanOrEqual(50);
    expect(result.flags).toContain("stale");
  });

  it("caps an opportunity that already has a linked solution", () => {
    const result = score({
      competition: { ...noCompetition, linkedPullRequests: 1 },
    });
    expect(result.score.total).toBeLessThanOrEqual(50);
    expect(result.flags).toContain("existing-solution");
  });

  it("rejects work explicitly reserved for another contributor", () => {
    const result = score({
      comments: [comment({ body: "Thanks @alice, it's yours." })],
    });
    expect(result.score.total).toBe(0);
    expect(result.flags).toContain("exclusive-assignee");
  });
});

describe("extractCompetition", () => {
  it("deduplicates competitors and linked pull requests", () => {
    const comments = [
      comment({ body: "/attempt #42", user: { login: "alice", type: "User" } }),
      comment({
        body: "PR https://github.com/example/paid-project/pull/7 /claim #42",
        user: { login: "alice", type: "User" },
      }),
      comment({ body: "I'd like to work on this", user: { login: "bob", type: "User" } }),
      comment({ body: "/attempt #42", user: { login: "algora-pbc", type: "Bot" } }),
    ];

    expect(extractCompetition(comments)).toEqual({
      attempts: 2,
      claims: 1,
      linkedPullRequests: 1,
      uniqueCompetitors: 2,
    });
  });
});
