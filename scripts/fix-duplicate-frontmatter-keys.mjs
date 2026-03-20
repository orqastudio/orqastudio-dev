#!/usr/bin/env node
/**
 * Fix duplicate YAML frontmatter keys across all .orqa/ artifacts.
 *
 * Reads raw text (since YAML is invalid), finds duplicate `relationships:`
 * blocks, merges all entries into one block, then validates with yaml.parse().
 *
 * Usage:
 *   node scripts/fix-duplicate-frontmatter-keys.mjs              # dry run
 *   node scripts/fix-duplicate-frontmatter-keys.mjs --apply       # apply fixes
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";
import { parse as parseYaml } from "yaml";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

function walkFiles(dir, results = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "target") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, results);
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

/**
 * Fix frontmatter by rebuilding it line-by-line.
 *
 * Strategy:
 * 1. Split into frontmatter lines and body
 * 2. Walk lines, tracking which top-level key we're in
 * 3. For `relationships:`, collect ALL entries across all occurrences
 * 4. For other duplicate keys, keep the last value
 * 5. Rebuild with one occurrence of each key
 * 6. Validate with yaml.parse()
 */
function fixFrontmatter(content) {
  if (!content.startsWith("---\n")) return null;

  // Find closing ---
  const lines = content.split("\n");
  let fmEndLine = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === "---") {
      fmEndLine = i;
      break;
    }
  }
  if (fmEndLine === -1) return null;

  const fmLines = lines.slice(1, fmEndLine);
  const bodyLines = lines.slice(fmEndLine); // includes the closing ---

  // Parse into blocks: each top-level key starts a block
  const blocks = []; // { key, lines[] }
  let currentBlock = null;

  for (const line of fmLines) {
    // Top-level key (not indented, has colon)
    const topKeyMatch = line.match(/^([a-zA-Z][\w-]*):\s*(.*)/);
    if (topKeyMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { key: topKeyMatch[1], lines: [line] };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  // Group by key
  const keyGroups = new Map();
  for (const block of blocks) {
    if (!keyGroups.has(block.key)) keyGroups.set(block.key, []);
    keyGroups.get(block.key).push(block);
  }

  // Check for duplicates
  const hasDuplicates = [...keyGroups.values()].some(g => g.length > 1);
  if (!hasDuplicates) return null;

  // Rebuild: for each key, merge blocks
  const newFmLines = [];
  const seenKeys = new Set();

  // Preserve original key order (first occurrence)
  const keyOrder = [];
  for (const block of blocks) {
    if (!keyOrder.includes(block.key)) keyOrder.push(block.key);
  }

  for (const key of keyOrder) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const group = keyGroups.get(key);

    if (key === "relationships") {
      // Merge all relationship entries
      const allEntries = [];
      for (const block of group) {
        // Skip the key line itself, collect indented content
        const firstLine = block.lines[0];
        // Check if it's "relationships: []" (empty)
        if (firstLine.includes("[]")) continue;

        for (let i = 1; i < block.lines.length; i++) {
          const line = block.lines[i];
          if (line.trim()) allEntries.push(line);
        }
      }

      // Deduplicate entries (by target + type combo)
      const seen = new Set();
      const uniqueEntries = [];
      for (let i = 0; i < allEntries.length; i++) {
        const line = allEntries[i];
        if (line.trim().startsWith("- target:")) {
          const target = line.trim().replace("- target:", "").trim();
          const nextLine = allEntries[i + 1];
          const type = nextLine?.trim().startsWith("type:") ? nextLine.trim().replace("type:", "").trim() : "";
          const key = `${target}|${type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueEntries.push(line);
            if (nextLine?.trim().startsWith("type:")) {
              uniqueEntries.push(nextLine);
              i++; // skip the type line
            }
            // Also grab any additional fields (rationale, etc.)
            while (i + 1 < allEntries.length && allEntries[i + 1].trim() && !allEntries[i + 1].trim().startsWith("- target:")) {
              i++;
              uniqueEntries.push(allEntries[i]);
            }
          } else {
            // Skip this duplicate entry + its type line + any extra fields
            if (nextLine?.trim().startsWith("type:")) i++;
            while (i + 1 < allEntries.length && allEntries[i + 1].trim() && !allEntries[i + 1].trim().startsWith("- target:")) {
              i++;
            }
          }
        }
      }

      if (uniqueEntries.length > 0) {
        newFmLines.push("relationships:");
        for (const entry of uniqueEntries) {
          newFmLines.push(entry);
        }
      } else {
        newFmLines.push("relationships: []");
      }
    } else if (group.length > 1) {
      // For non-array duplicate keys, keep the last occurrence
      const lastBlock = group[group.length - 1];
      newFmLines.push(...lastBlock.lines);
    } else {
      // Single occurrence — keep as-is
      newFmLines.push(...group[0].lines);
    }
  }

  const newFmText = newFmLines.join("\n");

  // Validate
  try {
    parseYaml(newFmText);
  } catch (e) {
    return { error: `Still invalid after fix: ${e.message.split("\n")[0]}` };
  }

  const newContent = "---\n" + newFmText + "\n" + bodyLines.join("\n");
  const duplicates = [...keyGroups.entries()].filter(([, g]) => g.length > 1).map(([k, g]) => `${k} (${g.length}x)`);

  return { content: newContent, duplicates };
}

// Main
const scanDirs = [
  join(ROOT, ".orqa"),
  join(ROOT, "app", ".orqa"),
  join(ROOT, "plugins"),
  join(ROOT, "connectors"),
];

const allFiles = scanDirs.flatMap(d => walkFiles(d));
let fixed = 0;
let errors = 0;

for (const file of allFiles) {
  const content = readFileSync(file, "utf-8");
  const result = fixFrontmatter(content);

  if (!result) continue;

  const rel = relative(ROOT, file);

  if (result.error) {
    console.log(`  ERROR: ${rel} — ${result.error}`);
    errors++;
    continue;
  }

  console.log(`  ${APPLY ? "fixed" : "would fix"}: ${rel} — ${result.duplicates.join(", ")}`);

  if (APPLY) {
    writeFileSync(file, result.content);
  }
  fixed++;
}

console.log(`\n${APPLY ? "Done" : "Dry run"}: ${fixed} files ${APPLY ? "fixed" : "to fix"}, ${errors} errors`);
if (!APPLY && fixed > 0) console.log("Run with --apply to execute.");
