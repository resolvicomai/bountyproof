import { describe, expect, it } from "vitest";

import { parseIssueUrl } from "../src/github.js";

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
