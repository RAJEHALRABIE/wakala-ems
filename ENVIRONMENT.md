# Wakala EMS - Environment Variables Documentation

This document outlines the environment variables used in the Wakala EMS project, their purpose, and where they are utilized.

## Database Configuration

*   **`DATABASE_URL`**:
    *   **Purpose**: Connection string for the database.
    *   **Usage**: Backend.
    *   **Example**: `mysql://user:password@localhost:3306/wakala_ems`

*   **`DB_ROOT_PASSWORD`**:
    *   **Purpose**: Root password for the MySQL database, primarily used in Docker Compose setup.
    *   **Usage**: Docker Compose / Database setup.

*   **`DB_NAME`**:
    *   **Purpose**: Name of the database.
    *   **Usage**: Docker Compose / Database setup.

*   **`DB_USER`**:
    *   **Purpose**: Username for database access.
    *   **Usage**: Docker Compose / Database setup.

*   **`DB_PASSWORD`**:
    *   **Purpose**: Password for the database user.
    *   **Usage**: Docker Compose / Database setup.

## Authentication

*   **`JWT_SECRET`**:
    *   **Purpose**: Secret key used for signing JWT tokens. **Must be at least 32 characters long.**
    *   **Usage**: Backend (authentication).

*   **`LOGIN_ACCESS_CODE`**:
    *   **Purpose**: A specific access code required for initial user login.
    *   **Usage**: Backend (authentication procedure in `server/routers.ts`).

*   **`MASTER_KEY`**:
    *   **Purpose**: A master key required for sensitive administrative operations (e.g., deleting agents/clients, modifying settings).
    *   **Usage**: Backend (admin procedures in `server/routers.ts`).

## Manus OAuth

*   **`VITE_APP_ID`**:
    *   **Purpose**: Application ID for Manus OAuth.
    *   **Usage**: Frontend (Vite prefixed, so exposed to client-side code).

*   **`OAUTH_SERVER_URL`**:
    *   **Purpose**: URL of the Manus OAuth server.
    *   **Usage**: Backend (OAuth flow).

*   **`VITE_OAUTH_PORTAL_URL`**:
    *   **Purpose**: URL of the Manus OAuth portal for user interaction.
    *   **Usage**: Frontend (Vite prefixed, so exposed to client-side code).

## Manus Forge API

*   **`BUILT_IN_FORGE_API_URL`**:
    *   **Purpose**: URL for the backend Manus Forge API (used for AI features).
    *   **Usage**: Backend.

*   **`BUILT_IN_FORGE_API_KEY`**:
    *   **Purpose**: Server-side API key for Manus Forge. **Keep this secret.**
    *   **Usage**: Backend.

*   **`VITE_FRONTEND_FORGE_API_KEY`**:
    *   **Purpose**: Frontend API key for Manus Forge.
    *   **Usage**: Frontend (Vite prefixed).

*   **`VITE_FRONTEND_FORGE_API_URL`**:
    *   **Purpose**: URL for the frontend Manus Forge API.
    *   **Usage**: Frontend (Vite prefixed).

## Google Maps API

*   **`VITE_GOOGLE_MAPS_API_KEY`**:
    *   **Purpose**: API key for Google Maps, used for interactive maps.
    *   **Usage**: Frontend (Vite prefixed).

## S3 / Object Storage

*   **`S3_BUCKET`**:
    *   **Purpose**: Name of the S3-compatible storage bucket.
    *   **Usage**: Backend (document uploads in `server/storage.ts`).

*   **`S3_REGION`**:
    *   **Purpose**: AWS region for the S3 bucket (e.g., `me-south-1`) or `auto` for Cloudflare R2.
    *   **Usage**: Backend (document uploads in `server/storage.ts`).

*   **`S3_ACCESS_KEY_ID`**:
    *   **Purpose**: Access key ID for S3-compatible storage.
    *   **Usage**: Backend (document uploads in `server/storage.ts`).

*   **`S3_SECRET_ACCESS_KEY`**:
    *   **Purpose**: Secret access key for S3-compatible storage. **Keep this secret.**
    *   **Usage**: Backend (document uploads in `server/storage.ts`).

*   **`S3_ENDPOINT`**:
    *   **Purpose**: Custom endpoint for S3-compatible storage (e.g., Cloudflare R2).
    *   **Usage**: Backend (document uploads in `server/storage.ts`).

*   **`S3_PUBLIC_URL`**:
    *   **Purpose**: Public URL for accessing stored files (e.g., a custom domain for R2).
    *   **Usage**: Frontend/Backend (constructing public file URLs).

## Application

*   **`NODE_ENV`**:
    *   **Purpose**: Node.js environment mode (`development`, `production`).
    *   **Usage**: Backend (conditional logic, logging).

*   **`PORT`**:
    *   **Purpose**: Port on which the backend server will listen.
    *   **Usage**: Backend (server startup).

*   **`OWNER_OPEN_ID`**:
    *   **Purpose**: Open ID of the first user to log in, who will be designated as the owner.
    *   **Usage**: Backend (initial user setup/privileges).

*   **`OWNER_NAME`**:
    *   **Purpose**: Name of the owner.
    *   **Usage**: Backend (initial user setup/privileges).

## Google Analytics 4 (GA4)

*   **`GA4_PROPERTY_ID`**:
    *   **Purpose**: Google Analytics 4 property ID for tracking.
    *   **Usage**: Backend (analytics router in `server/routers.ts`).

*   **`GA4_CREDENTIALS`**:
    *   **Purpose**: JSON string containing service account credentials for GA4 API access. **Keep this secret.**
    *   **Usage**: Backend (analytics router in `server/routers.ts`).
