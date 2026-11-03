# Vibe Coding with Claude Code — Setup & Skills Guide

*Checked against the official Claude Code docs, October 2026. Features change often, so re-check the links in the last section when something doesn't match.*

This guide has two parts:

- **Part A — User Guide:** what to prepare and the step-by-step path from an empty folder to a working project. Read this first.
- **Part B — Developer Reference:** how skills, `CLAUDE.md`, scopes and sync actually work, plus templates you can copy.

---

# PART A — USER GUIDE

## A1. The vocabulary in one table

| Term | What it is | Do you need it on day 1? |
|---|---|---|
| **Claude Code** | The coding agent. It reads your files, edits code, runs commands. Available as a VS Code extension, a terminal CLI, a desktop app, and on the web. | **Yes** |
| **CLAUDE.md** | A Markdown file in your project root that Claude reads at the start of every session: your stack, rules, commands, conventions. Think of it as the project's "briefing". | **Yes** |
| **Skill** | A folder containing a `SKILL.md` file with instructions for one specific kind of task (e.g. "how we write migrations", "how to deploy"). Claude loads it only when relevant, or you call it with `/skill-name`. | No — add later, when you notice you repeat yourself |
| **Bundled skills** | Skills that ship with Claude Code, e.g. `/code-review`, `/debug`, `/verify`, `/doctor`. | Already installed |
| **Plugin** | A package that can bundle several skills, MCP servers, hooks and agents. Installed with `/plugin` or `/plugins`. | No |
| **MCP server** | A connector that gives Claude access to an external tool (GitHub, a database, a browser…). | No |
| **Hook** | A shell command that runs automatically on an event (e.g. run the formatter after every edit). | No |

**Rule of thumb:** `CLAUDE.md` = facts that always apply. Skill = a procedure or long reference that only applies sometimes.

## A2. What to prepare (checklist)

- [ ] **A Claude account** — a paid plan (Pro, Max, Team or Enterprise) or a Claude Console (API) account. No API key is needed if you sign in with a subscription.
- [ ] **VS Code 1.94.0 or newer.**
- [ ] **Git** installed. On native Windows, install **Git for Windows** (recommended so Claude can use Bash; otherwise it falls back to PowerShell).
- [ ] **Your stack's runtime** — whatever the project needs (e.g. PHP + Composer, Node.js + npm, Python, a database server). Claude can run commands, but it can't run tools that aren't installed.
- [ ] **A GitHub/GitLab repository** (optional but strongly recommended — Git is your undo button).
- [ ] **A short written idea** of what you want to build: who uses it, the main screens/features, the stack. Even 10 lines helps a lot.

## A3. Step-by-step setup

### Step 1 — Install the VS Code extension
1. In VS Code press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac).
2. Search **"Claude Code"** (publisher: Anthropic) → **Install**.
3. If it doesn't appear, run **Developer: Reload Window** from the Command Palette.

### Step 2 — (Optional) Install the CLI too
The extension has its own private copy of Claude Code. You only need the standalone CLI if you want to type `claude` in a terminal (some features are CLI-only).

| System | Command |
|---|---|
| macOS / Linux / WSL | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Windows PowerShell | `irm https://claude.ai/install.ps1 \| iex` |
| Windows (WinGet) | `winget install Anthropic.ClaudeCode` |

Open a **new** terminal and check: `claude --version`.

### Step 3 — Sign in
Click the **Spark icon** (top-right of the editor, needs a file open) or **✻ Claude Code** in the status bar → **Sign in** → finish in the browser.

> **Important for skills sync:** sign in with your **claude.ai account** (the same one you use on the website) if you want skills from claude.ai to appear in VS Code. API-key logins do not sync skills. See B4.

### Step 4 — Create the project
```bash
mkdir my-new-app
cd my-new-app
git init
code .
```

### Step 5 — Write your idea down first
Create `docs/PROJECT_BRIEF.md` and describe: the goal, users, main features, stack, and what "done" looks like for version 1. (Template in B7.)

### Step 6 — Let Claude create `CLAUDE.md`
In the Claude panel, type:
```
/init
```
Claude scans the folder and creates a `CLAUDE.md`. Then open it and add your own rules (template in B6). For an empty project, ask instead:
```
Read docs/PROJECT_BRIEF.md and create a CLAUDE.md with the stack, folder
structure, coding conventions, and the commands to install, run and test.
```

### Step 7 — Pick a permission mode
Click the mode indicator under the prompt box:

| Mode | Behaviour | When to use |
|---|---|---|
| **Plan** | Claude writes a plan and waits for your approval before changing anything. | Start of every feature. **Recommended for beginners.** |
| **Manual** | Asks before each edit/command, shows a diff. | When you want to learn what it's doing. |
| **Auto** | A safety classifier approves most actions instead of you. | Once you trust the setup. |
| **Edit automatically** | Edits without asking. | Small, low-risk changes. |

### Step 8 — The vibe coding loop (repeat for every feature)
1. **Plan:** `/plan add a login page with email and password`
2. **Review the plan**, comment on it, approve.
3. **Build:** Claude implements.
4. **Verify:** ask it to run the app/tests, or use `/verify`.
5. **Review:** `/code-review`
6. **Commit:** `commit my changes with a descriptive message`
7. **Document:** `update README.md and docs/ for this change` (or use the `update-docs` skill from B5).

**Tips that save the most time**
- Be specific: *"fix the blank screen after a wrong password on /login"* beats *"fix the bug"*.
- One feature per conversation. Start a new conversation (or `/clear`) when switching topics.
- Commit after every working step, so you can always roll back.
- Hover a message → **Rewind** to undo code changes from that point.

---

# PART B — DEVELOPER REFERENCE

## B1. What a skill is, exactly

A skill is a folder whose entry point is `SKILL.md`:

```
my-skill/
├── SKILL.md          # required: frontmatter + instructions
├── reference.md      # optional: long docs, loaded only when needed
├── examples.md       # optional
└── scripts/
    └── helper.sh     # optional: executed, not loaded into context
```

`SKILL.md` = YAML frontmatter + Markdown instructions:

```markdown
---
name: my-skill
description: What it does and WHEN to use it. Claude reads this to decide whether to load the skill.
---

Instructions Claude follows when the skill runs...
```

How it loads:
- Only the **name + description** are always in context (cheap).
- The **full body** loads when Claude decides it's relevant or when you type `/my-skill`.
- Keep `SKILL.md` under ~500 lines; move long material to supporting files.

## B2. Do you need skills?

**Not to start.** `CLAUDE.md` plus the bundled skills is enough for a first project.

Create a skill when:
- You keep pasting the same instructions or checklist into chat.
- A section of `CLAUDE.md` has turned into a long step-by-step procedure.
- You want a one-word command for a workflow (`/deploy`, `/new-module`, `/update-docs`).

## B3. Where skills live (scope) — "is it per project?"

| Scope | Path | Applies to |
|---|---|---|
| **Personal** | `~/.claude/skills/<name>/SKILL.md` | All your projects on **this machine** |
| **Project** | `<repo>/.claude/skills/<name>/SKILL.md` | **This repository only.** Commit it → every teammate gets it. |
| **Plugin** | installed via `/plugin` | Wherever the plugin is enabled, as `/plugin-name:skill-name` |
| **claude.ai account** | uploaded on claude.ai | claude.ai chats, Cowork, cloud sessions, and Claude Code sessions signed in with that account (see B4) |
| **Enterprise** | managed settings directory | Everyone on machines where your org deploys it |

On Windows, `~` means `C:\Users\<your-name>`, so personal skills live in `C:\Users\<your-name>\.claude\skills\`.

**Name clashes:** enterprise beats personal, personal beats project. A personal or project skill with the same name as a bundled skill replaces it.

**Changes are live:** adding or editing a skill in these folders takes effect in the running session without restarting. If you create the top-level `skills` folder for the first time mid-session, run `/reload-skills`.

**So the answer is:** install once in **Personal** for things you want everywhere; put **project-specific** rules in the repo's `.claude/skills/` and commit them.

## B4. claude.ai skills vs. VS Code Claude Code — do they sync?

**Yes, one direction, with conditions.**

- Skills you **enable on claude.ai** (yours, your org's, and Anthropic's built-ins like `pdf`, `xlsx`) are **downloaded** into Claude Code automatically, into `~/.claude/skills/synced/`, when:
  - you are signed in to Claude Code with your **claude.ai account** (not an API key, not Bedrock/Vertex/Foundry), and
  - Claude Code / the extension is **v2.1.273 or newer** (the extension's version number = its Claude Code version), and
  - your organization hasn't turned skills off.
- Sync runs in the background at session start and re-checks roughly every 10 minutes while active.
- It is **download-only**. Editing files in `~/.claude/skills/synced/` does not change claude.ai, and the next sync can overwrite them. Edit on claude.ai instead.
- **Local skills do not upload to claude.ai.** A skill you created in `~/.claude/skills/` is not visible on the website, in Cowork, or in cloud sessions until you upload it there yourself.
- **Limitation:** for synced skills running on your machine, `!` shell-command lines are **not executed** and `@file` references aren't attached. Skills that need those features should be installed locally instead.
- If a synced skill has the same short name as a local one, the local one wins; the synced one is then available as `/anthropic-skills:<name>`.
- To turn sync off on a machine: set `"syncClaudeAiSkills": false` in `~/.claude/settings.json`.

**How to check:** in the Claude panel type `/skills`. Synced skills are grouped under **claude.ai sync**.

## B5. How to install / create a skill — four methods

### Method 1 — Write your own (most common)
Personal (all projects):
```bash
mkdir -p ~/.claude/skills/update-docs
# then create ~/.claude/skills/update-docs/SKILL.md
```
Project (this repo only, shareable):
```bash
mkdir -p .claude/skills/update-docs
# then create .claude/skills/update-docs/SKILL.md and commit it
```
Or simply ask Claude: *"Create a project skill called update-docs that …"*

**Example — `update-docs` skill** (keeps user + developer docs current):
```markdown
---
name: update-docs
description: Updates README.md, docs/USER_GUIDE.md and docs/DEVELOPER.md after a feature or change. Use when the user asks to document, update docs, or finishes a feature.
disable-model-invocation: true
---

After a code change, update documentation:

1. Read `git diff HEAD` to see what changed.
2. docs/USER_GUIDE.md — plain language for end users: what the feature does,
   how to use it step by step, screenshots placeholders, no code.
3. docs/DEVELOPER.md — for developers: affected files, data model / DB changes,
   new env vars, commands, API endpoints, how to test.
4. README.md — update only the feature list and setup commands if they changed.
5. docs/CHANGELOG.md — add one line under "Unreleased".
6. Show a summary of what you changed in each file.
```

### Method 2 — Copy a skill from GitHub / a teammate
Copy the skill **folder** (not just the file) into `~/.claude/skills/` or `.claude/skills/`. Review it first — a skill can run commands and pre-approve tools via `allowed-tools`.

### Method 3 — Install a plugin
In the Claude panel type `/plugins` → choose a plugin → pick a scope: **for you** (all projects), **for this project** (shared), or **locally** (only you, this repo). Terminal equivalent:
```
/plugin install skill-creator@claude-plugins-official
```
(`skill-creator` helps you write and test skills.)

### Method 4 — Upload on claude.ai, sync to VS Code
Upload a zipped skill folder in claude.ai's skills settings, enable it, then it syncs to Claude Code as described in B4. **Frontmatter for claude.ai uploads may only contain:** `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools` — any other field (e.g. `disable-model-invocation`, `argument-hint`) makes the upload fail.

## B6. Frontmatter fields worth knowing (Claude Code)

| Field | Use |
|---|---|
| `name` | Command name (`/name`). Defaults to folder name. |
| `description` | **Most important.** What + when. Put trigger keywords first. |
| `disable-model-invocation: true` | Only you can run it (good for deploy/commit/anything with side effects). |
| `user-invocable: false` | Only Claude can use it (background knowledge). |
| `allowed-tools` | Tools pre-approved for that turn, e.g. `Bash(git add *) Bash(git commit *)`. |
| `paths` | Glob patterns; skill auto-loads only for matching files, e.g. `app/**/*.php`. |
| `context: fork` | Runs the skill in a separate subagent. |
| `$ARGUMENTS`, `$0`, `$1` | Values typed after the command, e.g. `/fix-issue 123`. |
| `` !`command` `` | Runs a shell command and inserts its output before Claude reads the skill (local skills only). |

## B7. Recommended project structure (documented for users and developers)

```
my-new-app/
├── CLAUDE.md                 # briefing for Claude (always loaded)
├── README.md                 # quick overview + setup (humans)
├── docs/
│   ├── PROJECT_BRIEF.md      # the idea / requirements
│   ├── USER_GUIDE.md         # for end users — no code
│   ├── DEVELOPER.md          # for developers — architecture, setup, conventions
│   ├── CHANGELOG.md
│   └── decisions/            # one short file per important technical decision
└── .claude/
    ├── settings.json         # shared Claude Code settings (commit)
    ├── settings.local.json   # your personal overrides (git-ignored)
    └── skills/
        └── update-docs/
            └── SKILL.md
```

### Template — `CLAUDE.md`
```markdown
# Project: <name>

## Purpose
<one paragraph — see docs/PROJECT_BRIEF.md for details>

## Stack
- Backend: <framework + version>
- Database: <db + version>
- Frontend: <…>

## Commands
- Install: <…>
- Run dev server: <…>
- Run tests: <…>
- Lint/format: <…>

## Conventions
- <naming, folder rules, code style>
- Never commit secrets; config goes in .env (see .env.example)
- Every feature: plan first, then implement, then tests, then /update-docs

## Docs
- User-facing docs: docs/USER_GUIDE.md (plain language)
- Developer docs: docs/DEVELOPER.md
```

### Template — `docs/PROJECT_BRIEF.md`
```markdown
# Project Brief
## Problem
## Users (who and how many)
## Must-have features (v1)
## Nice-to-have (later)
## Stack and constraints
## Definition of done for v1
```

### Template — `docs/DEVELOPER.md`
```markdown
# Developer Guide
## Architecture overview
## Local setup (step by step)
## Environment variables
## Database schema / migrations
## Folder structure
## Coding conventions
## Testing
## Deployment
## Troubleshooting
```

### Template — `docs/USER_GUIDE.md`
```markdown
# User Guide
## What this app does
## Getting started (login, first steps)
## Feature: <name>
   1. Step…
   2. Step…
## FAQ
## Who to contact for help
```

## B8. Troubleshooting

| Problem | Fix |
|---|---|
| Skill never triggers | Improve the `description` with words you actually type; test with `/skill-name`; check it's listed in `/skills`. |
| Skill triggers too often | Make the description narrower, or add `disable-model-invocation: true`. |
| claude.ai skill not in VS Code | Check you're signed in with the claude.ai account (`/status`), update the extension, then look under **claude.ai sync** in `/skills`. |
| claude.ai upload fails with "Unexpected key(s)" | Remove frontmatter fields not in the six allowed ones (B5, Method 4). |
| `claude` not found in VS Code terminal | The extension doesn't add `claude` to PATH — install the CLI (A3 Step 2). |
| Claude forgets a skill mid-session | Re-invoke it; put the most important rules at the top of `SKILL.md`. |
| Something is broken in the setup | Run `/doctor`. |

## B9. Official links
- Claude Code overview: https://code.claude.com/docs/en/overview
- Quickstart: https://code.claude.com/docs/en/quickstart
- VS Code extension: https://code.claude.com/docs/en/vs-code
- Skills: https://code.claude.com/docs/en/skills
- CLAUDE.md / memory: https://code.claude.com/docs/en/memory
- Best practices: https://code.claude.com/docs/en/best-practices
- Plugins: https://code.claude.com/docs/en/plugins/overview
- Skill authoring best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Free course: https://academy.claude.com/courses/claude-code-101
