# AI Learning Log — Jekyll version

A Jekyll port of my AI learning log. Same look as the static version, but each
learning is authored as a **Markdown file** and GitHub Pages builds the HTML
server-side on every push.

## Add a learning

Create a file in `_posts/` named `YYYY-MM-DD-some-title.md`:

```markdown
---
layout: post
title: "Short, punchy title"
tags: [llm, rag]
---

What I learned, in **Markdown**. Code blocks, lists, links — all supported.

```python
print("even fenced code blocks just work")
```
```

Commit and push — GitHub Pages rebuilds the site in about a minute.

## How it differs from the static version

| | Static (JSON) | Jekyll |
|---|---|---|
| Author a learning | Edit `entries.json` | Add a Markdown file in `_posts/` |
| Rendering | Browser fetches JSON via JS | Pre-rendered HTML at build time |
| Per-entry permalink | No | Yes (`/learnings/<title>/`) |
| RSS feed | No | Yes (`/feed.xml` via jekyll-feed) |
| Local preview | Open the file | `bundle exec jekyll serve` (needs Ruby) |

## Structure

| Path | Purpose |
|------|---------|
| `_config.yml` | Site settings (title, baseurl, plugins) |
| `_layouts/default.html` | Shared shell: masthead, search, tag bar, footer |
| `_layouts/post.html` | Single-learning permalink page |
| `index.html` | Home — loops posts into the timeline + stats |
| `_posts/*.md` | **Your content** — one Markdown file per learning |
| `assets/style.css` | Styling (light + dark) |
| `assets/app.js` | Theme toggle, search, tag filtering |
| `Gemfile` | Gem set matching GitHub Pages (for local dev) |

## Local preview (optional)

Requires Ruby + Bundler:

```bash
bundle install
bundle exec jekyll serve
# http://localhost:4000/ai-learning-log/
```
