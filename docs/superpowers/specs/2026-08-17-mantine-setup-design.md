# Mantine Setup Design

Date: 2026-08-17

## Goal

Set up Mantine (v9, latest) in the existing TanStack Start app so the repo ("mantine-playground") can be used to experiment with Mantine components, keeping the current Tailwind CSS v4 setup for utility classes.

## Decisions

| Question | Decision |
| --- | --- |
| Tailwind relationship | Keep both — Mantine alongside Tailwind |
| Package scope | Core + hooks only (`@mantine/core`, `@mantine/hooks`) |
| PostCSS | Mantine's recommended preset (`postcss-preset-mantine` + `postcss-simple-vars`) |
| Color scheme | Light + dark with a persisted client-side toggle |
| Setup approach | A — keep `@tailwindcss/vite` plugin, add Mantine-only PostCSS config |

## Architecture

### 1. Dependencies

- Runtime: `@mantine/core`, `@mantine/hooks` (peer deps auto-installed by pnpm).
- Dev: `postcss`, `postcss-preset-mantine`, `postcss-simple-vars`.

### 2. PostCSS config

New `postcss.config.cjs` at repo root with only Mantine plugins (Tailwind stays on the Vite plugin in `vite.config.ts`):

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
}
```

### 3. App integration

- `src/styles.css`: add `@import "@mantine/core/styles.css";` immediately after `@import "tailwindcss";`. Vite resolves the package import and bundles it into the existing `?url` stylesheet asset, so the SSR-safe `<link>` in `__root.tsx` is unchanged.
- `src/routes/__root.tsx`:
  - Import `ColorSchemeScript`, `MantineProvider`, `mantineHtmlProps`, and `theme` from `src/theme`.
  - `<html lang="en" {...mantineHtmlProps}>` and `<ColorSchemeScript defaultColorScheme="light" />` inside `<head>` (prevents SSR hydration warning and pre-hydration color flash).
  - Wrap `<body>` content in `<MantineProvider defaultColorScheme="light" theme={theme}>`. TanStack devtools stay as-is.
- Tailwind coexistence: Tailwind's preflight is in cascade `@layer base`; Mantine's unlayered component CSS wins on Mantine components while Tailwind utilities remain available for custom layout.

### 4. Theme + toggle

- `src/theme.ts`: `export const theme = createTheme({})` — empty override placeholder, single source for future theming.
- `src/components/ColorSchemeToggle.tsx`: `ActionIcon` toggle using `useComputedColorScheme('light', { getInitialValueInEffect: true })` (SSR-safe) and `useMantineColorScheme()`. Selection persists to localStorage via Mantine's default manager. Icons are inline SVGs (no icon library, core+hooks only).

### 5. Demo page

`src/routes/index.tsx`: replace the Tailwind-only home page with a small Mantine showcase (Title, Text, Button, Card, TextInput, Switch, Badge, Stack) plus `ColorSchemeToggle`, proving the setup in both color schemes.

## Error handling / risks

- SSR hydration mismatches are prevented by `mantineHtmlProps` + `ColorSchemeScript` + `getInitialValueInEffect: true` on the computed color scheme hook.
- If `postcss.config.cjs` conflicts with `@tailwindcss/vite` (double-processing visible in dev/build), fall back to Approach B: replace `@tailwindcss/vite` with `@tailwindcss/postcss` as the first plugin in `postcss.config.cjs` (this combination is proven in the TanStack Start + Mantine + Tailwind v4 community template).

## Verification

1. `pnpm dev` — app loads with no React hydration errors; toggle flips color scheme and that choice survives reload (localStorage).
2. `pnpm build` — production build succeeds.
3. `npx tsc --noEmit` — typecheck passes.
4. `pnpm check` (Biome) — lint/format passes.