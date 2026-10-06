# Changelog

All notable changes to Company Nexus are documented in this file.

## [1.1.0] - 2026-10-06

### Added

- **Expanded company operations workspace**
  - Updated dashboard content and operational views to better surface company
    resources, key metrics, and quick-access information.
  - Improved overview and navigation flows for faster access to tools, reports,
    and team resources.

- **Improved knowledge and AI workflows**
  - Strengthened knowledge-base retrieval and assistant assistance with more
    reliable contextual lookups and citation-aware guidance.
  - Added more robust confirm-before-write patterns for safe proposal-driven
    updates to shared company content.

- **Operational tooling refinements**
  - Improved team directory, tracker, and board interactions for smoother record
    review and work tracking.
  - Expanded support for managing application details, reports, and shared
    operational workflows across the platform.

### Changed

- Refined the app shell, modal interactions, and visual feedback patterns to
  provide a more polished and consistent experience.
- Tightened database and Firebase integration behavior for shared data access,
  sync, and local fallback handling.

### Fixed

- Resolved workflow and UI inconsistencies in core navigation, data-driven
  views, and shared operational dashboards.
- Improved handling of local seed data and fallback scenarios when external
  services are unavailable.

## [1.0.0] - 2026-10-06

Initial release of Company Nexus, an internal operations hub for company tools,
team resources, shared knowledge, and operational tracking.

### Added

- **Application shell and navigation**
  - React, TypeScript, and Vite application with a shared header, footer, tab
    navigation, global search, loading states, and a responsive app shell.
  - Overview dashboard with metrics, regional clocks, market references, and
    quick-access content.
  - Theme switching, motion and glass-style UI primitives, reduced-motion
    support, reusable modal flows, and toast notifications.

- **Company resource hub**
  - Searchable company tools, FAQs, developer knowledge-base articles, quick
    links, and knowledge documents, with bundled seed content.
  - Team directory, contact-team directory, and shared team calendar with
    event management.
  - Company application directory with filtering, saved views, column
    selection, client details and contacts, comments, feature and status
    indicators, and spreadsheet export.
  - Quarterly and annual report-upload tracker with status editing, client
    matching, and support for additional report items.
  - Production and external tracker views for monitoring application-related
    work.
  - Kanban boards with editable cards and columns, and an archive for completed
    or removed cards.

- **Authentication and data**
  - Firebase Authentication and Firestore-backed shared data, including live
    collection synchronization and non-destructive seed-data initialization.
  - Local development login and browser-local data fallback when Firebase is
    not configured.
  - Shared repository and data hooks for collection access, subscriptions,
    and CRUD operations.
  - Firestore rules for signed-in access to application collections, with
    ownership-aware agent proposal controls and an append-only audit trail.

- **AI assistant and knowledge retrieval**
  - Gemini-powered assistant served through server-side agent and confirmation
    endpoints.
  - Knowledge lookup, hub-content assistance, and write proposals that require
    explicit approval or rejection before changes are applied.
  - Knowledge-document chunking, enrichment, embeddings, ranked retrieval with
    source citations, intent routing, caching, rate limiting, and retrieval
    budgets.
  - Scripts for knowledge-chunk backfill and retrieval evaluation.

- **MCP integration**
  - Standalone Claude Desktop-compatible MCP server over stdio.
  - Tools to search cited knowledge-base chunks, find FAQs, and submit
    confirm-before-write hub update proposals.

- **Operations and deployment**
  - Express + Vite local development server and bundled Node production server.
  - Vercel serverless agent and confirmation handlers, SPA routing configuration,
    and Firebase deployment configuration.
  - Environment-variable example, setup and deployment documentation, project
    map, and npm scripts for development, builds, type-checking, MCP, knowledge
    maintenance, and cleanup.

