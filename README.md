# Company Nexus

Company Nexus is an internal operations hub for the team. It brings together daily tools, FAQs, knowledge base articles, quick links, team resources, calendars, stock exchange references, and an master app list in a single interface.

The app supports two operating modes:

- `Firebase mode`: shared auth and live Firestore-backed data
- `Local mode`: browser-local storage with a lightweight local login flow for development

It also includes a Gemini-powered assistant that can answer questions and propose writes with explicit confirmation before data is saved.

## What The App Includes

- A dashboard with metrics, clocks, market resources, and quick access panels
- Search across tools, FAQs, KB articles, and links
- Team directory and shared calendar views
- Master application directory
- AI assistant modes for knowledge lookup, hub support, and confirm-before-write workflows
- Optional Firebase sync for shared team data

## Tech Stack

- `React 19`
- `TypeScript`
- `Vite`
- `Express`
- `Firebase Auth + Firestore`
- `Google Gemini API`
- `Tailwind CSS v4`
- `motion`
- `Vercel` for deployment

## Project Structure

```text
src/
  components/    UI sections, modals, chat, and shared motion primitives
  hooks/         App state and data orchestration
  lib/           Auth, Firebase, formatting, and helper utilities
  data/          Seed and static data
  services/      Repository layer for shared data access
server/
  agent/         Gemini agent runtime
  auth/          Request authentication helpers
  data/          Proposal persistence and audit helpers
  http/          API handlers for agent and confirmation flows
```

## Local Development

### Prerequisites

- `Node.js`
- `npm`

### Install

```bash
npm install
```

### Configure Environment

Copy `.env.example` to `.env` and fill in the values you need.

Minimum setups:

- For app shell + AI agent locally: set `GEMINI_API_KEY`
- For shared Firebase auth/data: set the `FIREBASE_*` variables
- For legacy local login: optionally set `HUB_USERNAME`, `HUB_PASSWORD`, and `VITE_HUB_USERNAME`

### Start The App

```bash
npm run dev
```

This starts the Express server with Vite middleware on `http://localhost:3000`.

## Environment Variables

### Required

- `GEMINI_API_KEY`: enables the server-side Gemini assistant

### Optional Firebase Configuration

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_AUTH_EMAIL`

Legacy `VITE_FIREBASE_*` names are still accepted for compatibility.

When Firebase is configured, the app uses Firebase Authentication and Firestore-backed shared data.
The Firebase client settings can be provided as `FIREBASE_*` or `VITE_FIREBASE_*` variables. Only the Firebase client settings and auth email are exposed to the browser bundle; do not put service-account credentials in either prefix.
The supplied project settings are stored locally in the ignored `.env.local`; configure the same client settings in your hosting provider for deployed builds. Deploy `firestore.rules` to the project and sign in with a Firebase Auth user before the app can sync.

### Optional Local / Login Configuration

- `HUB_USERNAME`
- `HUB_PASSWORD`
- `VITE_HUB_USERNAME`

When Firebase is not configured, local development falls back to a legacy `/api/login` flow and stores app data in browser local storage.

### Optional MCP / Tooling Configuration

- `NEXUS_ID_TOKEN`
- `NEXUS_MCP_UID`

### Claude Desktop MCP

The MCP server uses the official TypeScript SDK over stdio only. It is trusted-local when launched by Claude Desktop and has no additional MCP token layer. Do not expose this process through HTTP or SSE without adding authentication, rate limiting, and request controls.

Add this entry to Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "irapp-nexus": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "C:\\Users\\reina\\Downloads\\Dvan\\AI Apps\\IRAppNexus"
    }
  }
}
```

The process loads the existing `.env` settings. Set `NEXUS_ID_TOKEN` and the existing Firebase project variables when the MCP process should use live Firestore; without them it uses the repository's local seed/fallback behavior.

Manual verification checklist:

1. Ask Claude a knowledge-base question and confirm `search_knowledge_base` returns ranked chunks with real source citations.
2. Ask a specific FAQ question and confirm `get_faq` returns matching FAQ records.
3. Ask Claude to update a hub record, confirm `propose_hub_update` returns a pending proposal, then approve it in the existing web UI and verify the same data is visible from both surfaces.

## Available Scripts

- `npm run dev`: start the local Express + Vite development server
- `npm run build`: build the client and bundle the Node server
- `npm run build:vercel`: build the client for Vercel output
- `npm run start`: run the bundled production server from `dist`
- `npm run mcp`: start the Nexus MCP server
- `npm run lint`: run TypeScript type-checking
- `npm run clean`: remove generated build output

## Authentication And Data Modes

### Firebase Mode

Use Firebase when you want shared team data and production-style auth.

- Sign-in uses Firebase Auth
- Collections sync live from Firestore
- Missing bundled seed records are added to each collection on sign-in without overwriting existing records
- Production deployments expect Firebase to be configured

### Local Mode

Use local mode for quick standalone development.

- Login is handled by the local Express endpoint
- Data is stored in browser local storage
- No shared sync across users or browsers

## AI Assistant

The built-in assistant calls the server-side Gemini runtime through `/api/agent`.

Supported behaviors include:

- answering knowledge-base style questions
- helping navigate hub content
- proposing writes for review

Write operations are not applied immediately. The app creates a proposal and requires an explicit confirm or reject action before the change is committed.

## Deployment

The project is set up for Vercel.

- `vercel.json` rewrites non-API routes to `index.html`
- Add all required `VITE_*` variables in Vercel project settings
- Also add `GEMINI_API_KEY` for the agent endpoints
- Redeploy after changing any `VITE_*` variable because Vite embeds them at build time

## Notes

- Firebase is optional for local development but effectively required for a complete production deployment
- The MCP server can be run separately for Nexus tool access
- Firestore rules need to be deployed when collection or permission requirements change
