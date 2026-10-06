import { agentConfig } from "./config";

export class AgentRateLimitError extends Error {
  status = 429;
  retryAfterSec: number;

  constructor(message: string, retryAfterSec: number) {
    super(message);
    this.name = "AgentRateLimitError";
    this.retryAfterSec = Math.max(1, Math.ceil(retryAfterSec));
  }
}

interface Waiter {
  uid: string;
  resolve: (release: () => void) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface UserDayState {
  dayKey: string;
  count: number;
  inFlight: number;
}

/** In-process admission control + Gemini RPM token bucket (per server instance). */
class AgentAdmissionControl {
  private inFlight = 0;
  private queue: Waiter[] = [];
  private turnTimestamps: number[] = [];
  private geminiTimestamps: number[] = [];
  private users = new Map<string, UserDayState>();

  private dayKey(now = Date.now()): string {
    return new Date(now).toISOString().slice(0, 10);
  }

  private userState(uid: string): UserDayState {
    const key = this.dayKey();
    const existing = this.users.get(uid);
    if (!existing || existing.dayKey !== key) {
      const fresh = { dayKey: key, count: 0, inFlight: 0 };
      this.users.set(uid, fresh);
      return fresh;
    }
    return existing;
  }

  private pruneWindow(timestamps: number[], windowMs: number, now: number): number[] {
    return timestamps.filter((t) => now - t < windowMs);
  }

  private turnsAvailable(now: number): boolean {
    const { globalTurnsPerMinute, maxConcurrentTurns } = agentConfig();
    this.turnTimestamps = this.pruneWindow(this.turnTimestamps, 60_000, now);
    return this.inFlight < maxConcurrentTurns && this.turnTimestamps.length < globalTurnsPerMinute;
  }

  private tryAdmit(uid: string): (() => void) | null {
    const cfg = agentConfig();
    const now = Date.now();
    const user = this.userState(uid);

    if (user.inFlight >= cfg.perUserConcurrent) return null;
    if (user.count >= cfg.perUserDailyTurns) {
      throw new AgentRateLimitError(
        `Daily AIRA limit reached (${cfg.perUserDailyTurns} questions/day on free-tier settings). Try again tomorrow, or use header search for lookups.`,
        secondsUntilUtcMidnight(now)
      );
    }
    if (!this.turnsAvailable(now)) return null;

    this.inFlight += 1;
    user.inFlight += 1;
    user.count += 1;
    this.turnTimestamps.push(now);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.inFlight = Math.max(0, this.inFlight - 1);
      user.inFlight = Math.max(0, user.inFlight - 1);
      this.drainQueue();
    };
  }

  private drainQueue() {
    while (this.queue.length > 0) {
      const next = this.queue[0];
      try {
        const release = this.tryAdmit(next.uid);
        if (!release) break;
        this.queue.shift();
        clearTimeout(next.timer);
        next.resolve(release);
      } catch (err) {
        this.queue.shift();
        clearTimeout(next.timer);
        next.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  /**
   * Acquire a slot to run one agent turn. Queues briefly when busy.
   * Caller must invoke the returned release() in a finally block.
   */
  async acquireTurn(uid: string): Promise<() => void> {
    try {
      const immediate = this.tryAdmit(uid);
      if (immediate) return immediate;
    } catch (err) {
      if (err instanceof AgentRateLimitError) throw err;
      throw err;
    }

    const { queueWaitMs } = agentConfig();
    if (queueWaitMs <= 0) {
      throw new AgentRateLimitError(
        "AIRA is busy. Please wait a moment and try again.",
        15
      );
    }

    return new Promise<() => void>((resolve, reject) => {
      const waiter: Waiter = {
        uid,
        resolve,
        reject,
        timer: setTimeout(() => {
          const idx = this.queue.indexOf(waiter);
          if (idx >= 0) this.queue.splice(idx, 1);
          reject(
            new AgentRateLimitError(
              "AIRA is at capacity (free-tier rate limit). Please wait a bit, or use header search for quick lookups.",
              20
            )
          );
        }, queueWaitMs),
      };
      this.queue.push(waiter);
      this.drainQueue();
    });
  }

  /** Gate each Gemini generateContent call against a shared RPM bucket. */
  async acquireGeminiCall(): Promise<void> {
    const { geminiCallsPerMinute } = agentConfig();
    const maxWaitMs = 45_000;
    const started = Date.now();

    while (true) {
      const now = Date.now();
      this.geminiTimestamps = this.pruneWindow(this.geminiTimestamps, 60_000, now);
      if (this.geminiTimestamps.length < geminiCallsPerMinute) {
        this.geminiTimestamps.push(now);
        return;
      }
      if (now - started > maxWaitMs) {
        throw new AgentRateLimitError(
          "Gemini free-tier rate limit reached. Please wait about a minute and try again.",
          60
        );
      }
      const oldest = this.geminiTimestamps[0] ?? now;
      const waitMs = Math.min(5_000, Math.max(200, 60_000 - (now - oldest) + 50));
      await sleep(waitMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function secondsUntilUtcMidnight(now: number): number {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now) / 1000));
}

export const agentAdmission = new AgentAdmissionControl();
