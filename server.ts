import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { expressAgent, expressConfirm } from "./server/http/handlers";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

app.use(express.json({ limit: "2mb" }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Load Secure Auth Credentials from Environment
const getCredentials = () => {
  const username = process.env.HUB_USERNAME || "company";
  const password = process.env.HUB_PASSWORD || "password";
  return { username, password };
};

// 1. LOGIN ENDPOINT (legacy local mode)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const creds = getCredentials();

  if (username === creds.username && password === creds.password) {
    return res.json({
      success: true,
      token: "irapp-nexus-session-token-2026-secure",
      message: "Access granted",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid credentials",
  });
});

// 2. Agent endpoints (tool-calling Gemini + confirm-before-write)
app.post("/api/agent", expressAgent);
app.post("/api/confirm", expressConfirm);

// Legacy alias — prefer /api/agent
app.post("/api/chat", expressAgent);

// Vite Middleware & Static Serving setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Company Nexus server running on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
