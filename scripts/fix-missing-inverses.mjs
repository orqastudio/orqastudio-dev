#!/usr/bin/env node
/**
 * Fix missing inverse relationships across the artifact graph.
 *
 * Reads the verify output, parses MissingInverse errors, and adds
 * the inverse relationship on the target artifact using proper YAML parsing.
 *
 * Usage:
 *   node scripts/fix-missing-inverses.mjs              # dry run
 *   node scripts/fix-missing-inverses.mjs --apply       # apply fixes
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

// Build a map of artifact ID → file path
function buildIdIndex() {
  const index = new Map();

  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "target") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) {
        const content = readFileSync(full, "utf-8");
        const idMatch = content.match(/^id:\s*(.+)/m);
        if (idMatch) {
          index.set(idMatch[1].trim().replace(/"/g, ""), full);
        }
      }
    }
  }

  walk(join(ROOT, ".orqa"));
  walk(join(ROOT, "app", ".orqa"));
  walk(join(ROOT, "plugins"));
  walk(join(ROOT, "connectors"));

  return index;
}

// Inverse relationship map
const INVERSE_MAP = {
  "fulfils": "fulfilled-by",
  "fulfilled-by": "fulfils",
  "delivers": "delivered-by",
  "delivered-by": "delivers",
  "drives": "driven-by",
  "driven-by": "drives",
  "depends-on": "depended-on-by",
  "depended-on-by": "depends-on",
  "grounded": "grounded-by",
  "grounded-by": "grounded",
  "employs": "employed-by",
  "employed-by": "employs",
  "synchronised-with": "synchronised-with",
  "informs": "informed-by",
  "informed-by": "informs",
  "enforces": "enforced-by",
  "enforced-by": "enforces",
  "observes": "observed-by",
  "observed-by": "observes",
  "evolves-into": "evolves-from",
  "evolves-from": "evolves-into",
  "benefits": "benefited-by",
  "benefited-by": "benefits",
  "realises": "realised-by",
  "realised-by": "realises",
};

/**
 * Add a relationship to an artifact file using proper YAML parsing.
 */
function addRelationship(filePath, targetId, relType) {
  const content = readFileSync(filePath, "utf-8");

  // Find frontmatter boundaries
  if (!content.startsWith("---\n")) return false;
  const fmEnd = content.indexOf("\n---", 4);
  if (fmEnd === -1) return false;

  const fmText = content.substring(4, fmEnd);
  const body = content.substring(fmEnd);

  // Parse YAML
  let fm;
  try {
    fm = parseYaml(fmText);
  } catch {
    // If YAML is invalid, skip this file
    return false;
  }

  if (!fm || typeof fm !== "object") return false;

  // Ensure relationships array exists
  if (!Array.isArray(fm.relationships)) {
    fm.relationships = [];
  }

  // Check if this relationship already exists
  const exists = fm.relationships.some(
    (r) => r.target === targetId && r.type === relType
  );
  if (exists) return false;

  // Add the relationship
  fm.relationships.push({ target: targetId, type: relType });

  // Stringify back — trim trailing newlines to avoid double ---
  const newFm = stringifyYaml(fm, { lineWidth: 0 }).trimEnd();
  // Body starts with \n--- (the closing frontmatter marker + rest of file)
  // We need exactly: ---\n{yaml}\n---\n{body}
  const bodyWithoutLeadingMarker = body.replace(/^\n---/, "");
  const newContent = "---\n" + newFm + "\n---" + bodyWithoutLeadingMarker;

  if (APPLY) {
    writeFileSync(filePath, newContent);
  }
  return true;
}

// Main
const idIndex = buildIdIndex();
console.log(`Index: ${idIndex.size} artifacts\n`);

// Parse MissingInverse errors from verify output
// Format: [E] SOURCE_ID: SOURCE_ID --rel--> TARGET_ID but TARGET_ID has no INVERSE edge back to SOURCE_ID
const missingInversePattern = /\[E\] (\S+): \S+ --(\S+)--> (\S+) but \S+ has no (\S+) edge back/;

// Read errors from stdin or generate them
const { execSync } = await import("child_process");
let verifyOutput;
try {
  verifyOutput = execSync("npx orqa verify 2>&1", { encoding: "utf-8", timeout: 120000 });
} catch (e) {
  verifyOutput = e.stdout || "";
}
const lines = verifyOutput.split("\n").filter((l) => l.includes("has no") && l.includes("edge back"));

let fixed = 0;
let skipped = 0;
let notFound = 0;

for (const line of lines) {
  const match = line.match(missingInversePattern);
  if (!match) continue;

  const [, sourceId, relType, targetId, expectedInverse] = match;

  // Find the target file
  const targetFile = idIndex.get(targetId);
  if (!targetFile) {
    console.log(`  NOT FOUND: ${targetId} (needed inverse ${expectedInverse} → ${sourceId})`);
    notFound++;
    continue;
  }

  const added = addRelationship(targetFile, sourceId, expectedInverse);
  if (added) {
    const rel = relative(ROOT, targetFile);
    console.log(`  ${APPLY ? "added" : "would add"}: ${targetId} --${expectedInverse}--> ${sourceId} (${rel})`);
    fixed++;
  } else {
    skipped++;
  }
}

console.log(`\n${APPLY ? "Done" : "Dry run"}: ${fixed} inverses ${APPLY ? "added" : "to add"}, ${skipped} already exist, ${notFound} targets not found`);
if (!APPLY && fixed > 0) console.log("Run with --apply to execute.");
