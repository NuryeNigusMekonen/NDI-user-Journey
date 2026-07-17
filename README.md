# Nine Dean — Quality-of-Jobs Journey Map

An interactive documentation app for the **Nine Dean Institute (NDI) Quality-of-Jobs platform** — a
PE-diligence tool that scores acquisition targets on workforce quality across three tenets: **Fair Pay
(A)**, **Paid Sick Leave (B)**, and **Affordable Healthcare (C)**.

This app is the **reviewer-facing companion** to the platform. It presents the three delivery artifacts
in one place, behind a sidebar view switcher:

| View | What it shows |
|---|---|
| **Journey Map** | The end-to-end flow — deal team → platform → engines A/B/C → NDI acquisition model — as an interactive React Flow / Mermaid diagram. 6 stages, 7 actors, the A→B and A→C cascade. |
| **Test Plan** | Test levels (unit / integration / E2E / smoke), the deal-team user path (U1–U8) mapped to real API endpoints, and test cases grouped by engine stage — each tagged with the edge cases it exercises. |
| **Simulated Data** | The 8-file edge-case census dataset catalog and the 27 input variations (E1–E27), each traced to its expected engine behavior. |

> The Test Plan and Simulated Data content mirrors the platform repo's design notes
> (`research/14-user-journey-test-plan.md`, `research/15-edge-case-census-spec.md`) and is **DRAFT** —
> pending team approval of the plan and confirmation of the dataset variations.

## Stack

React + Vite · Tailwind CSS · React Flow (`@xyflow/react`) · Mermaid + ELK layout · framer-motion ·
Supabase (collaboration / presence). Deployed on Vercel.

## Run locally

```bash
npm install
npm run dev        # Vite dev server
npm run build      # production build (what Vercel runs)
npm run preview    # preview the production build
```

Requires a `.env` for Supabase (see `.env.example`).

## Structure

```
src/
  App.jsx                 view switching (Journey / Tests / Data)
  components/
    Sidebar.jsx           nav + the view switcher
    TestsView.jsx         the Test Plan view
    DataView.jsx          the Simulated Data view
    GuideView.jsx …       journey-map views
  data/
    journeys.js           the journey-map content (6 stages, 7 actors)
    tests.js              test-plan content (levels, user path, cases)
    datasets.js           dataset catalog + E1–E27 variations
  editor/                 the React Flow / Mermaid canvas
  lib/ · hooks/ · store/  layout, sync, presence, state
```

## Deploy

`main` deploys to production on Vercel; feature branches get preview URLs. Work lands via a PR into
`main`.
