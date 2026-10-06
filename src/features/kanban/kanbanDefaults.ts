import type { KanbanBoard } from "../../types";

const now = new Date().toISOString();

export const DEFAULT_BOARDS: KanbanBoard[] = [
  {
    id: "board-irapp-dev",
    name: "Company Development",
    isDefault: true,
    columns: [
      { id: "col-onhold", title: "On Hold", cardIds: [] },
      { id: "col-planned", title: "Planned", cardIds: [] },
      { id: "col-ongoing", title: "Ongoing", cardIds: [] },
      { id: "col-complete", title: "Complete", cardIds: [], maxVisible: 6, autoArchive: true },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "board-irapp-projects",
    name: "Company Projects",
    isDefault: true,
    columns: [
      { id: "col-todo", title: "To Do", cardIds: [] },
      { id: "col-inprogress", title: "In Progress", cardIds: [] },
      { id: "col-done", title: "Done", cardIds: [] },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export const SAMPLE_CARD = {
  id: "card-sample-1",
  boardId: "board-irapp-dev",
  columnId: "col-planned",
  title: "Analyst Consensus Estimates",
  actions: [
    "In Design",
    "Add Earnings Estimates on the app",
    "Design finalization",
  ],
  position: 0,
  archived: false,
  createdAt: now,
  updatedAt: now,
};
