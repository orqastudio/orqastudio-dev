---
id: IDEA-119
title: "GitHub integration plugin — bidirectional sync with Issues, Projects, Wiki, PRs"
description: "A plugin that syncs OrqaStudio artifacts with GitHub features. Tasks↔Issues, docs↔Wiki, epics↔Projects, decisions↔PRs. Manage community engagement through OrqaStudio's structured thinking layer."
status: captured
created: 2026-03-19
updated: 2026-03-19
research-needed:
  - GitHub Issues ↔ Tasks — can we sync status, assignee, labels bidirectionally?
  - GitHub Projects ↔ Milestones/Epics — can we map OrqaStudio delivery hierarchy to GitHub project boards?
  - GitHub Wiki ↔ Documentation — can we push/pull .orqa/documentation/ to/from wiki pages?
  - GitHub PRs ↔ Decisions/Tasks — can a PR be linked to the decision or task that drives it?
  - GitHub Discussions ↔ Artifact discussions — can we surface discussion threads on artifacts?
  - What's the conflict resolution when something is edited on both sides?
  - Which side is the source of truth? OrqaStudio artifacts or GitHub features?
  - Can we use GitHub Actions as the trigger for sync (webhook on issue change → update task)?
  - How does this interact with the multi-user sync via git (IDEA-118)?
  - What about GitLab/Bitbucket equivalents — should the plugin be provider-agnostic?
  - Can we manage PR reviews through OrqaStudio's review gate model?
  - How do we handle community engagement — external contributors file issues on GitHub, maintainers triage in OrqaStudio?
relationships:
  - target: PILLAR-001
    type: grounded
    rationale: Bidirectional sync makes GitHub's project management visible as structured artifacts in the OrqaStudio graph
  - target: PERSONA-001
    type: benefits
---

# GitHub Integration Plugin

A plugin (not core) that creates bidirectional sync between OrqaStudio artifacts and GitHub features.

## Mapping

| OrqaStudio | GitHub | Sync Direction | Notes |
|-----------|--------|----------------|-------|
| Task | Issue | Bidirectional | Status, assignee, labels, description |
| Epic | Project (board) | OrqaStudio → GitHub | Delivery hierarchy as a project board |
| Milestone | Milestone | Bidirectional | Gate criteria, target date |
| Document | Wiki page | OrqaStudio → GitHub | Platform docs published to wiki |
| Decision | PR description | Bidirectional | Architecture decisions linked to PRs |
| Idea | Discussion | Bidirectional | Ideas as discussion threads |
| Lesson | Issue (labelled) | OrqaStudio → GitHub | Lessons surfaced as labelled issues |

## Community Engagement Flow

For open-source projects:
1. External contributor files a GitHub Issue
2. The sync creates an OrqaStudio task (or idea, depending on labels)
3. Maintainer triages in OrqaStudio — assigns pillar, priority, links to epic
4. Status changes flow back to the issue
5. When the task is completed, the issue auto-closes

This means the maintainer works in OrqaStudio with the full governance framework while the community interacts through GitHub's familiar interface.

## Source of Truth

OrqaStudio artifacts are the source of truth for governance. GitHub is the distribution channel. When conflicts arise, the OrqaStudio version wins — but changes from GitHub are surfaced as proposals, not overwrites.

## Provider Agnostic?

The plugin should define an interface that could be implemented for GitLab, Bitbucket, etc. But the first implementation is GitHub — it's what we use, and the API is the richest.
