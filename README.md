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

Infrastructure is owned exclusively by the versioned OpenTofu stack in
[`golbi-ai/ops`](https://github.com/golbi-ai/ops/tree/main/tofu/rope-ladder-web).
The application repository never applies or mutates cloud configuration directly.
Each release selects its immutable Artifact Registry image in the ops stack and
uses a reviewed `tofu plan` and `tofu apply` to roll Cloud Run forward.
