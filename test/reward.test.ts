import { describe, expect, it } from "vitest";

import { extractReward } from "../src/reward.js";
import { comment, issue } from "./fixtures.js";

describe("extractReward", () => {
  it("trusts an Algora bot amount", () => {
    const result = extractReward(issue({ title: "Implement JSON import" }), [
      comment({
        body: "## 💎 $1,000 bounty — receive payment through https://algora.io",
        user: { login: "algora-pbc[bot]", type: "Bot" },
        author_association: "NONE",
      }),
    ]);

    expect(result).toMatchObject({
      amountUsd: 1000,
      provider: "algora",
      confidence: 0.96,
    });
  });

  it("parses a maintainer /bounty command without a dollar sign", () => {
    const result = extractReward(issue({ title: "Implement config import" }), [
      comment({ body: "/bounty 100", author_association: "CONTRIBUTOR" }),
    ]);

    expect(result).toMatchObject({ amountUsd: 100, provider: "algora" });
  });

  it("uses the largest explicit dollar amount in trusted evidence", () => {
    const result = extractReward(issue({ title: "Bounty: $250 or $300 for full scope" }), []);
    expect(result.amountUsd).toBe(300);
  });

  it("does not treat an untrusted comment as payment evidence", () => {
    const result = extractReward(issue({ title: "Fix the parser", body: "No reward." }), [
      comment({
        body: "I will pay $10000",
        user: { login: "random-user", type: "User" },
        author_association: "NONE",
      }),
    ]);

    expect(result.amountUsd).toBeNull();
    expect(result.provider).toBe("unknown");
  });
});
