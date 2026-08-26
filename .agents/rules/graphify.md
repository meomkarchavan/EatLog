---
trigger: always_on
description: Mandatory rule to consult the Graphify knowledge graph at graphify-out/ for learning, understanding architecture, and exploring the codebase before taking actions or reading raw files.
---

# Codebase Knowledge & Exploration Rule (Graphify)

All agents working on this project MUST use the Graphify knowledge graph (`graphify-out/`) as the primary source of truth for understanding project architecture, component relationships, and codebase structure.

## Mandatory Rules for All Agents:

1. **Mandatory First Step for Understanding & Learning:**
   - Before browsing raw files or conducting unguided file searches, first consult the Graphify knowledge graph.
   - For architecture, module relationships, and conceptual overviews, read [GRAPH_REPORT.md](file:///d:/code/EatLog/graphify-out/GRAPH_REPORT.md).
   - Use `graphify query "<question>"` to trace relevant subgraphs and dependencies for specific features or questions.
   - Use `graphify path "<A>" "<B>"` to understand connections and data flows between components.
   - Use `graphify explain "<concept>"` to get focused concept and symbol explanations.

2. **Targeted Navigation:**
   - When `graphify-out/wiki/index.md` exists, navigate the generated wiki structure instead of scanning arbitrary source files.
   - Use `graphify-out/graph.json` or MCP graph tools (`query_graph`, `shortest_path`, `get_node`) for machine-readable subgraphs.

3. **Keep Knowledge Graph Synchronized:**
   - After creating, updating, or deleting code files in any session, run `graphify update .` to keep the knowledge graph synchronized (runs fast AST extraction without API cost).

