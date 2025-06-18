# Store Review Backend

This is a secure Node.js backend that fetches data from Zoho Creator and exposes it to the frontend via `/api/stores`.

## How to Use

1. Set up a `.env` or use environment variables:
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `REFRESH_TOKEN`

2. Deploy on Render, Vercel, or your own server.

3. Access the store data at:
   ```
   GET /api/stores
   ```

Data is sanitized for public consumption and safe for frontend use.
