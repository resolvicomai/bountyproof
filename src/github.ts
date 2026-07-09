import type {
  GitHubComment,
  GitHubIssue,
  GitHubRepository,
} from "./types.js";

interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

export interface IssueReference {
  owner: string;
  repo: string;
  number: number;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export function parseIssueUrl(value: string): IssueReference {
  const url = new URL(value);
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("issueUrl must point to github.com");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "issues") {
    throw new Error("issueUrl must look like https://github.com/owner/repo/issues/123");
  }
  const number = Number(parts[3]);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error("issueUrl contains an invalid issue number");
  }
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) throw new Error("issueUrl is missing an owner or repository");
  return { owner, repo, number };
}

export class GitHubClient {
  private readonly token: string | undefined;
  private remaining: string | null = null;

  constructor(token = process.env.GITHUB_TOKEN) {
    this.token = token;
  }

  get rateLimitRemaining(): string | null {
    return this.remaining;
  }

  private async request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "bountyproof/0.1",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(`https://api.github.com${path}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    this.remaining = response.headers.get("x-ratelimit-remaining");

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new GitHubApiError(
        payload.message ?? `GitHub API returned HTTP ${response.status}`,
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  async getIssue(reference: IssueReference): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      `/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repo)}/issues/${reference.number}`,
    );
  }

  async getComments(reference: IssueReference): Promise<GitHubComment[]> {
    return this.request<GitHubComment[]>(
      `/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repo)}/issues/${reference.number}/comments?per_page=100&sort=created&direction=asc`,
    );
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    );
  }

  async searchIssues(query: string, limit: number): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      q: query,
      sort: "updated",
      order: "desc",
      per_page: String(Math.min(30, Math.max(1, limit))),
    });
    const result = await this.request<SearchResponse>(`/search/issues?${params}`);
    return result.items.filter((item) => !item.pull_request);
  }
}
