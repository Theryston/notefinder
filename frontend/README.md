# NoteFinder Frontend (Next.js)

## Development

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The app expects the FastAPI backend running at `BACKEND_URL` (default `http://localhost:8000`).

## Production

```bash
npm run build
npm start
```
