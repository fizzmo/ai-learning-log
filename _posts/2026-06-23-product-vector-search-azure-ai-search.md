---
layout: post
title: "Adding product vector search to a Foundry agent with Azure AI Search"
tags: [azure-ai-search, vector-search, embeddings, foundry, rag, semantic-search, managed-identity, security]
---

Azure AI Search adds semantic, natural-language product discovery to an Azure AI Foundry agent that already answers sales questions over AdventureWorksDW. Vector search lets the agent match products by meaning — for example, "something to protect my head while biking" returns helmets — rather than by keyword.

<figure>
  <img src="{{ '/assets/images/azure-ai-search-vector-search.png' | relative_url }}"
       alt="Azure AI Search vector search architecture: a SQL view is indexed and embedded into a vector index at index time, then queried by a Foundry IQ knowledge base at query time, with managed-identity RBAC throughout." />
  <figcaption>Vector search architecture: index-time embedding of a SQL view, and query-time agentic retrieval through a Foundry IQ knowledge base. All connections use Microsoft Entra ID and managed identities.</figcaption>
</figure>

## Why vector search

Keyword search matches literal terms: a query only returns documents that contain the same words. It fails when the user's vocabulary differs from the indexed text, even when the intent is clear.

Vector search embeds text into numeric vectors so that semantically similar items sit close together in vector space. Items can match with no shared keywords, because proximity reflects meaning rather than surface form. Hybrid search combines keyword and vector retrieval to capture both exact-term and semantic matches. A semantic reranker then reorders the combined results by relevance to the query.

## Data source: a denormalized SQL view

The data source is a SQL view, `dbo.vProducts`, that joins `DimProduct`, `DimProductSubcategory`, and `DimProductCategory` and filters to sellable finished goods (`FinishedGoodsFlag = 1`). The view exposes `ProductKey`, `ProductName`, `ProductDescription`, `Subcategory`, `Category`, and a concatenated `EmbedText` column used to generate embeddings. The result set is 397 products.

A denormalized view gives the indexer a single, clean table to read instead of resolving joins and filters at index time. This is the same pattern used for the sales view that backs the agent's SQL tool.

## Azure AI Search components

The pipeline is built from distinct resources, each of which must be created explicitly:

- **Index (`products-index`):** the schema and the searchable store. Fields include `ProductKey` (key), text fields (`ProductName`, `ProductDescription`, `Category`, `Subcategory`), and `contentVector`, a 1536-dimension `Collection(Edm.Single)` vector field. The index defines a vector search profile (HNSW algorithm) and a semantic configuration (`sem1`).
- **Data source (`ds-products`):** the connection to Azure SQL, using a managed-identity (`ResourceId`) connection string — no password.
- **Skillset (`ss-products`):** contains an `AzureOpenAIEmbeddingSkill` that calls `text-embedding-ada-002` to generate an embedding for each row's `EmbedText` at index time and writes it to `contentVector`.
- **Indexer (`ixr-products`):** orchestrates the pipeline — it reads the data source, runs the skillset, and maps fields into the index. It can be run on demand or on a schedule.
- **Vectorizer:** configured on the index so that at query time the user's text is embedded with the same ada-002 model automatically, without the caller computing vectors.

The skillset is the component that produces the embeddings. An indexer created without a skillset populates only the text fields and leaves `contentVector` empty, so vector search returns nothing.

## Embedding model

The same model, `text-embedding-ada-002` (deployed in Azure AI Foundry), is used in two places: the skillset at index time and the vectorizer at query time. Using the same model for both is required so that indexed vectors and query vectors are comparable.

## Connecting to Foundry as a knowledge source

In Microsoft Foundry (new), the Azure AI Search index is added to the agent as a knowledge source through a Foundry IQ knowledge base. The agent calls the knowledge base, which performs agentic retrieval: it can decompose a query into subqueries, run hybrid and vector search, and semantically rerank the results before returning grounded results with citations.

The agent decides when to use product search versus the SQL sales tool based on its instructions.

## Security: managed identities and RBAC

The solution uses Microsoft Entra ID and managed identities throughout. Local API-key authentication is disabled on the search service, and the SQL server uses Entra-only authentication. No passwords or keys are stored. The required role assignments are:

- **The search service managed identity** needs `db_datareader` in the database and `Reader` on the SQL server, so the indexer can read the view through a managed-identity connection.
- **The search service managed identity** needs `Cognitive Services OpenAI User` on the Foundry account, so the embedding skill and the query-time vectorizer can call the embedding model.
- **The Foundry PROJECT managed identity** needs `Search Index Data Reader` and `Search Service Contributor` on the search service. Microsoft Foundry uses a separate project-scoped managed identity to query a Foundry IQ knowledge base; this is different from the Foundry account identity. Granting the roles only to the account identity results in HTTP 403 Forbidden when the agent enumerates the knowledge base. Granting them to the project identity resolves it.
- **The web app's managed identity** needs `Cognitive Services OpenAI User` and `Azure AI Developer` on the Foundry account to invoke the agent.

## Validating the index

Confirm the pipeline in two steps. First, check the indexer run: it should report documents processed with zero failures. Second, issue a vector query and confirm semantically relevant results.

The following queries return correct matches with no keyword overlap:

- "protect my head" returns the Sport-100 Helmet.
- "I need a water bottle" returns the Water Bottle product.
- "warm layer for cold weather cycling" returns jerseys and tights.

## Summary

A SQL view is embedded into an Azure AI Search vector index via a skillset and indexer. A vectorizer enables natural-language queries by embedding the caller's text at query time with the same model. The index is exposed to a Foundry agent as a knowledge base for agentic retrieval. Managed-identity RBAC — including the project-identity role assignment required for knowledge base access — secures every connection.
