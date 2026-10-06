import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "../lib/firebase";
import {
  INITIAL_TOOLS,
  INITIAL_FAQS,
  INITIAL_KB_ARTICLES,
  INITIAL_KNOWLEDGE_DOCS,
  INITIAL_METRICS,
  INITIAL_QUICK_LINKS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_TEAM_DIRECTORY,
  INITIAL_CONTACT_TEAMS,
  STOCK_EXCHANGE_LINKS,
  REPORT_TRACKER_SEED,
  PRODUCTION_TRACKER_SEED,
} from "../data";
import { COMPANY_MASTER_APPS } from "../data/companyMasterApps";
import { normalizecompanyApp, normalizecompanyApps } from "../lib/companyAppNormalize";
import {
  hydrateSeedEntry,
  normalizeReportTrackerEntries,
  sanitizeReportTrackerEntry,
} from "../features/report-tracker/quarterUtils";
import type {
  ToolItem,
  FAQItem,
  KBItem,
  MetricItem,
  QuickLink,
  StockExchangeLink,
  companymasterapp,
  CalendarEvent,
  TeamMember,
  ContactTeam,
  KnowledgeDoc,
  KanbanBoard,
  KanbanCard,
  ReportTrackerEntry,
  ProductionTrackerEntry,
} from "../types";

export const COLLECTIONS = {
  tools: "tools",
  faqs: "faqs",
  kbArticles: "kbArticles",
  links: "links",
  metrics: "metrics",
  stockExchanges: "stockExchanges",
  companyApps: "companyApps",
  calendarEvents: "calendarEvents",
  teamMembers: "teamMembers",
  contactTeams: "contactTeams",
  knowledgeDocs: "knowledgeDocs",
  kanbanBoards: "kanbanBoards",
  kanbanCards: "kanbanCards",
  reportTracker: "reportTracker",
  productionTracker: "productionTracker",
} as const;

export interface NexusData {
  tools: ToolItem[];
  faqs: FAQItem[];
  articles: KBItem[];
  links: QuickLink[];
  metrics: MetricItem[];
  stockExchanges: StockExchangeLink[];
  companyApps: companymasterapp[];
  calendarEvents: CalendarEvent[];
  teamMembers: TeamMember[];
  contactTeams: ContactTeam[];
  knowledgeDocs: KnowledgeDoc[];
  kanbanBoards: KanbanBoard[];
  kanbanCards: KanbanCard[];
  reportTracker: ReportTrackerEntry[];
  productionTracker: ProductionTrackerEntry[];
}

export interface NexusRepositoryActions {
  upsertTool: (item: ToolItem) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
  upsertFaq: (item: FAQItem) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  upsertArticle: (item: KBItem) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  upsertMetric: (item: MetricItem) => Promise<void>;
  deleteMetric: (id: string) => Promise<void>;
  upsertLink: (item: QuickLink) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  upsertStockExchange: (item: StockExchangeLink) => Promise<void>;
  deleteStockExchange: (id: string) => Promise<void>;
  upsertcompanyApp: (item: companymasterapp) => Promise<void>;
  deletecompanyApp: (id: string) => Promise<void>;
  upsertCalendarEvent: (item: CalendarEvent) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  upsertTeamMember: (item: TeamMember) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  upsertContactTeam: (item: ContactTeam) => Promise<void>;
  deleteContactTeam: (id: string) => Promise<void>;
  upsertKnowledgeDoc: (item: KnowledgeDoc) => Promise<void>;
  deleteKnowledgeDoc: (id: string) => Promise<void>;
  upsertKanbanBoard: (item: KanbanBoard) => Promise<void>;
  deleteKanbanBoard: (id: string) => Promise<void>;
  upsertKanbanCard: (item: KanbanCard) => Promise<void>;
  deleteKanbanCard: (id: string) => Promise<void>;
  upsertReportTrackerEntry: (item: ReportTrackerEntry) => Promise<void>;
  deleteReportTrackerEntry: (id: string) => Promise<void>;
  upsertProductionTrackerEntry: (item: ProductionTrackerEntry) => Promise<void>;
  deleteProductionTrackerEntry: (id: string) => Promise<void>;
}

function mapSnapshot<T>(docs: { id: string; data: () => Record<string, unknown> }[]): T[] {
  return docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

function sortByLastUpdated<T extends { lastUpdated?: string; title?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.lastUpdated ?? "";
    const dateB = b.lastUpdated ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

function sortLinks(items: QuickLink[]): QuickLink[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title));
}

function sortStockExchanges(items: StockExchangeLink[]): StockExchangeLink[] {
  return [...items].sort((a, b) => {
    const countryCompare = a.country.localeCompare(b.country);
    if (countryCompare !== 0) return countryCompare;
    const cityCompare = a.city.localeCompare(b.city);
    if (cityCompare !== 0) return cityCompare;
    return a.exchange.localeCompare(b.exchange);
  });
}

function sortcompanyApps(items: companymasterapp[]): companymasterapp[] {
  return [...items].sort((a, b) => a.companyName.localeCompare(b.companyName));
}

function sortCalendarEvents(items: CalendarEvent[]): CalendarEvent[] {
  return [...items].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.title.localeCompare(b.title);
  });
}

function sortTeamMembers(items: TeamMember[]): TeamMember[] {
  return [...items].sort((a, b) => {
    const roleCompare = a.role.localeCompare(b.role);
    if (roleCompare !== 0) return roleCompare;
    return a.name.localeCompare(b.name);
  });
}

function sortContactTeams(items: ContactTeam[]): ContactTeam[] {
  return [...items].sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) return categoryCompare;
    return a.name.localeCompare(b.name);
  });
}

export function subscribeNexusData(
  onChange: (data: NexusData) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const state: NexusData = {
    tools: [],
    faqs: [],
    articles: [],
    links: [],
    metrics: [],
    stockExchanges: [],
    companyApps: [],
    calendarEvents: [],
    teamMembers: [],
    contactTeams: [],
    knowledgeDocs: [],
    kanbanBoards: [],
    kanbanCards: [],
    reportTracker: [],
    productionTracker: [],
  };

  function emit() {
    onChange({
      tools: sortByLastUpdated(state.tools),
      faqs: sortByLastUpdated(state.faqs),
      articles: sortByLastUpdated(state.articles),
      metrics: sortByLastUpdated(state.metrics),
      links: sortLinks(state.links),
      stockExchanges: sortStockExchanges(state.stockExchanges),
      companyApps: sortcompanyApps(state.companyApps),
      calendarEvents: sortCalendarEvents(state.calendarEvents),
      teamMembers: sortTeamMembers(state.teamMembers),
      contactTeams: sortContactTeams(state.contactTeams),
      knowledgeDocs: sortByLastUpdated(state.knowledgeDocs),
      kanbanBoards: state.kanbanBoards,
      kanbanCards: state.kanbanCards,
      reportTracker: normalizeReportTrackerEntries(state.reportTracker),
      productionTracker: state.productionTracker,
    });
  }

  // Emit immediately so the UI can render while waiting for snapshots.
  emit();

  const unsubscribers = [
    onSnapshot(
      collection(db, COLLECTIONS.tools),
      (snap) => {
        state.tools = mapSnapshot<ToolItem>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.faqs),
      (snap) => {
        state.faqs = mapSnapshot<FAQItem>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.kbArticles),
      (snap) => {
        state.articles = mapSnapshot<KBItem>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.links),
      (snap) => {
        state.links = mapSnapshot<QuickLink>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.metrics),
      (snap) => {
        state.metrics = mapSnapshot<MetricItem>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.stockExchanges),
      (snap) => {
        state.stockExchanges = mapSnapshot<StockExchangeLink>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.companyApps),
      (snap) => {
        state.companyApps = normalizecompanyApps(mapSnapshot<companymasterapp>(snap.docs));
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.calendarEvents),
      (snap) => {
        state.calendarEvents = mapSnapshot<CalendarEvent>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.teamMembers),
      (snap) => {
        state.teamMembers = mapSnapshot<TeamMember>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.contactTeams),
      (snap) => {
        state.contactTeams = mapSnapshot<ContactTeam>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.knowledgeDocs),
      (snap) => {
        state.knowledgeDocs = mapSnapshot<KnowledgeDoc>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.kanbanBoards),
      (snap) => {
        state.kanbanBoards = mapSnapshot<KanbanBoard>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.kanbanCards),
      (snap) => {
        state.kanbanCards = mapSnapshot<KanbanCard>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.reportTracker),
      (snap) => {
        state.reportTracker = mapSnapshot<ReportTrackerEntry>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
    onSnapshot(
      collection(db, COLLECTIONS.productionTracker),
      (snap) => {
        state.productionTracker = mapSnapshot<ProductionTrackerEntry>(snap.docs);
        emit();
      },
      (err) => onError(err)
    ),
  ];

  return () => unsubscribers.forEach((unsub) => unsub());
}

async function seedMissingItems<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<boolean> {
  const db = getFirestoreDb();
  const existing = await getDocs(collection(db, collectionName));
  const existingIds = new Set(existing.docs.map((snapshot) => snapshot.id));
  const missing = items.filter((item) => !existingIds.has(item.id));

  for (let offset = 0; offset < missing.length; offset += 450) {
    const batch = writeBatch(db);
    missing.slice(offset, offset + 450).forEach((item) => {
      batch.set(doc(db, collectionName, item.id), item);
    });
    await batch.commit();
  }

  return missing.length > 0;
}

export async function seedNexusDataIfEmpty(): Promise<boolean> {
  const db = getFirestoreDb();
  const metaRef = doc(db, "meta", "seed");
  const metaSnap = await getDoc(metaRef);

  const results = await Promise.all([
    seedMissingItems(COLLECTIONS.tools, INITIAL_TOOLS),
    seedMissingItems(COLLECTIONS.faqs, INITIAL_FAQS),
    seedMissingItems(COLLECTIONS.kbArticles, INITIAL_KB_ARTICLES),
    seedMissingItems(COLLECTIONS.metrics, INITIAL_METRICS),
    seedMissingItems(COLLECTIONS.links, INITIAL_QUICK_LINKS),
  ]);
  const seeded = results.some(Boolean);

  if (seeded || metaSnap.data()?.completed !== true) {
    await setDoc(metaRef, { completed: true, seededAt: serverTimestamp() }, { merge: true });
  }

  return seeded;
}

export async function seedStockExchangesIfEmpty(): Promise<boolean> {
  return seedMissingItems(COLLECTIONS.stockExchanges, STOCK_EXCHANGE_LINKS);
}

/** Add missing Company master list records without replacing existing documents. */
export async function seedcompanyAppsIfEmpty(): Promise<boolean> {
  return seedMissingItems(
    COLLECTIONS.companyApps,
    normalizecompanyApps(COMPANY_MASTER_APPS)
  );
}

/** Add missing team calendar records without replacing existing documents. */
export async function seedCalendarEventsIfEmpty(): Promise<boolean> {
  return seedMissingItems(COLLECTIONS.calendarEvents, INITIAL_CALENDAR_EVENTS);
}

/** Add missing bundled knowledge docs without replacing existing documents. */
export async function seedKnowledgeDocsIfEmpty(): Promise<boolean> {
  return seedMissingItems(COLLECTIONS.knowledgeDocs, INITIAL_KNOWLEDGE_DOCS);
}

/** Add missing team directory records without replacing existing documents. */
export async function seedTeamMembersIfEmpty(): Promise<boolean> {
  return seedMissingItems(COLLECTIONS.teamMembers, INITIAL_TEAM_DIRECTORY);
}

/** Apply the updated bundled link and team seeds once without replacing custom records. */
export async function applyDirectoryAndLinkSeedUpdate(): Promise<boolean> {
  const db = getFirestoreDb();
  const migrationRef = doc(db, "meta", "links-team-seed-v1");
  const migrationSnap = await getDoc(migrationRef);
  if (migrationSnap.exists()) return false;

  const batch = writeBatch(db);
  INITIAL_QUICK_LINKS.forEach((item) =>
    batch.set(doc(db, COLLECTIONS.links, item.id), item)
  );
  INITIAL_TEAM_DIRECTORY.forEach((item) =>
    batch.set(doc(db, COLLECTIONS.teamMembers, item.id), item)
  );
  INITIAL_CONTACT_TEAMS.forEach((item) =>
    batch.set(doc(db, COLLECTIONS.contactTeams, item.id), item)
  );
  batch.delete(doc(db, COLLECTIONS.links, "link-4"));
  batch.delete(doc(db, COLLECTIONS.links, "link-5"));
  batch.set(migrationRef, { completed: true, appliedAt: serverTimestamp() });
  await batch.commit();
  return true;
}

/** Update sample partner team emails without overwriting other saved team fields. */
export async function applyPartnerTeamEmailUpdate(): Promise<boolean> {
  const db = getFirestoreDb();
  const migrationRef = doc(db, "meta", "partner-team-emails-v1");
  const migrationSnap = await getDoc(migrationRef);
  if (migrationSnap.exists()) return false;

  const teamsSnap = await getDocs(collection(db, COLLECTIONS.contactTeams));
  const existingIds = new Set(teamsSnap.docs.map((team) => team.id));
  const batch = writeBatch(db);
  INITIAL_CONTACT_TEAMS.forEach((team) => {
    const teamRef = doc(db, COLLECTIONS.contactTeams, team.id);
    if (existingIds.has(team.id)) {
      batch.set(teamRef, { email: team.email }, { merge: true });
    } else {
      batch.set(teamRef, team);
    }
  });
  batch.set(migrationRef, { completed: true, appliedAt: serverTimestamp() });
  await batch.commit();
  return true;
}

/** Add missing partner / contact teams without replacing existing documents. */
export async function seedContactTeamsIfEmpty(): Promise<boolean> {
  return seedMissingItems(COLLECTIONS.contactTeams, INITIAL_CONTACT_TEAMS);
}

/** Add missing report tracker entries without replacing existing documents. */
export async function seedReportTrackerIfEmpty(): Promise<boolean> {
  const entries = REPORT_TRACKER_SEED.map((seed) =>
    sanitizeReportTrackerEntry(hydrateSeedEntry(seed))
  );
  return seedMissingItems(COLLECTIONS.reportTracker, entries);
}

/** Add missing production tracker entries without replacing existing documents. */
export async function seedProductionTrackerIfEmpty(): Promise<boolean> {
  return seedMissingItems(COLLECTIONS.productionTracker, PRODUCTION_TRACKER_SEED);
}

function upsert<T extends { id: string }>(collectionName: string, item: T) {
  const db = getFirestoreDb();
  return setDoc(doc(db, collectionName, item.id), item, { merge: true });
}

function remove(collectionName: string, id: string) {
  const db = getFirestoreDb();
  return deleteDoc(doc(db, collectionName, id));
}

export const nexusRepositoryActions: NexusRepositoryActions = {
  upsertTool: (item) => upsert(COLLECTIONS.tools, item),
  deleteTool: (id) => remove(COLLECTIONS.tools, id),
  upsertFaq: (item) => upsert(COLLECTIONS.faqs, item),
  deleteFaq: (id) => remove(COLLECTIONS.faqs, id),
  upsertArticle: (item) => upsert(COLLECTIONS.kbArticles, item),
  deleteArticle: (id) => remove(COLLECTIONS.kbArticles, id),
  upsertMetric: (item) => upsert(COLLECTIONS.metrics, item),
  deleteMetric: (id) => remove(COLLECTIONS.metrics, id),
  upsertLink: (item) => upsert(COLLECTIONS.links, item),
  deleteLink: (id) => remove(COLLECTIONS.links, id),
  upsertStockExchange: (item) => upsert(COLLECTIONS.stockExchanges, item),
  deleteStockExchange: (id) => remove(COLLECTIONS.stockExchanges, id),
  upsertcompanyApp: (item) => upsert(COLLECTIONS.companyApps, normalizecompanyApp(item)),
  deletecompanyApp: (id) => remove(COLLECTIONS.companyApps, id),
  upsertCalendarEvent: (item) => upsert(COLLECTIONS.calendarEvents, item),
  deleteCalendarEvent: (id) => remove(COLLECTIONS.calendarEvents, id),
  upsertTeamMember: (item) => upsert(COLLECTIONS.teamMembers, item),
  deleteTeamMember: (id) => remove(COLLECTIONS.teamMembers, id),
  upsertContactTeam: (item) => upsert(COLLECTIONS.contactTeams, item),
  deleteContactTeam: (id) => remove(COLLECTIONS.contactTeams, id),
  upsertKnowledgeDoc: (item) => upsert(COLLECTIONS.knowledgeDocs, item),
  deleteKnowledgeDoc: (id) => remove(COLLECTIONS.knowledgeDocs, id),
  upsertKanbanBoard: (item) => upsert(COLLECTIONS.kanbanBoards, item),
  deleteKanbanBoard: (id) => remove(COLLECTIONS.kanbanBoards, id),
  upsertKanbanCard: (item) => upsert(COLLECTIONS.kanbanCards, item),
  deleteKanbanCard: (id) => remove(COLLECTIONS.kanbanCards, id),
  upsertReportTrackerEntry: (item) =>
    upsert(COLLECTIONS.reportTracker, sanitizeReportTrackerEntry(item)),
  deleteReportTrackerEntry: (id) => remove(COLLECTIONS.reportTracker, id),
  upsertProductionTrackerEntry: (item) =>
    upsert(COLLECTIONS.productionTracker, item),
  deleteProductionTrackerEntry: (id) =>
    remove(COLLECTIONS.productionTracker, id),
};
