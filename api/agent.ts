import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAgentRaw } from "../server/http/handlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleAgentRaw(req as any, res as any);
}
