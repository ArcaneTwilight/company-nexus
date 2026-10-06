export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Live" | "In Development" | "Archived";
  url: string;
  lastUpdated: string;
}

export interface FAQItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  body: string;
  /** Denormalized AI registry card — preferred over re-parsing body. */
  summary?: string;
  outline?: KnowledgeOutlineHeading[];
  tokenEstimate?: number;
  contentVersion?: number;
  lastUpdated: string;
  isArchived: boolean;
}

export interface KBItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  body: string; // supports rich Markdown
  /** Denormalized AI registry card — preferred over re-parsing body. */
  summary?: string;
  outline?: KnowledgeOutlineHeading[];
  tokenEstimate?: number;
  contentVersion?: number;
  lastUpdated: string;
  isArchived: boolean;
}

export interface MetricItem {
  id: string;
  title: string;
  value: string;
  category: string;
  lastUpdated: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  category: string;
  notes?: string;
}

export interface TimezoneConfig {
  name: string;
  label: string;
  timezone: string;
}

export interface StockExchangeLink {
  id: string;
  country: string;
  city: string;
  exchange: string;
  code: string;
  flag: string;
  url: string;
  vpnRequired: boolean;
  note: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  proposals?: AgentProposal[];
  toolsUsed?: string[];
  citations?: KnowledgeCitation[];
}

export type AgentMode = "kb" | "hub" | "write";

/** Retrieval routing hint — orthogonal to AgentMode (capability). */
export type KnowledgeMode =
  | "support"
  | "developer"
  | "clients"
  | "team"
  | "reports"
  | "general"
  | "auto";

export type KnowledgeDomain =
  | "support"
  | "developer"
  | "clients"
  | "team"
  | "reports"
  | "general";

export type KnowledgeSourceCollection =
  | "faqs"
  | "kbArticles"
  | "companyApps"
  | "calendarEvents"
  | "teamMembers"
  | "contactTeams"
  | "knowledgeDocs"
  | "virtual";

export type KnowledgeChunkSourceCollection =
  | "faqs"
  | "kbArticles"
  | "companyApps"
  | "knowledgeDocs";

export interface KnowledgeChunk {
  id: string;
  sourceCollection: KnowledgeChunkSourceCollection;
  sourceDocId: string;
  chunkIndex: number;
  chunkText: string;
  title: string;
  sectionHeading?: string;
  category?: string;
  domain?: KnowledgeDomain;
  tags?: string[];
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
}

export interface KnowledgeCitation {
  id: string;
  sourceCollection: KnowledgeChunkSourceCollection;
  sourceDocId: string;
  chunkIndex: number;
  title: string;
  sectionHeading?: string;
  score: number;
}

export interface KnowledgeOutlineHeading {
  heading: string;
  anchor: string;
  charStart?: number;
  charEnd?: number;
}

export interface KnowledgeRegistryEntry {
  id: string;
  sourceCollection: KnowledgeSourceCollection;
  sourceId: string;
  title: string;
  domain: KnowledgeDomain;
  tags: string[];
  summary: string;
  outline: KnowledgeOutlineHeading[];
  tokenEstimate: number;
  contentHash: string;
  contentVersion: number;
  updatedAt: string;
  isArchived: boolean;
}

/** Long-form Markdown reports / docs for the knowledge layer. */
export interface KnowledgeDoc {
  id: string;
  title: string;
  domain: KnowledgeDomain;
  tags: string[];
  body: string;
  summary?: string;
  outline?: KnowledgeOutlineHeading[];
  tokenEstimate?: number;
  contentVersion: number;
  lastUpdated: string;
  isArchived: boolean;
}

export type ProposalAction = "create" | "update" | "delete";

export type ProposalCollection =
  | "faqs"
  | "kbArticles"
  | "companyApps"
  | "calendarEvents"
  | "teamMembers"
  | "contactTeams"
  | "knowledgeDocs";

export interface AgentProposal {
  id: string;
  tool: string;
  collection: ProposalCollection;
  action: ProposalAction;
  documentId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  summary: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  createdBy: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** IANA timezone id used for live local clocks (e.g. Asia/Manila). */
  timezoneId: string;
  /** Human-readable timezone label (e.g. Asia/Manila (PST)). */
  timezone: string;
  email: string;
  contactNotes: string;
}

/**
 * Partner / external teams (not Company people). Quick reference for who owns
 * app-adjacent data (announcements, content, etc.) plus group contact channels.
 */
export interface ContactTeam {
  id: string;
  name: string;
  /** Optional grouping label (e.g. Content, Operations, Client). */
  category: string;
  /** Shared team mailbox or distribution list. */
  email: string;
  /** Slack / Teams / chat room URL or name. */
  groupChat: string;
  /** What this team owns — used as human + AI quick reference. */
  notes: string;
}

export type AIUtilityCategory = "Tool" | "Prompt Template" | "Guide";

export interface AIUtilityItem {
  id: string;
  title: string;
  description: string;
  category: AIUtilityCategory;
  url?: string;
  content?: string;
  lastUpdated: string;
}

export type CalendarEventType = "Report" | "Event" | "Upload" | "Release";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  description: string;
  owner: string;
}

export type IRAppClientStatus = "Active" | "Onboarding" | "Maintenance" | "Archived";

export interface IRAppClient {
  id: string;
  clientName: string;
  pssMember: string;
  devMember: string;
  status: IRAppClientStatus;
  platform: string;
  comments: string;
  lastUpdated: string;
}

/** Semantic status keys used by the master-list table pills */
export type IRAppMasterStatusKey =
  | "online"
  | "for_production"
  | "client_testing"
  | "on_development"
  | "on_hold"
  | "cancelled"
  | "new"
  | "rejected"
  | "unknown";

export type FeatureTriState = "yes" | "no" | "partial" | "unknown";

/** Strict Yes/No only — never any other label in UI or storage */
export type HasChangesValue = "Yes" | "No";

export interface FeatureFlagValue {
  value: FeatureTriState;
  label: string;
}

export interface companymasterapp {
  id: string;
  companyName: string;
  statusKey: IRAppMasterStatusKey;
  statusLabel: string;
  liveVersion: string;
  upgradeOrNewOrder: string;
  v3Release: string;
  v3ReleaseRaw: string;
  initialReleaseDate: string;
  initialReleaseDateRaw: string;
  dateOrdered: string;
  daysCompleted: string;
  ongoingV2Production: string;
  iosDownloads: string;
  androidDownloads: string;
  pushNotification: string;
  deleteAccountFeature: string;
  accountFeature: FeatureFlagValue;
  media: FeatureFlagValue;
  aiFeatures: FeatureFlagValue;
  initialIosRelease: string;
  initialAndroidRelease: string;
  dateField: string;
  comments: string;
  /** Strict Yes/No flag — never any other label */
  hasChanges: HasChangesValue;
  salesOnboardingPoc: string[];
  salesOnboardingPocRaw: string;
  pssPoc: string[];
  devPoc: string[];
  country: string;
  market: string;
  stockExchange: string;
  dynamicContent: string;
  manualUpdateModule: string;
  marketingMaterial: string[];
  marketingMaterialRaw: string;
  androidClosedTesting: string[];
  androidClosedTestingRaw: string;
  androidInternalTesting: string[];
  androidInternalTestingRaw: string;
  lastUpdated: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cardIds: string[];
  maxVisible?: number;
  autoArchive?: boolean;
}

export interface KanbanCard {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  actions?: string[];
  position: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type IRAppMasterColumnId =
  | "companyName"
  | "status"
  | "liveVersion"
  | "upgradeOrNewOrder"
  | "initialReleaseDate"
  | "country"
  | "market"
  | "stockExchange"
  | "hasChanges"
  | "comments"
  | "lastUpdated"
  | "actions";

/** Quarterly report upload status for one quarter */
export interface OtherReportItem {
  id: string;
  label: string;
  uploaded: boolean;
}

export interface QuarterReportStatus {
  fr: boolean | null; // FR/FS/QR
  ip: boolean | null; // IP
  ep: boolean | null; // EP/RP
  mda: boolean | null; // MD&A
  pr: boolean | null; // PR/ER
  t: boolean | null; // T/ECT
  others: OtherReportItem[];
  completed: boolean;
}

/** Annual report upload status for one year */
export interface AnnualReportStatus {
  ar: boolean | null;
  sr: boolean | null;
  others: OtherReportItem[];
}

/** One company row in the Report Upload tracker */
export interface ReportTrackerEntry {
  id: string;
  appName: string;
  companyCode: string;
  stockExchange: string;
  /** Linked companymasterapp id when matched */
  irappClientId?: string;
  financialReports: boolean | null;
  annualReports: boolean | null;
  esgReports: boolean | null;
  /** Keys like "2026-Q1", "2025-Q2" */
  quarters: Record<string, QuarterReportStatus>;
  /** Keys like "2025", "2024" (annual report year) */
  annual: Record<string, AnnualReportStatus>;
  financialCalendar: boolean;
  docLib: boolean;
}

export type ReportQuarterView = "Q1" | "Q2" | "Q3" | "Q4" | "annual";

export type QuarterReportFieldId = "fr" | "ip" | "ep" | "mda" | "pr" | "t";
export type AnnualReportFieldId = "ar" | "sr";

/** One row in the Internal Production Tracker */
export interface ProductionTrackerEntry {
  id: string;
  clientName: string;
  priority: string;
  assignedDev: string;
  assignedPss: string;
  currentPhase: string;
  /** Linked companymasterapp id when matched */
  companyAppId?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}
