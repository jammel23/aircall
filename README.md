# Store Review Backend (with .env support)

This is a secure Node.js backend that fetches store data from Zoho Creator using a refresh token and serves it at `/api/stores`.

## Setup

1. Install dependencies:

    ```
    npm install
    ```

2. Create a `.env` file in the root directory with the following keys:

    ```
    CLIENT_ID=your_client_id
    CLIENT_SECRET=your_client_secret
    REFRESH_TOKEN=your_refresh_token
    ```

3. Run the server:

    ```
    node index.js
    ```

## Deployment

For Render/Vercel, configure the 3 environment variables in the dashboard.
