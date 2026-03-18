# OrqaStudio Dev Environment Makefile
# Thin wrapper around the orqa CLI + platform-specific build tools.

.DEFAULT_GOAL := help

.PHONY: setup \
        dev start stop kill restart-tauri restart-vite restart status \
        verify verify-integrity verify-rust verify-app verify-types verify-sdk verify-cli \
        lint-rust fmt-rust \
        test-rust \
        build-ui \
        sync-versions bump-version version-check \
        commit-all push-all pull-all \
        submodule-status submodule-update \
        release-check \
        repo-audit \
        help

# ── Setup ────────────────────────────────────────────────────────────────────

install: setup verify-integrity ## Full bootstrap: setup + verify everything passes
	@echo ""
	@echo "=== Install complete. Run 'make dev' to start developing. ==="

setup: ## Init submodules, install deps, build libs, link everything, add orqa to PATH
	git submodule update --init --recursive
	bash scripts/link-all.sh
	@orqa --version > /dev/null 2>&1 && echo "orqa CLI: $$(orqa --version)" || echo "WARNING: orqa not on PATH — run 'cd libs/cli && npm link'"

# ── Development ──────────────────────────────────────────────────────────────

dev: ## Start dev environment
	@cd app && node ../tools/debug/dev.mjs dev

start: ## Start dev controller in foreground
	@cd app && node ../tools/debug/dev.mjs start

stop: ## Stop controller gracefully
	@cd app && node ../tools/debug/dev.mjs stop

kill: ## Force-kill all OrqaStudio processes
	@cd app && node ../tools/debug/dev.mjs kill

restart-tauri: ## Restart Tauri app only
	@cd app && node ../tools/debug/dev.mjs restart-tauri

restart-vite: ## Restart Vite dev server only
	@cd app && node ../tools/debug/dev.mjs restart-vite

restart: ## Restart Vite + Tauri
	@cd app && node ../tools/debug/dev.mjs restart

status: ## Show dev controller and process status
	@cd app && node ../tools/debug/dev.mjs status

# ── Verification ─────────────────────────────────────────────────────────────

verify: verify-integrity verify-rust verify-app verify-types verify-sdk verify-cli ## Run all checks

verify-integrity: ## Artifact graph integrity + version + license + readme
	orqa validate
	orqa version check
	orqa repo license
	orqa repo readme

verify-rust: build-ui ## Rust backend tests
	cd app/backend/src-tauri && cargo test

verify-app: ## Svelte-check on app frontend
	cd app/ui && npx svelte-check --threshold warning

verify-types: ## TypeScript check on types lib
	cd libs/types && npx tsc --noEmit

verify-sdk: ## TypeScript check on SDK
	cd libs/sdk && npx tsc --noEmit

verify-cli: ## TypeScript check on CLI and connector
	cd libs/cli && npx tsc --noEmit
	cd connectors/claude-code && npx tsc --noEmit

# ── Quality ──────────────────────────────────────────────────────────────────

lint-rust: build-ui ## Rust clippy lint
	cd app/backend/src-tauri && cargo clippy -- -D warnings

fmt-rust: ## Check Rust formatting
	cd app/backend/src-tauri && cargo fmt --check

# ── Testing ──────────────────────────────────────────────────────────────────

test-rust: build-ui ## Run Rust tests
	cd app/backend/src-tauri && cargo test

# ── Build ────────────────────────────────────────────────────────────────────

build-ui: ## Build frontend (required before Rust compilation)
	cd app/ui && npm run build

# ── Version Management (delegates to orqa CLI) ──────────────────────────────

sync-versions: ## Sync VERSION file across all submodules
	npx orqa version sync

bump-version: ## Bump version: make bump-version V=0.2.0-dev
	@if [ -z "$(V)" ]; then echo "Usage: make bump-version V=0.2.0-dev"; exit 1; fi
	npx orqa version bump $(V)

version-check: ## Check for version drift across repos
	npx orqa version check

# ── Dev Environment (delegates to orqa CLI) ──────────────────────────────────

submodule-status: ## Show status of all submodules
	npx orqa dev status

submodule-update: ## Pull latest from all submodule remotes
	npx orqa dev update

commit-all: ## Commit all dirty submodules + dev repo
	npx orqa dev commit

push-all: ## Push all submodules + dev repo to origin
	npx orqa dev push

pull-all: ## Pull all submodules + dev repo from origin
	npx orqa dev pull

release-check: ## Pre-release check: all repos clean and on main
	npx orqa dev release-check

# ── Repo Maintenance (delegates to orqa CLI) ─────────────────────────────────

repo-audit: ## Audit licenses and READMEs across all repos
	npx orqa repo license
	npx orqa repo readme

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show all targets with descriptions
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
