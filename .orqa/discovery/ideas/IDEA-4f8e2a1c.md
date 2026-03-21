---
id: IDEA-4f8e2a1c
type: idea
title: "Cross-project classification learning with opt-in telemetry and AI-driven semantic merge"
description: "Projects that opt in share classification corrections to improve the global starting prompt. New version upgrades use AI-driven semantic merge to combine global improvements with local refinements without overwriting project-specific learnings."
status: captured
created: 2026-03-21
updated: 2026-03-21
relationships:
  - target: PILLAR-94b281db
    type: grounded
    rationale: "Purpose Through Continuity — local learnings persist across upgrades"
  - target: PILLAR-569581e0
    type: grounded
    rationale: "Clarity Through Structure — classification improvements are visible and governed"
  - target: PERSONA-a4b15450
    type: benefits
    rationale: "Jordan (Independent) — solo users benefit from collective learning without being forced to share"
  - target: IDEA-a3f2c17e
    type: grounded
    rationale: "Builds on the thinking mode classification system"
---

## The Idea

Three capabilities that build on the thinking mode classification system:

### 1. Opt-In Telemetry

Projects that choose to share their classification corrections contribute to improving the global starting prompt. Strictly opt-in, anonymised, user-controlled.

- When the learning loop corrects a classification (user says "that was feedback not implementation"), the correction is logged locally
- If telemetry is enabled, the anonymised correction (prompt pattern → expected mode) is shared
- Users can opt out completely with zero impact on their local experience
- This is about democratising AI tooling, not data extraction

### 2. Global Prompt Evolution

Across consenting projects, classification corrections aggregate into improved starting descriptions for each thinking mode.

- "Users who expected learning-loop mode but got implementation when saying X" refines the learning-loop mode description
- Same governance pipeline (observation → lesson → rule) applied cross-project
- Improvements ship in new versions as updated thinking mode knowledge artifacts

### 3. AI-Driven Semantic Merge for Upgrades

When a new version ships with improved classification prompts, it cannot overwrite local project refinements.

An AI merge process must:
- Take the new global prompt (improved from cross-project learning)
- Take the local project's refinements (lessons that corrected classifications locally)
- Merge so local learnings are preserved but global improvements are incorporated
- Flag conflicts for human review rather than silently overwriting

This is a semantic merge — understanding the intent of both versions, not just diffing text. The separate-artifacts-per-mode architecture makes this tractable: each mode description is independently mergeable.

### Privacy Principle

The system must be as useful for projects that share nothing as for those that share everything. Opt-in telemetry is an enhancement, not a requirement. Local learning always works.
