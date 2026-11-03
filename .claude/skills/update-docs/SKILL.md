---
name: update-docs
description: Updates README.md, user guides (EN + ID), DEVELOPER.md, architecture.md, server-actions.md and CHANGELOG.md after a feature or change. Use when the user asks to document, update docs, or finishes a feature.
disable-model-invocation: true
---

After a code change, update the documentation:

1. Run `git diff HEAD` (and `git diff --staged`) to see what changed.
2. `docs/USER_GUIDE.md` (EN) **and** `docs/USER_GUIDE.id.md` (ID) are plain language for end users: what the feature does and how to use it step by step. Use screenshot placeholders like `![...](images/...)`. No code. Keep both languages in sync.
3. `docs/DEVELOPER.md` covers affected folders, new env vars, commands, migrations and how to test.
4. `docs/server-actions.md`: for every new or changed Server Action, give its purpose, input DTO, output DTO, error codes, and an example hook call.
5. `docs/architecture.md`: update the Mermaid ERD or sequence diagrams if the schema or a flow changed.
6. `README.md`: update only the feature list and setup commands, if they changed.
7. `docs/CHANGELOG.md`: add one line under "Unreleased".
8. If a significant technical decision was made, add `docs/decisions/NNNN-*.md` and list it in `docs/decisions/README.md`.
9. Check that new exported functions have TSDoc comments.
10. Summarize what you changed in each file.
