---
layout: post
title: "From SQL Server 2025 change events to a live shipping page with Foundry"
tags: [sql-server-2025, change-event-streaming, event-hubs, schema-registry, foundry, azure-container-apps]
---
SQL Server 2025 introduces **Change Event Streaming (CES)**: the database engine
publishes row-level changes directly to Azure Event Hubs in near real time. There is
no external poller and no change-tracking reader process to operate. The push happens
inside the engine, which is why the pattern is often described as "IOLess." This post
walks through a proof of concept that takes order changes from a local SQL Server 2025
instance all the way to an AI-generated shipping recommendation on a live web page.

<figure>
  <img src="{{ '/assets/images/contoso-ces-architecture.png' | relative_url }}"
       alt="Architecture diagram. On the laptop, an Orders Application writes to SQL Server 2025 (dbo.Orders). CES pushes change events outbound over port 443 to an Azure Event Hub (order-changes). A local consumer reads the events over WebSocket, validates them against an Avro schema in the Event Hubs Schema Registry, calls a gpt-5.4 deployment in Azure AI Foundry for a revised ship date, and POSTs the result outbound to a FastAPI page on Azure Container Apps that customers view." />
  <figcaption>Order changes flow from SQL Server 2025 to Event Hubs, get schema-validated, are enriched by a Foundry model, and surface on a hosted page. Every hop is outbound.</figcaption>
</figure>

## The scenario

Contoso ships physical orders. When an order's estimated ship date drifts too far
out, customers grow unhappy. The goal is to detect each order change the moment it
lands in the database, ask an AI model whether the ship date can be improved, and
surface a customer-friendly update — without rearchitecting the orders application.

## How the pieces fit

The flow has four stages:

1. **Change Event Streaming.** CES is enabled on the `ContosoSales` database and the
   `dbo.Orders` table is added to a stream group that targets an Event Hub. Every
   `INSERT`, `UPDATE`, and `DELETE` is emitted as a CloudEvent. On SQL Server 2025,
   CES is in preview and requires the `PREVIEW_FEATURES` database-scoped configuration.

2. **Event Hubs and Schema Registry.** The Event Hubs namespace runs on the Standard
   tier so it can host a **Schema Registry**. The order-change contract is registered
   as an Avro schema, giving the consumer a versioned contract to validate against and
   a path for safe schema evolution.

3. **Foundry recommendation.** A consumer parses each CloudEvent, validates the record
   against the registered schema, and calls a **gpt-5.4** deployment in Azure AI
   Foundry. The model returns a revised ship date and a one-sentence customer message
   as structured JSON.

4. **A hosted page.** The recommendation is posted to a small FastAPI application on
   Azure Container Apps, which renders a live, auto-refreshing list of shipping updates.

## The architectural detail that matters most

A local database cannot be reached from Azure. There is no inbound path into a laptop,
so an Azure-hosted function cannot write a result back to a local SQL Server. The POC
resolves this by keeping **every hop outbound**:

- CES pushes *out* from the laptop to Event Hubs over port 443.
- The consumer runs *on the laptop*, reads from Event Hubs, and calls Foundry — both
  outbound calls.
- The consumer then POSTs the recommendation *out* to the hosted page.

Azure never initiates a connection back to the laptop. When the source database moves
to **Azure SQL Database** — which also supports CES — the same design runs entirely in
the cloud and an Event Hubs-triggered Azure Function can close the loop directly.

## Two governance gotchas

The environment enforced a policy that disables local (SAS key) authentication on both
Event Hubs and the Foundry account. That produced two failures worth noting:

- **CES could not authenticate to Event Hubs.** A standalone SQL Server instance can
  only use a SAS token for CES; Microsoft Entra authentication for CES requires an
  Arc-enabled or Azure VM instance. The fix was a resource-group–scoped **policy
  exemption** that re-allows SAS on the namespace.
- **Foundry rejected API keys.** Because Foundry is a cloud resource, the cleaner fix
  applied: **Microsoft Entra authentication** with a token credential, which is the
  recommended production pattern regardless.

## Result

A change to a local SQL Server 2025 table now appears, within seconds, as a
schema-validated, AI-enriched shipping update on a hosted page — for example, an
estimated ship date pulled in from September to July with a ready-to-send customer
message. The full source, infrastructure scripts, and run instructions are available
at [github.com/notesbyjosh/contoso-ces-poc](https://github.com/notesbyjosh/contoso-ces-poc).

> Change Event Streaming is in public preview on SQL Server 2025. Validate the current
> status on Microsoft Learn before relying on it in production.
