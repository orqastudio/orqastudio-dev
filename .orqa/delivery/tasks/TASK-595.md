---
id: TASK-595
type: task
title: "Skill sync — auto-generate Claude Code skills from OrqaStudio skills"
status: completed
created: 2026-03-19
updated: 2026-03-19
relationships:
  - target: EPIC-6967c7dc
    type: delivers
---

# TASK-595: Skill Sync

## Context

The connector has Claude Code-native skills (folder/SKILL.md format) that are derived from OrqaStudio skills (flat .md format). These can drift if the source is updated but the connector copy isn't.

## Acceptance Criteria

1. Sync script reads OrqaStudio skills and generates Claude Code-native versions
2. Generated skills preserve the body content but transform the frontmatter to Claude Code format
3. The session-start hook or a build step runs the sync
4. Connector skills that have no OrqaStudio source (connector-specific like delegation-patterns) are preserved
5. Drift detection: CI or pre-commit check flags when generated skills are out of date
