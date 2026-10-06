import type { CalendarEvent } from "../types";

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "cal-1",
    title: "Q3 Client Performance Report",
    date: "2026-07-15",
    type: "Report",
    description: "Quarterly analytics summary for all active Company clients.",
    owner: "Sarah Chen",
  },
  {
    id: "cal-2",
    title: "Company Nexus v1.3 Release",
    date: "2026-07-18",
    type: "Release",
    description: "Deploy new team directory, calendar, and Company list modules.",
    owner: "Nguyen Van Minh",
  },
  {
    id: "cal-3",
    title: "Marketing Asset Upload — July Batch",
    date: "2026-07-12",
    type: "Upload",
    description: "Upload refreshed banner templates and email creatives to the asset library.",
    owner: "Maria Santos",
  },
  {
    id: "cal-4",
    title: "Team Sync — Sprint Planning",
    date: "2026-07-10",
    type: "Event",
    description: "Bi-weekly cross-region sprint planning and blocker review.",
    owner: "Erik Lindqvist",
  },
  {
    id: "cal-5",
    title: "App Store Compliance Review",
    date: "2026-07-22",
    type: "Report",
    description: "Monthly review of App Store and Play Store policy compliance across all client apps.",
    owner: "Priya Sharma",
  },
  {
    id: "cal-6",
    title: "Nordic Client Onboarding — Acme Corp",
    date: "2026-07-25",
    type: "Event",
    description: "Kickoff call and sandbox provisioning for new Nordic region client.",
    owner: "Maria Santos",
  },
  {
    id: "cal-7",
    title: "Localization Strings Upload",
    date: "2026-07-14",
    type: "Upload",
    description: "Sync Q3 translation updates from spreadsheets to mobile app bundles.",
    owner: "Nguyen Van Minh",
  },
  {
    id: "cal-8",
    title: "Hotfix Release — v2.4.1",
    date: "2026-07-20",
    type: "Release",
    description: "Critical bug fix for push notification delivery on Android 14.",
    owner: "Andres Kask",
  },
  {
    id: "cal-demo-compliance-2026-11",
    title: "Client App Compliance Review",
    date: "2026-11-05",
    type: "Report",
    description:
      "Demo reminder: review store-policy changes, privacy disclosures, accessibility checks, and client-specific compliance evidence. Confirm scope and owners before the review.",
    owner: "Product & Compliance",
  },
  {
    id: "cal-demo-vapt-planning-2026-11",
    title: "VAPT Scope and Readiness Review",
    date: "2026-11-12",
    type: "Event",
    description:
      "Demo planning checkpoint for the next vulnerability assessment and penetration test. Confirm written authorization, test scope, environments, contacts, and remediation workflow.",
    owner: "Security & Engineering",
  },
  {
    id: "cal-demo-amazon-release-2026-11",
    title: "Amazon Client App — Release Window",
    date: "2026-11-19",
    type: "Release",
    description:
      "Proposed demo release window only. Confirm the client-approved date, acceptance sign-off, release notes, monitoring, support coverage, and rollback readiness.",
    owner: "Delivery Lead",
  },
  {
    id: "cal-demo-vapt-execution-2026-12",
    title: "VAPT Execution and Findings Triage",
    date: "2026-12-03",
    type: "Event",
    description:
      "Demo placeholder for authorized testing and findings review. Coordinate tester access, protect client data, log evidence securely, and agree remediation owners and retest criteria.",
    owner: "Security & Engineering",
  },
  {
    id: "cal-demo-ir-earnings-2026-12",
    title: "IR Calendar Watch — Earnings Dates",
    date: "2026-12-08",
    type: "Event",
    description:
      "Demo reminder to check official investor-relations calendars for client earnings and quiet-period dates before scheduling releases or client communications. This is not a confirmed company event date.",
    owner: "Client Relationship Team",
  },
  {
    id: "cal-demo-walmart-release-2026-12",
    title: "Walmart Client App — Release Window",
    date: "2026-12-10",
    type: "Release",
    description:
      "Proposed demo release window only. Confirm the client-approved date, acceptance sign-off, release notes, monitoring, support coverage, and rollback readiness.",
    owner: "Delivery Lead",
  },
  {
    id: "cal-demo-compliance-evidence-2026-12",
    title: "Year-End Compliance Evidence Pack",
    date: "2026-12-17",
    type: "Report",
    description:
      "Demo reminder to collect approved control evidence, review open exceptions, verify document access, and confirm retention requirements with each client owner.",
    owner: "Product & Compliance",
  },
  {
    id: "cal-demo-apple-release-2027-01",
    title: "Apple Client App — Release Window",
    date: "2027-01-14",
    type: "Release",
    description:
      "Proposed demo release window only. Confirm the client-approved date, acceptance sign-off, release notes, monitoring, support coverage, and rollback readiness.",
    owner: "Delivery Lead",
  },
  {
    id: "cal-demo-ir-event-check-2027-01",
    title: "IR Event and Quiet-Period Check",
    date: "2027-01-21",
    type: "Event",
    description:
      "Demo reminder to verify upcoming investor-relations events and quiet periods against official client sources, then coordinate release communications with the relationship owner.",
    owner: "Client Relationship Team",
  },
];
