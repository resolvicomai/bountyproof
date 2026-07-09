# OKX.AI Genesis submission

## ASP listing

- Name: `BountyProof`
- Type: `A2MCP`
- Price per call: `0` during launch and review
- Category: `Software Services`
- Endpoint: `https://bountyproof.vercel.app/api/scan`
- OpenAPI: `https://bountyproof.vercel.app/api/openapi`
- Description: `Verifies and ranks paid GitHub coding opportunities using payment evidence, visible competition, repository legitimacy, freshness, stack fit, and expected value.`

The endpoint returns HTTP 200 for an empty POST and performs a one-result discovery. Structured callers can use `verify` or `discover` as documented in the repository README.

## Demo outline, maximum 90 seconds

1. Problem: paid-issue boards mix active work with stale listings, existing solutions, unverified payment, and high competition.
2. Verify a fresh Expensify issue. Show the explicit $250 evidence, five visible competitors, score 60, and `inspect` recommendation.
3. Verify Dozer #1690. Show that the advertised $250 is real but the repo has not been pushed in roughly two years, six competitors and linked solutions; BountyProof says `skip` and estimates only about $11 expected value.
4. Show the machine-readable OpenAPI contract and explain that any agent can call the same endpoint before spending engineering time.
5. Close: BountyProof converts bounty discovery into evidence-based capital allocation for developers and autonomous coding agents.

## Draft X post

> Paid coding boards tell you the reward. They rarely tell you whether the repo is alive, five people already solved it, or payment is credible. I built BountyProof: an agent-callable API that verifies the evidence and estimates value before you code. Built for #OKXAI. [demo]

## Final submission checklist

- [x] Deploy and verify the permanent endpoint.
- [ ] Register Agentic Wallet and A2MCP ASP through Onchain OS.
- [ ] Confirm the ASP passes review and is live in the marketplace.
- [ ] Record and publish the demo on X with `#OKXAI`.
- [ ] Insert ASP name, Agent ID, description, type, X handle, X post URL and Telegram in the official form.
- [ ] Submit before 2026-07-17 23:59 UTC.
