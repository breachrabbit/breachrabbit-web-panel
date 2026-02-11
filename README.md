# breachrabbit-web-panel

Simple SSL certificates panel with:

- SQLite `certificates` table (`domain`, `issuer`, `not_before`, `not_after`, `auto_renew`, `last_renew_status`)
- API:
  - `GET /api/certificates`
  - `POST /api/certificates/issue`
  - `POST /api/certificates/renew`
  - `PATCH /api/certificates/:id/auto-renew`
- Hourly cron job for expiry check and auto-renew
- UI page: `/ssl-certificates` with filter "expiring < 30 days"

## Run

```bash
npm install
npm start
```

## Test

```bash
npm test
```
