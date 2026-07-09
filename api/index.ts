import { randomBytes } from "node:crypto";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export const PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BountyProof — Verify before you code</title>
  <meta name="description" content="Evidence-based scoring for paid GitHub coding opportunities.">
  <meta property="og:title" content="BountyProof — Verify before you code">
  <meta property="og:description" content="Check payment evidence, competition, repository health and expected value before spending engineering time.">
  <meta name="theme-color" content="#07110d">
  <style nonce="__NONCE__">
    :root { color-scheme: dark; --bg:#07110d; --panel:#0c1913; --line:#1f3c2e; --text:#edf8f1; --muted:#91aa9a; --lime:#9df7a9; --gold:#ffd978; --red:#ff8e8e; }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; background:radial-gradient(circle at 15% 0%,#173925 0,transparent 36rem),var(--bg); color:var(--text); font:16px/1.55 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
    a { color:var(--lime); }
    main { width:min(1080px,calc(100% - 32px)); margin:auto; padding:48px 0 64px; }
    nav { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:72px; }
    .brand { color:var(--lime); font-weight:800; letter-spacing:.04em; text-decoration:none; }
    .eyebrow { color:var(--lime); font-size:.78rem; letter-spacing:.16em; text-transform:uppercase; }
    h1 { max-width:860px; margin:.5rem 0 1rem; font:800 clamp(2.4rem,7vw,5.7rem)/.96 ui-sans-serif,system-ui,sans-serif; letter-spacing:-.065em; }
    .lead { max-width:700px; color:var(--muted); font-size:clamp(1rem,2vw,1.25rem); }
    .proof { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:34px 0 56px; }
    .proof div { border-left:2px solid var(--line); padding:4px 14px; }
    .proof strong { display:block; color:var(--gold); font-size:1.15rem; }
    .proof span { color:var(--muted); font-size:.8rem; }
    .tool { border:1px solid var(--line); background:color-mix(in srgb,var(--panel) 92%,transparent); border-radius:18px; padding:clamp(18px,4vw,36px); box-shadow:0 24px 80px #0007; }
    .tool h2 { margin:0 0 8px; font:700 1.35rem ui-sans-serif,system-ui,sans-serif; }
    .tool p { margin:0 0 22px; color:var(--muted); }
    form { display:grid; grid-template-columns:1fr auto; gap:10px; }
    .fields { display:grid; gap:10px; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    input,button { min-height:52px; border-radius:10px; font:inherit; }
    input { width:100%; border:1px solid var(--line); background:#06100b; color:var(--text); padding:0 16px; outline:none; }
    input:focus { border-color:var(--lime); box-shadow:0 0 0 3px #9df7a922; }
    button { border:0; background:var(--lime); color:#07110d; padding:0 22px; font-weight:900; cursor:pointer; }
    button:hover { filter:brightness(1.08); }
    button:disabled { cursor:wait; opacity:.65; }
    #status { min-height:26px; margin:14px 0 0; color:var(--muted); }
    #result[hidden] { display:none; }
    #result { margin-top:22px; border-top:1px solid var(--line); padding-top:24px; }
    .scoreline { display:flex; align-items:end; justify-content:space-between; gap:20px; }
    .score { color:var(--lime); font:800 4rem/.9 ui-sans-serif,system-ui,sans-serif; letter-spacing:-.07em; }
    .recommendation { padding:7px 11px; border:1px solid currentColor; border-radius:999px; font-weight:800; text-transform:uppercase; }
    .recommendation.skip { color:var(--red); } .recommendation.inspect { color:var(--gold); } .recommendation.pursue { color:var(--lime); }
    .result-title { margin:22px 0 16px; font:700 1.2rem ui-sans-serif,system-ui,sans-serif; }
    .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    .metric { min-width:0; padding:14px; background:#06100b; border:1px solid var(--line); border-radius:10px; }
    .metric span { display:block; color:var(--muted); font-size:.72rem; text-transform:uppercase; }
    .metric strong { display:block; margin-top:3px; overflow-wrap:anywhere; }
    .flags { display:flex; flex-wrap:wrap; gap:7px; margin:16px 0; }
    .flag { padding:5px 8px; border-radius:7px; background:#351d1d; color:#ffb1b1; font-size:.78rem; }
    .cta { display:inline-flex; margin-top:8px; padding:10px 13px; border:1px solid var(--line); border-radius:9px; text-decoration:none; font-weight:800; }
    .paid-audit { display:grid; grid-template-columns:1fr auto; align-items:center; gap:24px; margin-top:18px; padding:22px; border:1px solid #5f512b; border-radius:14px; background:linear-gradient(135deg,#211d0f,#0c1913 62%); }
    .paid-audit h3 { margin:3px 0 7px; font:800 1.15rem ui-sans-serif,system-ui,sans-serif; }
    .paid-audit p { margin:0; max-width:690px; }
    .paid-audit .delivery { margin-top:8px; color:var(--gold); font-size:.82rem; }
    .audit-action { display:grid; justify-items:end; gap:7px; min-width:210px; }
    .audit-price { color:var(--gold); font:800 1.25rem ui-sans-serif,system-ui,sans-serif; }
    .audit-cta { display:inline-flex; min-height:46px; align-items:center; justify-content:center; padding:0 16px; border-radius:9px; background:var(--gold); color:#171205; text-decoration:none; font-weight:900; text-align:center; }
    .audit-secondary { color:var(--lime); font-size:.78rem; font-weight:800; }
    .audit-note { color:var(--muted); font-size:.7rem; text-align:right; }
    ul { color:var(--muted); padding-left:20px; }
    footer { display:flex; justify-content:space-between; gap:20px; margin-top:40px; color:var(--muted); font-size:.8rem; }
    @media (max-width:720px) { nav { margin-bottom:48px; } .proof,.metrics { grid-template-columns:1fr 1fr; } form { grid-template-columns:1fr; } button { width:100%; } .paid-audit { grid-template-columns:1fr; } .audit-action { justify-items:start; min-width:0; } .audit-note { text-align:left; } }
    @media (max-width:440px) { .proof,.metrics { grid-template-columns:1fr; } footer { flex-direction:column; } }
  </style>
</head>
<body>
  <main>
    <nav><a class="brand" href="/">BOUNTYPROOF</a><a href="https://github.com/resolvicomai/bountyproof">Source ↗</a></nav>
    <section>
      <div class="eyebrow">Opportunity intelligence for developers and agents</div>
      <h1>Verify the payout before you write the code.</h1>
      <p class="lead">Bounty boards show the headline reward. BountyProof checks whether the repository is alive, payment has evidence, visible competitors are already working, and the expected value survives reality.</p>
      <div class="proof"><div><strong>Evidence first</strong><span>trusted payment sources</span></div><div><strong>Competition visible</strong><span>attempts, claims and linked PRs in the issue</span></div><div><strong>Value estimated</strong><span>probability × reward</span></div></div>
    </section>
    <section class="tool" aria-labelledby="verify-heading">
      <h2 id="verify-heading">Verify a GitHub issue</h2>
      <p>Paste a public issue URL. No GitHub login or payment information is required.</p>
      <form id="verify-form">
        <div class="fields">
          <label class="sr-only" for="issue-url">GitHub issue URL</label>
          <input id="issue-url" name="issueUrl" type="url" required autocomplete="url" placeholder="https://github.com/owner/repo/issues/123">
          <label class="sr-only" for="languages">Your preferred languages and stack</label>
          <input id="languages" name="languages" type="text" autocomplete="off" placeholder="Your stack, optional — e.g. Rust, Go, TypeScript">
        </div>
        <button id="submit" type="submit">Verify opportunity</button>
      </form>
      <div id="status" role="status" aria-live="polite"></div>
      <article id="result" hidden>
        <div class="scoreline"><div><span class="eyebrow">BountyProof score</span><div class="score" id="score"></div></div><div class="recommendation" id="recommendation"></div></div>
        <h3 class="result-title" id="result-title"></h3>
        <div class="metrics" id="metrics"></div>
        <div class="flags" id="flags"></div>
        <ul id="rationale"></ul>
        <a class="cta" id="issue-link" href="https://github.com/" target="_blank" rel="noopener noreferrer">Open issue on GitHub ↗</a>
      </article>
      <aside class="paid-audit" aria-labelledby="paid-audit-heading">
        <div>
          <div class="eyebrow">Need a decision you can act on?</div>
          <h3 id="paid-audit-heading">Get a reviewed bounty viability audit</h3>
          <p>Payment evidence, active competitors and pull requests, scope risk, stack fit, expected value, and a clear pursue / inspect / skip recommendation.</p>
          <p class="delivery">Concise evidence report delivered within 4 hours.</p>
        </div>
        <div class="audit-action">
          <div class="audit-price">10 USDC escrow</div>
          <a class="audit-cta" href="https://agentpact.xyz/offers/b556dd9c-3fdc-40d3-a642-1648bafc9a79" target="_blank" rel="noopener noreferrer">Buy with USDC escrow ↗</a>
          <a class="audit-secondary" id="audit-link" href="mailto:eu@resolvicomai.app?subject=BountyProof%20paid%20audit%20request">Ask before paying</a>
          <span class="audit-note">Escrow releases after delivery approval.</span>
        </div>
      </aside>
    </section>
    <footer><span>Deterministic scoring. No selection or payment guarantees.</span><span><a href="/api/openapi">OpenAPI</a> · <a href="/api/health">Status</a></span></footer>
  </main>
  <script nonce="__NONCE__">
    const form=document.querySelector('#verify-form'),input=document.querySelector('#issue-url'),languages=document.querySelector('#languages'),submit=document.querySelector('#submit'),status=document.querySelector('#status'),result=document.querySelector('#result'),auditLink=document.querySelector('#audit-link');
    const set=(id,value)=>{document.querySelector(id).textContent=String(value)};
    const metric=(label,value)=>{const box=document.createElement('div');box.className='metric';const l=document.createElement('span'),v=document.createElement('strong');l.textContent=label;v.textContent=value;box.append(l,v);return box};
    const updateAuditLink=()=>{const body='GitHub issue: '+(input.value||'[paste issue URL]')+'\nStack: '+(languages.value||'[optional]')+'\n\nPlease send the BountyProof audit details.';auditLink.href='mailto:eu@resolvicomai.app?subject='+encodeURIComponent('BountyProof paid audit request')+'&body='+encodeURIComponent(body)};
    input.addEventListener('input',updateAuditLink);languages.addEventListener('input',updateAuditLink);updateAuditLink();
    form.addEventListener('submit',async event=>{
      event.preventDefault(); submit.disabled=true; result.hidden=true; status.textContent='Checking payment evidence, competition and repository activity…';
      try {
        const preferred=languages.value.split(',').map(value=>value.trim()).filter(Boolean).slice(0,10);const request={action:'verify',issueUrl:input.value};if(preferred.length)request.languages=preferred;
        const response=await fetch('/api/scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)});
        const payload=await response.json(); if(!response.ok) throw new Error(payload.detail||payload.error||'Verification failed'); const item=payload.results[0]; if(!item) throw new Error('No opportunity evidence returned');
        set('#score',item.score.total); const rec=document.querySelector('#recommendation');rec.className='recommendation '+item.recommendation;rec.textContent=item.recommendation;
        set('#result-title',item.issue.title); const metrics=document.querySelector('#metrics');metrics.replaceChildren(metric('Reward',item.reward.amountUsd===null?'unverified':'$'+item.reward.amountUsd),metric('Expected value',item.score.expectedValueUsd===null?'n/a':'$'+item.score.expectedValueUsd),metric('Competitors',item.competition.uniqueCompetitors),metric('Repository',item.repository.stars.toLocaleString()+' stars'));
        const flags=document.querySelector('#flags');flags.replaceChildren(...item.flags.map(value=>{const el=document.createElement('span');el.className='flag';el.textContent=value;return el}));
        const rationale=document.querySelector('#rationale');rationale.replaceChildren(...item.rationale.map(value=>{const li=document.createElement('li');li.textContent=value;return li}));
        const issueLink=document.querySelector('#issue-link');issueLink.href=item.issue.url.startsWith('https://github.com/')?item.issue.url:'https://github.com/';
        const cacheState=response.headers.get('X-BountyProof-Cache');status.textContent=(cacheState==='STALE'?'GitHub is temporarily limited. Showing cached evidence from ':'Evidence checked at ')+new Date(payload.generatedAt).toLocaleString();result.hidden=false;
      } catch(error) { status.textContent=error instanceof Error?error.message:'Verification failed'; }
      finally { submit.disabled=false; }
    });
  </script>
</body>
</html>`;

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).send("Method not allowed");
  }
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=300");
  const nonce = randomBytes(18).toString("base64");
  response.setHeader("Content-Security-Policy", `default-src 'self'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  return response.status(200).send(PAGE.replaceAll("__NONCE__", nonce));
}
