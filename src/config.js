// web_ui config (standalone)
const getEnv = (key, fallback = "") => {
  const v = import.meta?.env?.[key];
  return v == null ? fallback : v;
};

const envBaseUrl = String(getEnv("VITE_API_BASE_URL", "")).trim();
const envProtocol = String(getEnv("VITE_API_PROTOCOL", "")).trim();
const envHost = String(getEnv("VITE_API_HOST", "")).trim();
const envPort = String(getEnv("VITE_API_PORT", "")).trim();
const envApiKey = String(getEnv("VITE_API_KEY", "")).trim();
const envApiKeyHeader = String(getEnv("VITE_API_KEY_HEADER", "")).trim();
const envApiKeyPrefix = String(getEnv("VITE_API_KEY_PREFIX", "")).trim();
const envApiKeyQuery = String(getEnv("VITE_API_KEY_QUERY", "")).trim();
const envClerkPublishableKey = String(getEnv("VITE_CLERK_PUBLISHABLE_KEY", "")).trim();

const hasWindow = typeof window !== "undefined";

function resolveApiBaseUrl() {
  if (envBaseUrl) return envBaseUrl;

  const hasAny = envProtocol || envHost || envPort;
  if (!hasAny) return "";

  const protocol = envProtocol || (hasWindow ? window.location.protocol.replace(":", "") : "http");
  const host = envHost || (hasWindow ? window.location.hostname : "localhost");
  const port = envPort ? String(envPort).trim() : "";
  const hostPort = port ? `${host}:${port}` : host;

  return `${protocol}://${hostPort}`;
}

const UI_CONFIG = {
  // Set to "" to use same origin, or absolute URL like "https://api.example.com"
  apiBaseUrl: resolveApiBaseUrl(),
  chatCreatePath: "/api/chat/create",
  chatStreamPath: "/api/chat/stream",
  // Optional token for your own backend (not recommended for OpenAI secret key)
  apiKey: envApiKey,
  apiKeyHeader: envApiKeyHeader || "Authorization",
  apiKeyPrefix: envApiKeyPrefix || "Bearer ",
  apiKeyQueryParam: envApiKeyQuery || "",
  // Clerk Authentication
  clerkPublishableKey: envClerkPublishableKey,
};

function normalizeBaseUrl(baseUrl) {
  const v = String(baseUrl || "").trim();
  return v.endsWith("/") ? v.slice(0, -1) : v;
}

function normalizePath(path) {
  const p = String(path || "").trim();
  if (!p) return "/";
  return p.startsWith("/") ? p : `/${p}`;
}

function buildApiUrl(path) {
  const base = normalizeBaseUrl(UI_CONFIG.apiBaseUrl);
  const p = normalizePath(path);
  if (!base) return p;
  return `${base}${p}`;
}

function buildApiHeaders(extraHeaders = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (UI_CONFIG.apiKey) {
    const name = String(UI_CONFIG.apiKeyHeader || "").trim();
    const prefix = String(UI_CONFIG.apiKeyPrefix || "");
    if (name) headers[name] = `${prefix}${UI_CONFIG.apiKey}`;
  }
  return headers;
}

async function buildStreamUrl(sid) {
  const base = buildApiUrl(UI_CONFIG.chatStreamPath);
  const url = new URL(base, hasWindow ? window.location.href : "http://localhost");
  if (sid) url.searchParams.set("sid", sid);
  if (UI_CONFIG.apiKey && UI_CONFIG.apiKeyQueryParam) {
    url.searchParams.set(UI_CONFIG.apiKeyQueryParam, UI_CONFIG.apiKey);
  }
  
  // Thêm Clerk token vào query param (EventSource không hỗ trợ custom headers)
  if (hasWindow && window.__CLERK_GET_TOKEN__) {
    try {
      const token = await window.__CLERK_GET_TOKEN__();
      if (token) {
        url.searchParams.set("__clerk_token", token);
      }
    } catch (e) {
      console.warn("Failed to get Clerk token for stream:", e);
    }
  }
  
  return url.toString();
}

export { UI_CONFIG, buildApiUrl, buildApiHeaders, buildStreamUrl };
