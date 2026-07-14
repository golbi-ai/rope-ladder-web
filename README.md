# rope-ladder web

The public website for [rope-ladder](https://github.com/golbi-ai/rope-ladder): installation, documentation, and a browser for reviewed public curricula.

`/api/catalog` reads the latest `main` branch of [rope-ladder-lesson-plans](https://github.com/golbi-ai/rope-ladder-lesson-plans). The site has no analytics, accounts, or user data collection.

## Local development

```bash
cd web && npm ci && npm run build
cd .. && go run .
```

Use `npm run dev` in `web/` during frontend work; it proxies `/api/catalog` and `/health` to a local Go server at port 8080.

## Deployment

The OpenTofu configuration under [`infra/gcp`](infra/gcp) follows the same shared-project, Cloud Run, Artifact Registry, and keyless GitHub Actions identity pattern as decide-web. It creates the `rpldr.golbi.ai` domain mapping but does not manage external DNS.
