# Company Nexus — Project Map

> Internal operations hub: dashboard, team directory, stock exchanges, master list, report upload tracker, Kanban, knowledge docs, and Gemini AI assistant.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, motion, lucide-react |
| Backend | Express (local) + Vercel serverless |
| Data | Firebase Auth + Firestore (prod) / localStorage (dev fallback) |
| AI | Google Gemini via `/api/agent` + `/api/confirm` |
| Validation | Zod |

## Tabs

`dashboard` · `tools` · `faqs` · `kb` · `links` · `team` · `docs` · `calendar` · `irapp` · `reports` · `kanban`

Configured in `src/app/tabConfig.tsx` → rendered by `src/app/TabContent.tsx`.

## File Map

```
├── server.ts                         # Local Express entry (dev)
├── api/agent.ts, api/confirm.ts      # Vercel serverless handlers
├── vercel.json, firestore.rules      # Deploy config
│
├── src/
│   ├── main.tsx, App.tsx             # Entry (thin re-export → app/App.tsx)
│   ├── index.css                     # Tailwind + design tokens
│   ├── types.ts                      # All shared domain types
│   │
│   ├── app/                          # Shell only (no business logic)
│   │   ├── App.tsx, AppShell.tsx     # Layout chrome
│   │   ├── AppHeader.tsx, AppFooter.tsx
│   │   ├── GlobalSearch.tsx, TabContent.tsx, tabConfig.tsx
│   │
│   ├── features/                     # Feature modules (prefer editing here)
│   │   ├── dashboard/clocks/         # Clock widgets
│   │   ├── dashboard/globe/          # Rotating earth
│   │   ├── irapp-list/               # Master list table, filters, drawer, modals
│   │   ├── report-tracker/           # Report Upload tab (Q1–Q4 tracker UI)
│   │   ├── kanban/                   # Boards, cards, archive
│   │   ├── team/                     # Team directory, contact teams
│   │   └── ai/                       # ProposalCard, chat subcomponents
│   │
│   ├── components/                   # Section entry points + modals
│   │   ├── shared/                   # Cross-feature UI (SectionToolbar, ToastBanner, etc.)
│   │   ├── modals/                   # ModalShell, ModalActions, useModalForm
│   │   └── motion/                   # Glass/motion primitives (reuse these)
│   │
│   ├── hooks/                        # useNexusData, useSyncedSearch, useEntityModal, useCategoryFilter, useTheme
│   ├── lib/                          # Pure helpers (globalSearch, firebase, normalize, domain utils)
│   ├── services/nexusRepository.ts   # Firestore CRUD + subscriptions
│   └── data/                         # Seed data by collection
│       └── reportTrackerSeed.ts      # Report Upload spreadsheet seed (hydrated at runtime)
│
└── server/
    ├── http/handlers.ts              # Shared agent + confirm logic
    ├── auth.ts                       # Firebase ID token / legacy session auth
    ├── agent/runAgent.ts             # Gemini tool-calling runtime
    ├── agent/config.ts, answerCache.ts, rateLimit.ts, retrievalBudget.ts
    ├── knowledge/                    # Layered retrieval (registry, intent router, enrichment)
    ├── tools/registry.ts             # Agent tool definitions + proposal flow
    ├── data/store.ts                 # Proposal persistence + apply-on-confirm
    ├── mcp/index.ts                  # Standalone MCP server
    └── types.ts                      # Server-side types
```

## Where to Edit

| Task | Location |
|------|----------|
| Tab feature UI | `src/features/<domain>/` |
| table/filters | `src/features/irapp-list/` |
| Report Upload tracker | `src/features/report-tracker/` |
| Shared UI (2+ features) | `src/components/shared/` |
| Modal chrome/forms | `src/components/modals/` |
| Domain types | `src/types.ts` (+ `server/types.ts` if needed) |
| Data access/CRUD | `src/hooks/useNexusData.ts` → `src/services/nexusRepository.ts` |
| Agent tools/writes | `server/tools/registry.ts` + `server/data/store.ts` |
| Knowledge retrieval | `server/knowledge/` |
| Styling | Tailwind utilities + `src/components/motion/` primitives |

## Report Upload (shared)

- **Tab**: `reports` — quarterly upload status for clients (Q1–Q4 + Annual).
- **Collection**: `reportTracker` in Firestore (team-shared via live `onSnapshot`).
- **Seed**: `REPORT_TRACKER_SEED` → `seedReportTrackerIfEmpty()` when the collection is empty.
- **UI**: status toggles, Others editor, edit modal, client matching (`matchClients.ts`).
- **Types**: `ReportTrackerEntry`, `QuarterReportStatus`, `OtherReportItem`, `AnnualReportStatus`.

## Rules

1. **Data flow**: Components → `useNexusData` → `nexusRepository`. Never write Firestore directly from UI.
2. **Agent writes**: Always create a proposal → apply only after `/api/confirm`. Writable collections: `faqs`, `kbArticles`, `companyApps`, `calendarEvents`, `teamMembers`, `contactTeams`, `knowledgeDocs`.
3. **Types first**: Update `src/types.ts` when changing entity shapes. Use normalize/factory helpers for records.
4. **Styling**: Tailwind + existing motion/glass primitives. No new CSS frameworks.
5. **Env**: `VITE_*` = build-time. Server needs `GEMINI_API_KEY`. Never commit `.env`.
6. **New collections**: Must update `COLLECTIONS`, `firestore.rules`, seed/subscribe paths, and types together. (Report Upload uses `reportTracker`.)
7. **No persistence in motion/**: `src/components/motion/` is UI primitives only.
