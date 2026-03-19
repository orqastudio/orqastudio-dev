---
id: EPIC-090
title: "Coding standards plugins — Svelte + Tauri with rule-driven enforcement"
description: "Create @orqastudio/plugin-svelte and @orqastudio/plugin-tauri. Plugins provide linting/testing infrastructure. Rules define enforcement config. Organisation mode syncs standards with override tracking."
status: active
created: 2026-03-19
updated: 2026-03-19
relationships:
  - target: MS-001
    type: fulfils
  - target: IDEA-124
    type: realised-by
  - target: TASK-570
    type: delivered-by
  - target: TASK-571
    type: delivered-by
  - target: TASK-572
    type: delivered-by
  - target: TASK-573
    type: delivered-by
  - target: TASK-574
    type: delivered-by
  - target: TASK-575
    type: delivered-by
  - target: TASK-576
    type: delivered-by
  - target: TASK-577
    type: delivered-by
  - target: TASK-578
    type: delivered-by
  - target: TASK-579
    type: delivered-by
---

# EPIC-090: Coding Standards Plugins

## Goal

Replace standalone eslint-config and test-config libraries with plugin-driven coding standards. Rules define enforcement, plugins provide tooling, organisation mode syncs standards.

## Deliverables

1. `@orqastudio/plugin-svelte` — ESLint, svelte-check, Vitest
2. `@orqastudio/plugin-tauri` — clippy, rustfmt, cargo test
3. Updated enforcement schema (plugin/tool/config arrays)
4. Config generator (rules → tool config files)
5. Core installer agent
6. `orqa check` integration
7. Official registry entries
