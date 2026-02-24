/**
 * OpenLiteSpeed WebAdmin REST API Client
 *
 * OLS WebAdmin API runs on port 7080 (HTTPS).
 * Docs: https://docs.openlitespeed.org/config/
 */

interface OLSConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface OLSResponse<T = any> {
  ok: boolean;
  data: T;
  error?: string;
}

function getConfig(): OLSConfig {
  return {
    host: process.env.OLS_HOST || "127.0.0.1",
    port: parseInt(process.env.OLS_PORT || "7080"),
    username: process.env.OLS_USERNAME || "admin",
    password: process.env.OLS_PASSWORD || "",
  };
}

async function olsRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, any>
): Promise<OLSResponse<T>> {
  const config = getConfig();
  const url = `https://${config.host}:${config.port}${endpoint}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(`${config.username}:${config.password}`).toString(
          "base64"
        ),
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // OLS uses self-signed cert
      // @ts-ignore -- Node.js fetch option
      rejectUnauthorized: false,
    });

    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error: any) {
    return { ok: false, data: null as any, error: error.message };
  }
}

// ─── Server Status ──────────────────────────────────────────────

export async function getServerStatus() {
  return olsRequest("/status");
}

export async function restartServer() {
  return olsRequest("/restart", "POST");
}

export async function gracefulRestart() {
  return olsRequest("/gracefulrestart", "POST");
}

export async function reloadConfig() {
  return olsRequest("/reload", "POST");
}

// ─── Virtual Hosts ──────────────────────────────────────────────

export interface VHostConfig {
  name: string;
  vhRoot: string;
  configFile?: string;
  allowBrowse?: boolean;
  enableGzip?: boolean;
  docRoot: string;
}

export async function listVHosts() {
  return olsRequest<string[]>("/vhosts");
}

export async function getVHost(name: string) {
  return olsRequest(`/vhosts/${encodeURIComponent(name)}`);
}

export async function createVHost(config: VHostConfig) {
  return olsRequest("/vhosts", "POST", config);
}

export async function updateVHost(name: string, config: Partial<VHostConfig>) {
  return olsRequest(`/vhosts/${encodeURIComponent(name)}`, "PUT", config);
}

export async function deleteVHost(name: string) {
  return olsRequest(`/vhosts/${encodeURIComponent(name)}`, "DELETE");
}

export async function enableVHost(name: string) {
  return olsRequest(`/vhosts/${encodeURIComponent(name)}/enable`, "POST");
}

export async function disableVHost(name: string) {
  return olsRequest(`/vhosts/${encodeURIComponent(name)}/disable`, "POST");
}

// ─── Listeners ──────────────────────────────────────────────────

export interface ListenerConfig {
  name: string;
  address: string;
  port: number;
  secure?: boolean;
  vhostMap?: Array<{ vhost: string; domain: string }>;
}

export async function listListeners() {
  return olsRequest("/listeners");
}

export async function getListener(name: string) {
  return olsRequest(`/listeners/${encodeURIComponent(name)}`);
}

export async function createListener(config: ListenerConfig) {
  return olsRequest("/listeners", "POST", config);
}

export async function deleteListener(name: string) {
  return olsRequest(`/listeners/${encodeURIComponent(name)}`, "DELETE");
}

// ─── PHP ────────────────────────────────────────────────────────

export async function listPHPVersions() {
  return olsRequest("/php");
}

export async function getPHPConfig(version: string) {
  return olsRequest(`/php/${version}`);
}

// ─── Cache ──────────────────────────────────────────────────────

export async function getLSCacheStats() {
  return olsRequest("/cache/stats");
}

export async function flushLSCache() {
  return olsRequest("/cache/flush", "POST");
}

export async function getOPCacheStats() {
  return olsRequest("/opcache/stats");
}

export async function flushOPCache() {
  return olsRequest("/opcache/flush", "POST");
}

// ─── Export all as namespace ────────────────────────────────────

export const olsApi = {
  getServerStatus,
  restartServer,
  gracefulRestart,
  reloadConfig,
  listVHosts,
  getVHost,
  createVHost,
  updateVHost,
  deleteVHost,
  enableVHost,
  disableVHost,
  listListeners,
  getListener,
  createListener,
  deleteListener,
  listPHPVersions,
  getPHPConfig,
  getLSCacheStats,
  flushLSCache,
  getOPCacheStats,
  flushOPCache,
};
