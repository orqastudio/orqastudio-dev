# OrqaStudio Dev Environment
#
# make install    Bootstrap the CLI then run orqa install
# make dev        Start the dev environment (Vite + Tauri)
#
# After install, use orqa directly for everything else:
#   orqa verify / check / test / validate / version / repo / plugin / graph

.DEFAULT_GOAL := install

install: ## Bootstrap the CLI then run orqa install
	@bash scripts/install.sh

dev: ## Start the dev environment
	@cd app && node ../tools/debug/dev.mjs dev
