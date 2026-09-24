# Aegis3D API (NestJS)

Sovereign geospatial backend for Aegis3D. CMS-driven configuration — **no hardcoded product copy, currency, legal text, or tier labels in application code**.

## Stack

- NestJS 11
- MongoDB + Mongoose
- Helmet, compression, class-validator
- Flat collections (no nested document trees)

## Flat CMS collections

| Collection | Purpose |
|---|---|
| `currencies` | ISO currency rows (`NGN`, symbol, default flag) |
| `cms_copy` | Page field strings (`pageKey` + `fieldKey` + `locale`) |
| `workspace_tiers` | Provisioning profiles (refs `currencyCode`) |
| `legal_documents` | ToS / NDPR markdown bodies |
| `compliance_badges` | Register + footer badges |
| `latency_nodes` | Footer latency strip |
| `site_settings` | Copyright, liaison email, etc. |
| `users` | Operators (refs `workspaceTierCode`) |

## Quick start

```bash
cp .env.example .env
# set MONGODB_URI

npm install
npm run seed
npm run start:dev
```

API base: `http://localhost:4000/v1`

### Key routes

- `GET /v1/health`
- `GET /v1/cms/pages/register`
- `GET /v1/cms/legal/:slug`
- `GET /v1/cms/currency/default`
- `POST /v1/auth/google/start`

## Google SSO

Leave `GOOGLE_CLIENT_ID` empty for stub redirect to the frontend dashboard. Set Google OAuth env vars for real Workspace SSO.
