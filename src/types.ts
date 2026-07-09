export type SupportedAction = "discover" | "verify";

export interface ScanRequest {
  action: SupportedAction;
  issueUrl?: string;
  languages?: string[];
  minRewardUsd?: number;
  limit?: number;
}

export interface GitHubUser {
  login: string;
  type: "User" | "Organization" | "Bot";
}

export interface GitHubLabel {
  name: string;
}

export interface GitHubIssue {
  html_url: string;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  comments: number;
  user: GitHubUser;
  assignees: GitHubUser[];
  labels: GitHubLabel[];
  pull_request?: unknown;
}

export interface GitHubComment {
  body: string;
  created_at: string;
  user: GitHubUser;
  author_association:
    | "COLLABORATOR"
    | "CONTRIBUTOR"
    | "FIRST_TIMER"
    | "FIRST_TIME_CONTRIBUTOR"
    | "MANNEQUIN"
    | "MEMBER"
    | "NONE"
    | "OWNER";
}

export interface GitHubTimelineEvent {
  event: string;
  actor: GitHubUser | null;
  created_at?: string;
  source?: {
    issue?: {
      html_url: string;
      state: "open" | "closed";
      user: GitHubUser;
      pull_request?: {
        merged_at: string | null;
      };
    };
  };
}

export interface GitHubRepository {
  full_name: string;
  html_url: string;
  description: string | null;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  owner: GitHubUser;
}

export type PaymentProvider =
  | "algora"
  | "bountyhub"
  | "expensify-upwork"
  | "opire"
  | "taskbounty"
  | "direct"
  | "unknown";

export interface RewardEvidence {
  amountUsd: number | null;
  currency: string;
  provider: PaymentProvider;
  confidence: number;
  excerpts: string[];
}

export interface CompetitionEvidence {
  attempts: number;
  claims: number;
  linkedPullRequests: number;
  uniqueCompetitors: number;
}

export type RiskFlag =
  | "closed"
  | "archived-repository"
  | "disabled-repository"
  | "stale"
  | "deadline-passed"
  | "no-guaranteed-reward"
  | "reward-unverified"
  | "extreme-competition"
  | "new-low-trust-repository"
  | "existing-solution"
  | "exclusive-assignee"
  | "large-scope"
  | "payment-not-escrowed";

export interface OpportunityScore {
  total: number;
  payment: number;
  executability: number;
  freshness: number;
  legitimacy: number;
  competition: number;
  fit: number;
  value: number;
  estimatedWinProbability: number;
  expectedValueUsd: number | null;
}

export interface Opportunity {
  issue: {
    owner: string;
    repo: string;
    number: number;
    title: string;
    url: string;
    state: "open" | "closed";
    assignees: string[];
    createdAt: string;
    updatedAt: string;
  };
  repository: {
    stars: number;
    forks: number;
    language: string | null;
    ownerType: GitHubUser["type"];
    createdAt: string;
    archived: boolean;
  };
  reward: RewardEvidence;
  competition: CompetitionEvidence;
  flags: RiskFlag[];
  score: OpportunityScore;
  recommendation: "pursue" | "inspect" | "skip";
  rationale: string[];
}

export interface ScanResponse {
  service: "BountyProof";
  generatedAt: string;
  disclaimer: string;
  results: Opportunity[];
  diagnostics: {
    candidatesExamined: number;
    githubRateLimitRemaining: string | null;
    cacheState?: "fresh" | "miss" | "stale";
  };
}
