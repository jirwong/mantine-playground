# GitHub Actions Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CI pipeline, gitleaks secret scanning, and dependabot config to `mantine-playground`, mirroring `basic-typescript-template` with adaptations for this repo's Biome-based tooling and lack of tests.

**Architecture:** Three workflow/config files are created under `.github/` — `ci.yml` (install → typecheck → check → build), `gitleaks.yml` (secret scan on push/PR), and `dependabot.yml` (npm weekly grouped + actions monthly). One script (`typecheck`) is added to `package.json`. CI runs on push to `main` and all pull requests using pnpm with the Node 24.12.0 toolchain, mirroring the template.

**Tech Stack:** GitHub Actions, pnpm, Node 24.12.0, Biome (lint+format), TypeScript/tsc, Vite build, gitleaks.

## Global Constraints

- Node version pinned to `24.12.0` in `actions/setup-node`.
- Lint + format verification is `pnpm check` (Biome `check` covers both; no separate `format:check`).
- No test/coverage steps or scripts (repo has no tests).
- Action versions verbatim from template: `actions/checkout@v7`, `pnpm/action-setup@v5`, `actions/setup-node@v7`, `gitleaks/gitleaks-action@v2`.
- Triggers: push to `main`, all `pull_request`.
- All YAML is .gitattributes-enforced LF line endings.

---

### Task 1: Add `typecheck` script to package.json

**Files:**
- Modify: `package.json` (scripts block, lines 8-16)

**Interfaces:**
- Produces: `pnpm typecheck` → runs `tsc --noEmit`

- [ ] **Step 1: Add the script**

Read `package.json`. Edit the `"scripts"` object (currently):

```json
  "scripts": {
    "dev": "vite dev --port 3000",
    "generate-routes": "tsr generate",
    "build": "vite build",
    "preview": "vite preview",
    "format": "biome format",
    "lint": "biome lint",
    "check": "biome check"
  },
```

Insert `"typecheck": "tsc --noEmit",` between `"generate-routes"` and `"build"` so the block becomes:

```json
  "scripts": {
    "dev": "vite dev --port 3000",
    "generate-routes": "tsr generate",
    "typecheck": "tsc --noEmit",
    "build": "vite build",
    "preview": "vite preview",
    "format": "biome format",
    "lint": "biome lint",
    "check": "biome check"
  },
```

- [ ] **Step 2: Verify the script runs**

Run: `pnpm typecheck`
Expected: exits 0 with no output (tsc found no type errors — verified against current tree).

- [ ] **Step 3: Verify the lockfile is unchanged**

Run: `git status --porcelain package.json pnpm-lock.yaml`
Expected: only `package.json` listed — no `pnpm-lock.yaml` change (script-only edit).

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add typecheck script"
```

---

### Task 2: Create CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `pnpm typecheck` (Task 1); `pnpm check`, `pnpm build` (existing scripts).
- Produces: workflow file used later only be GitHub (no downstream local task depends on it).

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/ci.yml` with exactly:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v5

      - uses: actions/setup-node@v7
        with:
          node-version: 24.12.0
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        env:
          CI: true

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint and format check
        run: pnpm check

      - name: Build
        run: pnpm build
```

- [ ] **Step 2: Validate YAML parses**

Run: `npx --yes -p prettier prettier --check .github/workflows/ci.yml`
Expected: exits 0, prints `ci.yml - Checked` (confirms valid YAML syntax and formatting).

- [ ] **Step 3: Verify LF line endings**

Run: `npx --yes -p prettier prettier --check .github/workflows/ci.yml` (already done in Step 2) and confirm the file on disk ends with a single final newline.

Run: `git add .github/workflows/ci.yml && git diff --cached .github/workflows/ci.yml`
Expected: added lines with no `warning: LF will be replaced by CRLF` message in `git add` output — `.gitattributes` (`* text=auto eol=lf`) enforces LF on commit.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow mirroring basic-typescript-template"
```

---

### Task 3: Create secret scanning workflow

**Files:**
- Create: `.github/workflows/gitleaks.yml`

**Interfaces:**
- Produces: workflow file used only by GitHub.

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/gitleaks.yml` with exactly:

```yaml
name: Secret scanning

on:
  push:
    branches: [main]
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Validate YAML parses**

Run: `npx --yes -p prettier prettier --check .github/workflows/gitleaks.yml`
Expected: exits 0, `gitleaks.yml - Checked`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/gitleaks.yml
git commit -m "ci: add gitleaks secret scanning workflow"
```

---

### Task 4: Create dependabot config

**Files:**
- Create: `.github/dependabot.yml`

**Interfaces:**
- Produces: config file used only by GitHub.

- [ ] **Step 1: Create the config file**

Create `.github/dependabot.yml` with exactly:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: '/'
    schedule:
      interval: weekly
    ignore:
      - dependency-name: '@types/node'
    groups:
      dev-dependencies:
        patterns:
          - '*'
        update-types:
          - 'minor'
          - 'patch'
  - package-ecosystem: github-actions
    directory: '/'
    schedule:
      interval: monthly
```

- [ ] **Step 2: Validate YAML parses**

Run: `npx --yes -p prettier prettier --check .github/dependabot.yml`
Expected: exits 0, `dependabot.yml - Checked`.

- [ ] **Step 3: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore: add Dependabot config for npm and GitHub Actions"
```

---

### Task 5: Final verification of all CI commands

**Files:**
- None (verification only)

- [ ] **Step 1: Run the exact CI command sequence locally**

Run each, in order:
- `pnpm install --frozen-lockfile` — Expected: exits 0 (`Already up to date`).
- `pnpm typecheck` — Expected: exits 0, no output.
- `pnpm check` — Expected: exits 0 (one `info` about biome schema version mismatch is non-fatal; do not attempt to fix it — it is pre-existing).
- `pnpm build` — Expected: exits 0, `vite build` completes and emits `dist/`.

Note: the pre-existing biome schema-version info (`.editorconfig`-style `$schema: 2.2.4` vs CLI `2.4.5`) does not fail CI. Leave it untouched.

- [ ] **Step 2: Confirm git state is clean**

Run: `git status --porcelain`
Expected: empty output (all four files committed; no untracked leftovers).

- [ ] **Step 3: Confirm final commit log**

Run: `git log --oneline -5`
Expected: your four commits on top of `b72debe docs: add GitHub Actions setup design spec`.