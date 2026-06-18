# Frontend CLAUDE.md

## Dev Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # vue-tsc type-check + Vite production build
npm run preview    # Preview production build locally
npm run test:unit  # Vitest unit tests
npm run lint       # ESLint (.vue, .ts, .tsx)
```

## Ionic Theming Rule

There is no `theme/variables.css` — Ionic CSS custom properties come from the
`@ionic/vue/css/core.css` import in `main.ts`.

**For Ionic components**, always use the `color` prop with semantic names:
```html
<ion-toolbar color="primary">
<ion-spinner color="danger">
<ion-button color="success">
```

**For custom CSS**, reference `--ion-color-*` variables, not arbitrary hex or
Tailwind color classes:
```css
/* CORRECT */
color: var(--ion-color-primary);
background: var(--ion-color-danger);

/* WRONG */
color: #ef4444;
color: theme('colors.red.500');
```

Available semantic colors: `primary`, `secondary`, `tertiary`, `success`,
`warning`, `danger`, `dark`, `medium`, `light`.

Exception: the sidebar in `App.vue` intentionally uses hardcoded Bridgestone
brand colors (`#ef4444`, `#111827`). Do not refactor these to `--ion-color-*`.

## Pinia Store Pattern

Stores use the **Composition API setup syntax** — no Options API (`state/getters/actions`).

```ts
export const useXxxStore = defineStore('xxx', () => {
  // state — ref()
  const items = ref<Item[]>([]);
  const loading = ref(false);

  // getters — computed()
  const count = computed(() => items.value.length);

  // actions — plain async functions
  const fetchItems = async () => { ... };

  return { items, loading, count, fetchItems }; // always explicit return
});
```

Auth store (`stores/auth.ts`) persists token + user to `localStorage` and sets
`api.defaults.headers.common['Authorization']`. It is initialized in `main.ts`
**before** `router.isReady()` to avoid a redirect race on page reload.

## Route / Page Structure

- Router: `src/router/index.ts` — uses `@ionic/vue-router` (not plain vue-router)
- Pages: `src/pages/` with subfolders `auth/`, `operators/`, `merit/`,
  `misconduct/`, `blockchain/`, `reports/`, `admin/`
- Route meta fields:
  - `requiresAuth: boolean` — defaults to `true` when absent
  - `roles: string[]` — allowed roles; absent means all authenticated users
- Guard in `router.beforeEach`: unauthenticated → `/login`,
  wrong role → `/dashboard`, authenticated on `/login` → `/dashboard`

## Hard Constraints

- **Do not modify `backend/`** under any circumstance.
- **Do not change the router structure** (paths, meta, guard logic) without
  asking first — role-based access control depends on it.
- **Do not install new npm packages** without asking first.
