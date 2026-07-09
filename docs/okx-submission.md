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

## Paid A2A service

- Name: `Bounty Viability Audit`
- Type: `A2A`
- Proposed launch price: `10 USDT` (confirm against live marketplace comparables after wallet login)
- Delivery target: `Within 4 hours`
- Description: `Audits one paid GitHub issue before the buyer commits engineering time. The report verifies payment evidence, active competitors and linked pull requests, repository activity, scope risk, stack fit, estimated value, and a pursue/inspect/skip decision.`
- Deliverable: `A concise evidence report with source links, risk flags, expected value, and a recommended next action.`

Use the free A2MCP endpoint for the Genesis demo and the paid A2A service for the first escrow-backed sale. Do not advertise the current endpoint as pay-per-call until it implements the marketplace payment protocol.

## Demo outline, maximum 90 seconds

1. Problem: paid-issue boards mix active work with stale listings, existing solutions, unverified payment, and high competition.
2. Verify Expensify #95742. Show the explicit $250 evidence, nine visible competitors, score 60, and `inspect` recommendation. The live snapshot currently estimates about $16 expected value for the configured stack.
3. Verify Dozer #1690. Show that the advertised $250 is real but the issue is stale and has multiple attempts, claims, and linked solutions; BountyProof says `skip`. The live snapshot currently detects seven competitors, four linked pull requests, and about $10 expected value.
4. Show the machine-readable OpenAPI contract and explain that any agent can call the same endpoint before spending engineering time.
5. Close: BountyProof converts bounty discovery into evidence-based capital allocation for developers and autonomous coding agents.

Re-run both scans immediately before recording because GitHub competition counts and expected value are live evidence and can change.

## Draft X post

> Paid coding boards tell you the reward. They rarely tell you whether the repo is alive, five people already solved it, or payment is credible. I built BountyProof: an agent-callable API that verifies the evidence and estimates value before you code. Built for #OKXAI. [demo]

## Final submission checklist

- [x] Deploy and verify the permanent endpoint.
- [ ] Register Agentic Wallet and A2MCP ASP through Onchain OS.
- [ ] Add and activate the paid `Bounty Viability Audit` A2A service.
- [ ] Confirm the ASP passes review and is live in the marketplace.
- [ ] Record and publish the demo on X with `#OKXAI`.
- [ ] Insert ASP name, Agent ID, description, type, X handle, X post URL and Telegram in the official form.
- [ ] Submit before 2026-07-17 23:59 UTC.
