import type { FAQItem, KBItem, QuickLink, ToolItem } from "../types";

export type GlobalSearchResultType = "Tool" | "FAQ" | "KB Article" | "Quick Link";
export type GlobalSearchTab = "tools" | "faqs" | "kb" | "links";

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: GlobalSearchResultType;
  tab: GlobalSearchTab;
  desc: string;
}

export interface GlobalSearchCollections {
  tools: ToolItem[];
  faqs: FAQItem[];
  articles: KBItem[];
  links: QuickLink[];
}

export function searchNexusCollections(
  query: string,
  collections: GlobalSearchCollections
): GlobalSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results: GlobalSearchResult[] = [];
  const { tools, faqs, articles, links } = collections;

  for (const tool of tools) {
    if (
      tool.title.toLowerCase().includes(normalized) ||
      tool.description.toLowerCase().includes(normalized)
    ) {
      results.push({
        id: tool.id,
        title: tool.title,
        type: "Tool",
        tab: "tools",
        desc: tool.description,
      });
    }
  }

  for (const faq of faqs.filter((f) => !f.isArchived)) {
    if (
      faq.title.toLowerCase().includes(normalized) ||
      faq.body.toLowerCase().includes(normalized)
    ) {
      results.push({
        id: faq.id,
        title: faq.title,
        type: "FAQ",
        tab: "faqs",
        desc: `${faq.body.slice(0, 80)}...`,
      });
    }
  }

  for (const article of articles.filter((a) => !a.isArchived)) {
    if (
      article.title.toLowerCase().includes(normalized) ||
      article.body.toLowerCase().includes(normalized)
    ) {
      results.push({
        id: article.id,
        title: article.title,
        type: "KB Article",
        tab: "kb",
        desc: `${article.body.slice(0, 80)}...`,
      });
    }
  }

  for (const link of links) {
    if (
      link.title.toLowerCase().includes(normalized) ||
      link.url.toLowerCase().includes(normalized)
    ) {
      results.push({
        id: link.id,
        title: link.title,
        type: "Quick Link",
        tab: "links",
        desc: link.url,
      });
    }
  }

  return results;
}
