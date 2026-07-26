---
name: codebase-memory
description: >
  Structural graph tools for live codebase navigation — trace call paths, detect change blast radius,
  find dead code, query architecture. Use before reading files. 120x fewer tokens than file exploration.
---

# Codebase Memory — Structural Graph

Zero-file-read structural analysis via [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp). Prefer these tools **before** broad file reads for structural questions.

Requires the `codebase-memory-mcp` binary / MCP server. Install:

```bash
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash
```

Project MCP wiring (Cursor): [`.cursor/mcp.json`](../../../.cursor/mcp.json).

## Quick Decision Matrix

| Question | Tool |
| --- | --- |
| What calls `foo()`? | `trace_path(function_name="foo", direction="inbound")` |
| What does `foo()` call? | `trace_path(function_name="foo", direction="outbound")` |
| Full call chain | `trace_path(direction="both", depth=3)` |
| Impact of my change | `detect_changes(base_branch="main")` |
| Architecture overview | `get_architecture` |
| Find by name/pattern | `search_graph(name_pattern="Auth.*")` |
| Find by label | `search_graph(label="Class")` |
| Dead code | `search_graph(max_degree=0, label="Function")` |
| Custom query | `query_graph(query="MATCH (n:Function)-[:CALLS]->(m) RETURN n.name, m.name LIMIT 20")` |
| ADR management | `manage_adr(mode="get")` |

## Workflow — First Use

1. `index_repository(repo_path=".")` — first run only
2. `list_projects` — verify indexed (this repo indexes as project name `workspace` when rooted at `/workspace`)
3. `get_architecture` — architecture map
4. Optional: `manage_adr(mode="update")` to persist architectural decisions

## Workflow — Before Reviewing Changes

1. `detect_changes(base_branch="main")` → risk score + blast radius
2. `trace_path` on highest-risk functions
3. Confirm with source before editing

## Workflow — Exploration

1. `get_architecture` → community map, entry points, routes, hotspots
2. `search_graph(name_pattern="<keyword>")` → find relevant nodes
3. `trace_path` → traverse from found nodes
4. `get_code_snippet(qualified_name="<name>")` → source with context

## CLI fallback (when MCP tools are unavailable)

```bash
export PATH="$HOME/.local/bin:$PATH"
codebase-memory-mcp cli index_repository --repo-path .
codebase-memory-mcp cli list_projects
codebase-memory-mcp cli get_architecture --project workspace
codebase-memory-mcp cli search_graph --project workspace --name-pattern 'simulate'
codebase-memory-mcp cli index_status --project workspace
```

## Known Gotchas

1. `search_graph(relationship="HTTP_CALLS")` filters by degree — use `query_graph` for actual edge inspection
2. `query_graph` has a row cap — paginate or narrow scope
3. `trace_path` requires **exact** qualified names — use `search_graph(name_pattern=...)` first
4. `direction="outbound"` misses cross-service callers — use `direction="both"`
5. When graph and checked-out source disagree, treat source as current

## Re-indexing

Graph auto-updates via background git polling. For immediate refresh:

```text
index_repository(repo_path=".", mode="fast")
```

## Safety

- Confirm graph-derived conclusions with source before edits.
- Do not call `delete_project` unless the user explicitly requests it.
- Fall back to normal repo exploration if the MCP/binary is unavailable.
