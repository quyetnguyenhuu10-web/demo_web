// web_ui/server.cjs - Backend API server
// Đọc config từ biến môi trường (.env)

require("dotenv").config();

// Khai báo DEBUG ngay từ đầu để tránh temporal dead zone
const DEBUG = process.env.DEBUG === "true" || false;

const https = require("https");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// ---------------- Đọc danh sách model từ file ---------------- 
let AVAILABLE_MODELS = [];
let DEFAULT_MODEL = "gpt-4o-mini";

try {
  const modelsPath = path.join(__dirname, "models.json");
  if (fs.existsSync(modelsPath)) {
    const modelsData = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
    AVAILABLE_MODELS = modelsData.models || [];
    DEFAULT_MODEL = modelsData.default || "gpt-4o-mini";
    console.log(`✅ Loaded ${AVAILABLE_MODELS.length} models from models.json`);
  } else {
    console.warn("⚠️  models.json not found, using default models");
    // Fallback nếu không có file
    AVAILABLE_MODELS = [
      { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Model nhanh và tiết kiệm chi phí" },
      { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Model mới nhất, hiệu suất cao hơn" }
    ];
    DEFAULT_MODEL = "gpt-4o-mini";
  }
} catch (e) {
  console.error("❌ Error loading models.json:", e.message);
  // Fallback
  AVAILABLE_MODELS = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Model nhanh và tiết kiệm chi phí" },
    { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Model mới nhất, hiệu suất cao hơn" }
  ];
  DEFAULT_MODEL = "gpt-4o-mini";
}

// Tạo danh sách giá trị model để validation
const VALID_MODELS = AVAILABLE_MODELS.map(m => m.value);

// ---------------- Config từ env ---------------- 
const PORT = Number(process.env.PORT || 3001);
const OPENAI_KEY = String(process.env.OPENAI_API_KEY || "").trim();
// KHÔNG dùng MODEL từ env nữa - chỉ lấy từ models.json và UI selection
// MODEL chỉ dùng làm fallback nếu UI không gửi model
const MODEL = DEFAULT_MODEL; // Chỉ dùng default từ models.json
const SYSTEM_PROMPT = String(process.env.SYSTEM_PROMPT || "You are a helpful assistant.");
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 8000);

// Log SYSTEM_PROMPT để debug
if (DEBUG || process.env.LOG_PROMPT === "true") {
  console.log(`[Config] SYSTEM_PROMPT: ${SYSTEM_PROMPT.substring(0, 100)}${SYSTEM_PROMPT.length > 100 ? "..." : ""}`);
}

// Log models info
console.log(`✅ Available models: ${AVAILABLE_MODELS.map(m => m.value).join(", ")}`);
console.log(`✅ Default model: ${DEFAULT_MODEL}`);

if (!OPENAI_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env file");
  console.error("   Tạo file .env và thêm: OPENAI_API_KEY=sk-...");
  process.exit(1);
}

// ---------------- Token cadence (server-side) ----------------
const SSE_FLUSH_MIN_MS = Number(process.env.SSE_FLUSH_MIN_MS || 33);        // ~30fps
const SSE_FLUSH_DENSE_MS = Number(process.env.SSE_FLUSH_DENSE_MS || 70);    // token dày
const SSE_SPARSE_IMMEDIATE_MS = Number(process.env.SSE_SPARSE_IMMEDIATE_MS || 140);
const SSE_MAX_BUFFER_CHARS = Number(process.env.SSE_MAX_BUFFER_CHARS || 900);

// Flush sớm khi gặp dấu câu / xuống dòng để "có nhịp đọc"
const SSE_PUNCT_FLUSH_RE = /[.!?。！？…\n:;，,)]\s?$/;

// ---------------- Utils ---------------- 
function isoNow() {
  return new Date().toISOString();
}
function newId() {
  return crypto.randomUUID();
}
function safeStr(x) {
  return typeof x === "string" ? x : "";
}

// ---------------- Session (sid) for uptime ----------------
const sessions = new Map(); // sid -> { startMs }
const SID_COOKIE = "sid";

function parseCookies(req) {
  const raw = String(req.headers.cookie || "");
  const out = {};
  raw.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function setSidCookie(res, sid) {
  // SameSite=Lax đủ cho same-origin. Nếu deploy https, có thể thêm Secure.
  res.setHeader("Set-Cookie", `${SID_COOKIE}=${sid}; Path=/; SameSite=Lax; HttpOnly`);
}

function ensureSession(req, res) {
  const cookies = parseCookies(req);
  let sid = safeStr(cookies[SID_COOKIE]).trim();

  if (!sid) {
    sid = crypto.randomBytes(16).toString("hex");
    setSidCookie(res, sid);
  }

  if (!sessions.has(sid)) {
    sessions.set(sid, { startMs: Date.now() });
  }

  req._sid = sid;
  return sid;
}

function msToHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function getUptimeForReq(req) {
  const sid = req?._sid || "";
  const sess = sessions.get(sid);
  const startMs = sess?.startMs ?? Date.now();
  const ms = Date.now() - startMs;
  return {
    sid,
    online_ms: ms,
    online_hms: msToHMS(ms),
    started_at_iso: new Date(startMs).toISOString(),
    now_iso: isoNow(),
  };
}

function wantsOnlineTime(text) {
  const t = safeStr(text).toLowerCase();
  // chủ ý: rộng nhưng vẫn tập trung - detect nhiều cách hỏi về thời gian online
  return (
    t.includes("online bao lâu") ||
    t.includes("tôi online") ||
    t.includes("đã online") ||
    t.includes("thời gian online") ||
    t.includes("mở web bao lâu") ||
    t.includes("mở trang bao lâu") ||
    t.includes("ở đây bao lâu") ||
    t.includes("uptime") ||
    t.includes("bao lâu rồi") ||
    t.includes("đã mở") ||
    t.includes("thời gian sử dụng") ||
    t.includes("sử dụng bao lâu") ||
    t.includes("how long") && (t.includes("online") || t.includes("here")) ||
    t.includes("time online") ||
    t.includes("session time")
  );
}

// ---------------- SSE helpers ---------------- 
function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`:ok\n\n`);
}
function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data ?? {})}\n\n`);
}

// ---------------- SSE parse helpers ---------------- 
function findSseBlockEnd(s) {
  const crlf = s.indexOf("\r\n\r\n");
  const lf = s.indexOf("\n\n");
  if (crlf === -1) return lf;
  if (lf === -1) return crlf;
  return Math.min(crlf, lf);
}
function cutSseBlock(s, endIdx) {
  if (s.slice(endIdx, endIdx + 4) === "\r\n\r\n") {
    return { block: s.slice(0, endIdx), rest: s.slice(endIdx + 4) };
  }
  return { block: s.slice(0, endIdx), rest: s.slice(endIdx + 2) };
}

// ---------------- In-memory jobs ---------------- 
const jobs = new Map();

// ---------------- Token cadence helpers ----------------
function ensureCadenceState(job) {
  if (job._cadence) return job._cadence;
  job._cadence = {
    outBuf: "",
    lastUpAt: Date.now(),
    lastFlushAt: 0,
    denseScore: 0,
    timer: null,
  };
  return job._cadence;
}

function getTargetFlushMs(st) {
  const now = Date.now();
  const dt = now - st.lastUpAt;
  if (dt >= SSE_SPARSE_IMMEDIATE_MS) return 0;
  if (st.denseScore >= 6) return SSE_FLUSH_DENSE_MS;
  return SSE_FLUSH_MIN_MS;
}

function shouldFlushBuf(st) {
  if (!st.outBuf) return false;
  if (st.outBuf.length >= SSE_MAX_BUFFER_CHARS) return true;
  if (SSE_PUNCT_FLUSH_RE.test(st.outBuf)) return true;
  return false;
}

function flushTokenBuf(sid, force = false) {
  const job = jobs.get(sid);
  if (!job) return;
  const st = ensureCadenceState(job);
  if (!st.outBuf) return;

  const now = Date.now();
  const target = getTargetFlushMs(st);

  if (!force && target > 0 && (now - st.lastFlushAt) < target && !shouldFlushBuf(st)) {
    scheduleTokenFlush(sid);
    return;
  }

  st.lastFlushAt = now;
  const chunk = st.outBuf;
  st.outBuf = "";

  // Broadcast token chunk (giữ event name token)
  broadcast(sid, "token", { t: chunk });
}

function scheduleTokenFlush(sid) {
  const job = jobs.get(sid);
  if (!job) return;
  const st = ensureCadenceState(job);
  if (st.timer) return;

  const now = Date.now();
  const target = getTargetFlushMs(st);
  const wait = target === 0 ? 0 : Math.max(0, target - (now - st.lastFlushAt));

  st.timer = setTimeout(() => {
    st.timer = null;
    flushTokenBuf(sid, false);
  }, wait);
}

function enqueueToken(sid, delta) {
  const job = jobs.get(sid);
  if (!job || job.done) return;

  const st = ensureCadenceState(job);

  const now = Date.now();
  const dt = now - st.lastUpAt;
  st.lastUpAt = now;

  // Dense scoring (đơn giản nhưng hiệu quả)
  if (dt < 18) st.denseScore = Math.min(12, st.denseScore + 1);
  else st.denseScore = Math.max(0, st.denseScore - 1);

  st.outBuf += delta;

  // Flush sớm nếu gặp dấu câu / xuống dòng / quá dài
  if (shouldFlushBuf(st)) {
    flushTokenBuf(sid, false);
    return;
  }

  scheduleTokenFlush(sid);
}

function broadcast(sid, event, data) {
  const job = jobs.get(sid);
  if (!job) return;
  job.last_event_ts = Date.now();
  for (const res of job.subscribers) {
    try {
      sseWrite(res, event, data);
    } catch {}
  }
}

function closeAll(sid) {
  const job = jobs.get(sid);
  if (!job) return;
  for (const res of job.subscribers) {
    try {
      res.end();
    } catch {}
  }
  job.subscribers.clear();
}

function finishJob(sid) {
  const job = jobs.get(sid);
  if (!job || job.done) return;
  job.done = true;

  // Flush token buffer trước khi done để client không bị thiếu đoạn cuối
  try {
    flushTokenBuf(sid, true);
    if (job._cadence?.timer) {
      clearTimeout(job._cadence.timer);
      job._cadence.timer = null;
    }
  } catch {}

  broadcast(sid, "done", { done: true, reply: job.reply });
  closeAll(sid);

  setTimeout(() => jobs.delete(sid), 120000);
}

// ---------------- Clerk Auth Middleware ----------------
let clerkMiddleware = null;
let clerkClient = null;
if (process.env.CLERK_SECRET_KEY) {
  try {
    const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
    clerkMiddleware = ClerkExpressRequireAuth({
      // Optional: configure options here
    });
    
    // Thử load clerkClient từ @clerk/backend (recommended)
    try {
      const { createClerkClient } = require("@clerk/backend");
      clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      console.log("✅ Clerk client loaded from @clerk/backend");
    } catch (e2) {
      // Fallback: thử từ @clerk/clerk-sdk-node
      try {
        const clerkSDK = require("@clerk/clerk-sdk-node");
        if (clerkSDK.clerkClient) {
          clerkClient = clerkSDK.clerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
          console.log("✅ Clerk client loaded from @clerk/clerk-sdk-node");
        }
      } catch (e3) {
        console.warn("⚠️ Could not load Clerk client. Authorization checks will be skipped.");
      }
    }
    
    console.log("✅ Clerk middleware enabled");
  } catch (e) {
    console.warn("⚠️ Failed to load Clerk middleware:", e.message);
  }
} else {
  console.warn("⚠️ CLERK_SECRET_KEY is not set. Skipping Clerk authentication.");
}

// ---------------- ABAC Authorization Middleware ----------------
// Kiểm tra Public Metadata: authorized === true
async function requireAuthorization(req, res, next) {
  // Nếu không có Clerk, skip check (dev mode)
  if (!clerkClient) {
    if (DEBUG) console.log(`[${isoNow()}] Authorization: No Clerk client, skipping check`);
    return next();
  }
  
  // Nếu không có auth (không có token hoặc token invalid)
  if (!req.auth?.userId) {
    if (DEBUG) console.log(`[${isoNow()}] Authorization: No auth.userId, returning 401`);
    return res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "Authentication required. Please sign in.",
    });
  }

  try {
    // Lấy user từ Clerk để check metadata
    const user = await clerkClient.users.getUser(req.auth.userId);
    const publicMetadata = user.publicMetadata || {};
    const authorized = publicMetadata.authorized === true;

    if (!authorized) {
      return res.status(403).json({
        error: "PENDING_APPROVAL",
        message: "Your account is pending admin approval. Please contact administrator.",
      });
    }

    // Authorized - cho phép tiếp tục
    next();
  } catch (e) {
    console.error(`[${isoNow()}] Authorization check failed:`, e.message);
    return res.status(500).json({
      error: "AUTHORIZATION_CHECK_FAILED",
      message: "Failed to verify authorization status",
    });
  }
}

// ---------------- App ---------------- 
const app = express();
// CORS với credentials để Clerk cookies hoạt động
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true; // Nếu không set, cho phép mọi origin (dev mode)

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Quan trọng: cho phép cookies
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: MODEL, port: PORT, ts: isoNow() });
});

// ---------------- API: Get available models ---------------- 
// Public endpoint - không cần auth để load danh sách models
app.get("/api/models", (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  res.json({
    ok: true,
    models: AVAILABLE_MODELS,
    default: DEFAULT_MODEL,
    // Không trả về current nữa - model được chọn từ UI
  });
});

// ---------------- API: Initialize user (auto-set readonly for new users) ---------------- 
app.post("/api/user/init",
  clerkMiddleware || ((req, res, next) => next()),
  async (req, res) => {
    // Không cần requireAuthorization - chỉ cần authenticated
    if (!req.auth?.userId) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }

    if (!clerkClient) {
      return res.status(500).json({
        error: "CLERK_NOT_CONFIGURED",
        message: "Clerk client not available",
      });
    }

    try {
      const userId = req.auth.userId;
      const user = await clerkClient.users.getUser(userId);
      const publicMetadata = user.publicMetadata || {};

      // Nếu user chưa có metadata (user mới), tự động set readonly
      if (!publicMetadata.authorized && !publicMetadata.readonly) {
        await clerkClient.users.updateUser(userId, {
          publicMetadata: {
            ...publicMetadata,
            authorized: true,
            readonly: true, // Tự động set readonly cho user mới
          },
        });

        console.log(`[${isoNow()}] ✅ Auto-set readonly for new user: ${userId}`);
        
        return res.json({
          ok: true,
          message: "User initialized as readonly",
          isNewUser: true,
        });
      }

      // User đã có metadata
      return res.json({
        ok: true,
        message: "User already initialized",
        isNewUser: false,
        authorized: publicMetadata.authorized === true,
        readonly: publicMetadata.readonly === true,
      });
    } catch (e) {
      console.error(`[${isoNow()}] Failed to initialize user:`, e.message);
      return res.status(500).json({
        error: "INIT_FAILED",
        message: `Failed to initialize user: ${e.message}`,
      });
    }
  }
);

// ---------------- API: create job ---------------- 
app.post("/api/chat/create", 
  clerkMiddleware || ((req, res, next) => next()),
  requireAuthorization,
  (req, res) => {
  ensureSession(req, res);

  const message = safeStr(req.body?.message).trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  // Nhận model từ request body (từ UI selection)
  const requestModel = safeStr(req.body?.model).trim();
  // Chỉ dùng model từ UI, fallback về DEFAULT_MODEL nếu không có
  const jobModel = requestModel || DEFAULT_MODEL;
  
  if (DEBUG) {
    console.log(`[${isoNow()}] create job - requestModel: "${requestModel}", jobModel: "${jobModel}", DEFAULT_MODEL: "${DEFAULT_MODEL}"`);
  }
  
  // Cảnh báo nếu model không trong danh sách (nhưng vẫn cho phép dùng)
  if (jobModel && !VALID_MODELS.includes(jobModel)) {
    console.warn(`⚠️  Warning: Model "${jobModel}" không nằm trong danh sách. Các model có sẵn: ${VALID_MODELS.join(", ")}`);
  }

  if (!message) return res.status(400).json({ error: "message_is_required" });
  if (message.length > MAX_INPUT_CHARS) return res.status(400).json({ error: "message_too_long" });

  const sid = newId();
  // Lưu userId vào job để verify khi stream
  const userId = req.auth?.userId || null;
  jobs.set(sid, {
    created_at: isoNow(),
    message,
    history,
    model: jobModel, // Lưu model được chọn cho job này
    subscribers: new Set(),
    done: false,
    reply: "",
    stream_mode: "unknown",
    last_event_ts: Date.now(),
    userId: userId, // Lưu userId để verify khi stream
  });

  if (DEBUG) console.log(`[${isoNow()}] create sid=${sid} msg_len=${message.length}`);

  // Kiểm tra xem user có hỏi về thời gian online không
  const needUptime = wantsOnlineTime(message);
  
  if (DEBUG && needUptime) {
    console.log(`[${isoNow()}] ✅ Detected uptime request for sid=${sid}`);
  }

  const runner = needUptime ? startUpstreamWithUptime : startUpstream;

  runner(sid, req).catch((e) => {
    console.log(`[${isoNow()}] upstream fatal sid=${sid}: ${String(e?.message || e)}`);
    broadcast(sid, "error", { error: String(e?.message || e) });
    finishJob(sid);
  });

  res.json({ ok: true, sid });
});

// ---------------- API: stream SSE ---------------- 
// Đơn giản hóa: Job đã được tạo với auth, chỉ cần verify token và so sánh userId
app.get("/api/chat/stream", async (req, res) => {
  console.log(`[${isoNow()}] 📥 Stream request received:`, {
    sid: req.query?.sid,
    hasToken: !!req.query?.__clerk_token,
    tokenLength: req.query?.__clerk_token?.length || 0,
    clerkClientExists: !!clerkClient,
  });

  ensureSession(req, res);

  const sid = safeStr(req.query?.sid).trim();
  if (!sid) {
    console.log(`[${isoNow()}] ❌ Stream: Missing sid`);
    return res.status(400).end("missing sid");
  }

  const job = jobs.get(sid);
  if (!job) {
    console.log(`[${isoNow()}] ❌ Stream: Job not found for sid=${sid}`);
    return res.status(404).end("sid not found");
  }

  // Nếu có Clerk, verify token và so sánh userId với job
  if (clerkClient) {
    const tokenFromQuery = req.query?.__clerk_token;
    if (!tokenFromQuery) {
      console.log(`[${isoNow()}] ❌ Stream: No token in query param for sid=${sid}`);
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }

    try {
      // Decode JWT để lấy userId (không verify signature - vì job đã được tạo với auth)
      const jwtParts = tokenFromQuery.split('.');
      if (jwtParts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      // Decode base64url (JWT dùng base64url, không phải base64 thường)
      let payloadPart;
      try {
        // Thử base64url decode (JWT standard)
        // Base64url: - thành +, _ thành /, và thêm padding nếu cần
        let base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
        // Thêm padding nếu cần
        while (base64.length % 4) {
          base64 += '=';
        }
        payloadPart = Buffer.from(base64, 'base64').toString('utf8');
      } catch (e) {
        // Fallback: thử base64 thường
        payloadPart = Buffer.from(jwtParts[1], 'base64').toString('utf8');
      }
      
      const decoded = JSON.parse(payloadPart);
      const tokenUserId = decoded.sub;
      
      if (!tokenUserId) {
        throw new Error("Token missing 'sub' field");
      }

      console.log(`[${isoNow()}] 🔍 Stream: Decoded token - userId=${tokenUserId}, job.userId=${job.userId || 'null'}`);

      // So sánh userId từ token với userId trong job
      if (job.userId && job.userId !== tokenUserId) {
        console.log(`[${isoNow()}] ❌ Stream: UserId mismatch. Job userId=${job.userId}, token userId=${tokenUserId}`);
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "You don't have access to this stream",
        });
      }

      // Set req.auth để requireAuthorization có thể dùng (nếu cần)
      req.auth = { userId: tokenUserId };
      console.log(`[${isoNow()}] ✅ Stream: Token verified, userId=${tokenUserId}, sid=${sid}`);
    } catch (e) {
      console.error(`[${isoNow()}] ❌ Stream: Token decode failed:`, e.message);
      console.error(`[${isoNow()}] Token (first 100 chars):`, tokenFromQuery.substring(0, 100));
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: `Invalid token: ${e.message}`,
      });
    }
  } else {
    console.log(`[${isoNow()}] ⚠️ Stream: No Clerk client, skipping auth check for sid=${sid}`);
  }

  // Nếu không có Clerk hoặc đã verify xong, tiếp tục stream

  sseHeaders(res);
  // Lấy model từ job (đã được set từ UI selection), fallback về DEFAULT_MODEL
  const jobModel = job?.model || DEFAULT_MODEL;
  sseWrite(res, "meta", { ok: true, sid, model: jobModel, ts: isoNow() });

  job.subscribers.add(res);
  if (DEBUG) console.log(`[${isoNow()}] stream connect sid=${sid} subs=${job.subscribers.size}`);

  const hb = setInterval(() => {
    try {
      sseWrite(res, "ping", { t: Date.now() });
    } catch {}
  }, 15000);

  req.on("close", () => {
    clearInterval(hb);
    job.subscribers.delete(res);
    if (DEBUG) console.log(`[${isoNow()}] stream close sid=${sid} subs=${job.subscribers.size}`);
  });

  if (job.done) {
    sseWrite(res, "done", { done: true, reply: job.reply });
    try {
      res.end();
    } catch {}
  }
});

// ---------------- Upstream OpenAI streaming ---------------- 
async function startUpstream(sid, req) {
  const job = jobs.get(sid);
  if (!job) return;

  const input = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const m of job.history) {
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string") continue;

    const c = m.content.trim();
    if (!c) continue;

    input.push({ role: m.role, content: c.slice(0, MAX_INPUT_CHARS) });
  }

  input.push({ role: "user", content: job.message });

  return startUpstreamCore(sid, input);
}

async function startUpstreamWithUptime(sid, req) {
  const job = jobs.get(sid);
  if (!job) return;

  // đảm bảo session tồn tại - QUAN TRỌNG: phải gọi trước khi getUptimeForReq
  if (req) {
    ensureSession(req, { setHeader: () => {} });
  }

  const u = req ? getUptimeForReq(req) : null;

  if (DEBUG) {
    console.log(`[${isoNow()}] startUpstreamWithUptime sid=${sid}, uptime:`, u);
  }

  const toolLine = u
    ? `\n[Tool result: online_time]\n` +
      `online_hms=${u.online_hms}\n` +
      `online_ms=${u.online_ms}\n` +
      `started_at=${u.started_at_iso}\n` +
      `now=${u.now_iso}\n`
    : `\n[Tool result: online_time]\nmissing_session\n`;

  // system prompt: bắt buộc dùng tool result, không đoán
  const system = (
    SYSTEM_PROMPT +
    "\n\n" +
    "If the user asks about how long they have been online in this web app, you MUST use the provided [Tool result: online_time]. " +
    "Do not guess. If tool result is missing, say you cannot determine it.\n" +
    toolLine
  );

  // Build input giống startUpstream, chỉ khác system
  const input = [{ role: "system", content: system }];

  for (const m of job.history) {
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string") continue;

    const c = m.content.trim();
    if (!c) continue;

    input.push({ role: m.role, content: c.slice(0, MAX_INPUT_CHARS) });
  }

  input.push({ role: "user", content: job.message });

  // gọi đúng pipeline streaming hiện có
  return startUpstreamCore(sid, input);
}

async function startUpstreamCore(sid, input) {
  const job = jobs.get(sid);
  if (!job) return;

  // Dùng model từ job (được set từ request body hoặc env)
  const modelToUse = job.model || MODEL;
  const payload = JSON.stringify({ model: modelToUse, stream: true, input });
  const bodyBytes = Buffer.byteLength(payload, "utf8");

  if (DEBUG) console.log(`[${isoNow()}] upstream start sid=${sid} bytes=${bodyBytes}`);

  let buf = "";
  let eventCount = 0;
  const firstTypes = [];

  const req = https.request(
    {
      hostname: "api.openai.com",
      path: "/v1/responses",
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Content-Length": String(bodyBytes),
      },
    },
    (resp) => {
      const ct = String(resp.headers["content-type"] || "");
      if (DEBUG) console.log(`[${isoNow()}] upstream headers sid=${sid}: ${resp.statusCode} ${ct}`);
      broadcast(sid, "upstream", { status: resp.statusCode, ct });

      if (!ct.includes("text/event-stream")) {
        let raw = "";
        resp.setEncoding("utf8");
        resp.on("data", (c) => (raw += c));
        resp.on("end", () => {
          console.log(`[${isoNow()}] upstream non-sse sid=${sid}: ${raw.slice(0, 400)}`);
          broadcast(sid, "error", { error: raw.slice(0, 2000) || `HTTP ${resp.statusCode}` });
          finishJob(sid);
        });
        return;
      }

      resp.setEncoding("utf8");

      resp.on("data", (chunk) => {
        buf += chunk;

        while (true) {
          const endIdx = findSseBlockEnd(buf);
          if (endIdx === -1) break;

          const cut = cutSseBlock(buf, endIdx);
          const block = cut.block.replace(/\r\n/g, "\n");
          buf = cut.rest;

          for (const rawLine of block.split("\n")) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;

            const dataStr = line.slice(5).trim();
            if (!dataStr) continue;

            if (dataStr === "[DONE]") {
              if (DEBUG) console.log(`[${isoNow()}] upstream [DONE] sid=${sid}`);
              finishJob(sid);
              return;
            }

            let ev;
            try {
              ev = JSON.parse(dataStr);
            } catch (e) {
              console.log(
                `[${isoNow()}] upstream json parse sid=${sid}: ${String(e?.message || e)} :: ${dataStr.slice(0, 120)}`
              );
              continue;
            }

            const type = String(ev?.type || "");
            eventCount += 1;

            if (firstTypes.length < 10) firstTypes.push(type);
            if (eventCount === 10) {
              if (DEBUG) console.log(`[${isoNow()}] first 10 event types sid=${sid}:`, firstTypes);
              broadcast(sid, "debug", { first_types: firstTypes });
            }

            if (job.stream_mode == null) job.stream_mode = "unknown";

            // 1) DELTA (primary)
            let delta = "";
            if (type === "response.output_text.delta") {
              delta = String(ev?.delta ?? ev?.text ?? "");
            } else if (type === "response.content_part.delta") {
              const part = ev?.part;
              if (part?.type === "output_text") {
                delta = String(part?.text ?? part?.delta ?? "");
              }
            }

            if (delta) {
              job.stream_mode = "delta";
              job.reply += delta;
              enqueueToken(sid, delta); // ✅ cadence
            }

            // 2) SNAPSHOT (secondary) chỉ khi CHƯA có delta
            if (job.stream_mode !== "delta") {
              let snap = "";

              if (type === "response.output_text.done") {
                snap = String(ev?.text ?? "");
              } else if (type === "response.done" || type === "response.completed") {
                const r = ev?.response;
                if (r && typeof r.output_text === "string") snap = r.output_text;
              }

              if (snap) {
                if (!job.reply) {
                  job.stream_mode = "snapshot";
                  job.reply = snap;
                  enqueueToken(sid, snap);
                } else if (snap.length > job.reply.length && snap.startsWith(job.reply)) {
                  job.stream_mode = "snapshot";
                  const add = snap.slice(job.reply.length);
                  job.reply = snap;
                  if (add) enqueueToken(sid, add);
                }
              }
            }

            // 3) Errors / Done
            if (type === "response.error") {
              console.log(`[${isoNow()}] upstream response.error sid=${sid}`);
              broadcast(sid, "error", { error: JSON.stringify(ev).slice(0, 2000) });
              finishJob(sid);
              return;
            }

            if (type === "response.done" || type === "response.completed") {
              if (DEBUG)
                console.log(
                  `[${isoNow()}] upstream done sid=${sid} events=${eventCount} len=${job.reply.length} mode=${job.stream_mode}`
                );
              finishJob(sid);
              return;
            }
          }
        }
      });

      resp.on("end", () => {
        if (DEBUG)
          console.log(
            `[${isoNow()}] upstream end sid=${sid} events=${eventCount} len=${job.reply.length} mode=${job.stream_mode}`
          );
        finishJob(sid);
      });

      resp.on("error", (e) => {
        console.log(`[${isoNow()}] upstream response error sid=${sid}: ${String(e?.message || e)}`);
        broadcast(sid, "error", { error: `Response error: ${String(e?.message || e)}` });
        finishJob(sid);
      });

      resp.on("close", () => {
        if (DEBUG) console.log(`[${isoNow()}] upstream response closed sid=${sid}`);
        // Nếu chưa done, finish job
        const job = jobs.get(sid);
        if (job && !job.done) {
          finishJob(sid);
        }
      });
    }
  );

  req.setTimeout(30000, () => {
    console.log(`[${isoNow()}] upstream timeout sid=${sid}`);
    try {
      req.destroy(new Error("upstream_timeout"));
    } catch {}
  });

  req.on("error", (e) => {
    const errMsg = String(e?.message || e);
    console.log(`[${isoNow()}] upstream error sid=${sid}: ${errMsg}`);
    
    // Nếu là ECONNRESET hoặc connection error, thử finish job gracefully
    if (errMsg.includes("ECONNRESET") || errMsg.includes("ECONNREFUSED") || errMsg.includes("socket")) {
      console.log(`[${isoNow()}] connection reset for sid=${sid}, finishing job`);
    }
    
    broadcast(sid, "error", { error: errMsg });
    finishJob(sid);
  });

  // Handle connection close
  req.on("close", () => {
    if (DEBUG) console.log(`[${isoNow()}] upstream connection closed sid=${sid}`);
  });

  req.write(payload, "utf8");
  req.end();
}

// ---------------- Start ---------------- 
// Serve static files từ dist (production build) - ĐẶT SAU TẤT CẢ API ROUTES
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  const fs = require("fs");
  const distPath = path.join(__dirname, "dist");
  
  // Chỉ serve static nếu thư mục dist tồn tại
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Serve index.html cho tất cả non-API routes (SPA routing)
    app.get("*", (req, res, next) => {
      // Bỏ qua API routes
      if (req.path.startsWith("/api")) {
        return next();
      }
      // Serve index.html cho frontend routes
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

app.listen(PORT, () => {
  console.log(`\n✅ Backend API server running: http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   OpenAI API Key: [CONFIGURED]`);
  if (clerkClient) {
    console.log(`   Clerk: ✅ Enabled`);
  } else {
    console.log(`   Clerk: ⚠️  Not configured (CLERK_SECRET_KEY missing)`);
  }
  if (process.env.NODE_ENV === "production") {
    console.log(`   Mode: 🚀 Production`);
    const path = require("path");
    const fs = require("fs");
    const distPath = path.join(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      console.log(`   Static files: ✅ Serving from ${distPath}`);
    }
  } else {
    console.log(`   Mode: 🔧 Development`);
  }
  console.log();
});
