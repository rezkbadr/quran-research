# Project instructions

## Workflow (durable, system-level)

Every code change must follow this workflow:

1. **New branch per change** — never commit directly to `main`. Create a fresh branch for each logical change.
2. **New PR per change** — open a pull request so the user can review and merge it.
3. **Semantic conventions** apply to branch names, commit messages, and PR titles.

### Conventional Commits (commit messages and PR titles)

Format: `<type>(<optional scope>): <description>`

Allowed types:
- `feat` — a new feature
- `fix` — a bug fix
- `docs` — documentation only
- `style` — formatting, whitespace, no code change
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — performance improvement
- `test` — adding or correcting tests
- `build` — build system or dependency changes
- `ci` — CI configuration
- `chore` — maintenance, tooling
- `revert` — revert a previous commit

Breaking changes: append `!` after type/scope (e.g. `feat!: ...`) or add a `BREAKING CHANGE:` footer.

Examples:
- `feat(search): add fuzzy matching for surah names`
- `fix(ui): correct ayah numbering on mobile`
- `refactor(api): extract verse loader into hook`

### Branch naming

Format: `<type>/<short-kebab-description>`

Use the same type vocabulary as commits. Examples:
- `feat/fuzzy-search`
- `fix/mobile-ayah-numbering`
- `docs/contributing-guide`
- `chore/bump-deps`

### PR titles and bodies

- PR title = Conventional Commit summary line.
- PR body should include a short **Summary** and a **Test plan**.
- Do not merge PRs on behalf of the user — leave merging to them.
