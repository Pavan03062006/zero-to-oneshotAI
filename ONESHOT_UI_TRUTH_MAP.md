# ONESHOT UI Truth Map

Read-only audit performed 2026-07-21 against the repository source. No application code was changed and no browser session with authenticated seeded data was available; runtime-specific observations are marked **UNVERIFIED**.

## 1. Executive summary

ONESHOT is a TanStack Start/React application with Supabase + TanStack Query. The implemented product is a story workspace with authentication, story creation, dashboard, Story Bible routes, chapter writing, continuity scanning, Narrative Intelligence on the Story Bible overview, and Story Memory. The visual foundation is cohesive (warm pumice background, limestone surfaces, obsidian text, ember/primary accents, serif editorial headings), but route coverage and feature maturity are uneven. The most important redesign constraint is preserving existing autosave, generated content, continuity mutations, and role/security behavior.

## 2. Application route map

| Route | Access | Purpose | Implementation |
|---|---|---|---|
| `/` | Public | Landing page / product entry | Working; exact CTA copy/runtime **UNVERIFIED** |
| `/auth` | Public | Sign in / sign up | Working form flow; provider/session edge cases **UNVERIFIED** |
| `/dashboard` | Authenticated | Story list, health cards, recent stories | Working |
| `/new-universe` | Authenticated | Multi-step story creation | Working; foundation generation is separate dialog |
| `/universe/:id` | Authenticated | Story Bible overview + narrative cards | Working |
| `/universe/:id/dna` | Authenticated | Technical Story Foundation / entity management | Working but terminology-heavy |
| `/universe/:id/characters` | Authenticated | Character cards and search | Working |
| `/universe/:id/world` | Authenticated | Locations, organizations, objects, rules cards and search | Working |
| `/universe/:id/chapters` | Authenticated | Chapter list, editor, autosave, continuity, reading mode | Working; rich formatting is not implemented |
| `/universe/:id/continuity` | Authenticated | Scan selection, findings, evidence, filters, resolve/dismiss | Working within backend scope |
| `/universe/:id/timeline` | Authenticated | Readable events/timeline | Read-only/partial; exact interaction **UNVERIFIED** |
| `/universe/:id/versions` | Authenticated | Versions/revisions | Existing route; capabilities and reachability **UNVERIFIED** |
| `/universe/:id/memory` | Authenticated | Evidence-bounded Story Memory questions | Working; keyword matching, not semantic retrieval |
| `/_authenticated` | Guard | Auth redirect + shell | Working |
| Fallback / error routes | All | Router/root error handling | **UNVERIFIED**; no dedicated not-found route found |

## 3. Global shell audit

`src/components/app-shell.tsx` provides sticky header, ONESHOT logo link, responsive navigation, New story CTA, avatar dropdown, and sign out. Desktop workspace links are shown only when a `/universe/:id` pathname is present; global dashboard shows Home and New story. Mobile navigation is a menu toggle. Settings and Profile routes are not implemented; profile data is displayed in the dropdown only. No story switcher, global search, breadcrumbs, theme control, or explicit active-route styling beyond router classes are present. Focus rings exist on avatar/menu controls; broad focus and focus-return behavior is **UNVERIFIED**.

| Control | Actual behavior | Status |
|---|---|---|
| ONESHOT logo | Links `/dashboard` | WORKING |
| Home | Links dashboard | WORKING |
| Story Bible | Current story root | WORKING when in story |
| Write | Current story chapters | WORKING when in story |
| Continuity | Current story continuity | WORKING when in story |
| Plan | Current story timeline | PARTIALLY WORKING (read-only timeline) |
| New story | `/new-universe` | WORKING |
| Avatar | Opens email/name/sign-out menu | WORKING |
| Sign out | Calls auth signOut, redirects `/` | WORKING; failure toast |
| Mobile menu | Toggles nav | WORKING |

## 4. Page-by-page inventory

### Landing `/`

Purpose: explain ONESHOT and enter auth. Source: `src/routes/index.tsx`. Exact rendered sections, responsive menu, testimonials, pricing, and CTA destinations require browser verification (**UNVERIFIED**). Required redesign preservation: all working auth links and any public copy.

### Auth `/auth`

Email/password auth UI in `auth.tsx`, backed by `useAuth`. Form validation, loading/disabled submit, invalid credentials, sign-up success, verification, reset-password, expired session behavior are source/runtime **UNVERIFIED**. Unauthorized authenticated routes redirect here. Missing dedicated password-reset and email-verification screens are **MISSING STATE** unless handled externally by Supabase.

### Dashboard `/dashboard`

Queries `listProjects`; filters story titles; shows greeting, New story, three health cards, search, story cards with genre/status/premise/progress, loading skeletons, load error, and empty state. Story cards link to `/universe/:id`. “Story progress” is currently a fixed progress value, not a measured metric: **MISLEADING**. Health cards are static editorial summaries rather than fetched analytics: **MISLEADING/UNVERIFIED**. Search has no explicit no-match state beyond the generic empty state. Responsive grids collapse at Tailwind breakpoints.

### Create Story `/new-universe`

Four-step page (`The idea`, `Details`, `The feeling`, `Review`) backed by `createProject`. Inputs: premise (required before continue), title, genre, tone, optional inspiration/logline, POV, canon strictness slider. Back/Continue and Create story buttons; creation shows mutation disabled state and toast then navigates to story root. Missing required title is allowed (defaults Untitled universe). Browser refresh loses unsaved form state; close/back preservation is **UNVERIFIED**. POV and canon strictness are advanced fields despite simplified copy.

### Story Bible overview `/universe/:id`

Queries entities, documents, issues, events. Displays counts, canon-health progress, quick links, Narrative Intelligence cards (momentum/activity/focus/balance), recent events, limitations, and Story Memory quick link. Loading skeleton and friendly load error exist. Counts are direct; canon health is a deterministic approved/(approved+proposed) heuristic; narrative cards use available record counts. Quick links to timeline and memory are working. No story title/genre/tone metadata is currently shown here: **MISSING STATE**.

### Story Foundation `/dna`

Entity/relationship foundation management exists in `dna.tsx`; generation dialog is `generate-story-dna-dialog.tsx`. It displays technical entity records, status pills, generation progress, foundation quality estimates, section labels and regenerate affordances. The current dialog’s section regenerate buttons do not invoke a mutation: **MISLEADING OR NON-FUNCTIONAL**. Approval/edit persistence and leaving mid-generation are **UNVERIFIED**. Preserve generated data and query invalidation during redesign.

### Characters `/characters`

Queries entities + relationships, filters character entities, supports client-side search. Cards show avatar initials, name, role, canon status, summary, goal, fear, voice, arc, and relationship type badges. Loading skeleton, load error, no-character empty state, and no-search-match state exist. Cards are read-only; no profile route, edit, filter chips, chapter references, first/latest appearance, or notes are implemented: **IMPLEMENTED BUT NOT DISCOVERABLE / MISSING STATE** where data exists only in attributes.

### World `/world`

Queries entities and groups location, organization, object, world_rule. Search filters name/summary. Cards show name, summary, canon status. Category empty states, loading, and error states exist. No detail pages, filters, referenced chapters, or organization/location profile workflows are implemented. Rules are displayed as cards, not a separate explanatory page.

### Writing `/chapters`

Three-column layout: chapter list, `Editor`, continuity sidebar. Chapter list supports select and create; displays title and word count. No search, reorder, duplicate, archive, or chapter menu: **MISSING STATE / UNREACHABLE**. Editor loads document, title input, contentEditable text surface, debounced `updateDocument`, revision checkpoint, word count, save indicator, continuity scan, read-aloud controls, AI-assist dropdown, focus mode, and Escape exit. Save states: saving, saved, saved without checkpoint, idle; failed save resets to idle and toast, with text retained. Ctrl/Cmd+S manually updates document. Reading mode is read-aloud, not a visual reading-mode layout. Undo/redo, headings, lists, quotes, links, selection menu, rich formatting, offline/retrying states are **MISSING STATE**. Right sidebar displays continuity issues only; characters/rules/events/plot context are not present.

### Continuity `/continuity`

Queries documents/issues; chapter select; scan button; staged status copy; last scan summary; severity/status filter chips; evidence collapsibles; suggested next step; Resolve and Dismiss mutations. No-scan, no-findings, loading, and load-error states exist. Failed scan preserves prior query data only if query cache remains. Score display was removed from primary messaging. Confidence field is present in database but not mapped in `ConsistencyIssue`: **UNAVAILABLE**. Reopen/Keep/history/chapter navigation are not implemented. Scan only checks supported document/story data; timeline/prior-chapter scope is explicitly limited.

### Timeline `/timeline`

Route exists and is linked as Plan. It is a chronological event presentation based on existing events. Interactive timeline editing, branches, filtering, and full chapter navigation are **UNVERIFIED/NOT IMPLEMENTED** from current source inspection.

### Versions `/versions`

Route exists; revision/version presentation is present in source tree. Restore/compare behavior must not be assumed. Any disabled or placeholder actions should be labeled **MISLEADING** in a future browser audit; runtime coverage is **UNVERIFIED**.

### Story Memory `/memory`

Queries entities, documents, events, relationships, issues. Ask input supports Enter and Ask; suggested prompts; answer derives keyword matches from approved/current records; evidence cards show source labels and snippets; unsupported questions say evidence is insufficient; local recent-question history is story-isolated. Loading skeleton exists. No semantic retrieval, actual confidence calibration, deep reasoning, source navigation, or persistent server history. The answer’s “events/relationships/issues” are loaded but not rendered as related cards: **PARTIALLY WORKING**.

### Settings/Profile

No settings or profile route found. Avatar menu exposes display name/email and sign out only. Settings, profile editing, appearance, AI settings, deletion, and permissions UI are **MISSING STATE**.

## 5. Master action inventory (condensed)

| Area | Controls | Behavior/status |
|---|---|---|
| Auth | Sign in/up submit, mode switch, password fields | WORKING; edge states UNVERIFIED |
| Shell | Logo, Home, workspace links, New story, avatar, sign out, mobile toggle | WORKING except absent global settings/profile |
| Dashboard | New story, search, story cards | WORKING; fixed progress is MISLEADING |
| Create story | Back, Continue, Create story, selects, slider | WORKING; refresh persistence missing |
| Foundation | Generate, cancel, close, review foundation, regenerate labels | Generate WORKING; regenerate controls MISLEADING |
| Characters | Search, character cards | Search WORKING; cards read-only |
| World | Search, category cards | WORKING/read-only |
| Writing | Add chapter, select chapter, title/content edit, save shortcut, scan, read aloud, AI menu, focus | Core editor WORKING; AI menu guidance only; chapter management incomplete |
| Continuity | Chapter select, scan, severity/status chips, evidence disclosure, Resolve, Dismiss | WORKING within supported lifecycle |
| Timeline | Event links/cards | Read-only/UNVERIFIED |
| Memory | Ask, Enter, prompt chips, history chips | WORKING keyword evidence flow |

## 6. User scenario inventory

| Scenario | Entry → response | Failure/recovery | Audit status |
|---|---|---|---|
| Visitor | `/` → auth CTA | Auth destination **UNVERIFIED** | PARTIAL |
| Account/sign in | `/auth` → session → dashboard | Invalid credentials toast/form state **UNVERIFIED** | PARTIAL |
| No stories | Dashboard → empty → Create story | None | WORKING |
| Create story | Form → createProject → story root | Validation only premise; mutation error toast | WORKING |
| Foundation | Story root → generation dialog → result | Provider failure toast; partial persistence **UNVERIFIED** | PARTIAL |
| Write | Story → chapters → add/select/edit | Autosave failure keeps text; retry is implicit debounce/manual save | WORKING |
| Switch during save | Select another chapter | Potential pending-save race **UNVERIFIED** | RISK |
| Continuity | Select chapter → scan → findings | Friendly scan error toast | WORKING |
| Resolve/dismiss | Finding action → updateIssue → invalidate issues | Mutation error handling minimal | WORKING |
| Memory | Ask/prompt → keyword answer | Unsupported answer preserves page | WORKING |
| Mobile | Responsive grids/menu/focus editor | Detailed browser behavior **UNVERIFIED** | PARTIAL |
| Unauthorized/missing story | Guard/queries | Redirect/load error; 404 specifics **UNVERIFIED** | PARTIAL |
| Sign out | Avatar → sign out → `/` | Toast on failure | WORKING |

## 7. Component inventory

### Shared/product components

| Component | File | Used by | Audit |
|---|---|---|---|
| AppShell | `src/components/app-shell.tsx` | Authenticated routes | Retain; standardize nav states |
| ContinuityScanButton | `src/components/continuity-scan-button.tsx` | Chapters, continuity | Retain; improve failure/retry status |
| GenerateStoryDnaDialog | `src/components/generate-story-dna-dialog.tsx` | Foundation/root | Retain; wire/hide regenerate controls |
| StoryDevelopmentDialog | `src/components/story-development-dialog.tsx` | Foundation/plan surfaces | Terminology and availability require audit |
| CanonPill | `dna.tsx` export | Characters/world | Retain; standardize status semantics |
| UI primitives | `src/components/ui/*` | Broad app | Mostly shadcn/Radix; retain, standardize spacing/radii |

### Primitive inventory

Button, input, textarea, select, label, card, badge, avatar, progress, skeleton, dialog, dropdown-menu, collapsible, tabs, table, alert, alert-dialog, drawer, sheet, tooltip, popover, command, sidebar, navigation-menu, separator, scroll-area, pagination, calendar, carousel, chart, checkbox, radio-group, slider, switch, toggle, toggle-group, form, breadcrumb, menubar, context-menu, aspect-ratio, sonner. Many are unused by current pages and are **IMPLEMENTED BUT NOT DISCOVERABLE** until mapped.

## 8. Visual design audit

Global styles use warm pumice background, limestone/card surfaces, obsidian text, chalk inverse text, ember accent, primary/secondary semantic colors, serif display typography, rounded cards/pills, subtle borders, gradients and soft shadows. Cards commonly use `border-border/60 bg-card/60`; headings use `font-serif`; labels use uppercase tracking. Strengths: cohesive editorial palette, clear card primitives, consistent skeletons, restrained motion. Weaknesses: duplicated card padding/radius recipes, uppercase technical labels, frequent muted text with uncertain contrast, mixed terminology (universe/story, Story DNA/Foundation, Plan/timeline), fixed dashboard progress, and inconsistent mobile density. Focus states exist on Radix controls; custom chips/icon buttons need consistent visible focus.

## 9. Accessibility and responsive audit

Good: semantic headings in most pages, label associations for key inputs, `aria-label` on icon controls in several places, keyboard Enter in Memory, Escape focus-mode exit, Radix dialogs/dropdowns/selects. Gaps: contentEditable lacks rich-text semantics beyond textbox, custom filter chips lack `aria-pressed`, status is often color/text dependent, focus return after dialogs is **UNVERIFIED**, no skip link, no global reduced-motion policy visible, and long evidence/card layouts need mobile testing. Desktop grids collapse to one/two columns at Tailwind breakpoints; shell has mobile menu; chapters uses three-column `lg` layout but sidebars are not independently collapsed.

## 10. State inventory

| Page | Loading | Empty | Error | Success | Missing/weak |
|---|---|---|---|---|---|
| Dashboard | Skeleton cards | No stories | Load error | Toast/project navigation | No-match, precise progress |
| Create | Mutation button text | N/A | Toast | Story created toast | Draft persistence |
| Foundation | Staged copy | Partial sections **UNVERIFIED** | Toast | Result summary | Regeneration/action truth |
| Chapters | Skeleton list/editor | No chapters/select prompt | Load/save toast | Saved/checkpoint states | Offline/retry, rich editor |
| Characters | Skeleton grid | No characters/no matches | Load error | N/A | Detail/edit |
| World | Skeleton | Per-category empty | Load error | N/A | Detail/filter |
| Continuity | Scan staged copy/skeleton | No scan/no findings | Friendly load/scan | Toast, resolve/dismiss | History/confidence |
| Memory | Skeleton | No question/history | Unsupported evidence state | Answer/evidence | Related record rendering |
| Timeline/Versions | **UNVERIFIED** | **UNVERIFIED** | **UNVERIFIED** | **UNVERIFIED** | Browser audit needed |
| Auth/Landing | **UNVERIFIED** | N/A | **UNVERIFIED** | **UNVERIFIED** | Recovery screens |

## 11. Misleading, non-functional, and undiscoverable UI

- Dashboard story progress is hard-coded (`30`): **MISLEADING**.
- Foundation result regenerate buttons are rendered without mutation behavior: **MISLEADING OR NON-FUNCTIONAL**.
- Foundation “approved”/section workflow is represented visually but persistence and independent approval are **UNVERIFIED**.
- AI-assist menu previously exposed disabled unavailable actions; current menu provides guidance to write/select text, but actual AI rewrite actions are not implemented.
- Chapter management requirements (search, reorder, duplicate, archive) are **MISSING STATE**.
- Settings/Profile routes and editing are **MISSING STATE**.
- Timeline/version capabilities beyond existing read-only route are **UNVERIFIED**.
- Story Memory related records are loaded but not fully rendered: **PARTIALLY WORKING**.

## 12. Page redesign briefs and priority

| Priority | Page | Redesign brief |
|---|---|---|
| P0 | Landing/Auth | Clarify product promise and auth recovery; preserve destinations/session behavior. |
| P0 | Dashboard | Replace static health/progress with truthful hierarchy; retain story navigation and empty/error states. |
| P0 | Create Story/Foundation | Simplify input hierarchy; make generation/approval actions truthful and recoverable. |
| P0 | Writing | Standardize editor chrome, save states, chapter management, mobile/focus behavior without changing persistence. |
| P1 | Story Bible overview/Characters/World | Unify editorial cards, terminology, search, and progressive disclosure. |
| P1 | Continuity | Make evidence/severity/status dominant; preserve resolve/dismiss mutations and limitations. |
| P1 | Story Memory | Improve answer/evidence/related-record hierarchy; preserve bounded keyword behavior. |
| P2 | Timeline/Versions/Plan | Audit actual runtime, then clarify read-only vs available actions. |
| P3 | Fallback/auth edge states | Add consistent not-found, unauthorized, session-expiry, network recovery once verified. |

## 13. OpenAI Build Week demo path

Landing → Auth/demo entry → Dashboard → New story → Foundation generation → Foundation result → Chapters/Writing → Continuity scan → Story Memory → Story Bible/Narrative Intelligence. Judges should immediately understand: ONESHOT turns an idea into a structured story, lets the writer draft, checks evidence-backed continuity, and answers story questions. Risky states to avoid: provider failure, no local auth data, empty generated foundation, hard-coded dashboard metrics, and unverified route behavior.

## 14. Recommended redesign sequence

1. Verify public/auth/error routes in a browser at 1440/1024/768/390px.
2. Fix truthfulness blockers (hard-coded progress, non-functional regenerate buttons, unsupported labels).
3. Establish shared page header, card, status, empty/error, and evidence primitives.
4. Redesign P0 flow end-to-end while preserving mutations and query keys.
5. Standardize Story Bible/Continuity/Memory evidence hierarchy.
6. Complete mobile/focus/accessibility passes.
7. Add state-level tests for all verified workflows.

## 15. Files and commands inspected

Routes: `src/routes/*.tsx` (30 route declarations; 17 user-facing/dynamic route files including generated Story Memory). Components: `src/components/*` plus 38 UI primitives. Data/API: `src/lib/queries.ts`, `src/lib/story-engine.ts`, `src/lib/auth.tsx`, `src/lib/types.ts`. Styling: `src/styles.css`, Tailwind classes, `src/components/ui/*`. Commands used: `rg --files src/routes src/components`, `rg -n 'createFileRoute'`, control inventory search, targeted `Get-Content`/`Select-String`, and repository verification commands.

## 16. Verification limitations

This deliverable is intentionally an implementation-grounded source audit, not a completed browser/device audit. No code was modified. Authenticated multi-story seeded data, actual browser screenshots, network/offline simulation, screen-reader testing, 1440/1024/768/390 viewport inspection, and all runtime route error boundaries remain **UNVERIFIED**. These must be completed before final visual redesign sign-off.

## Terminal summary

- Route declarations inspected: 30
- User-facing route files inspected: 17
- Components inspected: 38 UI primitives plus 5 product components
- Interactive control matches found: 152 source occurrences (not deduplicated)
- Complete scenarios documented: 12 grouped scenario families (35 requested cases mapped across them)
- Misleading/non-functional controls identified: 4
- Missing or unverified state groups identified: 18
- Highest-priority redesign pages: Landing/Auth, Dashboard, Create Story/Foundation, Writing Workspace
