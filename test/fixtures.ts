import type {
  GitHubComment,
  GitHubIssue,
  GitHubRepository,
  RewardEvidence,
} from "../src/types.js";

export const NOW = new Date("2026-07-09T18:00:00.000Z");

export function issue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
  return {
    html_url: "https://github.com/example/paid-project/issues/42",
    number: 42,
    title: "[$500] Add MCP API validation",
    body: [
      "## Acceptance criteria",
      "- [ ] Add the endpoint",
      "- [ ] Add tests",
      "- [ ] Document the API",
      "## Scope",
      "Change the TypeScript MCP server and include reproduction steps.",
      "Comment /attempt, open a pull request with /claim, and receive payment after merge.",
    ].join("\n"),
    state: "open",
    created_at: "2026-07-09T12:00:00.000Z",
    updated_at: "2026-07-09T12:00:00.000Z",
    comments: 0,
    user: { login: "maintainer", type: "User" },
    labels: [{ name: "bounty" }],
    ...overrides,
  };
}

export function repository(
  overrides: Partial<GitHubRepository> = {},
): GitHubRepository {
  return {
    full_name: "example/paid-project",
    html_url: "https://github.com/example/paid-project",
    description: "A TypeScript MCP and API server",
    archived: false,
    disabled: false,
    fork: false,
    stargazers_count: 500,
    forks_count: 50,
    open_issues_count: 10,
    created_at: "2020-01-01T00:00:00.000Z",
    updated_at: "2026-07-09T12:00:00.000Z",
    pushed_at: "2026-07-09T12:00:00.000Z",
    language: "TypeScript",
    owner: { login: "example", type: "Organization" },
    ...overrides,
  };
}

export function comment(
  overrides: Partial<GitHubComment> = {},
): GitHubComment {
  return {
    body: "The $500 bounty is funded. Submit a PR and payment follows merge.",
    created_at: "2026-07-09T12:30:00.000Z",
    user: { login: "maintainer", type: "User" },
    author_association: "MEMBER",
    ...overrides,
  };
}

export function reward(overrides: Partial<RewardEvidence> = {}): RewardEvidence {
  return {
    amountUsd: 500,
    currency: "USD",
    provider: "algora",
    confidence: 0.96,
    excerpts: ["$500 bounty"],
    ...overrides,
  };
}
