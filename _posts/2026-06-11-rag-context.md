---
layout: post
title: "RAG works best when chunks have context"
tags: [rag, embeddings]
---

Learned that naive fixed-size chunking hurts retrieval quality. Adding a short
summary or the document title to each chunk ("contextual retrieval") noticeably
improved how often the right passage came back.

Embeddings care about *meaning*, so giving each chunk a bit of surrounding
context goes a long way. A quick example of the idea:

```python
chunk = f"{doc_title}\n\n{raw_chunk}"   # prepend context before embedding
vector = embed(chunk)
```
