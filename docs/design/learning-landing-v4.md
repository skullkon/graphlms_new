# Learning landing v4

Audience: beginners and practising developers, chosen by the user. Goal: first meaningful learning session and voluntary return, without personal/founder promotion.

## Implemented
- Warm editorial landing with locally stored generated construction artwork, sharp edges, cobalt project section and course-book covers.
- Two level choices near the opening screen, real first-lesson / first-project-stage destinations, browser-local remembered choice.
- Two small Go warm-ups with honest answer evaluation and explanations. These do not count as completed course tasks or impersonate execution of a test runner.
- Returning-user panel based only on existing known learning events and solved tasks. URLs resolved through the current content registry; no invented streaks, counts or testimonials.
- Existing course, project, account and CLI behaviour retained.

Art asset: `site/web/public/images/learning-construction.png`, generated for this page. Optimized by Next Image, responsive sizes and priority loading.

Lazyweb report: https://www.lazyweb.com/report/lazyweb/b1463dfb-128e-403b-a2fb-1e1832162075/?source=create
Report proposals include a memorable poster-style hero and an immediate interactive first task. These are hypotheses, not measured retention lifts for GraphLMS.

## Verified
- Production build successful (153 generated routes), local production server restarted on port 3000 with local project bridge enabled.
- 93 tests across 21 files passed; lint exits 0 with only existing Analytics image warnings.
- Browser: both path selections, persistence through reload, first beginner lesson, returning-panel update to that lesson, correct/incorrect feedback on both warm-ups.
- Checked 1440px and 390px layouts; no horizontal mobile overflow. No browser console errors observed.
- Evidence: `evidence/design-2026-09-28-v4/`.
