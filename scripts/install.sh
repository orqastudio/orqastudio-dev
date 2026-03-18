#!/usr/bin/env bash
# install.sh — Bootstrap the OrqaStudio CLI, then let it handle everything.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== OrqaStudio Bootstrap ==="
echo ""

# Step 1: Ensure node exists (minimum requirement to run the CLI)
if ! command -v node &>/dev/null; then
  echo "Node.js not found. Install Node.js 22+ from https://nodejs.org/ or via fnm/nvm, then re-run."
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js $(node --version) found but 22+ required."
  exit 1
fi

# Step 2: Init submodules (needed to access libs/cli)
git submodule update --init --recursive

# Step 3: Build the CLI (minimal — just types + cli)
cd "$ROOT/libs/types" && npm install --ignore-scripts && npx tsc
cd "$ROOT/libs/cli" && npm install --ignore-scripts && npm link @orqastudio/types && npx tsc && npm link

# Step 4: Hand off to the CLI
cd "$ROOT"
echo ""
echo "CLI bootstrapped. Running orqa install..."
echo ""
orqa install
