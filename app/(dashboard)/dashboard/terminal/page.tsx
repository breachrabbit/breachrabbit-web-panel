"use client";

import { Terminal as TerminalIcon, Plus, X, Maximize2, Minimize2, Copy } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface TerminalTab {
  id: string;
  title: string;
  active: boolean;
}

export default function TerminalPage() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: "1", title: "root@server", active: true },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [fullscreen, setFullscreen] = useState(false);
  const [connected, setConnected] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Terminal will be initialized with xterm.js when running on server
  // For now, show a placeholder with instructions
  const [history, setHistory] = useState<string[]>([
    "\x1b[32mroot@hostpanel\x1b[0m:\x1b[34m~\x1b[0m$ ",
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // In production, this would initialize xterm.js + WebSocket
    // import('xterm').then(({ Terminal }) => { ... })
    setConnected(true);
  }, []);

  const addTab = () => {
    const id = String(Date.now());
    setTabs([...tabs, { id, title: `root@server`, active: false }]);
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const cmd = input.trim();
      const newHistory = [
        ...history,
        `${cmd}\n`,
      ];

      // Simulate basic command responses
      if (cmd === "clear") {
        setHistory(["\x1b[32mroot@hostpanel\x1b[0m:\x1b[34m~\x1b[0m$ "]);
        setInput("");
        return;
      }

      if (cmd) {
        // Mock responses
        const responses: Record<string, string> = {
          "whoami": "root\n",
          "hostname": "hostpanel-server\n",
          "uptime": " 14:32:01 up 45 days, 3:22, 1 user, load average: 0.12, 0.08, 0.05\n",
          "date": new Date().toUTCString() + "\n",
          "uname -a": "Linux hostpanel-server 6.1.0-18-amd64 #1 SMP Debian 6.1.76-1 (2024-02-01) x86_64 GNU/Linux\n",
          "ls": "\x1b[34mblog.example.com\x1b[0m  \x1b[34mshop.example.com\x1b[0m  \x1b[34mapi.example.com\x1b[0m\n",
          "df -h": "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G  6.2G   43G  13% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm\n",
          "free -m": "              total        used        free      shared  buff/cache   available\nMem:           3956        1247         412         128        2296        2356\nSwap:          2048          23        2025\n",
        };

        const response = responses[cmd] || `bash: ${cmd}: command not found\n`;
        newHistory.push(response);
      }

      newHistory.push("\x1b[32mroot@hostpanel\x1b[0m:\x1b[34m~\x1b[0m$ ");
      setHistory(newHistory);
      setInput("");
    }
  };

  return (
    <div className={`space-y-4 ${fullscreen ? "fixed inset-0 z-50 bg-[#0a0a0a] p-4" : ""}`}>
      {/* Header */}
      {!fullscreen && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Terminal</h2>
            <p className="text-sm text-[#555]">
              Secure shell access to your server
            </p>
          </div>
        </div>
      )}

      {/* Terminal container */}
      <div className="rounded-md border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col"
        style={{ height: fullscreen ? "calc(100vh - 2rem)" : "calc(100vh - 220px)", minHeight: "400px" }}
      >
        {/* Tab bar */}
        <div className="flex items-center border-b border-[#222] bg-[#111]">
          <div className="flex items-center overflow-x-auto flex-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer border-r border-[#222] ${
                  activeTab === tab.id
                    ? "bg-[#0a0a0a] text-white"
                    : "text-[#555] hover:text-white hover:bg-[#141414]"
                } transition-colors`}
              >
                <TerminalIcon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    className="p-0.5 rounded hover:bg-[#222] transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addTab}
              className="p-2.5 text-[#555] hover:text-white transition-colors"
              title="New tab"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 px-2">
            <div className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-danger"}`} />
            <span className="text-[11px] text-[#555] mr-2">
              {connected ? "Connected" : "Disconnected"}
            </span>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#222] transition-colors"
            >
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-auto bg-[#0a0a0a]"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
        >
          {/* Welcome message */}
          <div className="text-[#555] mb-2">
            Welcome to HostPanel Pro Terminal v2.0
            <br />
            Connected as root@hostpanel-server
            <br />
            Type &apos;help&apos; for available commands.
            <br />
            <br />
          </div>

          {/* History */}
          {history.map((line, i) => (
            <span key={i} className="text-[#ccc]" dangerouslySetInnerHTML={{
              __html: line
                .replace(/\x1b\[32m/g, '<span class="text-success">')
                .replace(/\x1b\[34m/g, '<span class="text-brand">')
                .replace(/\x1b\[0m/g, '</span>')
                .replace(/\n/g, '<br/>')
            }} />
          ))}

          {/* Current input */}
          <span className="text-[#ccc]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-transparent border-none outline-none text-[#ccc] font-mono text-sm w-[calc(100%-1rem)] caret-success"
              spellCheck={false}
            />
          </span>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-[#222] bg-[#111] px-4 py-1.5 text-[11px] text-[#555]">
          <span>root@hostpanel-server:~</span>
          <span>UTF-8 | LF | bash</span>
        </div>
      </div>

      {!fullscreen && (
        <p className="text-xs text-[#333]">
          Note: Full terminal with xterm.js + node-pty will be activated on the server.
          This is a preview interface.
        </p>
      )}
    </div>
  );
}
