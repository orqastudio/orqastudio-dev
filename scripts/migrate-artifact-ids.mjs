#!/usr/bin/env node
/**
 * Bulk artifact ID migration: sequential (TYPE-NNN) → hex (TYPE-XXXXXXXX)
 *
 * Usage:
 *   node scripts/migrate-artifact-ids.mjs              # dry run
 *   node scripts/migrate-artifact-ids.mjs --apply       # apply changes
 *   node scripts/migrate-artifact-ids.mjs --manifest    # output mapping only
 *
 * Scans all .md and .json files under .orqa/, app/.orqa/, plugins/, and connectors/.
 * Generates a new hex ID for each artifact, then updates:
 *   1. The `id:` field in YAML frontmatter
 *   2. All `target:` references in relationship arrays
 *   3. All body text references (prose, links, tables)
 *   4. Plugin manifests (orqa-plugin.json skill ID entries)
 *
 * Produces a migration manifest (scripts/id-migration-manifest.json) mapping old → new.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { randomBytes } from "crypto";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const MANIFEST_ONLY = process.argv.includes("--manifest");

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateHexId(prefix) {
  const hex = randomBytes(4).toString("hex");
  return `${prefix}-${hex}`;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function walkFiles(dir, extensions, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "target") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, extensions, results);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// ID extraction
// ---------------------------------------------------------------------------

// Match frontmatter `id: TYPE-NNN` (sequential format, not already hex)
const ID_PATTERN = /^id:\s*"?([A-Z]+-(?:[A-Z]+-)?(\d+))"?\s*$/;

function extractArtifactId(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  for (const line of fmMatch[1].split("\n")) {
    const m = line.match(ID_PATTERN);
    if (m) return m[1];
  }
  return null;
}

function getTypePrefix(id) {
  // SKILL-SVE-001 → SKILL, TASK-580 → TASK, AD-057 → AD
  // For compound prefixes like SKILL-SVE, we want the full type prefix
  const parts = id.split("-");
  if (parts.length === 3) {
    // SKILL-SVE-001 — first two parts are the prefix
    return `${parts[0]}-${parts[1]}`;
  }
  // TASK-580, AD-057, EPIC-094 — first part is the prefix
  return parts[0];
}

// IDs that should NOT be migrated (templates, examples in docs)
function isTemplateId(id) {
  return id.includes("NNN") || id === "SKILL-NNN" || id === "TASK-NNN";
}

// Already hex format
function isAlreadyHex(id) {
  const suffix = id.split("-").pop();
  return suffix.length === 8 && /^[0-9a-f]+$/.test(suffix);
}

// ---------------------------------------------------------------------------
// Build migration mapping
// ---------------------------------------------------------------------------

function buildMigrationMap() {
  const scanDirs = [
    join(ROOT, ".orqa"),
    join(ROOT, "app", ".orqa"),
    join(ROOT, "plugins"),
    join(ROOT, "connectors"),
  ];

  const allFiles = [];
  for (const dir of scanDirs) {
    walkFiles(dir, [".md"], allFiles);
  }

  const mapping = {}; // old ID → new ID
  const idLocations = {}; // old ID → file path where it's defined

  for (const file of allFiles) {
    const content = readFileSync(file, "utf-8");
    const id = extractArtifactId(content);
    if (!id) continue;
    if (isTemplateId(id)) continue;
    if (isAlreadyHex(id)) continue;

    const prefix = getTypePrefix(id);
    const newId = generateHexId(prefix);
    mapping[id] = newId;
    idLocations[id] = relative(ROOT, file);
  }

  return { mapping, idLocations };
}

// ---------------------------------------------------------------------------
// Apply migration
// ---------------------------------------------------------------------------

function applyMigration(mapping) {
  // Build regex that matches any old ID as a whole word
  // Sort by length descending so longer IDs match first (SKILL-SVE-001 before SKILL-001)
  const oldIds = Object.keys(mapping).sort((a, b) => b.length - a.length);
  if (oldIds.length === 0) {
    console.log("No IDs to migrate.");
    return { filesChanged: 0, replacements: 0 };
  }

  const pattern = new RegExp(
    oldIds.map((id) => id.replace(/[-]/g, "\\-")).join("|"),
    "g"
  );

  // Scan ALL files that could contain references
  const scanDirs = [
    join(ROOT, ".orqa"),
    join(ROOT, "app", ".orqa"),
    join(ROOT, "plugins"),
    join(ROOT, "connectors"),
  ];

  const allFiles = [];
  for (const dir of scanDirs) {
    walkFiles(dir, [".md", ".json"], allFiles);
  }

  let filesChanged = 0;
  let totalReplacements = 0;

  for (const file of allFiles) {
    const original = readFileSync(file, "utf-8");
    let updated = original;
    let count = 0;

    updated = updated.replace(pattern, (match) => {
      if (mapping[match]) {
        count++;
        return mapping[match];
      }
      return match;
    });

    if (count > 0) {
      if (APPLY) {
        writeFileSync(file, updated);
      }
      filesChanged++;
      totalReplacements += count;
      const rel = relative(ROOT, file);
      console.log(`  ${APPLY ? "updated" : "would update"}: ${rel} (${count} replacements)`);
    }
  }

  return { filesChanged, replacements: totalReplacements };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("Artifact ID Migration: sequential → hex (TYPE-XXXXXXXX)");
console.log("=========================================================\n");

const { mapping, idLocations } = buildMigrationMap();

console.log(`Found ${Object.keys(mapping).length} artifacts to migrate:\n`);

// Show mapping
const entries = Object.entries(mapping).sort(([a], [b]) => a.localeCompare(b));
for (const [oldId, newId] of entries) {
  const location = idLocations[oldId];
  console.log(`  ${oldId.padEnd(20)} → ${newId.padEnd(20)} (${location})`);
}

// Write manifest
const manifestPath = join(ROOT, "scripts", "id-migration-manifest.json");
writeFileSync(manifestPath, JSON.stringify({ migrated: new Date().toISOString(), mapping }, null, 2));
console.log(`\nManifest written to: ${relative(ROOT, manifestPath)}`);

if (MANIFEST_ONLY) {
  process.exit(0);
}

console.log(`\n${APPLY ? "Applying" : "Dry run (pass --apply to execute)"}...\n`);

const { filesChanged, replacements } = applyMigration(mapping);

console.log(`\n${APPLY ? "Done" : "Dry run complete"}:`);
console.log(`  ${Object.keys(mapping).length} IDs migrated`);
console.log(`  ${filesChanged} files ${APPLY ? "changed" : "would change"}`);
console.log(`  ${replacements} total replacements`);

if (!APPLY) {
  console.log("\nRun with --apply to execute the migration.");
}
