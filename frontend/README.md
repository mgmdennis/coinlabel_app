# NumisTag — Frontend

React single-page app built with **[Vite](https://vitejs.dev/)** and the **[Mantine](https://mantine.dev/)** UI framework.

## Available scripts

Run these from the `frontend/` directory.

### `npm run dev`

Starts the Vite dev server at [http://localhost:3000](http://localhost:3000) with hot module replacement.
Requests to `/api` are proxied to the Express backend at `http://localhost:5001` (see `vite.config.js`).

### `npm run build`

Builds the production bundle to the `build/` folder (configured via `build.outDir` in `vite.config.js`).
The Express server (`backend/server.js`) serves this folder in production, and Heroku's
`heroku-postbuild` step runs this build automatically.

### `npm run preview`

Serves the contents of `build/` locally to preview the production bundle.

## Configuration

- **API base URL** is resolved in `src/config.js` from `import.meta.env.VITE_API_URL`.
  Locally it defaults to `http://localhost:5001/api`; in production it uses same-origin `/api`.
- **Theme** lives in `src/theme.js` (Mantine theme: brand colors, fonts).

## Local development

```bash
# from the repo root — start the backend (requires MongoDB + .env)
npm start

# in another terminal — start the frontend dev server
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server proxies API calls to the backend on port 5001.
