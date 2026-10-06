import type { companymasterapp, IRAppMasterColumnId } from "../../../types";
import { MASTER_LIST_COLUMNS } from "../columnConfig";

export type ExportScope = "current" | "all";
export type ExportFormat = "csv" | "xlsx";

/** Columns that are UI-only and never belong in a spreadsheet. */
const NON_EXPORTABLE_COLUMNS = new Set<IRAppMasterColumnId>(["actions"]);

function cellValue(app: companymasterapp, columnId: IRAppMasterColumnId): string {
  switch (columnId) {
    case "companyName":
      return app.companyName ?? "";
    case "status":
      return app.statusLabel || app.statusKey || "";
    case "liveVersion":
      return app.liveVersion ?? "";
    case "upgradeOrNewOrder":
      return app.upgradeOrNewOrder ?? "";
    case "initialReleaseDate":
      return app.initialReleaseDate || app.initialReleaseDateRaw || "";
    case "country":
      return app.country ?? "";
    case "market":
      return app.market ?? "";
    case "stockExchange":
      return app.stockExchange ?? "";
    case "hasChanges":
      return app.hasChanges ?? "";
    case "comments":
      return app.comments ?? "";
    case "lastUpdated":
      return app.lastUpdated ?? "";
    case "actions":
      return "";
    default:
      return "";
  }
}

export function resolveExportColumns(
  scope: ExportScope,
  visibleColumns: Set<IRAppMasterColumnId>
): { id: IRAppMasterColumnId; label: string }[] {
  const source =
    scope === "current"
      ? MASTER_LIST_COLUMNS.filter(
          (column) =>
            visibleColumns.has(column.id) && !NON_EXPORTABLE_COLUMNS.has(column.id)
        )
      : MASTER_LIST_COLUMNS.filter((column) => !NON_EXPORTABLE_COLUMNS.has(column.id));

  return source.map((column) => ({ id: column.id, label: column.label }));
}

export function buildExportRows(
  apps: companymasterapp[],
  columns: { id: IRAppMasterColumnId; label: string }[]
): string[][] {
  const header = columns.map((column) => column.label);
  const rows = apps.map((app) => columns.map((column) => cellValue(app, column.id)));
  return [header, ...rows];
}

/** RFC 4180-style CSV serializer (client-side, no dependencies). */
export function serializeCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = value ?? "";
          if (/[",\r\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(",")
    )
    .join("\r\n");
}

function stampFilename(scope: ExportScope, extension: "csv" | "xlsx"): string {
  const date = new Date().toISOString().slice(0, 10);
  const scopeLabel = scope === "current" ? "current-table" : "all-data";
  return `company-list-${scopeLabel}-${date}.${extension}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function exportCsv(rows: string[][], scope: ExportScope) {
  const csv = serializeCsv(rows);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, stampFilename(scope, "csv"));
}

async function exportXlsx(rows: string[][], scope: ExportScope) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Company Nexus";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Company List", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const [header, ...body] = rows;
  sheet.addRow(header);
  for (const row of body) sheet.addRow(row);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.commit();

  header.forEach((_, index) => {
    const column = sheet.getColumn(index + 1);
    let max = header[index]?.length ?? 10;
    for (const row of body) {
      const len = row[index]?.length ?? 0;
      if (len > max) max = len;
    }
    column.width = Math.min(Math.max(max + 2, 12), 48);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, stampFilename(scope, "xlsx"));
}

export interface ExportIrappListOptions {
  scope: ExportScope;
  format: ExportFormat;
  /** Filtered / currently displayed rows */
  currentApps: companymasterapp[];
  /** Full unfiltered dataset */
  allApps: companymasterapp[];
  visibleColumns: Set<IRAppMasterColumnId>;
}

export async function exportIrappList({
  scope,
  format,
  currentApps,
  allApps,
  visibleColumns,
}: ExportIrappListOptions): Promise<void> {
  const apps = scope === "current" ? currentApps : allApps;
  const columns = resolveExportColumns(scope, visibleColumns);
  const rows = buildExportRows(apps, columns);

  if (format === "csv") {
    await exportCsv(rows, scope);
    return;
  }

  await exportXlsx(rows, scope);
}
