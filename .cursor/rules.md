# Cursor Editor Rules

- Always read `REPO_RULES.md` and `AGENTS.md` before making architectural changes.
- Do not break the build. Run `npx tsc` after significant changes.
- Never commit secrets. Ensure `.env` is ignored.
- Write tests for new features. Use `vitest`.
