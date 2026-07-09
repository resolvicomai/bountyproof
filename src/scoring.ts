import type {
  CompetitionEvidence,
  GitHubComment,
  GitHubIssue,
  GitHubRepository,
  GitHubTimelineEvent,
  OpportunityScore,
  RewardEvidence,
  RiskFlag,
} from "./types.js";

export interface ScoringInput {
  now: Date;
  issue: GitHubIssue;
  repository: GitHubRepository;
  comments: GitHubComment[];
  timeline: GitHubTimelineEvent[];
  reward: RewardEvidence;
  competition: CompetitionEvidence;
  preferredLanguages: string[];
}

export interface ScoringOutput {
  score: OpportunityScore;
  flags: RiskFlag[];
  recommendation: "pursue" | "inspect" | "skip";
  rationale: string[];
}

const DAY = 86_400_000;
const TRUSTED_ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR"];
const WORK_INTENT =
  /\/attempt|\/try\b|\/claim\b|\b(?:PR|pull request)\s*#?\d+|\bproposal\b|\b(?:can|could)\s+i\s+(?:take|work on)|\b(?:please\s+)?(?:assign|reassign)\b.{0,80}\b(?:me|to me)\b|\bi(?:'d| would)\s+(?:also\s+)?(?:like|love|be happy)\s+to\s+(?:work on|take)|\bi(?:'m| am)\s+(?:still\s+)?(?:interested|available|working on|taking)|\b(?:taking|claiming)\s+(?:this|the\s+)?(?:bounty|issue)\b|\bconsider\s+assigning\b.{0,60}\b(?:me|to me)\b/i;

function ageInDays(older: string, now: Date): number {
  return Math.max(0, (now.getTime() - Date.parse(older)) / DAY);
}

function scorePayment(reward: RewardEvidence): number {
  if (reward.amountUsd === null) return 0;
  if (reward.confidence >= 0.94) return 25;
  if (reward.confidence >= 0.85) return 22;
  if (reward.confidence >= 0.6) return 16;
  if (reward.confidence >= 0.35) return 10;
  return 4;
}

function hasLargeScope(issue: GitHubIssue): boolean {
  const text = `${issue.title}\n${issue.body ?? ""}`;
  const stages = new Set(
    [...text.matchAll(/\bstage\s+(\d+)\b/gi)].map((match) => match[1]),
  ).size;
  const deliverySignals = [
    /\bhardware\b/i,
    /\bbenchmarks?\b|\bperformance\b/i,
    /\bfull (?:generation )?pipeline\b/i,
    /\bstreaming\b/i,
    /\baccuracy\b|\bsimilarity\b|\bWER\b/i,
    /\boptimization\b|\bprofiling\b/i,
  ].filter((pattern) => pattern.test(text)).length;
  return stages >= 3 || (text.length >= 6_000 && deliverySignals >= 4);
}

function isCompetitorComment(comment: GitHubComment): boolean {
  return (
    !TRUSTED_ASSOCIATIONS.includes(comment.author_association) &&
    WORK_INTENT.test(comment.body)
  );
}

function scoreExecutability(issue: GitHubIssue): number {
  const text = `${issue.title}\n${issue.body ?? ""}`;
  const checklistItems = text.match(/^\s*[-*]\s+\[[ xX]\]/gm)?.length ?? 0;
  const criteria =
    checklistItems >= 3 || /acceptance criteria|requirements?|expected behavior/i.test(text)
      ? 5
      : checklistItems > 0
        ? 3
        : 0;
  const scope =
    /reproduction|steps to reproduce|scope|implementation|files?|endpoint|api|function/i.test(
      text,
    )
      ? 4
      : text.length >= 500
        ? 2
        : 0;
  const claimProcess = /\/attempt|\/claim|pull request|\bPR\b|fork the repo/i.test(text)
    ? 3
    : 0;
  const completion = /merge|merged|payment|paid|award|payout|receive/i.test(text) ? 3 : 0;
  const base = criteria + scope + claimProcess + completion;
  return hasLargeScope(issue) ? Math.max(0, base - 8) : base;
}

function scoreLegitimacy(repository: GitHubRepository, now: Date): number {
  const repoAge = ageInDays(repository.created_at, now);
  const activityAge = ageInDays(repository.pushed_at, now);
  const age = repoAge >= 365 ? 4 : repoAge >= 90 ? 2 : 0;
  const activity = activityAge <= 30 ? 4 : activityAge <= 90 ? 2 : 0;
  const adoption =
    repository.stargazers_count >= 100 || repository.forks_count >= 20
      ? 4
      : repository.stargazers_count >= 10 || repository.forks_count >= 3
        ? 2
        : 0;
  const identity = repository.owner.type === "Organization" ? 3 : 1;
  return age + activity + adoption + identity;
}

function scoreValue(amountUsd: number | null): number {
  if (amountUsd === null || amountUsd < 1) return 0;
  if (amountUsd < 50) return 1;
  if (amountUsd < 100) return 3;
  if (amountUsd < 250) return 6;
  if (amountUsd < 500) return 9;
  if (amountUsd < 1_000) return 12;
  if (amountUsd < 2_500) return 14;
  return 15;
}

function scoreCompetition(competition: CompetitionEvidence): number {
  const count = competition.uniqueCompetitors;
  if (count === 0) return 12;
  if (count === 1) return 9;
  if (count === 2) return 7;
  if (count <= 4) return 4;
  if (count <= 9) return 2;
  return 0;
}

function latestMaintainerActivity(
  issue: GitHubIssue,
  comments: GitHubComment[],
  timeline: GitHubTimelineEvent[],
): number {
  const maintainerActivity = comments
    .filter((comment) =>
      TRUSTED_ASSOCIATIONS.includes(comment.author_association),
    )
    .map((comment) => Date.parse(comment.created_at));
  const trustedTimelineActivity = timeline
    .filter((event) => ["assigned", "unassigned", "reopened"].includes(event.event))
    .map((event) => event.created_at)
    .filter((createdAt): createdAt is string => createdAt !== undefined)
    .map((createdAt) => Date.parse(createdAt));
  return Math.max(
    Date.parse(issue.created_at),
    ...maintainerActivity,
    ...trustedTimelineActivity,
  );
}

function scoreFreshness(
  issue: GitHubIssue,
  comments: GitHubComment[],
  timeline: GitHubTimelineEvent[],
  now: Date,
): number {
  const days = Math.max(
    0,
    (now.getTime() - latestMaintainerActivity(issue, comments, timeline)) / DAY,
  );

  if (days <= 1) return 10;
  if (days <= 3) return 8;
  if (days <= 7) return 6;
  if (days <= 14) return 4;
  if (days <= 30) return 2;
  if (days <= 90) return 1;
  return 0;
}

function scoreFit(
  repository: GitHubRepository,
  issue: GitHubIssue,
  preferredLanguages: string[],
): number {
  const text = `${repository.language ?? ""} ${repository.description ?? ""} ${issue.title} ${issue.body ?? ""}`.toLowerCase();
  const preferred = preferredLanguages.map((language) => language.toLowerCase());
  if (preferred.length === 0) return 2;
  const hasPreferred = preferred.some((language) => text.includes(language));
  const isMcp = /\bmcp\b|model context protocol/.test(text);
  const isApi = /\bapi\b|integration|backend|server/.test(text);
  const isTsNode = /typescript|node(?:\.js)?/.test(text);
  const isPythonLlm = /python|flask|fastapi|llm|rag|agent/.test(text);
  const isBrowser = /browser extension|webextension|firefox|chrome extension/.test(text);

  if (isMcp && isTsNode) return 8;
  if (hasPreferred && (isApi || isTsNode || isPythonLlm)) return 7;
  if (isBrowser) return 6;
  if (hasPreferred) return 4;
  return 2;
}

function probabilityFrom(
  payment: number,
  executability: number,
  legitimacy: number,
  competition: CompetitionEvidence,
  fit: number,
): number {
  const rivalry = 1 / (competition.uniqueCompetitors + 1);
  const quality =
    (payment / 25) *
    (0.45 + 0.55 * (executability / 15)) *
    (0.4 + 0.6 * (legitimacy / 15)) *
    (0.5 + 0.5 * (fit / 8));
  return Math.max(0.005, Math.min(0.8, rivalry * quality));
}

export function scoreOpportunity(input: ScoringInput): ScoringOutput {
  const {
    now,
    issue,
    repository,
    comments,
    timeline,
    reward,
    competition,
    preferredLanguages,
  } = input;
  const flags: RiskFlag[] = [];
  const rationale: string[] = [];

  if (issue.state !== "open") flags.push("closed");
  if (repository.archived) flags.push("archived-repository");
  if (repository.disabled) flags.push("disabled-repository");
  if (reward.amountUsd === null) flags.push("no-guaranteed-reward");
  if (reward.confidence < 0.6) flags.push("reward-unverified");
  if (["direct", "opire", "unknown"].includes(reward.provider)) {
    flags.push("payment-not-escrowed");
  }
  if (competition.linkedPullRequests > 0) flags.push("existing-solution");
  if (competition.uniqueCompetitors >= 10) flags.push("extreme-competition");
  const activeCompetitors = new Set([
    ...comments
      .filter(isCompetitorComment)
      .map((comment) => comment.user.login),
    ...timeline
      .map((event) => event.source?.issue)
      .filter((source) => source?.pull_request !== undefined && source.state === "open")
      .map((source) => source?.user.login)
      .filter((login): login is string => login !== undefined),
  ]);
  if (
    issue.assignees.some((assignee) => activeCompetitors.has(assignee.login)) ||
    comments.some(
      (comment) =>
        TRUSTED_ASSOCIATIONS.includes(comment.author_association) &&
        /\bit(?:'s| is) yours\b|\breserved for\b|\bassigned (?:this )?(?:issue )?to @/i.test(
          comment.body,
        ),
    )
  ) {
    flags.push("exclusive-assignee");
  }
  if (hasLargeScope(issue)) flags.push("large-scope");
  if (
    (now.getTime() - latestMaintainerActivity(issue, comments, timeline)) / DAY > 90
  ) {
    flags.push("stale");
  }
  if (
    ageInDays(repository.created_at, now) < 30 &&
    repository.stargazers_count < 10 &&
    (reward.amountUsd ?? 0) >= 1_000
  ) {
    flags.push("new-low-trust-repository");
  }

  const payment = scorePayment(reward);
  const executability = scoreExecutability(issue);
  const legitimacy = scoreLegitimacy(repository, now);
  const value = scoreValue(reward.amountUsd);
  const competitionScore = scoreCompetition(competition);
  const freshness = scoreFreshness(issue, comments, timeline, now);
  const fit = scoreFit(repository, issue, preferredLanguages);
  const raw =
    payment + executability + legitimacy + value + competitionScore + freshness + fit;
  let total = raw;

  if (flags.includes("reward-unverified")) total = Math.min(total, 45);
  if (flags.includes("new-low-trust-repository")) total = Math.min(total, 35);
  if (flags.includes("stale")) total = Math.min(total, 50);
  if (competition.uniqueCompetitors >= 5) total = Math.min(total, 60);
  if (flags.includes("extreme-competition")) total = Math.min(total, 45);
  if (flags.includes("existing-solution")) total = Math.min(total, 50);
  if (flags.includes("large-scope")) total = Math.min(total, 54);
  if (
    flags.some((flag) =>
      [
        "closed",
        "archived-repository",
        "disabled-repository",
        "no-guaranteed-reward",
        "deadline-passed",
        "exclusive-assignee",
      ].includes(flag),
    )
  ) {
    total = 0;
  }

  const estimatedWinProbability = probabilityFrom(
    payment,
    executability,
    legitimacy,
    competition,
    fit,
  );
  const expectedValueUsd =
    reward.amountUsd === null ? null : reward.amountUsd * estimatedWinProbability;

  if (reward.amountUsd !== null) {
    rationale.push(
      `${reward.provider} advertises an estimated $${reward.amountUsd.toLocaleString("en-US")} reward`,
    );
  }
  rationale.push(`${competition.uniqueCompetitors} visible competitor(s)`);
  rationale.push(
    `${repository.stargazers_count.toLocaleString("en-US")} repository stars; last push ${Math.round(ageInDays(repository.pushed_at, now))} day(s) ago`,
  );
  if (flags.length > 0) rationale.push(`Risk flags: ${flags.join(", ")}`);

  const fatal = total === 0;
  const recommendation = fatal || total < 55 ? "skip" : total >= 75 ? "pursue" : "inspect";

  return {
    score: {
      total: Math.round(total),
      payment,
      executability,
      freshness,
      legitimacy,
      competition: competitionScore,
      fit,
      value,
      estimatedWinProbability: Number(estimatedWinProbability.toFixed(4)),
      expectedValueUsd:
        expectedValueUsd === null ? null : Number(expectedValueUsd.toFixed(2)),
    },
    flags,
    recommendation,
    rationale,
  };
}

export function extractCompetition(
  comments: GitHubComment[],
  timeline: GitHubTimelineEvent[] = [],
): CompetitionEvidence {
  const attempts = comments.filter((comment) => /\/attempt|\/try\b/i.test(comment.body));
  const claims = comments.filter((comment) => /\/claim\b/i.test(comment.body));
  const timelinePullRequests = timeline
    .map((event) => event.source?.issue)
    .filter(
      (source): source is NonNullable<typeof source> =>
        source?.pull_request !== undefined,
    );
  const timelineStates = new Map(
    timelinePullRequests.map((pullRequest) => [pullRequest.html_url, pullRequest.state]),
  );
  const linkedPullRequests = new Set([
    ...comments.flatMap((comment) =>
      [...comment.body.matchAll(/https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/gi)]
        .map((match) => match[0])
        .filter((url) => timelineStates.get(url) !== "closed"),
    ),
    ...timelinePullRequests
      .filter((pullRequest) => pullRequest.state === "open")
      .map((pullRequest) => pullRequest.html_url),
  ]);
  const competitorComments = comments.filter(isCompetitorComment);
  const competitorUsers = [
    ...competitorComments.map((comment) => comment.user),
    ...timelinePullRequests
      .filter((pullRequest) => pullRequest.state === "open")
      .map((pullRequest) => pullRequest.user),
  ];
  const uniqueCompetitors = new Set(
    competitorUsers
      .filter(
        (user) =>
          user.type !== "Bot" &&
          !/^(?:algora-pbc|bountyhub-app)(?:\[bot\])?$/i.test(user.login),
      )
      .map((user) => user.login)
      .filter((login) => !/bot$|\[bot\]$/i.test(login)),
  ).size;

  return {
    attempts: attempts.length,
    claims: claims.length,
    linkedPullRequests: linkedPullRequests.size,
    uniqueCompetitors,
  };
}
