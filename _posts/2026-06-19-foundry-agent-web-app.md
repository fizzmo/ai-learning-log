---
layout: post
title: "Shipping a Foundry agent to the web: SQL via MCP, and three bugs that taught me how agents really work"
tags: [foundry, mcp, azure-container-apps, sql, agents, managed-identity]
---

I had a Foundry agent working in the playground and a SQL MCP server feeding it
AdventureWorks data. The next step was the obvious one: **get it running as a real
web app** so I could hand someone a URL instead of a Python script. What started as
a deployment exercise turned into a great tour of how agents, tools, and auth
actually behave once they leave the playground. Here's the build and the three bugs
that taught me the most.

<figure>
  <img src="{{ '/assets/images/foundry-sales-agent.png' | relative_url }}"
       alt="Architecture: a browser talks to a FastAPI web app on Azure Container Apps, which calls an Azure AI Foundry agent (gpt-5.4) via the responses API; the agent calls a Data API Builder SQL MCP server that queries AdventureWorksDW. The web app authenticates to Foundry with a managed identity, and pulls its image from Azure Container Registry." />
  <figcaption>The final shape: thin web app → Foundry agent → SQL MCP server → AdventureWorksDW. The app authenticates with a managed identity (no keys); the agent runs the tool loop server-side.</figcaption>
</figure>

## What I built

A small **FastAPI** chat app on **Azure Container Apps**:

- `GET /` serves a chat UI, `POST /api/ask` forwards the question to the agent.
- Auth is a **user-assigned managed identity** with `Cognitive Services OpenAI User`
  and `Azure AI Developer` on the Foundry account — so `DefaultAzureCredential` works
  the same locally (`az login`) and in the cloud, **no API keys anywhere**.
- The image builds **remotely on ACR** (`remoteBuild: true`), which is handy because
  the build box had no Docker.
- Everything is `azd` + Bicep, deployed with the
  prepare → validate → deploy flow.

The important design decision came during a refactor. My first version had the app
*route* sales questions itself — a hardcoded `SUM(SalesAmount)` in Python. That's why
"break down sales by product" only ever returned one number: the agent never saw the
question. The fix was to delete all that and make the app a **thin client** — forward
*everything* to the agent and let it own its tools. The moment I did, product
breakdowns just worked, because the agent already knew how to `GROUP BY`. **Lesson zero:
if you've attached a capable tool to your agent, don't second-guess it in app code.**

## Bug 1: one broken tool takes down the whole agent

After deploying, every tool question threw a generic HTTP 500. Even "hello" started
failing. The container logs had the real story:

```
Error code: 400 - tool_user_error: "Access denied when connecting to the MCP server
at https://api.fabric.microsoft.com/.../m365 while enumerating tools (HTTP 403 Forbidden)."
```

I'd attached a **second** MCP server (a Fabric one) to the agent. The key insight:
**a Foundry agent enumerates *all* of its attached MCP tools before it answers
anything.** If one of them fails that enumeration, the entire turn dies — even a plain
chat message that would never have called a tool. My working AdventureWorks server was
fine; one unhealthy neighbor poisoned everything.

## Bug 2: that Fabric tool needed a *user*, and my app didn't have one

Why 403? The Fabric MCP connection used **OAuth Identity Passthrough** — it expects a
*signed-in user's* token to pass through to Fabric/Power BI. My web app reaches the
agent through a **headless managed identity**. There's no user in the loop, so there's
no token to pass through.

I went down the rabbit hole of "can I just give it a client ID and secret?" The answer
is no, and it's worth understanding why: the connection's "Custom" OAuth option still
shows an **Auth URL + Refresh URL** — that's the *authorization-code* flow, which still
requires a user to sign in. It is **not** a client-credentials (app-only) grant. A
service principal's secret doesn't satisfy identity *passthrough*; passthrough is
delegated by definition.

| Tool's auth model | Works with a headless app? |
|---|---|
| Anonymous / no auth (my DAB SQL server) | ✅ yes |
| OAuth identity passthrough (the Fabric server) | ❌ no — needs a signed-in user |

So the takeaway: to use an identity-passthrough tool from a *deployed* app, the app
itself has to authenticate the end user (Entra sign-in) and flow that token through.
For now I removed the Fabric tool and the agent went green instantly.

## Bug 3: the "random" 500s were really 429s

Green — but bursty. Hammering the endpoint gave me ~5 successes then 3 failures, all
generic `server_error`. The logs unmasked it:

```
Error code: 429 - rate_limit_exceeded: "Model deployment rate limit exceeded."
```

Not random at all — my reasoning model (gpt-5.4) burns a lot of tokens, and each agent
question is several internal round-trips (decide → call tool → read result → compose).
A burst of clicks blew past the deployment's tokens-per-minute quota, and Foundry
sometimes surfaced the throttle as a 500.

Two fixes, and you want both:

1. **App-side resilience.** Retry transient `5xx` / `429` / timeouts with exponential
   backoff (1.5s → 3s → 6s), and return a clean `503` "try again" instead of a bare 500
   when exhausted. This took the hammer test from ~63% to **10/10**.
2. **More quota.** I checked the deployment capacity (`az cognitiveservices account
   deployment list`) and the regional limit (`az cognitiveservices usage list`). I had
   150 TPM units allocated against a 1,000-unit regional ceiling — tons of headroom — so
   I bumped the deployment to 400. No app redeploy needed.

Retry logic smooths transient blips; quota stops them happening. Belt and suspenders.

## Takeaways

- **Forward to the agent; don't pre-route in app code.** A capable tool can do more
  than your hardcoded shortcut — let it.
- **An agent enumerates every attached MCP tool before answering.** One broken tool
  fails *all* turns, including plain chat. Attach tools deliberately.
- **Identity passthrough means a signed-in user.** A managed identity or an
  SP client-secret can't stand in for it — that's a delegated, user-in-the-loop flow.
- **"Intermittent server errors" are often rate limits in disguise.** Read the logs,
  add retry/backoff, and check your TPM quota before blaming the service.
- **Pin the agent version** in an env var. Editing instructions in the playground
  creates a new version; promote it to the app with a one-line `az containerapp update
  --set-env-vars AGENT_VERSION=N` — no rebuild.
