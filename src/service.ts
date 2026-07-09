import { GitHubClient, parseIssueUrl, type IssueReference } from "./github.js";
import { extractReward } from "./reward.js";
import { extractCompetition, scoreOpportunity } from "./scoring.js";
import type {
  GitHubIssue,
  Opportunity,
  ScanRequest,
  ScanResponse,
} from "./types.js";

const MAX_RESULTS = 10;

function clampLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 5;
  return Math.min(MAX_RESULTS, Math.max(1, Math.floor(value)));
}

function referenceFromIssue(issue: GitHubIssue): IssueReference {
  return parseIssueUrl(issue.html_url);
}

async function evaluate(
  client: GitHubClient,
  reference: IssueReference,
  issue: GitHubIssue,
  preferredLanguages: string[],
  now: Date,
): Promise<Opportunity> {
  const [repository, comments] = await Promise.all([
    client.getRepository(reference.owner, reference.repo),
    client.getComments(reference),
  ]);
  const reward = extractReward(issue, comments);
  const competition = extractCompetition(comments);
  const scored = scoreOpportunity({
    now,
    issue,
    repository,
    comments,
    reward,
    competition,
    preferredLanguages,
  });

  return {
    issue: {
      owner: reference.owner,
      repo: reference.repo,
      number: reference.number,
      title: issue.title,
      url: issue.html_url,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    },
    repository: {
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      language: repository.language,
      ownerType: repository.owner.type,
      createdAt: repository.created_at,
      archived: repository.archived,
    },
    reward,
    competition,
    flags: scored.flags,
    score: scored.score,
    recommendation: scored.recommendation,
    rationale: scored.rationale,
  };
}

async function discoverCandidates(client: GitHubClient, limit: number): Promise<GitHubIssue[]> {
  const searches = [
    client.searchIssues(
      'bounty in:title,body is:issue is:open -label:"good first issue"',
      limit * 2,
    ),
    client.searchIssues('repo:Expensify/App label:"Help Wanted" is:issue is:open', limit),
  ];
  const settled = await Promise.allSettled(searches);
  const deduped = new Map<string, GitHubIssue>();

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const issue of result.value) deduped.set(issue.html_url, issue);
  }

  return [...deduped.values()].slice(0, Math.min(20, limit * 3));
}

export function validateRequest(value: unknown): ScanRequest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object");
  }
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length === 0) {
    return { action: "discover", limit: 1 };
  }
  if (body.action !== "verify" && body.action !== "discover") {
    throw new Error('action must be either "verify" or "discover"');
  }
  if (body.action === "verify" && typeof body.issueUrl !== "string") {
    throw new Error("issueUrl is required when action is verify");
  }
  if (
    body.languages !== undefined &&
    (!Array.isArray(body.languages) ||
      body.languages.some((language) => typeof language !== "string"))
  ) {
    throw new Error("languages must be an array of strings");
  }
  if (body.minRewardUsd !== undefined && typeof body.minRewardUsd !== "number") {
    throw new Error("minRewardUsd must be a number");
  }
  if (body.limit !== undefined && typeof body.limit !== "number") {
    throw new Error("limit must be a number");
  }

  const request: ScanRequest = { action: body.action };
  if (typeof body.issueUrl === "string") request.issueUrl = body.issueUrl;
  if (Array.isArray(body.languages)) request.languages = body.languages as string[];
  if (typeof body.minRewardUsd === "number") request.minRewardUsd = body.minRewardUsd;
  if (typeof body.limit === "number") request.limit = body.limit;
  return request;
}

export async function scan(
  request: ScanRequest,
  dependencies: { client?: GitHubClient; now?: Date } = {},
): Promise<ScanResponse> {
  const client = dependencies.client ?? new GitHubClient();
  const now = dependencies.now ?? new Date();
  const preferredLanguages = request.languages?.length
    ? request.languages.slice(0, 10)
    : [];
  const limit = clampLimit(request.limit);
  let candidates: GitHubIssue[];

  if (request.action === "verify") {
    const reference = parseIssueUrl(request.issueUrl ?? "");
    candidates = [await client.getIssue(reference)];
  } else {
    candidates = await discoverCandidates(client, limit);
  }

  const evaluated = await Promise.allSettled(
    candidates.map((issue) =>
      evaluate(client, referenceFromIssue(issue), issue, preferredLanguages, now),
    ),
  );
  const minRewardUsd = Math.max(0, request.minRewardUsd ?? 0);
  const results = evaluated
    .filter((result): result is PromiseFulfilledResult<Opportunity> =>
      result.status === "fulfilled",
    )
    .map((result) => result.value)
    .filter((opportunity) => (opportunity.reward.amountUsd ?? 0) >= minRewardUsd)
    .sort(
      (left, right) =>
        right.score.total - left.score.total ||
        right.score.payment - left.score.payment ||
        left.competition.uniqueCompetitors - right.competition.uniqueCompetitors ||
        (right.reward.amountUsd ?? 0) - (left.reward.amountUsd ?? 0) ||
        left.issue.url.localeCompare(right.issue.url),
    )
    .slice(0, limit);

  return {
    service: "BountyProof",
    generatedAt: now.toISOString(),
    disclaimer:
      "Scores are evidence-based estimates, not guarantees of selection or payment. Verify platform terms before starting work.",
    results,
    diagnostics: {
      candidatesExamined: candidates.length,
      githubRateLimitRemaining: client.rateLimitRemaining,
    },
  };
}
