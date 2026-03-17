# OrqaStudio Dev Environment Makefile

.DEFAULT_GOAL := help

VERSION := $(shell cat VERSION 2>/dev/null | tr -d '[:space:]' || echo "0.1.0-dev")

.PHONY: setup \
        dev start stop kill restart-tauri restart-vite restart status \
        verify verify-integrity verify-rust verify-app verify-types verify-sdk verify-cli \
        lint-rust fmt-rust \
        test-rust \
        build-ui \
        sync-versions bump-version \
        commit-all push-all pull-all \
        submodule-status submodule-update \
        release-check \
        help

# ── Setup ────────────────────────────────────────────────────────────────────

setup: ## First-time setup: install deps, build libs, link everything
	bash scripts/link-all.sh

# ── Development ──────────────────────────────────────────────────────────────

dev: ## Start dev environment (spawns controller, waits for ready, exits)
	@cd app && node ../tools/debug/dev.mjs dev

start: ## Start dev controller in foreground (long-running, unified output)
	@cd app && node ../tools/debug/dev.mjs start

stop: ## Stop controller gracefully
	@cd app && node ../tools/debug/dev.mjs stop

kill: ## Force-kill all OrqaStudio processes
	@cd app && node ../tools/debug/dev.mjs kill

restart-tauri: ## Restart Tauri app only — recompile Rust, Vite stays alive
	@cd app && node ../tools/debug/dev.mjs restart-tauri

restart-vite: ## Restart Vite dev server only
	@cd app && node ../tools/debug/dev.mjs restart-vite

restart: ## Restart Vite + Tauri (controller stays alive)
	@cd app && node ../tools/debug/dev.mjs restart

status: ## Show dev controller and process status
	@cd app && node ../tools/debug/dev.mjs status

# ── Verification ─────────────────────────────────────────────────────────────

verify: verify-integrity verify-rust verify-app verify-types verify-sdk verify-cli ## Run all verification checks

verify-integrity: ## Artifact graph integrity (links, inverses, dependencies)
	cd app/ui && npx orqa-integrity ../..

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

# ── Version Management ───────────────────────────────────────────────────────

sync-versions: ## Sync VERSION file across all submodules
	@echo "Current version: $(VERSION)"
	bash scripts/sync-versions.sh

bump-version: ## Bump version interactively: make bump-version V=0.2.0-dev
	@if [ -z "$(V)" ]; then echo "Usage: make bump-version V=0.2.0-dev"; exit 1; fi
	@echo "$(V)" > VERSION
	bash scripts/sync-versions.sh "$(V)"

# ── Submodule Operations ─────────────────────────────────────────────────────

submodule-status: ## Show status of all submodules (branch, dirty, version)
	@echo "=== Submodule Status ==="
	@echo "Canonical version: $(VERSION)"
	@echo ""
	@git submodule foreach --quiet 'printf "%-35s %-12s %s\n" "$$sm_path" "$$(git branch --show-current 2>/dev/null || echo detached)" "$$(git log --oneline -1 2>/dev/null | cut -c1-50)"'

submodule-update: ## Pull latest from all submodule remotes
	git submodule update --remote --merge
	@echo "All submodules updated to latest remote."

commit-all: ## Commit staged changes in all dirty submodules + dev repo
	@echo "=== Committing across submodules ==="
	@git submodule foreach --quiet 'if [ -n "$$(git status --porcelain)" ]; then echo "Committing: $$sm_path"; git add -A && git commit -m "Sync to $(VERSION)" || true; fi'
	@echo ""
	@echo "=== Committing dev repo ==="
	git add -A && git commit -m "Sync all submodules to $(VERSION)" || echo "Nothing to commit in dev repo."

push-all: ## Push all submodules + dev repo to origin
	@echo "=== Pushing submodules ==="
	git submodule foreach 'git push || true'
	@echo ""
	@echo "=== Pushing dev repo ==="
	git push

pull-all: ## Pull all submodules + dev repo from origin
	git pull
	git submodule update --remote --merge

release-check: ## Pre-release check: verify all submodules are clean and on main
	@echo "=== Release Readiness Check ==="
	@echo "Version: $(VERSION)"
	@echo ""
	@ERRORS=0; \
	git submodule foreach --quiet ' \
		BRANCH=$$(git branch --show-current 2>/dev/null); \
		DIRTY=$$(git status --porcelain | wc -l | tr -d " "); \
		if [ "$$BRANCH" != "main" ]; then \
			printf "  ✗ %-35s branch: %s (expected main)\n" "$$sm_path" "$$BRANCH"; \
			ERRORS=$$((ERRORS+1)); \
		elif [ "$$DIRTY" -gt 0 ]; then \
			printf "  ✗ %-35s %s uncommitted changes\n" "$$sm_path" "$$DIRTY"; \
			ERRORS=$$((ERRORS+1)); \
		else \
			printf "  ✓ %-35s clean on main\n" "$$sm_path"; \
		fi'; \
	echo ""; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "  ✗ dev repo has uncommitted changes"; \
	else \
		echo "  ✓ dev repo clean"; \
	fi

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show all targets with descriptions
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
