/**
 * WebSocket Terminal Server
 *
 * This is a standalone Node.js WebSocket server that manages
 * interactive PTY sessions via node-pty + ws.
 *
 * Run alongside Next.js: `node server/terminal-ws.js`
 * Or integrate into custom server.ts
 *
 * Protocol:
 *   Client → Server: { type: "input", data: "ls -la\r" }
 *   Client → Server: { type: "resize", cols: 120, rows: 40 }
 *   Server → Client: { type: "output", data: "..." }
 *   Server → Client: { type: "exit", code: 0 }
 */

import { WebSocketServer, WebSocket } from "ws";

// node-pty is an optional dependency — imported dynamically
let pty: typeof import("node-pty") | null = null;

async function loadPty() {
  if (!pty) {
    try {
      pty = await import("node-pty");
    } catch {
      console.error("node-pty not available. Install with: npm install node-pty");
      process.exit(1);
    }
  }
  return pty!;
}

const PORT = parseInt(process.env.TERMINAL_WS_PORT || "3001");

interface TerminalSession {
  pty: any;
  ws: WebSocket;
}

const sessions = new Map<string, TerminalSession>();

async function startServer() {
  const nodePty = await loadPty();

  const wss = new WebSocketServer({ port: PORT });
  console.log(`Terminal WebSocket server running on port ${PORT}`);

  wss.on("connection", (ws, req) => {
    // TODO: Validate auth token from query string
    // const token = new URL(req.url!, `http://localhost`).searchParams.get("token");

    const sessionId = Math.random().toString(36).slice(2);
    const shell = process.env.SHELL || "/bin/bash";

    const terminal = nodePty.spawn(shell, [], {
      name: "xterm-256color",
      cols: 120,
      rows: 40,
      cwd: process.env.HOME || "/root",
      env: {
        ...process.env,
        TERM: "xterm-256color",
      } as Record<string, string>,
    });

    sessions.set(sessionId, { pty: terminal, ws });

    // PTY → WebSocket
    terminal.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "output", data }));
      }
    });

    terminal.onExit(({ exitCode }: { exitCode: number }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "exit", code: exitCode }));
      }
      sessions.delete(sessionId);
    });

    // WebSocket → PTY
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "input":
            terminal.write(msg.data);
            break;
          case "resize":
            if (msg.cols && msg.rows) {
              terminal.resize(msg.cols, msg.rows);
            }
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      terminal.kill();
      sessions.delete(sessionId);
    });

    ws.on("error", () => {
      terminal.kill();
      sessions.delete(sessionId);
    });

    // Send initial session info
    ws.send(
      JSON.stringify({
        type: "connected",
        sessionId,
        shell,
      })
    );
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("Shutting down terminal server...");
    for (const [, session] of sessions) {
      session.pty.kill();
      session.ws.close();
    }
    wss.close();
    process.exit(0);
  });
}

startServer();
