import type {
  GitHubComment,
  GitHubIssue,
  PaymentProvider,
  RewardEvidence,
} from "./types.js";

const MONEY_PATTERNS = [
  /\$\s*([0-9][\d,]*(?:\.\d{1,2})?)\s*(?:USD|USDT)?\b/gi,
  /\b([0-9][\d,]*(?:\.\d{1,2})?)\s*(?:USD|USDT)\b/gi,
  /\/bounty\s+\$?\s*([0-9][\d,]*(?:\.\d{1,2})?)/gi,
] as const;

const PROVIDERS: Array<{
  provider: PaymentProvider;
  test: (text: string, comments: GitHubComment[]) => boolean;
  confidence: number;
}> = [
  {
    provider: "algora",
    test: (text, comments) =>
      /algora\.io|\/bounty\b/i.test(text) ||
      comments.some((comment) => /^algora-pbc(?:\[bot\])?$/i.test(comment.user.login)),
    confidence: 0.96,
  },
  {
    provider: "bountyhub",
    test: (text, comments) =>
      /bountyhub/i.test(text) ||
      comments.some((comment) =>
        /^bountyhub-app(?:\[bot\])?$/i.test(comment.user.login),
      ),
    confidence: 0.92,
  },
  {
    provider: "expensify-upwork",
    test: (text) => /upwork\.com\/jobs|Expensify\/App/i.test(text),
    confidence: 0.9,
  },
  {
    provider: "opire",
    test: (text, comments) =>
      /opire\.dev|\/opire\b/i.test(text) ||
      comments.some((comment) => /opire/i.test(comment.user.login)),
    confidence: 0.72,
  },
  {
    provider: "taskbounty",
    test: (text) => /task-bounty\.com|taskbounty/i.test(text),
    confidence: 0.94,
  },
];

function amountsFrom(text: string): number[] {
  const values: number[] = [];

  for (const pattern of MONEY_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const raw = match[1]?.replaceAll(",", "");
      if (!raw) continue;
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0 && value <= 10_000_000) {
        values.push(value);
      }
    }
  }

  return values;
}

export function extractReward(
  issue: GitHubIssue,
  comments: GitHubComment[],
): RewardEvidence {
  const issueText = `${issue.title}\n${issue.body ?? ""}`;
  const trustedComments = comments.filter(
    (comment) =>
      comment.user.login === issue.user.login ||
      ["OWNER", "MEMBER", "COLLABORATOR"].includes(comment.author_association),
  );
  const providerComments = comments.filter((comment) =>
    /^(?:algora-pbc|bountyhub-app)(?:\[bot\])?$/i.test(comment.user.login),
  );
  const evidenceText = [
    issueText,
    ...providerComments.map((comment) => comment.body),
    ...trustedComments.map((comment) => comment.body),
  ].join("\n");

  const providerMatch = PROVIDERS.find(({ test }) => test(evidenceText, comments));
  const amounts = amountsFrom(evidenceText);
  const amountUsd = amounts.length > 0 ? Math.max(...amounts) : null;
  const directEvidence = /\bbounty\b|\breward\b|\bpaid\b/i.test(evidenceText);

  let provider: PaymentProvider = providerMatch?.provider ?? "unknown";
  let confidence = providerMatch?.confidence ?? 0.15;

  if (!providerMatch && directEvidence && amountUsd !== null) {
    provider = "direct";
    confidence = trustedComments.length > 0 ? 0.64 : 0.38;
  }

  if (amountUsd === null) confidence = Math.min(confidence, 0.35);

  const excerpts = [issue.title, ...providerComments.map((comment) => comment.body)]
    .filter((text) => /\$|USD|USDT|bounty|reward|paid/i.test(text))
    .slice(0, 3)
    .map((text) => text.replace(/\s+/g, " ").trim().slice(0, 240));

  return {
    amountUsd,
    currency: "USD",
    provider,
    confidence,
    excerpts,
  };
}
