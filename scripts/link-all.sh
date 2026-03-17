#!/usr/bin/env bash
# link-all.sh — Install deps, build libs, and npm link everything
# Run from the orqastudio-dev root directory.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "=== OrqaStudio Dev Environment Setup ==="
echo "Root: $ROOT"

# 1. Install and build types (no deps on other @orqastudio packages)
echo ""
echo "--- libs/types ---"
cd "$ROOT/libs/types"
npm install
npx tsc
npm link

# 2. Install and build CLI (depends on types)
echo ""
echo "--- libs/cli ---"
cd "$ROOT/libs/cli"
npm install
npm link @orqastudio/types
npx tsc
npm link

# 3. Install and build claude-code-cli (depends on types + cli)
echo ""
echo "--- libs/claude-code-cli ---"
cd "$ROOT/libs/claude-code-cli"
npm install
npm link @orqastudio/types @orqastudio/cli
npx tsc
npm link

# 4. Install and build SDK (depends on types)
echo ""
echo "--- libs/sdk ---"
cd "$ROOT/libs/sdk"
npm install
npm link @orqastudio/types
npx tsc
npm link

# 5. Install and build integrity-validator (depends on types)
echo ""
echo "--- libs/integrity-validator ---"
cd "$ROOT/libs/integrity-validator"
npm install
npm link @orqastudio/types
npx tsc
npm link

# 6. Install and build svelte-components (depends on types)
echo ""
echo "--- libs/svelte-components ---"
cd "$ROOT/libs/svelte-components"
npm install
npm link @orqastudio/types
npm run build

npm link

# 7. Install and build graph-visualiser (depends on types)
echo ""
echo "--- libs/graph-visualiser ---"
cd "$ROOT/libs/graph-visualiser"
npm install
npm link @orqastudio/types
npm run build
npm link

# 8. Install app UI and link all libs
echo ""
echo "--- app/ui ---"
cd "$ROOT/app/ui"
npm install
npm link @orqastudio/types @orqastudio/sdk @orqastudio/cli @orqastudio/claude-code-cli @orqastudio/integrity-validator @orqastudio/svelte-components @orqastudio/graph-visualiser
npx svelte-kit sync

# 9. Build UI (needed for Rust compilation)
echo ""
echo "--- app/ui build ---"
npm run build

echo ""
echo "=== Done. All libs linked into app. ==="
