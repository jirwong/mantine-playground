# GitHub Actions Setup Design

**Date:** 2026-08-17
**Status:** Approved

## Goal

Mirror the GitHub Actions setup from `basic-typescript-template` (`/c/dev/migrate-code/basic-typescript-template`) into this repo (`mantine-playground`) so both projects share consistent CI, secret scanning, and dependency-update behavior.

## Source Template Files

| Template file | Purpose |
| --- | --- |
| `.github/workflows/ci.yml` | Install, typecheck, lint, format check, test, coverage, build |
| `.github/workflows/gitleaks.yml` | Secret scanning via gitleaks |
| `.github/dependabot.yml` | npm (weekly, grouped) + github-actions (monthly) dependency updates |

## Key Differences From Template

This repo differs from the template in ways that require CI adaptation (approved as "Option A — mirror-adapted"):

- **Tooling:** Lint/format is Biome (`pnpm lint` / `pnpm check`) rather than oxlint + prettier. `biome check` covers both lint and format, so separate `format:check` is unnecessary.
- **No tests:** No test framework or specs exist, so test / test:coverage steps are dropped.
- **No typecheck script:** `package.json` lacks a typecheck script; one must be added.

## Design

### 1. `.github/workflows/ci.yml`

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

Triggers on push to `main` and all pull requests. Steps: install → typecheck → check (Biome lint + format) → build.

### 2. `.github/workflows/gitleaks.yml`

Copied verbatim from the template (tool-agnostic):

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

### 3. `.github/dependabot.yml`

Copied verbatim from the template:

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

### 4. `package.json` Script Change

Add one script (all others unchanged):

```json
"typecheck": "tsc --noEmit"
```

## Non-Goals

- No test framework or test/coverage steps are added (repo has no tests).
- No changes to existing scripts beyond adding `typecheck`.
- No branch-trimming, concurrency controls, or artifact caching beyond what the templates provide.

## Verification

- Run `pnpm typecheck`, `pnpm check`, and `pnpm build` locally to confirm the three CI steps pass.
- CI workflow will run automatically once pushed to GitHub; `on: pull_request` trigger verifies it on a PR.