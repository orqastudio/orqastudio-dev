# OrqaStudio Dev Environment
#
# The Makefile bootstraps the orqa CLI. After that, use orqa directly:
#
#   make install          Bootstrap CLI then run orqa install
#   orqa install          Full setup (prereqs, submodules, deps, link, verify)
#   orqa verify           Run all checks
#   orqa version check    Check version drift
#   orqa repo license     Audit licenses
#   orqa repo readme      Audit READMEs
#   orqa validate         Run integrity validation
#
# See 'orqa --help' for all available commands.

.DEFAULT_GOAL := install

install: ## Bootstrap the CLI then run orqa install
	@bash scripts/install.sh
