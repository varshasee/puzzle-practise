# CAT 2026 Puzzle Practice

Minimal daily practice app for Sudoku and Kakuro, designed for CAT 2026 preparation.
Runs from **March 14, 2026 → November 29, 2026** with progressive difficulty.

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local
# Fill in your Supabase URL + keys

# 3. Run database migration in Supabase SQL Editor
# (paste contents of supabase/migrations/001_initial.sql)

# 4. Generate puzzles
npm run gen:all

# 5. Start dev server
npm run dev
# Open http://localhost:3000
```

## Deploy to Production

See **CAT2026-Build-Deploy-Guide.docx** for the full step-by-step guide.

**Short version:**
1. Push code to GitHub
2. Create Supabase project → run migration → get API keys
3. Create Vercel project → connect GitHub → add env vars → deploy
4. Run `npm run gen:all` locally (writes to Supabase)
5. Share the `.vercel.app` URL with friends

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build for production |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Vitest unit tests |
| `npm run gen:sudoku` | Generate Sudoku puzzle pool |
| `npm run gen:kakuro` | Generate Kakuro puzzle pool |
| `npm run gen:all` | Generate all puzzles + seed calendar |

## Architecture

```
Next.js 16 (App Router)
  ├── Server Actions  →  Supabase Postgres (RLS)
  ├── Puzzle Engines  →  Deterministic TS (no LLM)
  └── Vercel          →  Auto-deploy on git push
```

## Training Phases

| Phase | Dates | Difficulty |
|-------|-------|-----------|
| Foundation | Mar 14 – Apr 12 | 2.0 → 3.5 |
| Core Build | Apr 13 – Jun 14 | 3.5 → 5.0 |
| Speed + Patterning | Jun 15 – Aug 16 | 5.0 → 6.5 |
| Advanced Reasoning | Aug 17 – Oct 4 | 6.5 → 8.0 |
| CAT Simulation Ramp | Oct 5 – Nov 15 | 8.0 → 9.5 |
| Taper + Maintenance | Nov 16 – Nov 29 | 8.0 → 7.5 |

## Assumptions

- Single-user-first: each person has isolated data via RLS
- Puzzle solutions are never sent to the client; validation is server-side
- Adaptation delta is bounded to ±1.5 from the calendar difficulty target
- Puzzle uniqueness is validated by a backtracking solver at generation time

## Cost

- **Free:** Vercel Hobby + Supabase Free Tier (for personal + small friend group)
- **Optional:** ~₹500/year for a custom `.in` domain
