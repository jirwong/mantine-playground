# Mantine Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Mantine v9 (`@mantine/core`, `@mantine/hooks`) into the existing TanStack Start app, add a light/dark toggle, and replace the home page with a Mantine showcase — keeping Tailwind CSS v4.

**Architecture:** Mantine's own PostCSS preset processes `@mantine/core/styles.css`; the CSS is loaded through the app's existing SSR-safe `?url` stylesheet link. `MantineProvider` + `ColorSchemeScript` + `mantineHtmlProps` wrap the root document so color scheme works headlessly and without SSR hydration errors. Tailwind stays on the `@tailwindcss/vite` Vite plugin untouched.

**Tech Stack:** Mantine v9, TanStack Start (React 19, Vite 8), Tailwind CSS v4 (`@tailwindcss/vite`), pnpm 10, Biome 2, TypeScript 6.

## Global Constraints

- Package manager is `pnpm` (v10.33.0), Node 24. Do not use npm/yarn.
- No test framework is installed. Verification for every task is: `pnpm build`, `npx tsc --noEmit`, `pnpm check` (Biome), and a dev-server smoke check (Task 7).
- Biome formatting: tab indentation, double quotes, imports auto-organized on save. Run `pnpm check` and fix any reported issues before committing.
- Do NOT change `vite.config.ts` — `@tailwindcss/vite` must stay the pipeline that compiles Tailwind (Approach A from the spec). Mantine's PostCSS config is added separately.
- Preserve the existing SSR-safe stylesheet pattern in `src/routes/__root.tsx` (CSS imported as `?url` and listed in `links`). Do not switch to inline CSS imports in components.
- `@import "tailwindcss";` must remain the FIRST statement in `src/styles.css`.
- Mantine packages to install: runtime `@mantine/core`, `@mantine/hooks`; dev `postcss`, `postcss-preset-mantine`, `postcss-simple-vars`. Nothing else (no icon package, no `@mantine/notifications`, etc.).
- Breakpoint variables in `postcss.config.cjs` are required verbatim (`xs` 36em, `sm` 48em, `md` 62em, `lg` 75em, `xl` 88em).
- Spec ref: `docs/superpowers/specs/2026-08-17-mantine-setup-design.md`.

---

### Task 1: Install Mantine dependencies

**Files:**
- Modify: `package.json` (via pnpm)

**Interfaces:**
- Consumes: nothing.
- Produces: `@mantine/core`, `@mantine/hooks` in `dependencies`; `postcss`, `postcss-preset-mantine`, `postcss-simple-vars` in `devDependencies`.

- [ ] **Step 1: Install runtime packages**

Run:
```bash
pnpm add @mantine/core @mantine/hooks
```
Expected: pnpm resolves and installs the latest v9 versions with no peer-dependency errors (Mantine v9 has no required peer deps).

- [ ] **Step 2: Install PostCSS dev packages**

Run:
```bash
pnpm add -D postcss postcss-preset-mantine postcss-simple-vars
```
Expected: install completes; `postcss-preset-mantine` and `postcss-simple-vars` appear in `devDependencies`.

- [ ] **Step 3: Verify installation**

Run:
```bash
pnpm ls @mantine/core @mantine/hooks postcss postcss-preset-mantine postcss-simple-vars
```
Expected: all five packages listed, `@mantine/core` and `@mantine/hooks` at `^9.x`. Then run `pnpm build` — expected: production build succeeds (existing app still compiles after dependency additions).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install Mantine core, hooks, and PostCSS preset"
```

---

### Task 2: Add Mantine PostCSS config

**Files:**
- Create: `postcss.config.cjs`

**Interfaces:**
- Consumes: `postcss`, `postcss-preset-mantine`, `postcss-simple-vars` (Task 1).
- Produces: Vite auto-detects this file and runs it on every processed CSS asset. Later tasks rely on it to resolve Mantine's `$mantine-breakpoint-*` variables and apply `rem()`/preset transforms in `@mantine/core/styles.css`.

- [ ] **Step 1: Create `postcss.config.cjs`**

Create `postcss.config.cjs` at the repo root with exactly:

```js
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

- [ ] **Step 2: Verify Tailwind still builds with the config present**

Run:
```bash
pnpm build
```
Expected: build succeeds. (Fallback if `postcss-preset-mantine`/`postcss-simple-vars` mangles Tailwind output — double-processing failure: swap to Approach B by changing `vite.config.ts` to remove `tailwindcss()` and adding `'@tailwindcss/postcss': {}` as the FIRST plugin in `postcss.config.cjs`, then re-run build. Confirm with the user before switching.)

- [ ] **Step 3: Commit**

```bash
git add postcss.config.cjs
git commit -m "feat: add Mantine PostCSS preset configuration"
```

---

### Task 3: Import Mantine styles through the app stylesheet

**Files:**
- Modify: `src/styles.css:2`

**Interfaces:**
- Consumes: `postcss.config.cjs` (Task 2).
- Produces: `@mantine/core` component CSS bundled into the existing `?url` stylesheet asset served by `__root.tsx`.

- [ ] **Step 1: Add the Mantine styles import**

Edit `src/styles.css` so the imports are ordered like this (the append goes after the Tailwind import, before the `*` rule):

```css
@import "tailwindcss";
@import "@mantine/core/styles.css";

* {
  box-sizing: border-box;
}
```

- [ ] **Step 2: Verify the build processes Mantine CSS**

Run:
```bash
pnpm build
```
Expected: build succeeds and outputs a processed stylesheet asset containing Mantine styles (no PostCSS/simple-vars resolution errors).

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat: import Mantine core styles via app stylesheet"
```

---

### Task 4: Wire MantineProvider into the root document

**Files:**
- Create: `src/theme.ts`
- Modify: `src/routes/__root.tsx`

**Interfaces:**
- Consumes: `@mantine/core` styles (Task 3); consumed by the demo page (Task 6) and toggle (Task 5) via the `theme` it wraps.
- Produces: export `theme` from `@mantine/core`'s `createTheme`; modifies `RootDocument` so everything rendered inside `<body>` is inside `<MantineProvider theme={theme} defaultColorScheme="light">`, with `<html ...mantineHtmlProps>` and `<ColorSchemeScript defaultColorScheme="light" />` in `<head>`.

- [ ] **Step 1: Create `src/theme.ts`**

Create `src/theme.ts` with exactly:

```ts
import { createTheme } from '@mantine/core';

export const theme = createTheme({});
```

- [ ] **Step 2: Update `src/routes/__root.tsx`**

Replace the file contents with:

```tsx
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { theme } from '../theme'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'TanStack Start Starter',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" {...mantineHtmlProps}>
			<head>
				<HeadContent />
				<ColorSchemeScript defaultColorScheme="light" />
			</head>
			<body>
				<MantineProvider theme={theme} defaultColorScheme="light">
					{children}
					<TanStackDevtools
						config={{
							position: 'bottom-right',
						}}
						plugins={[
							{
								name: 'Tanstack Router',
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
					<Scripts />
				</MantineProvider>
			</body>
		</html>
	)
}
```

- [ ] **Step 3: Verify typecheck and build**

Run:
```bash
npx tsc --noEmit
```
Expected: no type errors (`mantineHtmlProps` and `ColorSchemeScript` are exported by `@mantine/core` v9). Then run `pnpm build`. Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/theme.ts src/routes/__root.tsx
git commit -m "feat: wrap app in MantineProvider with color scheme support"
```

---

### Task 5: Add the color scheme toggle component

**Files:**
- Create: `src/components/ColorSchemeToggle.tsx`

**Interfaces:**
- Consumes: `MantineProvider` context from Task 4.
- Produces: exported `ColorSchemeToggle` component (no props, no state lifted) used by the demo page (Task 6). It toggles `light` <-> `dark`, persists to localStorage (Mantine default manager), and is SSR-safe via `getInitialValueInEffect: true`.

- [ ] **Step 1: Create `src/components/ColorSchemeToggle.tsx`**

Create the directory `src/components` and the file with exactly:

```tsx
import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'

export function ColorSchemeToggle() {
	const { setColorScheme } = useMantineColorScheme()
	const computedColorScheme = useComputedColorScheme('light', {
		getInitialValueInEffect: true,
	})

	const isLight = computedColorScheme === 'light'

	return (
		<ActionIcon
			variant="default"
			onClick={() => setColorScheme(isLight ? 'dark' : 'light')}
			aria-label="Toggle color scheme"
		>
			{isLight ? <MoonIcon /> : <SunIcon />}
		</ActionIcon>
	)
}

function SunIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	)
}

function MoonIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	)
}
```

- [ ] **Step 2: Verify typecheck and lint**

Run both:
```bash
npx tsc --noEmit
pnpm check
```
Expected: no type errors; Biome reports zero problems (if Biome flags formatting, run `pnpm check --write` and re-verify).

- [ ] **Step 3: Commit**

```bash
git add src/components/ColorSchemeToggle.tsx
git commit -m "feat: add SSR-safe color scheme toggle"
```

---

### Task 6: Replace home page with a Mantine showcase

**Files:**
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `ColorSchemeToggle` (Task 5), `MantineProvider` (Task 4).
- Produces: home route renders Mantine `Stack`, `Title`, `Text`, `Card`, `Button`, `Badge`, `TextInput`, `Switch`, `Group` components plus the toggle. No new route links required.

- [ ] **Step 1: Replace `src/routes/index.tsx`**

Replace the file contents with:

```tsx
import { Badge, Button, Card, Group, Stack, Switch, Text, TextInput, Title } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'

import { ColorSchemeToggle } from '../components/ColorSchemeToggle'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
	return (
		<Stack p="lg" gap="md" maw={480} mx="auto">
			<Group justify="space-between">
				<Title order={1}>Mantine Playground</Title>
				<ColorSchemeToggle />
			</Group>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Text fw={500} size="lg">
					Welcome to Mantine!
				</Text>
				<Text c="dimmed" size="sm">
					Mantine is wired up and working alongside Tailwind CSS.
				</Text>
			</Card>
			<Group>
				<Button>Primary button</Button>
				<Button variant="light">Light button</Button>
				<Badge color="teal">Ready</Badge>
			</Group>
			<TextInput label="Playground input" placeholder="Type something..." />
			<Switch label="Dark mode friendly switch" defaultChecked />
		</Stack>
	)
}
```

- [ ] **Step 2: Verify typecheck, lint, and build**

Run all three:
```bash
npx tsc --noEmit
pnpm check
pnpm build
```
Expected: no type errors, zero Biome problems, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: render Mantine showcase on home page"
```

---

### Task 7: End-to-end verification

**Files:**
- None (verification only).

- [ ] **Step 1: Start the dev server and smoke-check the page**

Run:
```bash
pnpm dev
```
Expected: `vite dev --port 3000` starts. In a second terminal:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```
Expected: `200`. The returned HTML contains the server-rendered "Mantine Playground" title and a Mantine stylesheet link.

- [ ] **Step 2: Manual browser check of the toggle and color scheme**

Open http://localhost:3000 in a browser. Expected:
- No errors/warnings in the browser console (specifically no React hydration mismatches).
- Clicking the toggle (moon/sun button) switches the whole UI to dark/light.
- Reloading the page keeps the selected color scheme (persisted in localStorage) and shows no color flash.
- Mantine components render with Mantine styling (rounded card, padded buttons), independent of Tailwind.

- [ ] **Step 3: Production build + typecheck final pass**

Stop the dev server, then run:
```bash
pnpm build && npx tsc --noEmit && pnpm check
```
Expected: all three succeed with no errors.

- [ ] **Step 4: Confirm all work is committed**

Run:
```bash
git status --short && git log --oneline -8
```
Expected: clean working tree (only the previously-committed spec/docs untouched — the spec commit is `docs: add Mantine setup design spec`), and 6 feature commits from Tasks 1-6 present (`feat: install Mantine core, hooks, and PostCSS preset`, `feat: add Mantine PostCSS preset configuration`, `feat: import Mantine core styles via app stylesheet`, `feat: wrap app in MantineProvider with color scheme support`, `feat: add SSR-safe color scheme toggle`, `feat: render Mantine showcase on home page`).