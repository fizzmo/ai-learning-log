---
layout: post
title: "Studying for AI-103: Developing AI Apps and Agents on Azure"
tags: [ai, azure, certification, ai-103, foundry, agents, rag]
---

I'm starting prep for **Exam AI-103: Developing AI Apps and Agents on Azure** — the
certification for the *Azure AI Apps and Agents Developer Associate*. It's a developer
exam (Python-first) centered on **Microsoft Foundry**: building generative apps, RAG
pipelines, and agents, then planning, securing, and operationalizing them. This post
is my study plan, the full objective breakdown, a vocabulary list, and the resources
I'm using — partly so I have it to share, partly because writing it out is how I learn.

## Exam at a glance

| Item | Detail |
| --- | --- |
| Certification | Azure AI Apps and Agents Developer Associate |
| Passing score | **700 / 1000** |
| Primary language | Python |
| Core platform | Microsoft Foundry (models, agents, tools, projects) |
| Scope | Mostly GA features; commonly used Preview features may appear |
| Skills version | As of April 16, 2026 |

## Skills measured &amp; weighting

| Domain | Weight |
| --- | --- |
| 1. Plan and manage an Azure AI solution | 25–30% |
| 2. Implement generative AI and agentic solutions | 30–35% |
| 3. Implement computer vision solutions | 10–15% |
| 4. Implement text analysis solutions | 10–15% |
| 5. Implement information extraction solutions | 10–15% |

Domains 1 and 2 together are ~55–65% of the exam, so that's where most of my time goes.

## Domain 1 — Plan &amp; manage (25–30%)

- **Choose Foundry services:** match LLMs / small language models / multimodal models /
  Foundry Tools to the task; pick services for generation, grounding, vector search,
  agent workflows, and multimodal processing; choose a retrieval/indexing method; choose
  memory, tool, and knowledge integration for agents.
- **Set up in Foundry:** design Azure infrastructure; choose deployment options; configure
  model and agent deployments; integrate Foundry projects with CI/CD pipelines.
- **Manage, monitor, secure:** quotas, scaling, rate limits, and cost; monitor performance,
  drift, safety events, and grounding quality; watch ingestion quality and index health;
  secure with managed identity, private networking, keyless credentials, and RBAC.
- **Responsible AI:** safety filters, guardrails, and content moderation; evaluators and
  safety evaluations; auditing via trace logging and provenance metadata; govern agents
  with oversight modes and tool-access controls.

## Domain 2 — Generative &amp; agentic (30–35%)

- **Build generative apps:** deploy and consume LLM / small / code / multimodal models;
  implement **RAG**; design tool-augmented, multistep reasoning flows; evaluate for
  fabrications, relevance, quality, and safety; use Foundry SDKs and connectors; connect
  an app to a Foundry project.
- **Build agents:** define roles, goals, conversation tracking, and tool schemas; integrate
  retrieval + function-calling + memory; wire in tools (APIs, knowledge stores, search,
  Content Understanding, custom functions); orchestrate multi-agent solutions; build
  autonomous / semi-autonomous flows with approval controls; monitor and error-analyze
  deployed agents.
- **Optimize &amp; operationalize:** prompt engineering and parameter tuning; reflection,
  chain-of-thought, and self-critique loops; observability (tracing, token analytics,
  safety signals, latency); orchestrate multiple models or hybrid LLM + rules engines.

## Domain 3 — Computer vision (10–15%)

- **Image/video generation:** generate from text prompts and reference media; image editing
  (inpainting, mask-based, prompt-driven); edit generated videos; apply platform controls.
- **Multimodal understanding:** analyze visual context; concise/detailed captions; visual
  question-answering; accessibility alt-text; Content Understanding for visual
  characteristics; video analysis; single-task and pro-mode pipelines; object/region
  detection.
- **Responsible AI for multimodal:** classify unsafe visual content; detect indirect prompt
  injection from text embedded in images; enforce visual policy (watermarks, prohibited
  symbols, brand usage).

## Domain 4 — Text analysis (10–15%)

- **Language model text analysis:** extract entities, topics, summaries, and structured JSON;
  detect sentiment, tone, safety, and PII; translate via Azure Translator or LLM flows;
  customize outputs for domain tasks like compliance summarization.
- **Speech:** speech-to-text and text-to-speech for agents; speech as an agent modality
  with custom speech models; multimodal reasoning from audio; speech translation.

## Domain 5 — Information extraction (10–15%)

- **Retrieval &amp; grounding pipelines:** ingest and index documents, images, audio, and
  video; semantic, hybrid, and vector search; enrichment with built-in/custom skills;
  RAG ingestion with OCR; connect pipelines to agent tools.
- **Extract from documents:** multimodal pipelines combining OCR, layout analysis, and field
  extraction; clean, grounded representations via Content Understanding; analyzers that
  emit structured or markdown output for downstream reasoning.

## My 6-week plan

| Week | Focus |
| --- | --- |
| 1 | Foundations + Domain 1: model selection, deployments, quotas, security |
| 2 | Domain 2a: RAG, embeddings, vector/hybrid search, evaluators |
| 3 | Domain 2b: agents, tools, memory, multi-agent, human-in-the-loop |
| 4 | Domains 3 &amp; 4: vision gen/edit, Content Understanding, speech, text analysis |
| 5 | Domain 5: Document Intelligence, AI Search skillsets, OCR-to-index RAG |
| 6 | Responsible AI + review + free practice assessment |

## Vocabulary I want cold

- **RAG** — Retrieval-Augmented Generation: retrieve relevant content, ground the model on
  it, then generate. The single most important pattern on this exam.
- **Grounding** — anchoring output to authoritative source evidence.
- **Hallucination / fabrication** — fluent output not supported by the sources.
- **Embedding** — numeric vector capturing semantic meaning, used for similarity search.
- **Vector / hybrid / semantic search** — similarity search / keyword + vector combined /
  language-model re-ranking of results.
- **Chunking** — splitting documents into passages before embedding and indexing.
- **Token / context window** — unit of text the model processes / max tokens per request.
- **Temperature / top-p** — sampling controls for randomness.
- **Agent** — goal-driven app that calls tools and tracks conversation state.
- **Tool / function calling &amp; tool schema** — model invoking defined functions via a JSON
  parameter contract.
- **Conversation memory / thread** — persisted history giving an agent continuity.
- **Multi-agent orchestration** — coordinating specialized agents (handoff/connected).
- **Human-in-the-loop (HITL)** — requiring human approval before a sensitive action.
- **Evaluator / groundedness / drift** — automated quality metrics / support-by-source /
  performance decay over time.
- **Azure AI Content Safety** — detects harm across hate, sexual, violence, self-harm with
  severity levels.
- **Prompt injection (direct/indirect)** — malicious instructions in user input or in
  retrieved data/images that hijack model behavior.
- **Managed identity / keyless auth / RBAC / private endpoint** — the core security stack:
  Entra-based, credential-free service auth; least-privilege roles; private networking.
- **OCR / layout analysis / Document Intelligence** — text extraction / structure detection
  / prebuilt + custom field extraction.
- **Content Understanding / analyzer / pro mode** — Foundry Tools capability extracting
  structured insights from documents, images, audio, and video.
- **Inpainting** — regenerating a masked region of an image from a prompt.
- **STT / TTS / custom speech** — speech-to-text / text-to-speech / domain-adapted models.

## Resources

- [AI-103 exam page &amp; free practice assessment](https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-103/)
- [AI-103 study guide (objective source)](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103)
- [Certification overview](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/)
- [Exam sandbox — try the UI](https://aka.ms/examdemo)
- Product docs: [Azure OpenAI / Foundry](https://learn.microsoft.com/en-us/azure/ai-services/openai/),
  [AI Search](https://learn.microsoft.com/en-us/azure/search/),
  [Document Intelligence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/),
  [AI Vision](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/),
  [AI Language](https://learn.microsoft.com/en-us/azure/ai-services/language-service/),
  [AI Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/),
  [Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/)

The best part: I can practice most of this in my own Azure tenant. Building a RAG app over
my own documents, standing up a Foundry agent with a custom function tool and a
human-in-the-loop approval step, and running the built-in evaluators is going to teach me
more than any amount of reading. More posts to come as I work through each domain.
