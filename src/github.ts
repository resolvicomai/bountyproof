import type {
  GitHubComment,
  GitHubIssue,
  GitHubRepository,
  GitHubTimelineEvent,
} from "./types.js";

interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

interface GitHubPage<T> {
  data: T;
  link: string | null;
}

export function lastPageFromLink(link: string | null): number {
  if (!link) return 1;
  const last = link
    .split(",")
    .find((part) => /rel="last"/.test(part));
  const match = last?.match(/[?&]page=(\d+)[^>]*>/);
  return match ? Math.max(1, Number(match[1])) : 1;
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

  private async requestPage<T>(path: string): Promise<GitHubPage<T>> {
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
    return {
      data: (await response.json()) as T,
      link: response.headers.get("link"),
    };
  }

  private async request<T>(path: string): Promise<T> {
    return (await this.requestPage<T>(path)).data;
  }

  private async requestPages<T>(path: string): Promise<T[]> {
    const first = await this.requestPage<T[]>(path);
    const lastPage = lastPageFromLink(first.link);
    if (lastPage === 1) return first.data;

    const pages = Array.from(
      { length: Math.min(lastPage, 4) - 1 },
      (_, index) => index + 2,
    );
    if (lastPage > 4) pages.push(lastPage);
    const separator = path.includes("?") ? "&" : "?";
    const rest = await Promise.all(
      pages.map((page) => this.request<T[]>(`${path}${separator}page=${page}`)),
    );
    return [first.data, ...rest].flat();
  }

  async getIssue(reference: IssueReference): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      `/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repo)}/issues/${reference.number}`,
    );
  }

  async getComments(reference: IssueReference): Promise<GitHubComment[]> {
    return this.requestPages<GitHubComment>(
      `/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repo)}/issues/${reference.number}/comments?per_page=100&sort=created&direction=asc`,
    );
  }

  async getTimeline(reference: IssueReference): Promise<GitHubTimelineEvent[]> {
    return this.requestPages<GitHubTimelineEvent>(
      `/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repo)}/issues/${reference.number}/timeline?per_page=100`,
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
