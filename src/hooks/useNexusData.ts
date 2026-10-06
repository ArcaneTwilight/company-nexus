import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
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
import { getFirebaseAuth, isFirebaseConfigured } from "../lib/firebase";
import {
  nexusRepositoryActions,
  seedNexusDataIfEmpty,
  seedStockExchangesIfEmpty,
  seedcompanyAppsIfEmpty,
  seedCalendarEventsIfEmpty,
  seedKnowledgeDocsIfEmpty,
  seedTeamMembersIfEmpty,
  applyDirectoryAndLinkSeedUpdate,
  applyPartnerTeamEmailUpdate,
  seedContactTeamsIfEmpty,
  seedReportTrackerIfEmpty,
  seedProductionTrackerIfEmpty,
  subscribeNexusData,
  type NexusRepositoryActions,
} from "../services/nexusRepository";
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
import {
  hydrateSeedEntry,
  loadStoredEntries,
  normalizeReportTrackerEntries,
  STORAGE_KEY,
} from "../features/report-tracker/quarterUtils";

export type NexusStorageMode = "firestore" | "local";

export interface UseNexusDataResult {
  mode: NexusStorageMode;
  isAuthReady: boolean;
  isDataReady: boolean;
  syncError: string | null;
  firebaseUser: User | null;
  tools: ToolItem[];
  faqs: FAQItem[];
  articles: KBItem[];
  metrics: MetricItem[];
  links: QuickLink[];
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
  actions: NexusRepositoryActions;
  logout: () => Promise<void>;
}

function loadLocal<T>(key: string, fallback: T, legacyKeys: string[] = []): T {
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);

  for (const legacyKey of legacyKeys) {
    const legacySaved = localStorage.getItem(legacyKey);
    if (!legacySaved) continue;
    localStorage.setItem(key, legacySaved);
    return JSON.parse(legacySaved);
  }

  return fallback;
}

function loadLocalCompanyApps(): companymasterapp[] {
  const migrationKey = "nexus_company_demo_seed_v1";
  const loaded = normalizecompanyApps(
    loadLocal("nexus_company_apps", COMPANY_MASTER_APPS, ["nexus_irapp_apps"])
  );
  if (localStorage.getItem(migrationKey) === "complete") return loaded;

  const seedById = new Map(COMPANY_MASTER_APPS.map((app) => [app.id, app]));
  const existingIds = new Set(loaded.map((app) => app.id));
  const updated = loaded.map((app) => {
    const seed = seedById.get(app.id);
    if (
      seed &&
      (app.country === "Placeholder" ||
        app.comments === "Placeholder company record")
    ) {
      return seed;
    }
    return app;
  });
  COMPANY_MASTER_APPS.forEach((app) => {
    if (!existingIds.has(app.id)) updated.push(app);
  });

  const normalized = normalizecompanyApps(updated);
  localStorage.setItem("nexus_company_apps", JSON.stringify(normalized));
  localStorage.setItem(migrationKey, "complete");
  return normalized;
}

function loadLocalTrackerDemoSeed<T>(
  key: string,
  seed: T[],
  migrationId: string
): T[] {
  const migrationKey = `nexus_demo_tracker_seed_${migrationId}`;
  if (localStorage.getItem(migrationKey) === "complete") {
    return loadLocal(key, seed);
  }

  localStorage.setItem(key, JSON.stringify(seed));
  localStorage.setItem(migrationKey, "complete");
  return seed;
}

function loadLocalWithSeedUpdate<T extends { id: string }>(
  key: string,
  seed: T[],
  migrationId: string,
  removedSeedIds: string[] = []
): T[] {
  const migrationKey = `nexus_seed_migration_${migrationId}_${key}`;
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(migrationKey, "complete");
    return seed;
  }

  const existing = JSON.parse(saved) as T[];
  if (
    !Array.isArray(existing) ||
    existing.some((item) => !item || typeof item.id !== "string")
  ) {
    throw new Error(`Saved data for ${key} must be an array.`);
  }
  if (localStorage.getItem(migrationKey) === "complete") return existing;

  const seedIds = new Set(seed.map((item) => item.id));
  const removedIds = new Set(removedSeedIds);
  const customItems = existing.filter(
    (item) => !seedIds.has(item.id) && !removedIds.has(item.id)
  );
  const updated = [...customItems, ...seed];
  localStorage.setItem(key, JSON.stringify(updated));
  localStorage.setItem(migrationKey, "complete");
  return updated;
}

function loadLocalContactTeams(): ContactTeam[] {
  const migrationKey = "nexus_seed_migration_partner-team-emails_v1";
  const saved = localStorage.getItem("nexus_contact_teams");
  if (!saved) {
    localStorage.setItem(migrationKey, "complete");
    return INITIAL_CONTACT_TEAMS;
  }

  const existing = JSON.parse(saved) as ContactTeam[];
  if (
    !Array.isArray(existing) ||
    existing.some((team) => !team || typeof team.id !== "string")
  ) {
    throw new Error("Saved data for nexus_contact_teams must be an array.");
  }
  if (localStorage.getItem(migrationKey) === "complete") return existing;

  const seedsById = new Map(
    INITIAL_CONTACT_TEAMS.map((team) => [team.id, team])
  );
  const existingIds = new Set(existing.map((team) => team.id));
  const updated = existing.map((team) => {
    const seed = seedsById.get(team.id);
    return seed ? { ...team, email: seed.email } : team;
  });
  INITIAL_CONTACT_TEAMS.forEach((team) => {
    if (!existingIds.has(team.id)) updated.push(team);
  });
  localStorage.setItem("nexus_contact_teams", JSON.stringify(updated));
  localStorage.setItem(migrationKey, "complete");
  return updated;
}

function loadFaqSeedWithMigration(): FAQItem[] {
  const saved = loadLocal("nexus_faqs", INITIAL_FAQS);
  const legacyFaqIds = new Set(["faq-1", "faq-2", "faq-3", "faq-4"]);

  if (!Array.isArray(saved)) return INITIAL_FAQS;

  const isLegacyFaqSeed =
    saved.length === legacyFaqIds.size &&
    saved.every((item) => item && typeof item === "object" && legacyFaqIds.has(String(item.id)));

  if (isLegacyFaqSeed) {
    localStorage.setItem("nexus_faqs", JSON.stringify(INITIAL_FAQS));
    return INITIAL_FAQS;
  }

  return saved;
}

export function useNexusData(sessionToken: string | null): UseNexusDataResult {
  const useFirestore = isFirebaseConfigured();
  const mode: NexusStorageMode = useFirestore ? "firestore" : "local";

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(!useFirestore);
  const [isDataReady, setIsDataReady] = useState(!useFirestore);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [tools, setTools] = useState<ToolItem[]>(() =>
    useFirestore ? [] : loadLocal("nexus_tools", INITIAL_TOOLS)
  );
  const [faqs, setFaqs] = useState<FAQItem[]>(() =>
    useFirestore ? [] : loadFaqSeedWithMigration()
  );
  const [articles, setArticles] = useState<KBItem[]>(() =>
    useFirestore ? [] : loadLocal("nexus_articles", INITIAL_KB_ARTICLES)
  );
  const [metrics, setMetrics] = useState<MetricItem[]>(() =>
    useFirestore ? [] : loadLocal("nexus_metrics", INITIAL_METRICS)
  );
  const [links, setLinks] = useState<QuickLink[]>(() =>
    useFirestore
      ? []
      : loadLocalWithSeedUpdate(
          "nexus_links",
          INITIAL_QUICK_LINKS,
          "links-team-seed-v1",
          ["link-4", "link-5"]
        )
  );
  const [stockExchanges, setStockExchanges] = useState<StockExchangeLink[]>(() =>
    useFirestore ? [] : loadLocal("nexus_stock_exchanges", STOCK_EXCHANGE_LINKS)
  );
  const [companyApps, setcompanyApps] = useState<companymasterapp[]>(() =>
    useFirestore
      ? []
      : loadLocalCompanyApps()
  );
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() =>
    useFirestore
      ? []
      : loadLocalWithSeedUpdate(
          "nexus_calendar_events",
          INITIAL_CALENDAR_EVENTS,
          "calendar-events-q4-2026-v1"
        )
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    useFirestore
      ? []
      : loadLocalWithSeedUpdate(
          "nexus_team_members",
          INITIAL_TEAM_DIRECTORY,
          "links-team-seed-v1"
        )
  );
  const [contactTeams, setContactTeams] = useState<ContactTeam[]>(() =>
    useFirestore
      ? []
      : loadLocalContactTeams()
  );
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(() =>
    useFirestore
      ? []
      : loadLocalWithSeedUpdate(
          "nexus_knowledge_docs",
          INITIAL_KNOWLEDGE_DOCS,
          "knowledge-docs-demo-v1"
        )
  );
  const [kanbanBoards, setKanbanBoards] = useState<KanbanBoard[]>(() =>
    useFirestore ? [] : loadLocal("nexus_kanban_boards", [])
  );
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>(() =>
    useFirestore ? [] : loadLocal("nexus_kanban_cards", [])
  );
  const [reportTracker, setReportTracker] = useState<ReportTrackerEntry[]>(() => {
    if (useFirestore) return [];
    const stored = loadLocalTrackerDemoSeed(
      STORAGE_KEY,
      normalizeReportTrackerEntries(
        REPORT_TRACKER_SEED.map((seed) => hydrateSeedEntry(seed))
      ),
      "company-report-monitoring-v1"
    );
    const normalized = loadStoredEntries();
    if (normalized) return normalized;
    return normalizeReportTrackerEntries(
      REPORT_TRACKER_SEED.map((seed) => hydrateSeedEntry(seed))
    );
  });
  const [productionTracker, setProductionTracker] = useState<
    ProductionTrackerEntry[]
  >(() =>
    useFirestore
      ? []
      : loadLocalTrackerDemoSeed(
          "nexus_production_tracker",
          PRODUCTION_TRACKER_SEED,
          "company-production-v1"
        )
  );

  const seededRef = useRef(false);

  useEffect(() => {
    if (!useFirestore) return;

    const auth = getFirebaseAuth();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
      if (!user) {
        setIsDataReady(false);
        seededRef.current = false;
      }
    });

    return () => unsubAuth();
  }, [useFirestore]);

  useEffect(() => {
    if (!useFirestore || !firebaseUser) return;

    let unsubData: (() => void) | undefined;

    async function startSync() {
      try {
        unsubData = subscribeNexusData(
          (data) => {
            setTools(data.tools);
            setFaqs(data.faqs);
            setArticles(data.articles);
            setMetrics(data.metrics);
            setLinks(data.links);
            setStockExchanges(data.stockExchanges);
            setcompanyApps(data.companyApps);
            setCalendarEvents(data.calendarEvents);
            setTeamMembers(data.teamMembers);
            setContactTeams(data.contactTeams);
            setKnowledgeDocs(data.knowledgeDocs);
            setKanbanBoards(data.kanbanBoards);
            setKanbanCards(data.kanbanCards);
            setReportTracker(data.reportTracker);
            setProductionTracker(data.productionTracker);
            setIsDataReady(true);
            setSyncError(null);
          },
          (error) => {
            console.error("Firestore sync error:", error);
            const message = error.message || "Firestore permission denied";
            setSyncError(
              message.includes("permission")
                ? `${message} — deploy firestore.rules in Firebase and ensure you are signed in.`
                : message
            );
            setIsDataReady(true);
          }
        );

        // Listeners are active; show the app even while seeding runs.
        setIsDataReady(true);

        if (!seededRef.current) {
          await seedNexusDataIfEmpty();
          await seedStockExchangesIfEmpty();
          await seedcompanyAppsIfEmpty();
          await seedCalendarEventsIfEmpty();
          await seedKnowledgeDocsIfEmpty();
          await seedTeamMembersIfEmpty();
          await seedContactTeamsIfEmpty();
          await applyDirectoryAndLinkSeedUpdate();
          await applyPartnerTeamEmailUpdate();
          await seedReportTrackerIfEmpty();
          await seedProductionTrackerIfEmpty();
          seededRef.current = true;
        }
      } catch (error) {
        console.error("Failed to start Firestore sync:", error);
        setSyncError(
          error instanceof Error
            ? error.message
            : "Failed to connect to Firestore. Check rules and database setup."
        );
        setIsDataReady(true);
      }
    }

    startSync();

    return () => {
      unsubData?.();
    };
  }, [useFirestore, firebaseUser]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_tools", JSON.stringify(tools));
  }, [useFirestore, tools]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_faqs", JSON.stringify(faqs));
  }, [useFirestore, faqs]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_articles", JSON.stringify(articles));
  }, [useFirestore, articles]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_metrics", JSON.stringify(metrics));
  }, [useFirestore, metrics]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_links", JSON.stringify(links));
  }, [useFirestore, links]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_stock_exchanges", JSON.stringify(stockExchanges));
  }, [useFirestore, stockExchanges]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_company_apps", JSON.stringify(companyApps));
  }, [useFirestore, companyApps]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_calendar_events", JSON.stringify(calendarEvents));
  }, [useFirestore, calendarEvents]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_team_members", JSON.stringify(teamMembers));
  }, [useFirestore, teamMembers]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_contact_teams", JSON.stringify(contactTeams));
  }, [useFirestore, contactTeams]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_knowledge_docs", JSON.stringify(knowledgeDocs));
  }, [useFirestore, knowledgeDocs]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_kanban_boards", JSON.stringify(kanbanBoards));
  }, [useFirestore, kanbanBoards]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem("nexus_kanban_cards", JSON.stringify(kanbanCards));
  }, [useFirestore, kanbanCards]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reportTracker));
  }, [useFirestore, reportTracker]);

  useEffect(() => {
    if (useFirestore) return;
    localStorage.setItem(
      "nexus_production_tracker",
      JSON.stringify(productionTracker)
    );
  }, [useFirestore, productionTracker]);

  const localActions: NexusRepositoryActions = {
    upsertTool: async (item) =>
      setTools((prev) => {
        const exists = prev.some((t) => t.id === item.id);
        return exists ? prev.map((t) => (t.id === item.id ? item : t)) : [item, ...prev];
      }),
    deleteTool: async (id) => setTools((prev) => prev.filter((t) => t.id !== id)),
    upsertFaq: async (item) =>
      setFaqs((prev) => {
        const exists = prev.some((f) => f.id === item.id);
        return exists ? prev.map((f) => (f.id === item.id ? item : f)) : [item, ...prev];
      }),
    deleteFaq: async (id) => setFaqs((prev) => prev.filter((f) => f.id !== id)),
    upsertArticle: async (item) =>
      setArticles((prev) => {
        const exists = prev.some((a) => a.id === item.id);
        return exists ? prev.map((a) => (a.id === item.id ? item : a)) : [item, ...prev];
      }),
    deleteArticle: async (id) => setArticles((prev) => prev.filter((a) => a.id !== id)),
    upsertMetric: async (item) =>
      setMetrics((prev) => {
        const exists = prev.some((m) => m.id === item.id);
        return exists ? prev.map((m) => (m.id === item.id ? item : m)) : [...prev, item];
      }),
    deleteMetric: async (id) => setMetrics((prev) => prev.filter((m) => m.id !== id)),
    upsertLink: async (item) =>
      setLinks((prev) => {
        const exists = prev.some((l) => l.id === item.id);
        return exists ? prev.map((l) => (l.id === item.id ? item : l)) : [...prev, item];
      }),
    deleteLink: async (id) => setLinks((prev) => prev.filter((l) => l.id !== id)),
    upsertStockExchange: async (item) =>
      setStockExchanges((prev) => {
        const exists = prev.some((s) => s.id === item.id);
        return exists ? prev.map((s) => (s.id === item.id ? item : s)) : [...prev, item];
      }),
    deleteStockExchange: async (id) =>
      setStockExchanges((prev) => prev.filter((s) => s.id !== id)),
    upsertcompanyApp: async (item) =>
      setcompanyApps((prev) => {
        const next = normalizecompanyApp(item);
        const exists = prev.some((a) => a.id === next.id);
        return exists
          ? prev.map((a) => (a.id === next.id ? next : a))
          : [next, ...prev].sort((a, b) => a.companyName.localeCompare(b.companyName));
      }),
    deletecompanyApp: async (id) => setcompanyApps((prev) => prev.filter((a) => a.id !== id)),
    upsertCalendarEvent: async (item) =>
      setCalendarEvents((prev) => {
        const exists = prev.some((e) => e.id === item.id);
        const next = exists
          ? prev.map((e) => (e.id === item.id ? item : e))
          : [...prev, item];
        return next.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.title.localeCompare(b.title);
        });
      }),
    deleteCalendarEvent: async (id) =>
      setCalendarEvents((prev) => prev.filter((e) => e.id !== id)),
    upsertTeamMember: async (item) =>
      setTeamMembers((prev) => {
        const exists = prev.some((m) => m.id === item.id);
        const next = exists
          ? prev.map((m) => (m.id === item.id ? item : m))
          : [...prev, item];
        return next.sort((a, b) => {
          const roleCompare = a.role.localeCompare(b.role);
          if (roleCompare !== 0) return roleCompare;
          return a.name.localeCompare(b.name);
        });
      }),
    deleteTeamMember: async (id) =>
      setTeamMembers((prev) => prev.filter((m) => m.id !== id)),
    upsertContactTeam: async (item) =>
      setContactTeams((prev) => {
        const exists = prev.some((t) => t.id === item.id);
        const next = exists
          ? prev.map((t) => (t.id === item.id ? item : t))
          : [...prev, item];
        return next.sort((a, b) => {
          const categoryCompare = a.category.localeCompare(b.category);
          if (categoryCompare !== 0) return categoryCompare;
          return a.name.localeCompare(b.name);
        });
      }),
    deleteContactTeam: async (id) =>
      setContactTeams((prev) => prev.filter((t) => t.id !== id)),
    upsertKnowledgeDoc: async (item) =>
      setKnowledgeDocs((prev) => {
        const exists = prev.some((d) => d.id === item.id);
        return exists
          ? prev.map((d) => (d.id === item.id ? item : d))
          : [item, ...prev];
      }),
    deleteKnowledgeDoc: async (id) =>
      setKnowledgeDocs((prev) => prev.filter((d) => d.id !== id)),
    upsertKanbanBoard: async (item) =>
      setKanbanBoards((prev) => {
        const exists = prev.some((b) => b.id === item.id);
        return exists ? prev.map((b) => (b.id === item.id ? item : b)) : [...prev, item];
      }),
    deleteKanbanBoard: async (id) =>
      setKanbanBoards((prev) => prev.filter((b) => b.id !== id)),
    upsertKanbanCard: async (item) =>
      setKanbanCards((prev) => {
        const exists = prev.some((c) => c.id === item.id);
        return exists ? prev.map((c) => (c.id === item.id ? item : c)) : [...prev, item];
      }),
    deleteKanbanCard: async (id) =>
      setKanbanCards((prev) => prev.filter((c) => c.id !== id)),
    upsertReportTrackerEntry: async (item) =>
      setReportTracker((prev) => {
        const exists = prev.some((e) => e.id === item.id);
        const next = exists
          ? prev.map((e) => (e.id === item.id ? item : e))
          : [...prev, item];
        return normalizeReportTrackerEntries(next);
      }),
    deleteReportTrackerEntry: async (id) =>
      setReportTracker((prev) => prev.filter((e) => e.id !== id)),
    upsertProductionTrackerEntry: async (item) =>
      setProductionTracker((prev) => {
        const exists = prev.some((e) => e.id === item.id);
        return exists
          ? prev.map((e) => (e.id === item.id ? item : e))
          : [...prev, item];
      }),
    deleteProductionTrackerEntry: async (id) =>
      setProductionTracker((prev) => prev.filter((e) => e.id !== id)),
  };

  const logout = useCallback(async () => {
    if (useFirestore) {
      await signOut(getFirebaseAuth());
    }
  }, [useFirestore]);

  const isLoggedIn = useFirestore ? Boolean(firebaseUser) : Boolean(sessionToken);

  return {
    mode,
    isAuthReady,
    isDataReady: useFirestore ? isDataReady && isLoggedIn : isLoggedIn,
    syncError,
    firebaseUser,
    tools,
    faqs,
    articles,
    metrics,
    links,
    stockExchanges,
    companyApps,
    calendarEvents,
    teamMembers,
    contactTeams,
    knowledgeDocs,
    kanbanBoards,
    kanbanCards,
    reportTracker,
    productionTracker,
    actions: useFirestore ? nexusRepositoryActions : localActions,
    logout,
  };
}
