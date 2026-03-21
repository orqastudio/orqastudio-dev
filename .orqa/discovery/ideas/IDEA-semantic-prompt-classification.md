---
id: IDEA-a3f2c17e
type: idea
title: "Semantic prompt classification — embeddings-driven orchestrator context injection"
description: "Use the ONNX embeddings server to classify user prompts before the orchestrator processes them. Determine whether the input is research, feedback, process observation, implementation request, etc. — then inject the right process context concisely based on what kind of work is being requested."
status: captured
created: 2026-03-21
updated: 2026-03-21
relationships:
  - target: PILLAR-94b281db
    type: grounded
    rationale: "Purpose Through Continuity — ensuring the right process is applied to the right kind of work"
  - target: PILLAR-569581e0
    type: grounded
    rationale: "Clarity Through Structure — making the orchestrator's decision-making visible and structured"
  - target: PERSONA-cda6edd6
    type: benefits
    rationale: "Alex (Lead) — the orchestrator serves Alex's coordination needs"
---

## The Idea

Use the ONNX embeddings server to pre-classify user prompts before the orchestrator acts on them. Instead of the orchestrator receiving raw text and deciding what to do, the `UserPromptSubmit` hook embeds the prompt, classifies it against known work categories, and injects the appropriate process context.

## Categories to Classify

| Category | Signal | Process Injected |
|----------|--------|-----------------|
| **Research request** | "investigate", "find out", "what does X do" | Research methodology, search-first approach |
| **Feedback/observation** | "I noticed", "this isn't right", "the X is broken" | Lesson capture, bug triage, status assessment |
| **Process observation** | "we should", "can we enforce", "the governance" | Rule creation, AD drafting, enforcement design |
| **Implementation request** | "build", "add", "fix", "implement" | Epic/task scoping, delegation protocol, knowledge injection |
| **Planning request** | "plan", "scope", "what's next", "priorities" | Milestone review, epic planning, graph-first orientation |
| **Review request** | "check", "review", "audit", "validate" | Quality checklist, standards injection, reviewer delegation |

## How It Works

1. `UserPromptSubmit` hook receives the prompt
2. Embed the prompt via the search server
3. Compare against category embeddings (pre-computed from category descriptions)
4. Top match determines which process knowledge to inject
5. Orchestrator receives the prompt + concise process context for that category

## Why This Matters for the Orchestrator

The orchestrator determines what gets done by whom. Currently it receives every prompt the same way and must figure out the intent from raw text. With semantic classification:
- Research questions get research methodology injected
- Implementation requests get delegation protocol + knowledge injection
- Process observations get governance context
- The orchestrator's response is informed by the RIGHT process, not all processes

## Decision Tree for Knowledge Injection

Beyond flat classification, the system should support a **decision tree** that progressively narrows what knowledge to inject based on layered context:

```
Level 1: Intent Classification (embeddings)
  ├── Research → "what domain?"
  │   ├── Frontend → svelte5-best-practices, orqa-frontend
  │   ├── Backend → rust-async-patterns, orqa-backend
  │   └── Governance → orqa-governance, artifact-relationships
  ├── Implementation → "what layer?"
  │   ├── UI component → component-extraction, tailwind-design-system
  │   ├── Rust command → orqa-ipc-patterns, orqa-domain-services
  │   ├── Store → orqa-store-patterns, orqa-store-orchestration
  │   └── Artifact → orqa-governance, schema-validation
  ├── Feedback → "what type?"
  │   ├── Bug report → bug triage, diagnostic-methodology
  │   ├── Process improvement → governance-maintenance, systems-thinking
  │   └── Quality concern → code-quality-review, test-engineering
  └── Planning → "what scope?"
      ├── Epic scoping → epic-requirement-inference, planning
      ├── Task breakdown → software-delivery, delegation-patterns
      └── Architecture → architectural-evaluation, composability
```

Each level uses semantic similarity to narrow further. Level 1 classifies intent from the prompt. Level 2 classifies domain from the prompt + file context. The tree is defined as a governance artifact — editable, versionable, and inspectable in the app.

**Tree nodes are knowledge artifacts** — each leaf in the tree references specific knowledge files to inject. The tree structure itself is a knowledge artifact with `injection` metadata, making it self-documenting and extensible by plugins.

**Plugin extension:** Plugins add branches to the tree. The software plugin adds implementation sub-branches (UI, Rust, Store). A future data-science plugin could add analysis/ML branches. The tree merges at install time like all other plugin schemas.

## Value

- Reduces orchestrator context window usage (inject only relevant process, not everything)
- Faster delegation (category already classified)
- More consistent process application (same category → same process every time)
- Foundation for agent-aware injection (different agents could get different category-specific context)
- Decision tree is inspectable — the user can see WHY certain knowledge was injected
- Progressive narrowing means higher precision than flat keyword matching
