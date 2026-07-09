import { describe, expect, it } from "vitest";

import { GitHubClient, lastPageFromLink, parseIssueUrl } from "../src/github.js";

describe("parseIssueUrl", () => {
  it("parses a canonical GitHub issue URL", () => {
    expect(parseIssueUrl("https://github.com/Expensify/App/issues/95742")).toEqual({
      owner: "Expensify",
      repo: "App",
      number: 95742,
    });
  });

  it.each([
    "https://example.com/owner/repo/issues/1",
    "https://github.com/owner/repo/pull/1",
    "https://github.com/owner/repo/issues/nope",
  ])("rejects invalid URLs: %s", (value) => {
    expect(() => parseIssueUrl(value)).toThrow();
  });
});

describe("lastPageFromLink", () => {
  it("extracts the final GitHub pagination page", () => {
    expect(
      lastPageFromLink(
        '<https://api.github.com/resource?page=2>; rel="next", <https://api.github.com/resource?page=7>; rel="last"',
      ),
    ).toBe(7);
  });

  it("uses one page when GitHub omits a last link", () => {
    expect(lastPageFromLink(null)).toBe(1);
    expect(
      lastPageFromLink('<https://api.github.com/resource?page=1>; rel="prev"'),
    ).toBe(1);
  });
});

describe("GitHubClient", () => {
  it("reports whether requests use authenticated GitHub capacity", () => {
    expect(new GitHubClient("").authenticated).toBe(false);
    expect(new GitHubClient("token").authenticated).toBe(true);
  });
});
