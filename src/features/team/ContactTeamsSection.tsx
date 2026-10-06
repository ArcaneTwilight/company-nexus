import { Fragment, useMemo } from "react";
import type { ContactTeam } from "../../types";
import {
  AlertTriangle,
  Building2,
  LayoutGrid,
  Mail,
  MessageSquare,
  MessagesSquare,
  Pencil,
  Plus,
} from "lucide-react";
import {
  EmptyState,
  GlassButton,
  GlassCard,
  StaggerGrid,
  StaggerItem,
} from "../../components/motion";
import { SectionToolbar } from "../../components/shared";
import { useSyncedSearch } from "../../hooks/useSyncedSearch";
import { useEntityModal } from "../../hooks/useEntityModal";
import { useCategoryFilter } from "../../hooks/useCategoryFilter";
import { ContactTeamModal } from "./ContactTeamModal";

interface ContactTeamsSectionProps {
  teams: ContactTeam[];
  initialSearch?: string;
  onUpsert: (team: ContactTeam) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function ContactTeamsSection({
  teams,
  initialSearch = "",
  onUpsert,
  onDelete,
}: ContactTeamsSectionProps) {
  const [searchTerm, setSearchTerm] = useSyncedSearch(initialSearch);
  const { selectedCategory, setSelectedCategory, categories, matchesCategory } =
    useCategoryFilter(teams, (team) => team.category);
  const { open, editingItem, openCreate, openEdit, close } = useEntityModal<ContactTeam>();

  const categoryExtras = useMemo(() => teams.map((t) => t.category), [teams]);
  const query = searchTerm.toLowerCase();

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(query) ||
      team.category.toLowerCase().includes(query) ||
      team.email.toLowerCase().includes(query) ||
      team.groupChat.toLowerCase().includes(query) ||
      team.notes.toLowerCase().includes(query);
    return matchesSearch && matchesCategory(team);
  });

  return (
    <div className="space-y-6">
      <SectionToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search teams by name, email, or ownership notes..."
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryIcon={<LayoutGrid className="w-4 h-4 text-fg-muted shrink-0" />}
        actions={
          <GlassButton variant="primary" onClick={openCreate} iconRight={<Plus className="w-4 h-4" />}>
            Add team
          </GlassButton>
        }
      />

      <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-1">
          Partner teams
        </p>
        <p className="text-sm text-fg font-sans font-light leading-relaxed">
          Teams outside Company that own app-adjacent data. Use ownership notes as a quick
          reference for who to approach — also searchable by the AI assistant.
        </p>
      </div>

      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          message="No partner teams found. Add a team to track email, group chat, and ownership notes."
        />
      ) : (
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team, index) => (
            <Fragment key={team.id}>
              <StaggerItem>
                <GlassCard index={index} className="p-5 flex flex-col group h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold font-display text-fg group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors truncate">
                        {team.name}
                      </h3>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {team.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(team)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-2.5 py-1.5 text-[11px] font-mono text-fg-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`Edit ${team.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {team.email ? (
                      <div className="flex items-center gap-2 text-xs text-fg-muted">
                        <Mail className="w-3.5 h-3.5 text-fg-subtle shrink-0" />
                        <a
                          href={`mailto:${team.email}`}
                          className="hover:text-sky-700 dark:hover:text-sky-300 transition-colors truncate"
                        >
                          {team.email}
                        </a>
                      </div>
                    ) : null}
                    {team.groupChat ? (
                      <div className="flex items-center gap-2 text-xs text-fg-muted">
                        <MessagesSquare className="w-3.5 h-3.5 text-fg-subtle shrink-0" />
                        {isHttpUrl(team.groupChat) ? (
                          <a
                            href={team.groupChat}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-sky-700 dark:hover:text-sky-300 transition-colors truncate"
                          >
                            {team.groupChat}
                          </a>
                        ) : (
                          <span className="truncate">{team.groupChat}</span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {team.notes ? (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-fg-subtle shrink-0 mt-0.5" />
                        <p className="text-xs text-fg-muted leading-relaxed font-sans font-light">
                          {team.notes}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </GlassCard>
              </StaggerItem>
            </Fragment>
          ))}
        </StaggerGrid>
      )}

      <ContactTeamModal
        open={open}
        team={editingItem}
        categories={categoryExtras}
        onClose={close}
        onSave={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
