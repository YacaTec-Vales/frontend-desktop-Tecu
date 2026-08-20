# frontend-desktop-Tecu

Frontend web (gerente) de taquizaschavez.com.mx.

## Stack
- Angular 22 + `@angular/build:application`
- Tailwind v4 + Flowbite (consumido de `frontend-global-styles`)
- Backend: `/api/v1/*` -> https://api.taquizaschavez.com.mx

## Build
```bash
npm ci
npm run build  # ng build -> dist/frontend-desktop-tecu/browser/
```

## Deploy staging
Auto-deploy via GitHub Actions on merge to `develop`. Ver
`infrastructure/docs/AUTO-REDEPLOY-STAGING.md`.

---
_updated: 2026-08-20 16:30 CST - test del flujo end-to-end_
