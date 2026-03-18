#!/usr/bin/env bash
# install.sh — Bootstrap the OrqaStudio CLI, then let it handle everything.
#
# This script needs only Node.js 22+ to run. It builds the CLI, then
# hands off to `orqa install` which handles everything else including
# checking/installing Rust.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== OrqaStudio Bootstrap ==="
echo ""

# ── Check Node.js ────────────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  echo "Node.js is required to bootstrap the OrqaStudio CLI."
  echo ""
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*|Windows*)
      echo "Install Node.js 22+:"
      echo "  Option 1: winget install Schniz.fnm && fnm install 22"
      echo "  Option 2: https://nodejs.org/en/download"
      ;;
    Darwin*)
      echo "Install Node.js 22+:"
      echo "  Option 1: brew install fnm && fnm install 22"
      echo "  Option 2: https://nodejs.org/en/download"
      ;;
    *)
      echo "Install Node.js 22+:"
      echo "  Option 1: curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22"
      echo "  Option 2: https://nodejs.org/en/download"
      ;;
  esac
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js $(node --version) found but 22+ required."
  echo ""
  if command -v fnm &>/dev/null; then
    echo "  fnm install 22 && fnm use 22"
  elif command -v nvm &>/dev/null; then
    echo "  nvm install 22 && nvm use 22"
  else
    echo "  https://nodejs.org/en/download"
  fi
  exit 1
fi

echo "  ✓ node $(node --version)"

# ── Init submodules (needed to access libs/cli) ─────────────────────────────

echo "  Initialising submodules..."
git submodule update --init --recursive
echo "  ✓ submodules"

# ── Bootstrap the CLI ────────────────────────────────────────────────────────

echo "  Building CLI..."
cd "$ROOT/libs/types" && npm install --ignore-scripts && npx tsc
cd "$ROOT/libs/cli" && npm install --ignore-scripts && npm link @orqastudio/types && npx tsc && npm link

# ── Hand off to orqa install ─────────────────────────────────────────────────

cd "$ROOT"
echo ""
orqa install
