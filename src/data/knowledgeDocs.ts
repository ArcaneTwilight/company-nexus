import type { KnowledgeDoc } from "../types";

export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: "demo-doc-reporting-playbook",
    title: "Client Reporting Playbook",
    domain: "reports",
    tags: ["reporting", "quarterly", "client", "quality-check"],
    summary:
      "A repeatable workflow for collecting, validating, reviewing, and delivering client reports.",
    body: `# Client Reporting Playbook

Use this playbook for recurring client reports, quarterly business reviews, and one-off operational summaries. Treat client-specific contracts, approved report templates, and the reporting calendar as authoritative whenever they differ from this general workflow.

## 1. Confirm the request

- Record the client, reporting period, audience, due date, delivery channel, and requested measures.
- Confirm whether the deliverable is an operational report, a quarterly review, or a regulatory/client-mandated report.
- Identify the data owners and reviewers before collection begins.
- Check that the request is in scope and that the recipient list is approved for the information being shared.

## 2. Collect and validate source data

- Pull data from the approved source systems; record the source and extraction date.
- Use a consistent reporting period, timezone, and definition for every measure.
- Compare totals with the prior period and investigate material changes rather than smoothing or hiding them.
- Check for missing records, duplicates, stale extracts, and inconsistent client identifiers.
- Keep calculations reproducible. Include a short methodology note for derived measures.

## 3. Draft and review

- Start from the current approved template and update the period, client name, and version.
- Separate confirmed facts from interpretation, risks, and recommended actions.
- Include a concise executive summary, key measures, notable changes, open issues, and next steps.
- Have the data owner verify figures and a second reviewer check clarity, permissions, links, and client-specific wording.
- Resolve comments and remove internal-only notes before approval.

## 4. Approve, deliver, and retain

- Obtain the required business and client-relationship approvals before sending.
- Deliver only through the client's approved channel and confirm that the recipients are correct.
- Record the delivery date, version, approver, and location of the final copy in the reporting tracker.
- Store working files and the final deliverable in the approved restricted repository; follow the retention policy for the client.
- If a material error is found after delivery, notify the owner promptly, correct the source, issue a clearly versioned replacement, and record the correction.

## Completion checklist

- [ ] Period, timezone, and metric definitions are explicit.
- [ ] Source data and calculations have been checked.
- [ ] Reviewer and approver are recorded.
- [ ] Final copy contains no internal-only notes or unapproved data.
- [ ] Delivery and archive locations are recorded.`,
    contentVersion: 1,
    lastUpdated: "2026-10-05",
    isArchived: false,
  },
  {
    id: "demo-doc-support-incident-handling",
    title: "Client Support and Incident Handling Guide",
    domain: "support",
    tags: ["support", "incident", "triage", "escalation"],
    summary:
      "A practical intake, triage, communication, escalation, and closure process for client app issues.",
    body: `# Client Support and Incident Handling Guide

Use this guide for client-reported problems with an app, account, integration, or service. Follow the client's support agreement and the current incident policy for severity definitions, response commitments, and notification requirements.

## 1. Acknowledge and capture

Create or update a support record and capture:

- Client, reporter, affected app/version, platform, and environment.
- What the user expected and what happened, including the first observed time and timezone.
- Scope and impact: affected users, workflows, regions, and any workaround.
- Reproduction steps, sanitized screenshots/logs, and recent relevant changes.
- The client's preferred contact and update channel.

Do not request passwords, access tokens, payment data, or unnecessary personal information. Ask the reporter to use the approved secure channel for diagnostic files.

## 2. Triage and assign

- Determine whether the issue is an outage, a security/privacy concern, a release regression, or an individual user problem.
- Assess impact using the documented severity policy. If impact is unclear, keep investigating and ask focused questions.
- Assign an accountable support owner and route technical work to the relevant engineering or operations owner.
- For suspected security or privacy exposure, preserve relevant evidence and immediately use the security/privacy escalation path; do not investigate by accessing more client data than necessary.
- Link related incidents and check recent deploys, monitoring, and known issues.

## 3. Investigate and communicate

- Reproduce in a safe non-production environment where possible.
- Separate confirmed findings from hypotheses. Record checks performed and their results.
- Prefer a reversible mitigation that restores service without risking client data.
- Provide factual updates at the cadence required by the agreement or incident lead. State impact, current action, next update time, and any client action needed.
- Coordinate client-facing wording through the designated relationship owner for major or sensitive incidents.

## 4. Resolve and close

- Verify the fix against the original symptoms and affected platforms.
- Confirm recovery with monitoring and, where appropriate, the reporting client.
- Document root cause (or clearly state that it remains under investigation), impact, fix, timeline, and follow-up actions.
- Close only when ownership is clear for remaining work and the client has received the appropriate resolution note.
- Feed recurring issues into product backlog, runbooks, or release checks.

## Escalation handoff

Include the incident record, impact, timeline, evidence location, actions tried, current risk, and the next owner. Avoid sending sensitive logs or client data in chat or broad email threads.`,
    contentVersion: 1,
    lastUpdated: "2026-10-05",
    isArchived: false,
  },
  {
    id: "demo-doc-app-creation-lifecycle",
    title: "Client App Creation: Discovery to Production",
    domain: "developer",
    tags: ["app-creation", "engineering", "delivery", "release"],
    summary:
      "A stage-gated outline for turning an approved client request into a tested, supportable production app.",
    body: `# Client App Creation: Discovery to Production

This document describes the normal delivery path for a new client app or a substantial new capability. It is a working baseline, not a substitute for the approved statement of work, architecture standards, security controls, or platform release policies.

## 1. Discovery and scope

- Capture the business outcome, user groups, platforms, regions, accessibility needs, and success measures.
- Map the current workflow and identify integrations, data owners, retention needs, and dependencies.
- Separate launch requirements from later enhancements; record assumptions and exclusions.
- Obtain client and internal product approval for scope, acceptance criteria, and ownership.

## 2. Design and readiness

- Produce user flows, a lightweight technical design, and an agreed interface/API contract.
- Review authentication, authorization, privacy, threat scenarios, data handling, and operational support needs.
- Confirm environments, credentials provisioning, test data, analytics, logging, monitoring, and rollback approach.
- Resolve design and security review actions before implementation begins.

## 3. Build and verify

- Create the app from the maintained project template and use approved dependencies and secrets handling.
- Implement small, reviewable changes with automated checks and peer review.
- Test core journeys, error states, permissions, supported devices, integrations, and accessibility.
- Run client acceptance testing using agreed scenarios and non-production data.
- Track defects by impact and do not waive release-blocking security, data integrity, or critical journey issues without documented approval.

## 4. Release and handover

- Prepare version notes, support instructions, known limitations, monitoring checks, and a rollback plan.
- Confirm client acceptance, operational ownership, release window, store or deployment prerequisites, and stakeholder communications.
- Deploy through the approved pipeline with the required approvals; verify health and key journeys after release.
- Provide the client with approved access instructions, user guidance, support route, and release summary.

## 5. Operate and improve

- Monitor service health and support trends after launch.
- Route defects through support triage and product prioritization.
- Review usage and client feedback against the agreed success measures.
- Keep dependencies, runbooks, ownership, and recovery procedures current.

## Stage exit evidence

At each handoff, link the approved scope, design decisions, test evidence, outstanding risks, and named owner in the delivery record. A stage is complete when its acceptance criteria are met or an explicit, approved exception is recorded.`,
    contentVersion: 1,
    lastUpdated: "2026-10-05",
    isArchived: false,
  },
  {
    id: "demo-doc-client-app-onboarding",
    title: "Client App Onboarding and Service Handoff",
    domain: "clients",
    tags: ["client-onboarding", "handoff", "training", "operations"],
    summary:
      "A client-facing handoff checklist covering access, training, launch communication, and ongoing ownership.",
    body: `# Client App Onboarding and Service Handoff

Use this checklist when providing a new or materially changed app to a client. Keep the client's approved contacts, access model, and support agreement as the source of truth.

## Before handoff

- Confirm the release has passed its acceptance criteria and the client has approved the production handoff.
- Verify that production accounts and roles follow least privilege and that access is provisioned through approved identity processes.
- Confirm the production app version, supported platforms, known limitations, and any required client-side setup.
- Prepare a short getting-started guide, user/admin instructions, and an accessible support route.
- Identify the client sponsor, day-to-day administrator, internal relationship owner, product owner, and operational support owner.

## Handoff session

Walk through the primary user journeys, account administration, expected notifications, and any integrations. Demonstrate where users can get help and what details make a useful support request. Explain known limitations plainly; do not promise unapproved roadmap items or service levels.

## Launch confirmation

- Send the approved release summary and documentation through the agreed channel.
- Confirm the client can access the app and complete the agreed critical journey.
- Record attendees, decisions, open questions, and follow-up owners.
- Verify monitoring and escalation contacts are active for the launch period.

## Transition to steady-state service

- Move remaining items into the support queue or product backlog with an owner and priority.
- Confirm the support route, escalation path, and update expectations from the agreement.
- Schedule a follow-up review if required by the delivery plan.
- Update the client record with release version, go-live date, owners, documentation location, and unresolved risks.

## Good client communication

Be concise, specific, and transparent. Distinguish completed work from planned work; include the next action and owner; share only approved information; and escalate any security, privacy, or service-impact concern through the formal process.`,
    contentVersion: 1,
    lastUpdated: "2026-10-05",
    isArchived: false,
  },
  {
    id: "demo-doc-team-order-to-support",
    title: "Team Delivery Flow: Order, Release, and Support",
    domain: "team",
    tags: ["team-workflow", "order", "release", "support", "ownership"],
    summary:
      "An end-to-end team workflow that keeps client commitments, delivery decisions, release evidence, and support ownership connected.",
    body: `# Team Delivery Flow: Order, Release, and Support

This is the shared operating flow for a client order or approved change. Adapt the sequence to the engagement, but retain a named owner and a traceable handoff at every stage.

## 1. Order intake and qualification

The relationship or sales owner records the client request, intended outcome, requested timing, and known constraints. Product and delivery owners review fit, dependencies, capacity, risks, and missing decisions before anyone commits to a delivery date. The agreed scope, exclusions, acceptance criteria, and client approver are captured in the delivery record.

## 2. Plan and assign

Product breaks the approved scope into deliverable work. Engineering, design, security, and operations identify dependencies and reviews. Assign one accountable delivery owner, contributors, and client contacts. Agree the test approach, environments, release prerequisites, and client communication plan.

## 3. Build and review

Contributors work from the approved scope, keep changes reviewable, and update the delivery record when decisions or risks change. Engineering review, automated checks, security/privacy review, and product validation happen before client acceptance testing as applicable. A scope or date change is surfaced early for approval rather than silently absorbed.

## 4. Client acceptance and release readiness

The delivery owner confirms acceptance evidence, unresolved defects, release notes, monitoring, support instructions, deployment approvals, and rollback readiness. The client relationship owner confirms the release window and stakeholder communications. Any blocker is recorded with its owner and decision path.

## 5. Release and verify

The authorized release owner deploys through the approved process. The team verifies service health and agreed critical journeys, records the deployed version and outcome, and communicates status through the approved channel. If verification fails, use the rollback or incident process and keep the client informed.

## 6. Handoff to support

Before delivery is considered complete, support receives the client and app context, release version, known issues, runbook, monitoring links, escalation contacts, and outstanding follow-ups. The client receives the approved usage guidance and support route. The delivery owner confirms that ongoing work has moved to a named queue owner.

## 7. Learn and improve

Review support trends, release outcomes, and client feedback. Close actions only when the responsible owner and evidence are recorded. Feed lessons into templates, tests, runbooks, and future estimates.

## Working agreements

- One accountable owner per stage; consult specialists without diffusing accountability.
- Decisions, approvals, and scope changes belong in the shared delivery record.
- Never promise dates, service levels, or features outside approved commitments.
- Escalate security, privacy, data integrity, or material availability concerns promptly.
- A clean handoff includes context and next steps, not just a link or a status change.`,
    contentVersion: 1,
    lastUpdated: "2026-10-05",
    isArchived: false,
  },
];
