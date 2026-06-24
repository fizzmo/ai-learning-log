---
layout: post
title: "Calling a Fabric IQ ontology from a Foundry agent over MCP"
tags: [fabric, fabric-iq, ontology, mcp, foundry, azure-container-apps, entra]
---

Microsoft Fabric IQ introduces an **ontology** item: a data-bound knowledge model that sits
over Lakehouse tables and answers questions in business terms rather than raw schema. Fabric
exposes each ontology through an **MCP server**, which means any MCP-aware model can query it as
a tool. This post walks through a proof of concept that connects a Fabric IQ ontology to an
**Azure AI Foundry** model and serves the result as a signed-in web app on **Azure Container
Apps**.

<figure>
  <img src="{{ '/assets/images/ontology-agent-architecture.png' | relative_url }}"
       alt="Architecture diagram. A browser user signs in and asks a question against a FastAPI app on Azure Container Apps. The app calls the Azure AI Foundry Responses API with gpt-5.4, authenticating with its system-assigned managed identity. The model invokes the Fabric Ontology MCP server as a tool, using the user's delegated Fabric token. The ontology, AdventureWorksOntology, is bound to a Lakehouse built from a Power BI semantic model. Container Apps Easy Auth stores the user's Fabric-scoped token in an Azure Blob token store." />
  <figcaption>The signed-in user's delegated identity flows all the way to the ontology. The model is orchestrated through the Responses API, and the Fabric Ontology MCP server runs the natural-language translation.</figcaption>
</figure>

## The scenario

The ontology models the classic **AdventureWorksDW** star schema — Internet and reseller sales,
products, customers, territories, and dates. The goal is to let a person ask a plain-language
question, such as *"What were total Internet sales?"*, and have a Foundry model answer it by
querying the ontology, with every query running under that person's own identity.

## How the pieces fit

The solution has four stages:

1. **Ontology and Lakehouse.** A Power BI semantic model is extracted to a Fabric **Lakehouse**,
   and an **Ontology** item binds each entity type to a Delta table with mapped relationships.
   Integer keys are preserved as `BigInt` so they remain valid entity keys and join columns.

2. **Ontology MCP server.** Fabric publishes the ontology at a dataplane MCP endpoint:

   ```
   https://api.fabric.microsoft.com/v1/mcp/dataPlane/workspaces/<workspaceId>/items/<ontologyId>/ontologyEndpoint
   ```

   It offers two tools: `list_ontology_entity_types` for metadata, and `search_ontology` for
   natural-language questions over the bound data ("NL2Ontology").

3. **Foundry orchestration.** A **gpt-5.4** deployment runs the tool loop. Rather than the
   Foundry visual playground — which is currently unreliable with MCP tools — the app calls the
   **Responses API** directly and attaches the ontology as an MCP tool:

   ```json
   {
     "type": "mcp",
     "server_label": "fabric_ontology",
     "server_url": "<ontologyEndpoint>",
     "require_approval": "never",
     "headers": { "Authorization": "Bearer <user Fabric token>" }
   }
   ```

4. **Web app and sign-in.** A small **FastAPI** app on **Azure Container Apps** serves a chat UI.
   Container Apps **Easy Auth** requires an Entra sign-in and requests the Fabric scope, then
   forwards the user's token to the app.

## The constraint that shaped the design

The `search_ontology` tool requires a **delegated user identity**. A managed identity or service
principal can call `list_ontology_entity_types`, but NL2Ontology translation fails for non-user
identities — the same "no service principal" rule that governs Fabric data agents.

That single fact drives the authentication model. The app cannot simply use its managed identity
to reach the ontology. Instead, Container Apps Easy Auth signs each user in, requests a token
scoped to `https://api.fabric.microsoft.com/user_impersonation`, and stores it in an Azure Blob
token store. The platform surfaces that token to the container in the
`X-MS-TOKEN-AAD-ACCESS-TOKEN` header, and the app uses it as the bearer token on the MCP call.
The model deployment, by contrast, is reached with the app's **system-assigned managed identity**
(`Cognitive Services OpenAI User`). Two identities, two purposes: the managed identity talks to
the model, and the user's delegated token talks to the ontology.

## Gotchas worth recording

Several steps were less obvious than the documentation implied:

- **The Easy Auth callback returned 401** until an OAuth2 grant existed. Admin consent did not
  create it on its own; an explicit `az ad app permission grant` did.
- **The token store needs a user-assigned identity.** A system-assigned identity returned HTTP
  500 for the blob token store.
- **`AZURE_CLIENT_ID` must be unset** when relying on a system-assigned managed identity. Setting
  it to the system app ID breaks `DefaultAzureCredential`.
- **The login scope must be set explicitly** to include the Fabric `user_impersonation`
  permission, through the authConfig management API, so the issued token is Fabric-scoped.
- **One focused question per turn.** The NL2Ontology translator rejects multi-part questions, so
  "Internet *and* reseller in one query" has to become two queries.

## The result

After sign-in, asking *"What were total Internet sales?"* returns **$29,358,677.22** — the model
calls `search_ontology` under the user's identity, the ontology resolves the business question to
its bound Lakehouse data, and the answer comes back through the web UI. The end-to-end design
keeps governance intact: the ontology only ever sees the identity of the person actually asking.

The full source, including the FastAPI app, Dockerfile, and a step-by-step deployment guide, is
on GitHub: [notesbyjosh/adventureworks-ontology-agent](https://github.com/notesbyjosh/adventureworks-ontology-agent).
