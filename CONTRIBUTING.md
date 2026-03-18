# Contributing to OrqaStudio

All contributions to the core project and official plugins go through the [orqastudio-dev](https://github.com/orqastudio/orqastudio-dev) repository.

## Getting Started

```bash
git clone git@github.com:orqastudio/orqastudio-dev.git
cd orqastudio-dev
make install
```

See the [README](README.md) for full setup instructions.

## Discussions

Use [GitHub Discussions](https://github.com/orqastudio/orqastudio-dev/discussions) on the dev repo for:
- Feature proposals
- Architecture questions
- General questions about contributing

## Issues

File bugs and feature requests on the [dev repo issues](https://github.com/orqastudio/orqastudio-dev/issues), not on individual submodule repos.

## Community Plugins

Community plugins are maintained independently. To list yours in the registry, see [Submitting a Community Plugin](#submitting-a-community-plugin) below.

---

## Contributing to Core

### Contributor Agreement

We use DCO (Developer Certificate of Origin). Sign off every commit:

```bash
git commit -s -m "your message"
```

You retain copyright. No CLA required.

### Workflow

1. Fork `orqastudio-dev`
2. `make install` to bootstrap
3. Create a branch: `git checkout -b feat/my-feature`
4. Make changes in the relevant submodule(s)
5. Commit in each submodule, then update pointers in the dev repo
6. Push and open a PR against `orqastudio-dev`

For multi-repo changes, use the same branch name across all affected submodules. The dev repo PR ties them together.

### Pre-commit Checks

These must pass before committing:

```bash
orqa verify    # integrity, version, license, readme
orqa check     # lint, typecheck, format
orqa test      # test suites
```

### Quality Standards

- Rust: `cargo clippy -- -D warnings`, `cargo fmt --check`, no `unwrap()` in production
- TypeScript: strict mode, no `any`, Svelte 5 runes only
- All: tests for new functionality, no TODOs, no commented-out code

### Values

OrqaStudio is licensed under BSL-1.1 with an Ethical Use Addendum. By contributing you agree to these terms. See [Licensing & Ethics](.orqa/documentation/project/licensing.md).

---

## Submitting a Community Plugin

Community plugins live in their own repos under your control. To list one in the OrqaStudio community registry:

1. Ensure your plugin has a valid `orqa-plugin.json` manifest
2. Ensure it has a README with the OrqaStudio banner, badges, and required sections
3. Fork [orqastudio-dev](https://github.com/orqastudio/orqastudio-dev)
4. Add your repo as a submodule under `registry/community/`:
   ```bash
   cd registry/community
   git submodule add https://github.com/yourname/your-plugin.git your-plugin
   ```
5. Open a PR against `orqastudio-dev` with:
   - A description of what your plugin does
   - Which artifact types or relationships it provides (if any)
   - Your plugin's license

Community plugins can use any license. The registry index itself is MIT.

## License

BSL-1.1 with Ethical Use Addendum — see [LICENSE](app/LICENSE) and [CHANGE-LICENSE](app/CHANGE-LICENSE).
