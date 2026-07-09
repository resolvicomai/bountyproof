import { describe, expect, it } from "vitest";

import { discoveryBudget, validateRequest } from "../src/service.js";

describe("validateRequest", () => {
  it("turns an empty JSON body into a marketplace-safe discovery", () => {
    expect(validateRequest({})).toEqual({ action: "discover", limit: 1 });
  });

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

describe("discoveryBudget", () => {
  it("protects the anonymous GitHub quota from discovery fan-out", () => {
    expect(discoveryBudget(1, false)).toBe(1);
    expect(discoveryBudget(10, false)).toBe(2);
  });

  it("allows broader discovery when a token is configured", () => {
    expect(discoveryBudget(5, true)).toBe(15);
    expect(discoveryBudget(10, true)).toBe(20);
  });
});
