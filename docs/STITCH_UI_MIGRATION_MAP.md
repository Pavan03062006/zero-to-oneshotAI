# Stitch UI Migration Map

## Audit status

The Stitch export is present as `C:\Users\HAIL\Downloads\stitch_oneshot_editorial_design_system.zip` and was extracted for inspection to a temporary Downloads folder. It contains the Cinematic Story OS design specification plus 14 screen/state folders with HTML and PNG references.

The real ONESHOT repository remains the functional source of truth. No application code, routes, API contracts, schema, migrations, RLS, Edge Functions, or generated database types were changed during the initial audit.

## Stitch screens discovered

`oneshot_landing_page`, `oneshot_dashboard`, `oneshot_create_story_desktop`, `oneshot_foundation_generation_loading`, `oneshot_foundation_review_desktop`, `oneshot_writing_workspace`, `oneshot_story_bible_desktop`, `oneshot_story_bible_mobile`, `oneshot_characters_desktop`, `oneshot_characters_mobile`, `oneshot_world_knowledge_desktop`, `oneshot_story_consistency_desktop`, `oneshot_story_memory_desktop`, `oneshot_story_timeline_desktop`, and `oneshot_system_states_components`. Each discovered screen includes a `code.html` and `screen.png` reference. No separate font files or application runtime package were included.

## Repository inspected

Real application: `C:\Users\HAIL\Downloads\zero-to-oneshotAI-main\zero-to-oneshotAI-main`

- TanStack Start/React + Vite
- TanStack Router and TanStack Query
- Supabase client/auth/data access
- Tailwind CSS v4 + shadcn/Radix primitives
- Existing warm Caldera palette in `src/styles.css`
- Story Foundation, Writing Workspace, Story Bible, Continuity, Narrative Intelligence, Story Memory routes
- Existing tests and production build scripts

## Screen-to-route mapping

Because no separate Stitch screens exist, this is the safe target map for a future visual migration:

| Stitch screen | Real route | Functional source | Unsupported visual controls to omit |
|---|---|---|---|
| Landing | `/` | `src/routes/index.tsx` | Testimonials, pricing, logos, or metrics unless real |
| Auth | `/auth` | `src/routes/auth.tsx`, `src/lib/auth.tsx` | OAuth providers not implemented |
| Home | `/dashboard` | `listProjects`, React Query | Fixed/demo progress values |
| Create Story | `/new-universe` | `createProject` | Unsaved server draft claims |
| Foundation | `/universe/:id`, `/dna`, generation dialog | Story Engine + entity queries | Non-functional regenerate/approve actions |
| Write | `/universe/:id/chapters` | document queries, autosave, revisions | Rich-text, reorder, duplicate, archive, rewrite actions |
| Story Bible | `/universe/:id`, `/characters`, `/world` | entity/relationship/event queries | Unsupported profile fields/references |
| Continuity | `/universe/:id/continuity` | scan mutation, issue queries | Confidence scores, history, automatic fixes |
| Story Memory | `/universe/:id/memory` | bounded keyword evidence matching | Semantic search, graph reasoning, fabricated citations |
| Plan/Timeline | `/universe/:id/timeline` | existing read-only event route | Timeline editing/planning engine |
| Versions | `/universe/:id/versions` | existing route/revisions | Compare/Restore unless runtime proves supported |

## Existing design system to retain/refine

`src/styles.css` already defines pumice canvas, limestone surfaces, obsidian text, ember primary, sulfur accent, warm muted text, semantic borders, serif display typography, rounded controls, and Tailwind theme variables. Future migration should consolidate repeated arbitrary classes into semantic utilities, retain the warm editorial palette, add explicit focus/selection/overlay tokens, and introduce a single motion policy with reduced-motion support.

No fonts or images were migrated because no independent Stitch assets were found. Existing `/public/logo.png` remains the only verified brand asset. No local Windows path is used in application code.

## Reusable migration components proposed (not yet implemented)

- `MotionPage`, `MotionSection`, `StaggerGroup`, `StaggerItem`, `AnimatedPresencePanel`
- `PageHeader`, `StoryStatus`, `EmptyState`, `ErrorState`, `SaveIndicator`, `EvidenceBlock`
- Responsive shell variants for editorial pages versus writing mode

These are design targets only until a real Stitch export is supplied. Existing Radix dialogs, dropdowns, selects, cards, buttons, skeletons, and toasts should be reused.

## Responsive and accessibility requirements

- Validate 1440, 1024, 768, and 390px in a browser before claiming parity.
- Preserve mobile shell menu, three-panel writing recomposition, readable evidence, long-title wrapping, and touch targets.
- Add/retain visible focus rings, semantic headings, `aria-live` save/generation/scan announcements, `aria-expanded` disclosures, `aria-pressed` filter chips, and reduced-motion behavior.
- Do not animate the contentEditable surface or caret.

## Motion mapping

Once the export and compatible motion dependency are available, use one library only. Apply short opacity/8–16px entrance transitions, restrained card stagger, disclosure height/opacity, scan/foundation staged progress, calm shell transitions, and no typing simulation. Respect `prefers-reduced-motion` and avoid layout-shifting width/height animations except small disclosures.

## Risks and constraints

1. Pixel-accurate Stitch migration cannot be performed without the actual export files.
2. The current package does not include Framer Motion; an attempted `npm install framer-motion --save` did not complete in this environment, so no dependency or animation architecture was introduced.
3. Existing UI truth-map findings remain binding: hard-coded dashboard progress, non-functional foundation regenerate affordances, missing chapter-management actions, and unverified fallback routes must not be disguised by visual redesign.
4. Browser screenshots, authenticated seeded data, and viewport comparison are not available in this checkpoint.

## Design reference inspected

`cinematic_story_os/DESIGN.md` specifies warm near-white/pumice surfaces, obsidian text, orange/ember secondary accent, EB Garamond for display/prose, Geist for UI, 4–80px spacing, restrained tonal elevation, 12-column editorial grid, 700–800px reading width, and reduced visual noise. These tokens are compatible in spirit with the existing ONESHOT palette but differ in exact values and typography; migration should reconcile rather than blindly replace existing production tokens.

## Files examined

`package.json`, `src/styles.css`, `src/routes/*`, `src/components/*`, `src/lib/auth.tsx`, `src/lib/queries.ts`, `src/lib/story-engine.ts`, `src/lib/types.ts`, tests, generated build output, and all Stitch `code.html`, `screen.png`, and `DESIGN.md` files.

## Next safe checkpoint

The export is now available and mapped. The next implementation checkpoint is shell/tokens first, followed by landing/auth/dashboard, then creation/foundation, writing, Story Bible, continuity/memory, and timeline. Framer Motion is not currently installed; adding it should be a separate dependency checkpoint after confirming package installation succeeds.
