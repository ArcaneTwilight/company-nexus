import type { KBItem } from "../types";

export const INITIAL_KB_ARTICLES: KBItem[] = [
  {
    id: "kb-1",
    title: "Mobile App Store Release Checklist",
    category: "Release Management",
    tags: ["iOS", "Android", "appstore", "playstore"],
    body: `### Production Release Protocol
Follow this exact guide before submitting any build to Apple TestFlight or Google Play Console.

1. **Verify Config Profiles**
   Ensure \`config.env\` is pointing to production gateway URLs and all debug logs are strictly stripped or compiled out.
2. **Crashlytics Verification**
   Verify that correct Proguard mapping files (Android) or dSYM files (iOS) are fully uploaded to Firebase Crashlytics.
3. **App Store Assets**
   All store screenshots, metadata keywords, and update descriptions must be approved by the Marketing lead.
4. **Gradual Staged Rollout**
   - **Android**: Configure a 10% gradual rollout to production. Monitor stability metrics for 48 hours before ramping to 50% and then 100%.
   - **iOS**: Enable Phased Rollout (7-day schedule).`,
    lastUpdated: "2026-07-05",
    isArchived: false
  },
  {
    id: "kb-2",
    title: "Troubleshooting Local Sync & Cache Inconsistencies",
    category: "Engineering Support",
    tags: ["cache", "sync", "mobile-db"],
    body: `### Resolving Local DB Synchronization Faults
If mobile app clients report that data fails to refresh or displays stale data:

#### Root Cause Analysis
Company client-side databases utilize SQLite + Room / CoreData with a local write-ahead log (WAL) and an active memory cache. Heavy concurrent write operations can lead to locking states or sync race conditions.

#### Recommended Troubleshooting Steps:
1. **Trigger Force DB Reset**
   Inside the developer debug menu, tap **Force Database Rebuild**. This purges the local database and downloads a fresh state from the cloud API.
2. **Cache Pruning Command**
   Verify the sync server timestamp in headers. If headers lag the database state, have the admin trigger a cache invalidation request on our Vercel Edge Cache.
3. **Log Collection**
   Generate a client diagnostic package from the settings tray and upload it directly to Bugsnag.`,
    lastUpdated: "2026-06-30",
    isArchived: false
  },
  {
    id: "kb-3",
    title: "Auth Token Rotation and JWT Token Expiry Flow",
    category: "Security & Architecture",
    tags: ["security", "JWT", "auth"],
    body: `### Token Security Architecture
Company implements strict OAuth 2.0 with rotating Refresh Tokens to protect endpoints.

- **Access Token**: JWT format, valid for exactly 15 minutes. Must be sent in the \`Authorization: Bearer <token>\` header.
- **Refresh Token**: Cryptographically random UUID stored securely in client keychain (iOS) or secure shared preferences (Android). Valid for 30 days.

#### Handshake Cycle
1. When a client API receives a \`401 Unauthorized\`, the application must pause outgoing calls.
2. Trigger the \`/oauth/token/refresh\` request in the background using the stored Refresh Token.
3. If successful, resume all paused requests with the new Access Token.
4. If the Refresh Token itself is expired, instantly wipe local credentials and redirect the user back to the Secure Hub Login.`,
    lastUpdated: "2026-07-02",
    isArchived: false
  }
];
