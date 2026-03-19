#!/usr/bin/env node
/**
 * Add synchronised-with relationships from skills to their human-facing docs.
 * Also adds inverse relationships on the doc files.
 *
 * Usage:
 *   node scripts/link-skills-to-docs.mjs              # dry run
 *   node scripts/link-skills-to-docs.mjs --apply       # apply changes
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

// Mapping: skill directory → doc ID to link to
const SKILL_TO_DOC = {
  // Core platform skills → platform skill catalog
  "app/.orqa/process/skills": "DOC-a1b2c3d4",

  // Plugin skills → their plugin's development guide
  "plugins/svelte/skills": "DOC-SVE-5d832d1d",
  "plugins/tauri/skills": "DOC-TAU-d9c0d1c7",
  "plugins/rust/skills": "DOC-RST-27becb92",
  "plugins/software/skills": "DOC-SW-421219ce",
  "plugins/cli/skills": "DOC-CLI-2c9bfdda",
  "plugins/typescript/skills": "DOC-TS-e4f5a6b7",

  // Project-level skills → project coding standards
  ".orqa/process/skills": "DOC-4b4fbc0f",
};

function extractId(content) {
  const match = content.match(/^id:\s*"?([^\s"]+)"?\s*$/m);
  return match ? match[1] : null;
}

function hasRelationship(content, targetId, relType) {
  return content.includes(`target: ${targetId}`) && content.includes(`type: ${relType}`);
}

function addRelationship(content, targetId, relType) {
  // Find the relationships array in frontmatter
  const fmMatch = content.match(/^(---\n[\s\S]*?)(relationships:\s*\[?\]?\s*\n)([\s\S]*?\n---)/);
  if (fmMatch) {
    // Empty relationships array — replace with populated one
    if (fmMatch[2].includes("[]")) {
      const newRels = `relationships:\n  - target: ${targetId}\n    type: ${relType}\n`;
      return content.replace(fmMatch[2], newRels);
    }
    // Has existing relationships — append
    const insertPoint = content.lastIndexOf("\n---");
    const newEntry = `  - target: ${targetId}\n    type: ${relType}\n`;
    return content.slice(0, insertPoint) + newEntry + content.slice(insertPoint);
  }

  // No relationships field at all — add before closing ---
  const fmEnd = content.indexOf("\n---", 4);
  if (fmEnd === -1) return content;
  const newField = `relationships:\n  - target: ${targetId}\n    type: ${relType}\n`;
  return content.slice(0, fmEnd) + "\n" + newField + content.slice(fmEnd);
}

let totalSkills = 0;
let totalLinked = 0;
let totalAlready = 0;
const docInverses = {}; // docId → [skillIds to add as inverses]

for (const [skillDir, docId] of Object.entries(SKILL_TO_DOC)) {
  const fullDir = join(ROOT, skillDir);
  if (!existsSync(fullDir)) continue;

  for (const file of readdirSync(fullDir)) {
    if (!file.endsWith(".md")) continue;
    const filePath = join(fullDir, file);
    const content = readFileSync(filePath, "utf-8");
    const skillId = extractId(content);
    if (!skillId) continue;

    totalSkills++;

    if (hasRelationship(content, docId, "synchronised-with")) {
      totalAlready++;
      continue;
    }

    const updated = addRelationship(content, docId, "synchronised-with");
    if (APPLY) {
      writeFileSync(filePath, updated);
    }
    totalLinked++;
    console.log(`  ${APPLY ? "linked" : "would link"}: ${skillId} → ${docId} (${skillDir}/${file})`);

    // Track inverse to add on doc
    if (!docInverses[docId]) docInverses[docId] = [];
    docInverses[docId].push(skillId);
  }
}

// Add inverse relationships on docs
console.log("\nDoc inverse relationships:");
for (const [docId, skillIds] of Object.entries(docInverses)) {
  // Find the doc file
  const allDocs = [
    ...readdirSync(join(ROOT, "app/.orqa/documentation/platform"), { withFileTypes: true }).map(e => join(ROOT, "app/.orqa/documentation/platform", e.name)),
    ...readdirSync(join(ROOT, ".orqa/documentation/project"), { withFileTypes: true }).map(e => join(ROOT, ".orqa/documentation/project", e.name)),
  ];

  // Also check plugin docs
  for (const plugin of ["svelte", "tauri", "rust", "software", "cli", "typescript"]) {
    const docDir = join(ROOT, "plugins", plugin, "documentation");
    if (existsSync(docDir)) {
      allDocs.push(...readdirSync(docDir, { withFileTypes: true }).map(e => join(docDir, e.name)));
    }
  }

  for (const docPath of allDocs) {
    if (typeof docPath !== "string" || !docPath.endsWith(".md")) continue;
    if (!existsSync(docPath)) continue;
    let content = readFileSync(docPath, "utf-8");
    const id = extractId(content);
    if (id !== docId) continue;

    let changed = false;
    for (const skillId of skillIds) {
      if (!hasRelationship(content, skillId, "synchronised-with")) {
        content = addRelationship(content, skillId, "synchronised-with");
        changed = true;
        console.log(`  ${APPLY ? "added" : "would add"}: ${docId} ← ${skillId}`);
      }
    }
    if (changed && APPLY) {
      writeFileSync(docPath, content);
    }
    break;
  }
}

console.log(`\n${APPLY ? "Done" : "Dry run"}:`);
console.log(`  ${totalSkills} skills found`);
console.log(`  ${totalLinked} ${APPLY ? "linked" : "would link"}`);
console.log(`  ${totalAlready} already linked`);

if (!APPLY) {
  console.log("\nRun with --apply to execute.");
}
