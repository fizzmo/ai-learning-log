---
layout: post
title: "Temperature isn't the only knob"
tags: [llm, prompting]
---

Beyond `temperature`, `top_p` (nucleus sampling) often gives more predictable
control over output diversity. Rule of thumb I'm adopting: tune *one* of them,
not both.

- **Factual tasks** → low temperature
- **Brainstorming** → raise it
