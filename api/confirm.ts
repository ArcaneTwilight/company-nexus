import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleConfirmRaw } from "../server/http/handlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleConfirmRaw(req as any, res as any);
}
