"use client";

import {
  Settings,
  Server,
  Shield,
  Bell,
  Key,
  Globe,
  Database,
  HardDrive,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

interface SettingsSection {
  id: string;
  label: string;
  icon: any;
}

const sections: SettingsSection[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "server", label: "Server", icon: Server },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [saving, setSaving] = useState(false);

  // General settings
  const [panelName, setPanelName] = useState("HostPanel Pro");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Server settings
  const [olsHost, setOlsHost] = useState("127.0.0.1");
  const [olsPort, setOlsPort] = useState("7080");
  const [olsUser, setOlsUser] = useState("admin");
  const [olsPass, setOlsPass] = useState("");
  const [showOlsPass, setShowOlsPass] = useState(false);
  const [defaultPhp, setDefaultPhp] = useState("8.3");

  // Security
  const [sessionTimeout, setSessionTimeout] = useState("24");
  const [twoFactor, setTwoFactor] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");

  // Notifications
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const handleSave = async () => {
    setSaving(true);
    // API call would go here
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-[#555]">Panel configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  activeSection === sec.id
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-[#555] hover:text-white hover:bg-[#141414]"
                }`}
              >
                <sec.icon className="h-4 w-4" />
                {sec.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {/* General */}
          {activeSection === "general" && (
            <div className="space-y-6">
              <div className="rounded-md border border-[#222] bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Panel Name</label>
                    <input
                      type="text"
                      value={panelName}
                      onChange={(e) => setPanelName(e.target.value)}
                      className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#555]">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Moscow">Europe/Moscow</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#555]">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
                      >
                        <option value="en">English</option>
                        <option value="ru">Russian</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Server */}
          {activeSection === "server" && (
            <div className="space-y-6">
              <div className="rounded-md border border-[#222] bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">OpenLiteSpeed Connection</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#555]">Host</label>
                      <input
                        type="text"
                        value={olsHost}
                        onChange={(e) => setOlsHost(e.target.value)}
                        className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#555]">Port</label>
                      <input
                        type="text"
                        value={olsPort}
                        onChange={(e) => setOlsPort(e.target.value)}
                        className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Username</label>
                    <input
                      type="text"
                      value={olsUser}
                      onChange={(e) => setOlsUser(e.target.value)}
                      className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Password</label>
                    <div className="relative">
                      <input
                        type={showOlsPass ? "text" : "password"}
                        value={olsPass}
                        onChange={(e) => setOlsPass(e.target.value)}
                        className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-brand transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOlsPass(!showOlsPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                      >
                        {showOlsPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Default PHP Version</label>
                    <select
                      value={defaultPhp}
                      onChange={(e) => setDefaultPhp(e.target.value)}
                      className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
                    >
                      <option value="8.3">PHP 8.3</option>
                      <option value="8.2">PHP 8.2</option>
                      <option value="8.1">PHP 8.1</option>
                      <option value="7.4">PHP 7.4</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <div className="rounded-md border border-[#222] bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Session Timeout (hours)</label>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full max-w-xs rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-[#555]">Require 2FA for admin login</p>
                    </div>
                    <button
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        twoFactor ? "bg-brand" : "bg-[#333]"
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        twoFactor ? "left-[22px]" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">
                      IP Whitelist (one per line)
                    </label>
                    <textarea
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      placeholder="e.g. 192.168.1.0/24"
                      rows={3}
                      className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] outline-none focus:border-brand transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div className="rounded-md border border-[#222] bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand" />
                      <span className="text-sm text-white">Enable Email</span>
                    </div>
                    <button
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        emailEnabled ? "bg-brand" : "bg-[#333]"
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        emailEnabled ? "left-[22px]" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                  {emailEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#555]">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand transition-colors"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#555]">SMTP Port</label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-[#222] bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Telegram Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-brand" />
                      <span className="text-sm text-white">Enable Telegram</span>
                    </div>
                    <button
                      onClick={() => setTelegramEnabled(!telegramEnabled)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        telegramEnabled ? "bg-brand" : "bg-[#333]"
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        telegramEnabled ? "left-[22px]" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                  {telegramEnabled && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#555]">Bot Token</label>
                        <input
                          type="text"
                          value={telegramToken}
                          onChange={(e) => setTelegramToken(e.target.value)}
                          placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] outline-none focus:border-brand transition-colors"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#555]">Chat ID</label>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="-1001234567890"
                          className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] outline-none focus:border-brand transition-colors"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeSection === "api" && (
            <div className="space-y-6">
              <div className="rounded-md border border-[#222] bg-[#141414] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">API Keys</h3>
                  <button className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brandlight transition-colors">
                    <Key className="h-3 w-3" />
                    Generate Key
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-[#555]">
                  <Key className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm">No API keys generated</p>
                  <p className="text-xs mt-1">API keys allow programmatic access to the panel</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
