# Master Layout Design

## Overview

Replace the current `__root.tsx` shell component with a Mantine-idiomatic master layout that provides a center-aligned, responsive application shell for all routes.

## Architecture

Uses `AppShell` for structural chrome (header, sidebar, footer) and `Container` for centering route content at a max-width.

```
AppShell (layout="default")
├── AppShell.Header (60px)
│   ├── Burger (mobile-only toggle for sidebar)
│   ├── Logo / Title
│   └── ColorSchemeToggle (existing component)
├── AppShell.Navbar (width=260, breakpoint=sm, collapsible)
│   └── Navigation links (placeholder for future)
├── AppShell.Main
│   └── Container (size="md")
│       └── <Outlet /> (route content)
└── AppShell.Footer (centered text)
```

## Key Decisions

- **Approach A — Container-only with AppShell shell:** Uses AppShell for header/sidebar/footer structure and Mantine Container for center-aligning content. Most Mantine-idiomatic pattern.
- **`layout="default"`:** Navbar/sidebar height equals viewport minus header/footer. Header/footer span full width.
- **Sidebar collapsed on mobile:** `breakpoint="sm"` with `useDisclosure` toggled via Burger button.
- **Container `size="md"`:** Max-width 62em (~992px), suitable for playground content.
- **Reusable component:** Layout extracted into `src/components/AppLayout.tsx` to keep `__root.tsx` clean.

## File Changes

| File | Action |
|---|---|
| `src/components/AppLayout.tsx` | **New** — AppShell + Container layout component |
| `src/routes/__root.tsx` | **Modify** — Use AppLayout as shellComponent |

## Dependencies

None — all components come from `@mantine/core` already installed.

## Future-Proofing

- Sidebar navigation links are placeholder-ready for when routes are added.
- Header layout accommodates additional items (breadcrumbs, actions) without restructuring.
- Container size can be adjusted per-route via context if needed later.