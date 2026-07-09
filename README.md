# BountyProof

Find coding work that is actually worth doing.

BountyProof is a deterministic opportunity-intelligence API for developers and agents. It verifies a GitHub issue, extracts payment evidence only from trusted sources, measures visible competition and linked solutions through the GitHub timeline, detects assignments plus stale or suspicious listings, and ranks the opportunity by expected value.

The public product is live at [bountyproof.vercel.app](https://bountyproof.vercel.app). The deterministic scanner is free. A reviewed viability audit costs 10 USDC through escrow and adds a human-readable decision, cited evidence, scope risk, stack fit, active competitors, linked pull requests, and expected value, delivered within four hours.

`GET /api/scan` returns self-describing metadata, `GET /api/openapi` returns the OpenAPI 3.1 contract, and an empty `POST /api/scan` performs a minimal discovery so automated marketplace checks receive HTTP 200.

Pass `languages` to personalize stack fit and expected value. Without it, BountyProof uses a neutral fit instead of assuming the operator's skills.

## Reviewed audit

Use **Request paid audit** on the public site or email `eu@resolvicomai.app` with the GitHub issue URL and your preferred stack. No payment details are required to request the audit. The report returns a clear `pursue`, `inspect`, or `skip` recommendation with the evidence behind it.

## API

### Verify one issue

```bash
curl -sS -X POST https://bountyproof.vercel.app/api/scan \
  -H 'content-type: application/json' \
  -d '{
    "action": "verify",
    "issueUrl": "https://github.com/Expensify/App/issues/95742",
    "languages": ["TypeScript", "Python", "MCP"]
  }'
```

### Discover opportunities

```bash
curl -sS -X POST https://bountyproof.vercel.app/api/scan \
  -H 'content-type: application/json' \
  -d '{
    "action": "discover",
    "languages": ["TypeScript", "Python", "MCP"],
    "minRewardUsd": 100,
    "limit": 5
  }'
```

The response includes:

- advertised reward and payment-provider confidence;
- visible attempts, claims, competitors, and linked PRs;
- repository legitimacy and freshness evidence;
- fatal and capped risk flags;
- a 0–100 score, estimated win probability, and expected reward value;
- `pursue`, `inspect`, or `skip`, with plain-language reasons.

## Scoring model

The score is intentionally deterministic and auditable:

| Component | Points |
| --- | ---: |
| Payment evidence | 25 |
| Executable scope | 15 |
| Repository legitimacy | 15 |
| Reward value | 15 |
| Competition | 12 |
| Freshness | 10 |
| Stack fit | 8 |

Risk caps prevent a large advertised amount from hiding bad fundamentals. Closed or archived work, and listings without a guaranteed reward, score zero. Unverified payments cap at 45; stale listings and existing solutions cap at 50; ten or more competitors cap at 45.

## Local verification

```bash
npm install
npm test
npm run check
npm run verify:live -- https://github.com/owner/repo/issues/123
```

Set `GITHUB_TOKEN` for a higher API rate limit. The token is read only on the server and is never accepted from callers or returned in a response.

## Safety and limitations

BountyProof does not guarantee selection or payment. It deliberately ranks no-guarantee prize pools as ineligible for direct-work mode, and it separates payment evidence from engineering fit. Users should verify platform terms, eligibility, tax obligations, and payout onboarding before starting work.
