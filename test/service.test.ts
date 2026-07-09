import { describe, expect, it } from "vitest";

import { validateRequest } from "../src/service.js";

describe("validateRequest", () => {
  it("accepts a verify request", () => {
    expect(
      validateRequest({
        action: "verify",
        issueUrl: "https://github.com/owner/repo/issues/1",
        languages: ["TypeScript"],
      }),
    ).toEqual({
      action: "verify",
      issueUrl: "https://github.com/owner/repo/issues/1",
      languages: ["TypeScript"],
    });
  });

  it("requires issueUrl for verification", () => {
    expect(() => validateRequest({ action: "verify" })).toThrow(
      "issueUrl is required",
    );
  });

  it("rejects unsupported actions and malformed filters", () => {
    expect(() => validateRequest({ action: "steal" })).toThrow();
    expect(() => validateRequest({ action: "discover", languages: "TypeScript" })).toThrow();
  });
});
