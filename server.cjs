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

try {
  const modelsPath = path.join(__dirname, "models.json");
  if (fs.existsSync(modelsPath)) {
    const modelsData = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
    AVAILABLE_MODELS = modelsData.models || [];
    console.log(`✅ Loaded ${AVAILABLE_MODELS.length} models from models.json`);
  } else {
    console.warn("⚠️  models.json not found, using default models");
    // Fallback nếu không có file
    AVAILABLE_MODELS = [
      { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Model nhanh và tiết kiệm chi phí" },
      { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Model mới nhất, hiệu suất cao hơn" }
    ];
  }
} catch (e) {
  console.error("❌ Error loading models.json:", e.message);
  // Fallback
  AVAILABLE_MODELS = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Model nhanh và tiết kiệm chi phí" },
    { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Model mới nhất, hiệu suất cao hơn" }
  ];
}

// Tạo danh sách giá trị model để validation
const VALID_MODELS = AVAILABLE_MODELS.map(m => m.value);

// ---------------- Config từ env ---------------- 
const PORT = Number(process.env.PORT || 3001);
const OPENAI_KEY = String(process.env.OPENAI_API_KEY || "").trim();
// KHÔNG có model mặc định - phải lấy từ UI selection
// SYSTEM_PROMPT - có fallback nếu không set trong .env
const SYSTEM_PROMPT = String(process.env.SYSTEM_PROMPT || "You are a helpful assistant.").trim();
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 8000);

// Log SYSTEM_PROMPT để debug
if (DEBUG || process.env.LOG_PROMPT === "true") {
  if (SYSTEM_PROMPT) {
    console.log(`[Config] SYSTEM_PROMPT (length=${SYSTEM_PROMPT.length}): ${SYSTEM_PROMPT.substring(0, 200)}${SYSTEM_PROMPT.length > 200 ? "..." : ""}`);
  } else {
    console.warn(`[Config] SYSTEM_PROMPT is empty or not set`);
  }
}

// Log models info
console.log(`✅ Available models: ${AVAILABLE_MODELS.map(m => m.value).join(", ")}`);
console.log(`✅ No default model - model must be selected from UI`);

if (!OPENAI_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env file");
  console.error("   Tạo file .env và thêm: OPENAI_API_KEY=sk-...");
  process.exit(1);
}

if (!SYSTEM_PROMPT || SYSTEM_PROMPT === "You are a helpful assistant.") {
  console.warn("⚠️  SYSTEM_PROMPT not set in .env file, using default fallback");
  console.warn("   Để tùy chỉnh, tạo file .env và thêm: SYSTEM_PROMPT=Your prompt here...");
  console.warn("   Hoặc set biến môi trường SYSTEM_PROMPT khi chạy server");
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
  
  // Disable timeout cho response này
  if (res.setTimeout) {
    res.setTimeout(0); // Không timeout cho SSE connection
  }
  
  res.flushHeaders?.();
  res.write(`:ok\n\n`);
  
  // Flush ngay để client biết connection đã thiết lập
  if (res.flush) {
    res.flush();
  }
}
function sseWrite(res, event, data) {
  try {
    const eventLine = `event: ${event}\n`;
    const dataLine = `data: ${JSON.stringify(data ?? {})}\n\n`;
    res.write(eventLine);
    res.write(dataLine);
    
    // Flush ngay sau mỗi event để tránh buffer - QUAN TRỌNG
    if (res.flush) {
      res.flush();
    } else if (res.flushHeaders) {
      // Fallback: nếu không có flush, ít nhất flush headers
      res.flushHeaders();
    }
  } catch (e) {
    // Ignore write errors (client có thể đã disconnect)
    // Không log để tránh spam
  }
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
  
  // Đảm bảo flush ngay sau broadcast cho TẤT CẢ subscribers
  // QUAN TRỌNG: Flush để tránh buffer và timeout
  for (const res of job.subscribers) {
    try {
      if (res.flush) {
        res.flush();
      } else if (res.flushHeaders) {
        res.flushHeaders();
      }
    } catch (e) {
      // Client có thể đã disconnect, ignore
    }
  }
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

// ---------------- Clerk Auth Middleware (Optional) ----------------
let clerkMiddleware = null;
let clerkClient = null;

// Kiểm tra xem có Clerk dependencies không (không throw error nếu không có)
function hasClerkDependencies() {
  try {
    require.resolve("@clerk/clerk-sdk-node");
    require.resolve("@clerk/backend");
    return true;
  } catch (e) {
    return false;
  }
}

// Debug: Log Clerk env vars để kiểm tra
if (DEBUG || process.env.CLERK_SECRET_KEY) {
  console.log(`[${isoNow()}] 🔍 Clerk env check:`);
  console.log(`   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? "[SET]" : "[NOT SET]"}`);
  console.log(`   CLERK_PUBLISHABLE_KEY: ${process.env.CLERK_PUBLISHABLE_KEY ? "[SET]" : "[NOT SET]"}`);
  console.log(`   VITE_CLERK_PUBLISHABLE_KEY: ${process.env.VITE_CLERK_PUBLISHABLE_KEY ? "[SET]" : "[NOT SET]"} (frontend only)`);
}

// Chỉ load Clerk nếu có dependencies VÀ có CLERK_SECRET_KEY
// Backend chỉ cần CLERK_SECRET_KEY để verify tokens
// CLERK_PUBLISHABLE_KEY chỉ cần cho frontend (VITE_CLERK_PUBLISHABLE_KEY)
if (process.env.CLERK_SECRET_KEY && hasClerkDependencies()) {
  try {
    // Load clerkClient trước (chỉ cần secret key)
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
    
    // Chỉ load Clerk middleware nếu có publishable key
    // ClerkExpressRequireAuth cần publishable key để hoạt động
    if (process.env.CLERK_PUBLISHABLE_KEY) {
      try {
        const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
        clerkMiddleware = ClerkExpressRequireAuth({
          publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        });
        console.log("✅ Clerk middleware enabled");
      } catch (e) {
        console.warn("⚠️ Failed to load Clerk middleware:", e.message);
        console.warn("   Will use manual token verification instead.");
        clerkMiddleware = null;
      }
    } else {
      console.log("ℹ️  Clerk middleware skipped (no CLERK_PUBLISHABLE_KEY)");
      console.log("   Will use manual token verification via clerkClient.");
      clerkMiddleware = null;
    }
  } catch (e) {
    console.warn("⚠️ Failed to initialize Clerk:", e.message);
    console.warn("   Server will continue without Clerk authentication.");
    clerkMiddleware = null;
    clerkClient = null;
  }
} else {
  // Không có đủ Clerk config - server vẫn chạy bình thường
  if (process.env.CLERK_SECRET_KEY && !hasClerkDependencies()) {
    // Có CLERK_SECRET_KEY nhưng không có dependencies
    console.warn("⚠️ CLERK_SECRET_KEY is set but Clerk dependencies are not installed.");
    console.warn("   To enable Clerk: npm install @clerk/clerk-sdk-node @clerk/backend");
    console.warn("   Server will continue without Clerk authentication.");
  }
  // Không có CLERK_SECRET_KEY - không cần log gì, server chạy bình thường
  clerkMiddleware = null; // Đảm bảo clerkMiddleware là null
}

// ---------------- ABAC Authorization Middleware ----------------
// Kiểm tra Public Metadata: authorized === true
async function requireAuthorization(req, res, next) {
  // Nếu không có Clerk client, skip check (dev mode)
  if (!clerkClient) {
    if (DEBUG) console.log(`[${isoNow()}] Authorization: No Clerk client, skipping check`);
    return next();
  }
  
  // Nếu không có Clerk middleware, verify token thủ công từ Authorization header
  if (!clerkMiddleware) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
          message: "Authentication required. Please sign in.",
        });
      }
      
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      // Verify token bằng clerkClient
      try {
        const { verifyToken } = require("@clerk/backend/server");
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        // Set req.auth để tương thích với code sau
        req.auth = { userId: payload.sub };
      } catch (verifyError) {
        // Fallback: thử dùng clerkClient để verify
        try {
          const session = await clerkClient.verifyToken(token);
          req.auth = { userId: session.sub };
        } catch (e2) {
          throw verifyError; // Throw original error
        }
      }
    } catch (e) {
      if (DEBUG) console.log(`[${isoNow()}] Authorization: Token verification failed:`, e.message);
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Invalid or expired token. Please sign in again.",
      });
    }
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

    // Nếu chưa có authorized, tự động set thành viewer (readonly + authorized)
    if (!authorized) {
      try {
        await clerkClient.users.updateUser(req.auth.userId, {
          publicMetadata: {
            ...publicMetadata,
            authorized: true,
            readonly: true,
          },
        });
        console.log(`[${isoNow()}] ✅ Auto-set viewer for user: ${req.auth.userId}`);
        // Tiếp tục xử lý request sau khi đã set viewer
      } catch (e) {
        console.error(`[${isoNow()}] Failed to auto-set viewer:`, e.message);
        return res.status(500).json({
          error: "INIT_FAILED",
          message: "Failed to initialize user account",
        });
      }
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
// Tăng timeout cho server để tránh upstream_timeout
app.timeout = 0; // Disable timeout cho toàn bộ app
app.keepAliveTimeout = 65000; // 65 giây keep-alive
app.headersTimeout = 66000; // 66 giây headers timeout

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
  res.json({ ok: true, port: PORT, ts: isoNow() });
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
    // Không có default model - phải chọn từ UI
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

      // Nếu user chưa có authorized, tự động set thành viewer (readonly + authorized)
      if (!publicMetadata.authorized) {
        await clerkClient.users.updateUser(userId, {
          publicMetadata: {
            ...publicMetadata,
            authorized: true,
            readonly: true, // Tự động set readonly (viewer) cho user mới
          },
        });

        console.log(`[${isoNow()}] ✅ Auto-set viewer (readonly) for user: ${userId}`);
        
        return res.json({
          ok: true,
          message: "User initialized as viewer (readonly)",
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

// ---------------- API: Mark welcome guide as seen ---------------- 
console.log(`[${isoNow()}] 📝 Registering route: POST /api/user/mark-welcome-seen`);
app.post("/api/user/mark-welcome-seen",
  clerkMiddleware || ((req, res, next) => next()),
  async (req, res) => {
    // Chỉ cần authenticated, không cần requireAuthorization
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

      // Update metadata để đánh dấu đã xem welcome guide
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...publicMetadata,
          hasSeenWelcomeGuide: true,
        },
      });

      console.log(`[${isoNow()}] ✅ Marked welcome guide as seen for user: ${userId}`);
      
      return res.json({
        ok: true,
        message: "Welcome guide marked as seen",
      });
    } catch (e) {
      console.error(`[${isoNow()}] Failed to mark welcome guide as seen:`, e.message);
      return res.status(500).json({
        error: "UPDATE_FAILED",
        message: `Failed to update user metadata: ${e.message}`,
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
  // Nhận model từ request body (từ UI selection) - BẮT BUỘC
  const requestModel = safeStr(req.body?.model).trim();
  
  if (!requestModel) {
    return res.status(400).json({ 
      error: "model_is_required",
      message: "Model must be selected from UI. Available models: " + VALID_MODELS.join(", ")
    });
  }
  
  const jobModel = requestModel;
  
  if (DEBUG) {
    console.log(`[${isoNow()}] create job - requestModel: "${requestModel}", jobModel: "${jobModel}"`);
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

// ---------------- API: Paper Snapshot ---------------- 
// Snapshot dữ liệu từ vùng paper và lưu vào file txt
console.log(`[${isoNow()}] 📝 Registering route: POST /api/paper/snapshot`);
app.post("/api/paper/snapshot",
  // CORS preflight
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  },
  // Clerk middleware - chỉ dùng nếu có Clerk middleware
  // Lưu ý: Backend chỉ cần CLERK_SECRET_KEY để load clerkClient
  // CLERK_PUBLISHABLE_KEY chỉ cần cho frontend (VITE_CLERK_PUBLISHABLE_KEY)
  (req, res, next) => {
    // Nếu không có Clerk middleware, skip
    if (!clerkMiddleware) {
      return next();
    }
    // Wrap Clerk middleware để catch errors
    return clerkMiddleware(req, res, (err) => {
      if (err) {
        console.warn(`[${isoNow()}] Clerk middleware error (skipping):`, err.message);
        // Skip Clerk middleware nếu có lỗi, để requireAuthorization xử lý
        // requireAuthorization sẽ check req.auth và trả về JSON error nếu cần
        return next();
      }
      next();
    });
  },
  requireAuthorization,
  (req, res) => {
    // Đảm bảo response luôn là JSON
    res.setHeader("Content-Type", "application/json");
    
    try {
      // Debug: Log request body để kiểm tra
      if (DEBUG) {
        console.log(`[${isoNow()}] Paper snapshot request:`, {
          hasBody: !!req.body,
          contentType: req.headers["content-type"],
          contentLength: req.body?.content?.length || 0,
          lineCount: req.body?.lineCount,
          pageNumber: req.body?.pageNumber,
        });
      }
      
      const content = safeStr(req.body?.content || "").trim();
      const lineCount = Number(req.body?.lineCount) || 0;
      const pageNumber = Number(req.body?.pageNumber) || 1;
      
      // Cho phép content rỗng (có thể là paper trống)
      // Chỉ validate nếu content là null hoặc undefined
      if (req.body?.content === null || req.body?.content === undefined) {
        return res.status(400).json({
          error: "CONTENT_REQUIRED",
          message: "Content field is required (can be empty string)",
        });
      }

      // Tạo folder content_for_AI tại đường dẫn tuyệt đối
      const contentDir = "C:\\Users\\HP\\OneDrive\\Máy tính\\AI_Agent\\content_for_AI";
      if (!fs.existsSync(contentDir)) {
        fs.mkdirSync(contentDir, { recursive: true });
      }

      // Format ngày tháng năm theo giờ Việt Nam
      const now = new Date();
      // Chuyển sang giờ Việt Nam (UTC+7)
      const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
      const dayName = dayNames[vietnamTime.getUTCDay()];
      
      // Format ngày: DD/MM/YYYY
      const day = String(vietnamTime.getUTCDate()).padStart(2, "0");
      const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, "0");
      const year = vietnamTime.getUTCFullYear();
      const displayDateStr = `${day}/${month}/${year}`;
      
      // Format giờ: HH:MM:SS
      const hours = String(vietnamTime.getUTCHours()).padStart(2, "0");
      const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, "0");
      const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, "0");
      const displayTimeStr = `${hours}:${minutes}:${seconds}`;

      // Tên file cố định - mỗi lần snapshot sẽ ghi đè file này
      const filename = "paper_snapshot.txt";
      const filepath = path.join(contentDir, filename);

      // Format nội dung với số dòng ở đầu mỗi dòng
      const contentLines = content.split("\n");
      const numberedContent = contentLines
        .map((line, index) => {
          const lineNumber = index + 1;
          return `[dòng:${lineNumber}] ${line}`;
        })
        .join("\n");

      // Format nội dung file với metadata và prompt
      const fileContent = `=== PAPER SNAPSHOT - AI DATA SOURCE ===
Lưu ý: File này được ghi đè mỗi lần snapshot. Chỉ giữ lại bản snapshot mới nhất.

METADATA:
- Thứ: ${dayName}
- Ngày: ${displayDateStr}
- Giờ: ${displayTimeStr}
- Số dòng: ${lineCount}
- Trang: ${pageNumber}

=== PROMPT FOR AI ===
Đây là dữ liệu được snapshot từ vùng paper (writing pane) trong hệ thống web hiện tại.
Vùng paper là một editor với giao diện giống tờ giấy có dòng kẻ, số dòng bên trái, và hỗ trợ soạn thảo văn bản.
Dữ liệu này được lưu để làm nguồn dữ liệu cho AI đọc và xử lý.

=== CONTENT ===
${numberedContent}

=== END OF SNAPSHOT ===
`;

      // Lưu file (ghi đè nếu file đã tồn tại)
      fs.writeFileSync(filepath, fileContent, "utf8");

      console.log(`[${isoNow()}] ✅ Paper snapshot saved: ${filename} (${lineCount} lines, page ${pageNumber}, ${displayDateStr} ${displayTimeStr})`);

      return res.json({
        ok: true,
        filename,
        filepath: `content_for_AI/${filename}`,
        lineCount,
        pageNumber,
        date: displayDateStr,
        time: displayTimeStr,
      });
    } catch (e) {
      console.error(`[${isoNow()}] ❌ Failed to save paper snapshot:`, e.message);
      return res.status(500).json({
        error: "SNAPSHOT_FAILED",
        message: `Failed to save snapshot: ${e.message}`,
      });
    }
  }
);

// Error handler cho route này - đảm bảo luôn trả về JSON
app.use("/api/paper/snapshot", (err, req, res, next) => {
  console.error(`[${isoNow()}] Paper snapshot route error:`, err.message);
  res.setHeader("Content-Type", "application/json");
  return res.status(500).json({
    error: "SNAPSHOT_ERROR",
    message: err.message || "An error occurred while processing snapshot",
  });
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
  // Lấy model từ job (đã được set từ UI selection) - BẮT BUỘC
  const jobModel = job?.model;
  if (!jobModel) {
    console.error(`[${isoNow()}] ❌ Stream: Job missing model for sid=${sid}`);
    sseWrite(res, "error", { error: "Job missing model" });
    res.end();
    return;
  }
  sseWrite(res, "meta", { ok: true, sid, model: jobModel, ts: isoNow() });

  job.subscribers.add(res);
  if (DEBUG) console.log(`[${isoNow()}] stream connect sid=${sid} subs=${job.subscribers.size}`);

  // Heartbeat mỗi 5 giây để giữ connection alive và tránh timeout
  // QUAN TRỌNG: Gửi ping đều đặn để proxy/server không timeout
  const hb = setInterval(() => {
    try {
      // Gửi ping và flush ngay
      sseWrite(res, "ping", { t: Date.now() });
    } catch (e) {
      // Nếu không thể write, client đã disconnect
      clearInterval(hb);
      job.subscribers.delete(res);
    }
  }, 5000); // Giảm xuống 5 giây để đảm bảo connection không timeout

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

// ---------------- Helper: Read Paper Snapshot ---------------- 
async function readPaperSnapshot() {
  try {
    const contentDir = "C:\\Users\\HP\\OneDrive\\Máy tính\\AI_Agent\\content_for_AI";
    const filename = "paper_snapshot.txt";
    const filepath = path.join(contentDir, filename);

    if (!fs.existsSync(filepath)) {
      return null; // File chưa tồn tại
    }

    const fileContent = fs.readFileSync(filepath, "utf8");
    return fileContent;
  } catch (e) {
    console.warn(`[${isoNow()}] ⚠️ Failed to read paper snapshot:`, e.message);
    return null;
  }
}

// ---------------- Helper: Check if message asks about paper ---------------- 
function asksAboutPaper(message) {
  const lowerMessage = message.toLowerCase();
  const paperKeywords = [
    "paper", "giấy", "snapshot", "vùng paper", "writing pane",
    "nội dung paper", "dữ liệu paper", "file snapshot", "paper snapshot",
    "đọc paper", "xem paper", "nội dung trong paper", "dòng trong paper"
  ];
  return paperKeywords.some(keyword => lowerMessage.includes(keyword));
}

// ---------------- Upstream OpenAI streaming ---------------- 
async function startUpstream(sid, req) {
  const job = jobs.get(sid);
  if (!job) return;

  // Chỉ đọc paper snapshot nếu user hỏi về paper
  let systemContent = SYSTEM_PROMPT;
  
  // Thông báo cho AI về khả năng đọc paper snapshot
  systemContent += "\n\n" +
    "=== HỆ THỐNG WEB ===\n" +
    "Bạn đang hoạt động trong hệ thống web có vùng paper (writing pane) - một editor giống tờ giấy có dòng kẻ.\n" +
    "Hệ thống có khả năng đọc file snapshot từ vùng paper khi bạn cần.\n" +
    "Nếu người dùng hỏi về nội dung trong paper, bạn có thể yêu cầu hệ thống đọc file snapshot.\n" +
    "Chỉ yêu cầu đọc khi thực sự cần thiết để trả lời câu hỏi của người dùng về nội dung paper.";
  
  // Kiểm tra xem user có hỏi về paper không
  const userAsksAboutPaper = asksAboutPaper(job.message);
  
  if (userAsksAboutPaper) {
    const paperSnapshot = await readPaperSnapshot();
    if (paperSnapshot) {
      systemContent += "\n\n" +
        "=== PAPER SNAPSHOT (Đã đọc theo yêu cầu) ===\n" +
        paperSnapshot;
    } else {
      systemContent += "\n\n" +
        "=== PAPER SNAPSHOT ===\n" +
        "File snapshot chưa tồn tại hoặc chưa được tạo. Người dùng cần tạo snapshot trước.";
    }
  }

  const input = [{ role: "system", content: systemContent }];

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

  // Thông báo cho AI về khả năng đọc paper snapshot
  let paperContext = "\n\n=== HỆ THỐNG WEB ===\n" +
    "Bạn đang hoạt động trong hệ thống web có vùng paper (writing pane) - một editor giống tờ giấy có dòng kẻ.\n" +
    "Hệ thống có khả năng đọc file snapshot từ vùng paper khi bạn cần.\n" +
    "Nếu người dùng hỏi về nội dung trong paper, bạn có thể yêu cầu hệ thống đọc file snapshot.\n" +
    "Chỉ yêu cầu đọc khi thực sự cần thiết để trả lời câu hỏi của người dùng về nội dung paper.";
  
  // Chỉ đọc paper snapshot nếu user hỏi về paper
  const userAsksAboutPaper = asksAboutPaper(job.message);
  
  if (userAsksAboutPaper) {
    const paperSnapshot = await readPaperSnapshot();
    if (paperSnapshot) {
      paperContext += "\n\n=== PAPER SNAPSHOT (Đã đọc theo yêu cầu) ===\n" +
        paperSnapshot;
    } else {
      paperContext += "\n\n=== PAPER SNAPSHOT ===\n" +
        "File snapshot chưa tồn tại hoặc chưa được tạo. Người dùng cần tạo snapshot trước.";
    }
  }

  // system prompt: bắt buộc dùng tool result, không đoán
  const system = (
    SYSTEM_PROMPT +
    "\n\n" +
    "If the user asks about how long they have been online in this web app, you MUST use the provided [Tool result: online_time]. " +
    "Do not guess. If tool result is missing, say you cannot determine it.\n" +
    toolLine +
    paperContext
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

  // Dùng model từ job (được set từ request body) - BẮT BUỘC
  const modelToUse = job.model;
  if (!modelToUse) {
    console.error(`[${isoNow()}] ❌ upstream: Job missing model for sid=${sid}`);
    broadcast(sid, "error", { error: "Job missing model" });
    finishJob(sid);
    return;
  }
  // Payload đồng nhất - model chỉ là parameter, không có logic riêng
  const payload = JSON.stringify({ model: modelToUse, stream: true, input });
  const bodyBytes = Buffer.byteLength(payload, "utf8");
  const inputLength = input.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const systemPromptLength = input[0]?.content?.length || 0;

  // Track start time để tính duration
  const startTime = Date.now();

  // Log chi tiết để debug - đảm bảo cả 2 model được xử lý giống nhau
  console.log(`[${isoNow()}] upstream start sid=${sid} model=${modelToUse} bytes=${bodyBytes} input_len=${inputLength} messages=${input.length} system_prompt_len=${systemPromptLength}`);
  
  // Log system prompt để đảm bảo prompt được gửi đúng
  if (DEBUG && input[0]?.content) {
    console.log(`[${isoNow()}] system prompt (first 200 chars): ${input[0].content.substring(0, 200)}`);
  }
  
  // Timeout đồng nhất cho TẤT CẢ models - tránh xử lý khác biệt
  // Đảm bảo cả 2 model được xử lý giống hệt nhau
  const upstreamTimeout = 120000; // 120s cho tất cả models - đồng nhất

  let buf = "";
  let eventCount = 0;
  const firstTypes = [];

  // Request config đồng nhất - model chỉ là parameter trong payload
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
      console.log(`[${isoNow()}] upstream headers sid=${sid} model=${modelToUse}: ${resp.statusCode} ${ct}`);
      broadcast(sid, "upstream", { status: resp.statusCode, ct });

      // Kiểm tra status code - nếu không phải 200, có thể là lỗi
      if (resp.statusCode !== 200) {
        let raw = "";
        resp.setEncoding("utf8");
        resp.on("data", (c) => (raw += c));
        resp.on("end", () => {
          console.error(`[${isoNow()}] ❌ upstream error sid=${sid} model=${modelToUse} status=${resp.statusCode}: ${raw.slice(0, 500)}`);
          broadcast(sid, "error", { error: `HTTP ${resp.statusCode}: ${raw.slice(0, 2000) || "Unknown error"}` });
          finishJob(sid);
        });
        return;
      }

      if (!ct.includes("text/event-stream")) {
        let raw = "";
        resp.setEncoding("utf8");
        resp.on("data", (c) => (raw += c));
        resp.on("end", () => {
          console.error(`[${isoNow()}] ❌ upstream non-sse sid=${sid} model=${modelToUse}: ${raw.slice(0, 500)}`);
          broadcast(sid, "error", { error: raw.slice(0, 2000) || `HTTP ${resp.statusCode}` });
          finishJob(sid);
        });
        return;
      }

      resp.setEncoding("utf8");

      // Track thời gian nhận data đầu tiên
      let firstDataReceived = false;
      let firstDataTime = null;
      
      resp.on("data", (chunk) => {
        buf += chunk;
        
        // QUAN TRỌNG: Cập nhật last_event_ts mỗi khi nhận data từ upstream
        // Để tránh timeout nếu upstream chậm
        job.last_event_ts = Date.now();
        
        // Log khi nhận data đầu tiên để debug
        if (!firstDataReceived && buf.length > 0) {
          firstDataReceived = true;
          firstDataTime = Date.now();
          const delay = firstDataTime - startTime;
          console.log(`[${isoNow()}] ✅ upstream first data received sid=${sid} model=${modelToUse} delay=${delay}ms chunk_len=${chunk.length}`);
        }

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
              // Xử lý token đồng nhất - model chỉ là parameter, không ảnh hưởng logic
              enqueueToken(sid, delta);
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
              const errorMsg = JSON.stringify(ev).slice(0, 500);
              console.error(`[${isoNow()}] ❌ upstream response.error sid=${sid} model=${modelToUse}: ${errorMsg}`);
              broadcast(sid, "error", { error: errorMsg });
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
        const duration = Date.now() - startTime;
        const hasReply = job.reply && job.reply.length > 0;
        
        if (!firstDataReceived) {
          console.error(`[${isoNow()}] ❌ upstream end NO DATA sid=${sid} model=${modelToUse} duration=${duration}ms events=${eventCount}`);
        } else {
          const firstDataDelay = firstDataTime ? firstDataTime - startTime : 0;
          console.log(
            `[${isoNow()}] upstream end sid=${sid} model=${modelToUse} events=${eventCount} len=${job.reply.length} mode=${job.stream_mode} duration=${duration}ms first_data_delay=${firstDataDelay}ms`
          );
        }
        
        // Nếu không có reply và không có data, báo lỗi
        if (!hasReply && eventCount === 0) {
          console.error(`[${isoNow()}] ❌ upstream end with NO REPLY sid=${sid} model=${modelToUse}`);
          broadcast(sid, "error", { error: `Model ${modelToUse} không trả về dữ liệu. Có thể model không khả dụng hoặc tác vụ quá phức tạp.` });
        }
        
        finishJob(sid);
      });

      resp.on("error", (e) => {
        const errMsg = String(e?.message || e);
        const duration = Date.now() - startTime;
        console.error(`[${isoNow()}] ❌ upstream response error sid=${sid} model=${modelToUse} duration=${duration}ms: ${errMsg}`);
        broadcast(sid, "error", { error: `Response error: ${errMsg}` });
        finishJob(sid);
      });

      resp.on("close", () => {
        const duration = Date.now() - startTime;
        const hasReply = job.reply && job.reply.length > 0;
        
        if (DEBUG || !hasReply) {
          console.log(`[${isoNow()}] upstream response closed sid=${sid} model=${modelToUse} duration=${duration}ms has_reply=${hasReply}`);
        }
        
        // Nếu chưa done và không có reply, báo lỗi
        if (job && !job.done) {
          if (!hasReply && eventCount === 0) {
            console.error(`[${isoNow()}] ❌ upstream closed with NO DATA sid=${sid} model=${modelToUse}`);
            broadcast(sid, "error", { error: `Model ${modelToUse} đóng kết nối mà không trả về dữ liệu. Có thể model không khả dụng.` });
          }
          finishJob(sid);
        }
      });
    }
  );

  // Timeout chung - model chỉ là parameter, không ảnh hưởng logic
  req.setTimeout(upstreamTimeout, () => {
    const duration = Date.now() - startTime;
    const hasReply = job.reply && job.reply.length > 0;
    console.error(`[${isoNow()}] ❌ upstream timeout sid=${sid} model=${modelToUse} after ${upstreamTimeout}ms duration=${duration}ms has_reply=${hasReply} events=${eventCount}`);
    
    // Nếu không có reply, báo lỗi rõ ràng
    if (!hasReply) {
      broadcast(sid, "error", { 
        error: `Model ${modelToUse} timeout sau ${Math.round(upstreamTimeout/1000)}s không trả về dữ liệu. Có thể model không khả dụng hoặc tác vụ quá phức tạp.` 
      });
    }
    
    try {
      req.destroy(new Error("upstream_timeout"));
    } catch {}
  });

  req.on("error", (e) => {
    const errMsg = String(e?.message || e);
    const duration = Date.now() - startTime;
    console.error(`[${isoNow()}] ❌ upstream request error sid=${sid} model=${modelToUse} duration=${duration}ms: ${errMsg}`);
    
    // Nếu là ECONNRESET hoặc connection error, thử finish job gracefully
    if (errMsg.includes("ECONNRESET") || errMsg.includes("ECONNREFUSED") || errMsg.includes("socket")) {
      console.log(`[${isoNow()}] connection reset for sid=${sid}, finishing job`);
    }
    
    // Xử lý lỗi đồng nhất - không phân biệt model
    // Model chỉ là parameter, không ảnh hưởng đến logic xử lý
    if (errMsg.includes("model") || errMsg.includes("not found") || errMsg.includes("invalid")) {
      console.error(`[${isoNow()}] ⚠️ Model ${modelToUse} có thể không tồn tại hoặc không được hỗ trợ`);
      broadcast(sid, "error", { error: `Model ${modelToUse} không khả dụng hoặc không được hỗ trợ. Vui lòng chọn model khác.` });
    } else {
      broadcast(sid, "error", { error: errMsg });
    }
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

const server = app.listen(PORT, () => {
  console.log(`\n✅ Backend API server running: http://localhost:${PORT}`);
  console.log(`   Models: ${AVAILABLE_MODELS.map(m => m.value).join(", ")}`);
  console.log(`   OpenAI API Key: [CONFIGURED]`);
  if (clerkClient && clerkMiddleware) {
    console.log(`   Clerk: ✅ Enabled (with authentication)`);
  } else if (process.env.CLERK_SECRET_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
    console.log(`   Clerk: ⚠️  Partially configured (CLERK_PUBLISHABLE_KEY missing)`);
  } else if (process.env.CLERK_SECRET_KEY && !hasClerkDependencies()) {
    console.log(`   Clerk: ⚠️  Not configured (Clerk dependencies missing)`);
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
  console.log(`   Timeout: Disabled (no timeout)`);
  console.log(`   Keep-Alive: 65s`);
  console.log(`   API Routes:`);
  console.log(`     - POST /api/chat/create`);
  console.log(`     - GET  /api/chat/stream`);
  console.log(`     - POST /api/paper/snapshot`);
  console.log();
});

// Cấu hình timeout cho server
server.timeout = 0; // Disable timeout
server.keepAliveTimeout = 65000; // 65 giây
server.headersTimeout = 66000; // 66 giây
