# CoffeeTech — Frontend

Web client for CoffeeTech: it lets a coffee grower register farms and sections, place them on a
map, read the live sensor diagnosis for each plot, browse historical reports, keep an agronomic
log, and manage the hub inventory. React + TypeScript, built with Vite; UI in Spanish and English
(the language switcher lives in the top bar).

## Requirements

- Node 18+
- A running backend (see `VITE_BACKEND_SERVICE_URL`) and, for the reference bands on the reports
  chart, the model service (`VITE_MODEL_SERVICE_URL`). The app degrades gracefully when the model
  service is absent: the chart is drawn without bands.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # Vite dev server, default http://localhost:5173
```

## Scripts

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`tsc --noEmit`) and produce the production bundle in `dist/`.
- `npm run preview` — serve the built bundle locally.
- `npm run typecheck` — type-check without emitting.

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_BACKEND_SERVICE_URL` — the backend API base URL.
- `VITE_OPENWEATHER_API_KEY` — OpenWeatherMap key, for the farm weather chip.
- `VITE_MODEL_SERVICE_URL` — the model service (FastAPI) that publishes the agronomic reference
  ranges the reports chart draws.

Maps and place search need no keys: OpenStreetMap for the street map, Esri World Imagery for the
satellite, and Photon for search and reverse geocoding.
