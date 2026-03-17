# OrqaStudio Dev Environment Makefile

.DEFAULT_GOAL := help

.PHONY: setup \
        dev start stop kill restart-tauri restart-vite restart status \
        verify verify-integrity verify-rust verify-app verify-types verify-sdk \
        lint-rust fmt-rust \
        test-rust \
        build-ui \
        help

# ── Setup ────────────────────────────────────────────────────────────────────

setup: ## First-time setup: install deps, build libs, link everything
	bash scripts/link-all.sh

# ── Development ──────────────────────────────────────────────────────────────

dev: ## Start dev environment (spawns controller, waits for ready, exits)
	@cd app && node ../tools/debug-tool/dev.mjs dev

start: ## Start dev controller in foreground (long-running, unified output)
	@cd app && node ../tools/debug-tool/dev.mjs start

stop: ## Stop controller gracefully
	@cd app && node ../tools/debug-tool/dev.mjs stop

kill: ## Force-kill all OrqaStudio processes
	@cd app && node ../tools/debug-tool/dev.mjs kill

restart-tauri: ## Restart Tauri app only — recompile Rust, Vite stays alive
	@cd app && node ../tools/debug-tool/dev.mjs restart-tauri

restart-vite: ## Restart Vite dev server only
	@cd app && node ../tools/debug-tool/dev.mjs restart-vite

restart: ## Restart Vite + Tauri (controller stays alive)
	@cd app && node ../tools/debug-tool/dev.mjs restart

status: ## Show dev controller and process status
	@cd app && node ../tools/debug-tool/dev.mjs status

# ── Verification ─────────────────────────────────────────────────────────────

verify: verify-integrity verify-rust verify-app verify-types verify-sdk ## Run all verification checks

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

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show all targets with descriptions
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
