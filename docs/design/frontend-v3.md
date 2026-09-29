# GraphLMS — frontend v3

Direction: light developer product, restrained cobalt accent, sharp geometry, clear type hierarchy, thin shared borders. Landing at `/`; course library retained at `/learn`. Horizontal global navigation replaces the left global sidebar, leaving a single contextual stage rail in projects.

## References inspected on 21st.dev

- https://21st.dev/@shadcnblockscom/components/hero-195-1 — measured headline scale and concise primary action.
- https://21st.dev/@mikolajdobrucki/components/hero-section — Launch UI, MIT; clear product framing and spacing.
- https://21st.dev/@lyanchouss/components/hero-minimalism — typography-led hierarchy and restrained framing.

Visual references only; no paid component source copied or additional registry dependencies installed. Implementation uses existing React, Lucide, Radix and CSS. Landing's interactive protocol examples are explicitly labelled examples, not fabricated screenshots or claimed test results.

Lazyweb report: https://www.lazyweb.com/report/lazyweb/2a6ea617-e385-4932-9723-6d295958fde3/?source=create

Adopted reading focus and reduced competing navigation. Did not adopt inline browser execution: the authorized workflow remains local development and local testers.

## Preserved

Russian project content, source attribution, local CLI commands, language selection, report polling and stage progress; existing course/practice/auth/team paths, search and progress features.

## Verification

- Production build succeeded (153 generated routes); local production server running on port 3000 with project bridge enabled.
- Vitest: 20 files, 89 tests passed. Lint exits 0; pre-existing Analytics.tsx image warnings remain.
- Browser QA at 1440px and 390px: no horizontal document overflow in project workspace; mobile menu and stage disclosure, stage links, language select, global search, library filter, protocol examples, FAQ verified.
- Screenshots saved in `evidence/design-2026-09-28-v3/`.
