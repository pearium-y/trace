# Trace

> Between the pages, see the marks of persistence.

A paper-textured journal-style habit and plan tracking app: create habits, daily check-ins, heatmap review, periodic analytics reports, to help build and sustain habits. Pure front-end application, data is stored only in the browser's local storage, no server or account required.

## Features

### Projects & Tags
- **Independent projects**: each project owns its own habit list, heatmaps, reports and tags; switch the current project at any time from the sidebar (or the top bar on mobile)
- **All projects view**: aggregate completion heatmap and reports across every project
- **Free-form tags**: add custom text tags, rename them, change colors, and manage or delete them right while picking tags for a habit; built-in color tags cannot be deleted
- One habit belongs to exactly one project

### Plan Management
- **Two frequencies**: Daily / Weekly
- **Three goal types**:
  - Count-based (e.g., read 1 time per day)
  - Duration-based (e.g., run 2 hours per week)
  - No goal (simple check-in recording)
- Each plan can be customized with name, emoji icon, tags, a habit note and theme color; real-time card style preview during creation

### Search & Organization
- **Global search**: search habit names, tags, notes and project names across all projects
- **Sorting**: by default order, name, streak, 30-day completion, target value or creation date
- **Filtering**: by tag, frequency and goal type in the Today and Habit list views

### Internationalization
- Full Chinese / English interface, switchable in Settings

### Habit Notes
- Attach a free-form note to a habit itself, shown on its detail page and included in global search

### Check-in Recording
- Enter values corresponding to plan goals (count or minutes)
- Multiple entries on the same day only update that day's value, **no accumulation**
- Supports backdating any day's record (click on a heatmap cell)
- Add notes to each record for detailed completion descriptions
- Quick +1 check-in with stamp animation feedback

### Data Visualization
- **Per-plan heatmap**: GitHub‑style annual grid, color intensity reflects daily completion; click any cell to backdate
- **Weekly / Monthly / Yearly three‑dimension reports**:
  - Heatmap and bar chart
  - Completion rate, consecutive days, cumulative statistics
  - Note review (aggregates all record notes in the period)

### Data Backup
- **JSON export**: complete data backup for cross‑device migration
- **JSON import**: one‑click restore from backup file
- **CSV export**: all detailed records (with UTF‑8 BOM, Excel opens without garbled text) for further analysis in spreadsheet software

### Others
- Mobile‑first design (bottom tab navigation), desktop responsive (sidebar navigation)
- For no‑goal plans, check‑in marks completion; weekly plans are evaluated against the whole‑week cumulative value
- Consecutive days statistics (daily plans by day, weekly plans by week)

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Date handling | dayjs |
| Persistence | localStorage |
| Visualization | Hand‑drawn SVG (heatmap / bar chart, zero chart library dependencies) |
| Styling | CSS Modules + global design tokens |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/<your-username>/trace.git
cd trace

# Install dependencies
npm install

# Start the development server
npm run dev

# Production build (output to dist/)
npm run build

# Preview the production build locally
npm run preview
```

## Deployment

The build output is pure static files; deploy the `dist/` directory to any static hosting:

```bash
npm run build
```

- **Nginx / Apache**: copy the contents of `dist/` to the site root
- **Vercel / Netlify**: build command `npm run build`, output directory `dist`
- **GitHub Pages**: can use tools like [gh-pages](https://www.npmjs.com/package/gh-pages) to push `dist/` (`vite.config.ts` already has `base: './'` configured for sub‑path deployment)

## Data Notes

- All data (projects + tags + habits + records) is stored in browser localStorage (key: `trace-data-v2`), never uploaded to any server
- When switching devices or browsers, export a JSON backup via "Settings → Export JSON Backup" and import it in the new environment
- Upgrading from V1.0: if legacy data (`trace-data-v1`) is detected on startup, the app asks whether to migrate it (all labels become default tags, all habits go to the default project) or exit the page
- "Settings → Clear All Data" deletes all plans and records (requires double confirmation; backup is recommended)

## Project Structure

```
src/
├── App.tsx              # Application entry and routing (simple state‑based routing)
├── store.tsx            # Global state (Context + useReducer + localStorage persistence)
├── storage.ts           # Data parsing / validation / import / export
├── types.ts             # Core type definitions (Habit / DayRecord / DB)
├── components/          # Reusable components (heatmap, bar chart, record popup, bottom navigation, etc.)
├── pages/               # Pages (Today / Plans / Detail / Form / Report / Settings)
├── utils/               # Utilities (dates, statistics, formatting, CSV, download)
└── styles/              # Global styles and design system
```

## License

MIT
