# BountyProof

Find coding work that is actually worth doing.

BountyProof is a deterministic opportunity-intelligence API for developers and agents. It verifies a GitHub issue, extracts payment evidence only from trusted sources, measures visible competition and existing solutions, detects stale or suspicious listings, and ranks the opportunity by expected value.

The first public version is a free A2MCP-compatible HTTPS endpoint built for the OKX.AI Genesis hackathon. A paid x402 endpoint is planned after the free review path is live.

`GET /api/scan` returns self-describing metadata, `GET /api/openapi` returns the OpenAPI 3.1 contract, and an empty `POST /api/scan` performs a minimal discovery so automated marketplace checks receive HTTP 200.

## API

### Verify one issue

```bash
curl -sS -X POST https://YOUR_DOMAIN/api/scan \
  -H 'content-type: application/json' \
  -d '{
    "action": "verify",
    "issueUrl": "https://github.com/Expensify/App/issues/95742",
    "languages": ["TypeScript", "Python", "MCP"]
  }'
```

### Discover opportunities

```bash
curl -sS -X POST https://YOUR_DOMAIN/api/scan \
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
