import type { AIUtilityItem } from "../types";

export const INITIAL_AI_UTILITIES: AIUtilityItem[] = [
  {
    id: "ai-1",
    title: "Company FAQ Grounded Agent",
    description: "Ask workflow questions against the live FAQ knowledge base with cited answers.",
    category: "Tool",
    url: "#faqs",
    lastUpdated: "2026-07-01",
  },
  {
    id: "ai-2",
    title: "Developer KB Assistant",
    description: "Technical Q&A grounded on engineering articles, release protocols, and architecture notes.",
    category: "Tool",
    url: "#kb",
    lastUpdated: "2026-07-01",
  },
  {
    id: "ai-3",
    title: "PoC Feature Request Template",
    description:
      "Structured prompt for scoping a proof-of-concept: problem statement, success criteria, data sources, and deliverables.",
    category: "Prompt Template",
    content:
      "You are an Company product analyst. Help me scope a PoC for [FEATURE]. Include: 1) Problem statement, 2) Target users, 3) Success metrics, 4) Required integrations, 5) Timeline estimate, 6) Risks.",
    lastUpdated: "2026-06-28",
  },
  {
    id: "ai-4",
    title: "Client Demo Script Generator",
    description: "Generate tailored demo walkthrough scripts based on client industry and feature set.",
    category: "Prompt Template",
    content:
      "Create a 15-minute Company demo script for a [INDUSTRY] client interested in [FEATURES]. Include talking points, screen flow, and objection handling.",
    lastUpdated: "2026-06-25",
  },
  {
    id: "ai-5",
    title: "Building a Vercel PoC",
    description: "Step-by-step guide to spinning up a quick proof-of-concept on Vercel with Company design tokens.",
    category: "Guide",
    content:
      "1. Clone the Company starter template\n2. Configure environment variables\n3. Deploy to Vercel preview\n4. Share preview URL with stakeholders\n5. Collect feedback and update content directly on the relevant Nexus section",
    lastUpdated: "2026-06-20",
  },
  {
    id: "ai-6",
    title: "Requesting AI-Generated Results",
    description: "Best practices for writing effective prompts when requesting analysis, summaries, or code from AI tools.",
    category: "Guide",
    content:
      "Be specific about context, desired output format, constraints, and examples. Always review AI output before sharing with clients. Use grounded agents when factual accuracy is critical.",
    lastUpdated: "2026-06-15",
  },
];
