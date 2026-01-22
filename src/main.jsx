// main.jsx — UI locked + Stream plain (no flicker) + Markdown commit-on-stable (Hướng 1)
// FIX #1: Không tự TOP->BOTTOM do nội dung tăng (nguyên nhân gây "tụt").
//         Chỉ chuyển sang BOTTOM khi user chủ động cuộn gần đáy.
// FIX #2: Copy button nằm dưới bubble + tick feedback.

import { UI_CONFIG, buildApiUrl, buildApiHeaders, buildStreamUrl } from "./config.js";

const $ = (id) => document.getElementById(id);

const messagesEl = $("messages");
const scrollArea = $("scrollArea");
const ta = $("ta");
const sendBtn = $("send");
const statusEl = $("status");

// ===== Config =====
const HISTORY_LIMIT = 10;
const history = [];

const FOLLOW_BOTTOM_THRESHOLD_PX = 140;

// Stable commit conditions
const IDLE_FOR_MD_COMMIT_MS = 450;
const MIN_STREAM_MS_BEFORE_MD = 900;
const MAX_TEXT_LEN_GUARD = 200_000;

// ===== Token cadence (UI-side) =====
const UI_FLUSH_MIN_MS = 16;          // ~60fps để markdown render nhanh hơn
const UI_FLUSH_DENSE_MS = 33;        // token dày
const UI_SPARSE_IMMEDIATE_MS = 100;  // token thưa → flush ngay

let uiPending = "";     // token chưa flush ra DOM
let uiFlushScheduled = false;
let uiLastFlushAt = 0;
let uiDenseScore = 0;

// ===== State =====
let activeSid = null;
let es = null;

let scrollMode = "BOTTOM"; // TOP | BOTTOM
let userScrollLocked = false;
let programmaticScroll = false;
let ignoreScrollUntil = 0;
let userScrollIntent = false;
let userPointerDown = false;
let userIntentTimer = null;
let justInsertedTurn = false;
let lastTurnEl = null;

// ✅ NEW: chỉ khi user cuộn về gần đáy thì mới cho phép bám đáy
let followBottomArmed = false;

// Current turn streaming
let curAiEl = null;
let curPlainEl = null;
let curBuf = "";

let streamStartedAt = 0;
let lastTokenAt = 0;
let idleTimer = null;

let mdCommitted = false;
let mdRenderAttempts = 0;
let mdRenderDisabled = false;
let mdFallbackMode = false; // Nếu true: chỉ render markdown khi done, không render trong lúc streaming

// ===== Utilities =====
// ===== Theme (Light / Dark) =====
const THEME_KEY = "ui_theme"; // "light" | "dark"

function getSystemTheme() {
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Theme toggle không còn text, chỉ có icon + thumb
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme =
    saved === "dark" || saved === "light"
      ? saved
      : getSystemTheme();

  applyTheme(theme);

  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const cur =
      document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";

    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// ===== Clock (icon + HH:MM:SS) =====
let clockTimer = null;
let clockInterval = null;

function formatHHMMSS(d) {
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateClockNow() {
  const el = document.getElementById("clockTime");
  if (!el) return;
  el.textContent = formatHHMMSS(new Date());
}

function initClock() {
  if (clockTimer) clearTimeout(clockTimer);
  if (clockInterval) clearInterval(clockInterval);

  updateClockNow();
  const now = new Date();
  const msToNextSecond = 1000 - now.getMilliseconds() + 10;

  clockTimer = setTimeout(() => {
    updateClockNow();
    clockInterval = setInterval(updateClockNow, 1000);
  }, Math.max(40, msToNextSecond));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") initClock();
  });
}

// ===== Constraint-based lite sizing =====
const SIZE_KEYS = {
  topbar: "ui_topbar_ideal_rem",
  chat: "ui_chat_ideal_vw",
};

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function getRemPx() {
  const fs = getComputedStyle(document.documentElement).fontSize;
  const n = parseFloat(fs || "16");
  return Number.isFinite(n) ? n : 16;
}

function getVwPx() {
  return window.innerWidth / 100;
}

function readNumberLS(key, fallback) {
  const raw = localStorage.getItem(key);
  const n = raw == null ? NaN : parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function writeNumberLS(key, val) {
  localStorage.setItem(key, String(val));
}

function applyTopbarFromIdeal(idealRem) {
  const TOPBAR_MIN_PX = 20;
  const TOPBAR_MAX_PX = 56;

  const remPx = getRemPx();
  const idealPx = idealRem * remPx;
  const actualPx = clamp(idealPx, TOPBAR_MIN_PX, TOPBAR_MAX_PX);

  const root = document.documentElement;
  root.style.setProperty("--topbar-h", `${actualPx}px`);
  // pill scale theo actual, không theo px cứng
  const pill = Math.max(16, Math.min(34, Math.round(actualPx * 0.64)));
  root.style.setProperty("--topbar-pill-h", `${pill}px`);
}

function applyChatFromIdeal(idealVw) {
  const CHAT_MIN_PX = 280;
  const CHAT_MAX_PX = 560;

  const vwPx = getVwPx();
  const idealPx = idealVw * vwPx;
  const actualPx = clamp(idealPx, CHAT_MIN_PX, CHAT_MAX_PX);

  document.documentElement.style.setProperty("--chat-w", `${actualPx}px`);
}

function restoreIdealsAndApply() {
  // Default ideal: topbar ~ 2.0rem, chat ~ 28vw
  const idealTopbarRem = readNumberLS(SIZE_KEYS.topbar, 2.0);
  const idealChatVw = readNumberLS(SIZE_KEYS.chat, 28);

  applyTopbarFromIdeal(idealTopbarRem);
  applyChatFromIdeal(idealChatVw);
}

// ===== Topbar drag resize (Cursor-like) =====
const TOPBAR_MIN = 20;
const TOPBAR_MAX = 56;

function initTopbarResizer() {
  const grip = document.getElementById("topbarResizer");
  const topbar = document.querySelector(".topbar");
  if (!grip || !topbar) {
    console.warn("⚠️ Topbar resizer element not found (main.jsx)");
    return;
  }
  console.log("✅ Initializing topbar resizer (main.jsx)");

  let dragging = false;
  let startY = 0;
  let startPx = 0;
  let startIdealRem = 2.0;
  let activePointerId = null;
  let raf = 0;
  let pendingIdealRem = null;

  function commit() {
    raf = 0;
    if (pendingIdealRem == null) return;
    writeNumberLS(SIZE_KEYS.topbar, pendingIdealRem);
    applyTopbarFromIdeal(pendingIdealRem);
    pendingIdealRem = null;
  }

  const handlePointerMove = (e) => {
    if (!dragging || (activePointerId != null && e.pointerId !== activePointerId)) return;
    
    const dy = e.clientY - startY;      // kéo xuống -> tăng height
    const nextPx = startPx + dy;
    
    const remPx = getRemPx();
    const nextIdealRem = nextPx / remPx;
    
    pendingIdealRem = nextIdealRem;
    if (!raf) raf = requestAnimationFrame(commit);
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerUp = (e) => {
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    endDrag();
    e.preventDefault();
  };

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    document.documentElement.removeAttribute("data-resizing");
    
    // Remove listeners từ document
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    
    try { grip.releasePointerCapture?.(activePointerId); } catch {}
    activePointerId = null;
  }

  grip.addEventListener("pointerdown", (e) => {
    // chỉ primary
    if (e.isPrimary === false) return;
    console.log("🖱️ Topbar resizer pointerdown (main.jsx)");
    dragging = true;
    activePointerId = e.pointerId;

    const remPx = getRemPx();
    // lấy actual hiện tại từ CSS var --topbar-h (px)
    const curPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h")) || 28;
    startPx = curPx;
    startIdealRem = readNumberLS(SIZE_KEYS.topbar, curPx / remPx);

    startY = e.clientY;

    document.documentElement.setAttribute("data-resizing", "topbar");

    // Attach listeners to document để bắt mọi movement
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    // bắt pointer để kéo mượt kể cả ra ngoài topbar
    try { grip.setPointerCapture(e.pointerId); } catch {}

    e.preventDefault();
  });

  grip.addEventListener("pointercancel", () => endDrag());

  // safety: nếu window blur khi đang kéo
  window.addEventListener("blur", () => endDrag());
}

// ===== Chat drag resize (width) =====
const CHAT_MIN = 280;
const CHAT_MAX = 560;

function initChatResizer() {
  const grip = document.getElementById("chatResizer");
  const chat = document.querySelector(".chat");
  if (!grip || !chat) {
    console.warn("⚠️ Chat resizer element not found (main.jsx)");
    return;
  }
  console.log("✅ Initializing chat resizer (main.jsx)");

  let dragging = false;
  let startX = 0;
  let startPx = 380;
  let startIdealVw = 28;

  let activePointerId = null;
  let raf = 0;
  let pendingIdealVw = null;

  function commit() {
    raf = 0;
    if (pendingIdealVw == null) return;
    writeNumberLS(SIZE_KEYS.chat, pendingIdealVw);
    applyChatFromIdeal(pendingIdealVw);
    pendingIdealVw = null;
  }

  const handlePointerMove = (e) => {
    if (!dragging || (activePointerId != null && e.pointerId !== activePointerId)) return;
    
    // Chat nằm bên phải; kéo handle sang trái -> chat rộng hơn
    const dx = startX - e.clientX;
    const nextPx = startPx + dx;
    
    const vwPx = getVwPx();
    const nextIdealVw = nextPx / vwPx;
    
    pendingIdealVw = nextIdealVw;
    if (!raf) raf = requestAnimationFrame(commit);
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerUp = (e) => {
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    endDrag();
    e.preventDefault();
  };

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    document.documentElement.removeAttribute("data-resizing");
    
    // Remove listeners từ document
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    
    try { grip.releasePointerCapture?.(activePointerId); } catch {}
    activePointerId = null;
  }

  grip.addEventListener("pointerdown", (e) => {
    if (e.isPrimary === false) return;
    console.log("🖱️ Chat resizer pointerdown (main.jsx)");
    dragging = true;
    activePointerId = e.pointerId;

    const curPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--chat-w")) || 380;
    startPx = curPx;

    const vwPx = getVwPx();
    startIdealVw = readNumberLS(SIZE_KEYS.chat, curPx / vwPx);

    startX = e.clientX;

    document.documentElement.setAttribute("data-resizing", "chat");
    
    // Attach listeners to document để bắt mọi movement
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    
    try { grip.setPointerCapture(e.pointerId); } catch {}

    e.preventDefault();
  });

  grip.addEventListener("pointercancel", () => endDrag());
  window.addEventListener("blur", () => endDrag());
}

function setStatus(_) { /* intentionally empty: no system log in topbar */ }

function pushHistory(role, content) {
  history.push({ role, content });
  if (history.length > HISTORY_LIMIT) {
    history.splice(0, history.length - HISTORY_LIMIT);
  }
}

function safeJsonParse(raw) {
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

function getPaddingTopPx() {
  const cs = getComputedStyle(scrollArea);
  const pt = parseFloat(cs.paddingTop || "0");
  return Number.isFinite(pt) ? pt : 0;
}

function getPaddingBottomPx() {
  const cs = getComputedStyle(scrollArea);
  const pb = parseFloat(cs.paddingBottom || "0");
  return Number.isFinite(pb) ? pb : 0;
}

function distanceToBottomPx() {
  return scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
}

function markProgrammaticScroll() {
  programmaticScroll = true;
  ignoreScrollUntil = performance.now() + 80;
  requestAnimationFrame(() => { programmaticScroll = false; });
}

let isUserScrolling = false;
let userScrollTimer = null;

function markUserScrollIntent() {
  userScrollIntent = true;
  isUserScrolling = true; // Đánh dấu user đang scroll
  
  // Clear timer cũ
  if (userIntentTimer) clearTimeout(userIntentTimer);
  if (userScrollTimer) clearTimeout(userScrollTimer);
  
  // Reset userScrollIntent sau khi không scroll nữa
  userIntentTimer = setTimeout(() => {
    if (!userPointerDown) userScrollIntent = false;
  }, 140);
  
  // Reset isUserScrolling sau khi scroll dừng
  userScrollTimer = setTimeout(() => {
    isUserScrolling = false;
  }, 150);
}

function scrollToBottomImmediate() {
  // Chỉ scroll khi có đủ nội dung
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  
  markProgrammaticScroll();
  scrollArea.scrollTop = scrollArea.scrollHeight;
}

function anchorElementToTop(el) {
  if (!el) return;
  const pt = getPaddingTopPx();

  const wrapRect = scrollArea.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const delta = elRect.top - wrapRect.top;
  markProgrammaticScroll();
  scrollArea.scrollTop += (delta - pt);
}


function scheduleLayoutUpdate() {
  requestAnimationFrame(() => {
    if (scrollMode === "TOP") {
      anchorElementToTop(lastTurnEl);
    } else {
      scrollToBottomImmediate();
    }
  });
}

// textarea auto grow
function autoGrow() {
  if (!ta) return;
  ta.style.height = "0px";
  const max = 160;
  const next = Math.min(ta.scrollHeight, max);
  ta.style.height = next + "px";
}

function refreshSendState() {
  const hasText = (ta.value || "").trim().length > 0;
  const busy = !!activeSid;
  const isReadOnly = typeof window !== 'undefined' && window.__USER_READONLY__ === true;
  sendBtn.disabled = busy || !hasText || isReadOnly;
  
  // Disable textarea if readonly
  if (ta && isReadOnly) {
    ta.disabled = true;
    ta.placeholder = "Chế độ xem: Không thể gửi tin nhắn";
  } else if (ta) {
    ta.disabled = false;
    ta.placeholder = "Nhập câu hỏi...";
  }
}

// ===== UI cadence flush =====
function uiTargetFlushMs(now) {
  if (now - lastTokenAt >= UI_SPARSE_IMMEDIATE_MS) return 0;
  if (uiDenseScore >= 6) return UI_FLUSH_DENSE_MS;
  return UI_FLUSH_MIN_MS;
}

function uiFlushNow() {
  uiFlushScheduled = false;
  if (!uiPending) return;

  const now = performance.now();
  const target = uiTargetFlushMs(now);

  if (target > 0 && now - uiLastFlushAt < target) {
    uiScheduleFlush();
    return;
  }

  uiLastFlushAt = now;

  clearThinkingToPlain();
  if (curPlainEl) curPlainEl.textContent = curBuf;

  uiPending = "";

  // Render markdown ngay lập tức (như App.jsx) - mỗi lần flush đều thử commit
  commitMarkdown(false);

  // Scroll logic sau khi flush
  if (scrollMode !== "TOP" && !userScrollLocked && !isUserScrolling) {
    scrollToBottomImmediate();
  }
}

function uiScheduleFlush() {
  if (uiFlushScheduled) return;
  uiFlushScheduled = true;
  requestAnimationFrame(uiFlushNow);
}

// ===== DOM builders =====
function makeUserTurn(text, parentTurn) {
  const turn = parentTurn || document.createElement("div");
  if (!parentTurn) turn.className = "turn";

  const userWrap = document.createElement("div");
  userWrap.className = "userWrap";

  const user = document.createElement("div");
  user.className = "user";

  const userText = document.createElement("span");
  userText.className = "userText";
  userText.textContent = text;
  user.appendChild(userText);

  const copyBtn = document.createElement("button");
  copyBtn.className = "copyBtn";
  copyBtn.type = "button";
  copyBtn.setAttribute("data-tooltip", "Copy");
  copyBtn.textContent = "⧉";

  // ✅ Tick feedback
  copyBtn.addEventListener("click", async () => {
    const prevTxt = copyBtn.textContent;
    const prevTip = copyBtn.getAttribute("data-tooltip") || "Copy";
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "✓";
      copyBtn.setAttribute("data-tooltip", "Copied");
      setTimeout(() => {
        copyBtn.textContent = prevTxt;
        copyBtn.setAttribute("data-tooltip", prevTip);
      }, 900);
    } catch {
      copyBtn.setAttribute("data-tooltip", "Failed");
      setTimeout(() => copyBtn.setAttribute("data-tooltip", prevTip), 900);
    }
  });

  // ✅ Vị trí đúng: bubble trước, copy dưới
  userWrap.appendChild(user);
  userWrap.appendChild(copyBtn);

  turn.appendChild(userWrap);
  if (!parentTurn) messagesEl.appendChild(turn);

  return turn;
}

function makeAiTurnThinking(parentTurn) {
  const turn = parentTurn || document.createElement("div");
  if (!parentTurn) turn.className = "turn";

  const ai = document.createElement("div");
  ai.className = "ai";
  ai.dataset.thinking = "true";

  const plain = document.createElement("div");
  plain.className = "aiPlain";
  plain.innerHTML = '<span class="thinkingText">Đang suy nghĩ...</span>';

  ai.appendChild(plain);
  turn.appendChild(ai);

  if (!parentTurn) messagesEl.appendChild(turn);

  return { turn, ai, plain };
}

function clearThinkingToPlain() {
  if (!curAiEl || !curPlainEl) return;
  if (curAiEl.dataset.thinking === "true") {
    curPlainEl.textContent = "";
    curAiEl.dataset.thinking = "false";
  }
}

// ===== Markdown commit (stable) =====
function hasMarkdownLib() {
  return !!window.marked && !!window.DOMPurify;
}

function codeFenceClosed(text) {
  const m = text.match(/```/g);
  const fences = m ? m.length : 0;
  return fences % 2 === 0;
}

function renderMarkdownSafe(mdText) {
  try {
    const html = window.marked.parse(mdText, {
      gfm: true,
      breaks: true,
      mangle: false,
      headerIds: false,
    });
    return window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  } catch (e) {
    console.warn("Markdown render error:", e);
    throw e; // Re-throw để xử lý ở commitMarkdown
  }
}

function canCommitMarkdownNow(force = false) {
  // Nếu đã bị disable markdown (fail quá 3 lần), không commit markdown
  if (mdRenderDisabled) return false;
  if (!hasMarkdownLib()) return false;
  if (!curAiEl) return false;
  
  // Nếu đã commit rồi, luôn cho phép update
  if (mdCommitted) return true;
  
  // Cho phép commit ngay cả khi không có curPlainEl (đã commit rồi)
  if (!curPlainEl && !curAiEl.querySelector(".aiRender")) return false;

  // Lần đầu commit: chỉ cần có nội dung và đã qua 50ms (nhanh hơn)
  if (!force) {
    const now = performance.now();
    if (now - streamStartedAt < 50) return false;
    if (!curBuf || curBuf.trim().length === 0) return false;
  }
  return true;
}

function commitMarkdown(force = false) {
  if (!canCommitMarkdownNow(force)) return;
  
  // Nếu đang ở fallback mode và chưa done, không commit (chỉ commit khi done)
  if (mdFallbackMode && !force) return;

  // Thử render markdown với fallback
  let safe;
  try {
    safe = renderMarkdownSafe(curBuf);
    // Reset counter và fallback mode nếu thành công
    mdRenderAttempts = 0;
    mdFallbackMode = false;
  } catch (e) {
    // Tăng counter khi fail
    mdRenderAttempts++;
    console.warn(`Markdown render failed (attempt ${mdRenderAttempts}/3):`, e);
    
    // Nếu fail quá 3 lần, chuyển sang fallback mode (chỉ render khi done)
    if (mdRenderAttempts >= 3) {
      mdFallbackMode = true;
      console.warn("Markdown fallback mode: chỉ render khi stream xong");
      // Giữ nguyên plain text, không commit markdown trong lúc streaming
      return;
    }
    
    // Nếu chưa đến 3 lần, thử lại lần sau
    return;
  }

  // Nếu đã commit rồi, chỉ update innerHTML thay vì replace
  const existingRender = curAiEl.querySelector(".aiRender");
  if (existingRender) {
    existingRender.innerHTML = safe;
    return;
  }

  const h = curAiEl.getBoundingClientRect().height;
  curAiEl.style.minHeight = `${Math.max(0, h)}px`;

  const render = document.createElement("div");
  render.className = "aiRender";
  render.innerHTML = safe;

  curAiEl.replaceChild(render, curPlainEl);
  curPlainEl = null;
  mdCommitted = true;

  requestAnimationFrame(() => {
    curAiEl.style.minHeight = "";
  });
}

function scheduleIdleCommitCheck() {
  if (idleTimer) clearTimeout(idleTimer);
  // Commit khi idle (fallback nếu uiFlushNow chưa commit)
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (!mdCommitted && curBuf.length > 20) {
      commitMarkdown(false);
    }
  }, 300); // 300ms fallback
}

function finalizeCommitOnDone() {
  if (!mdCommitted) {
    // Nếu đang ở fallback mode, force commit markdown khi done
    if (mdFallbackMode) {
      // Reset fallback mode và thử commit lại
      mdFallbackMode = false;
      mdRenderAttempts = 0;
      if (canCommitMarkdownNow(true)) {
        commitMarkdown(true);
      } else {
        // Nếu vẫn fail, giữ plain text
        clearThinkingToPlain();
        if (curPlainEl && !curPlainEl.textContent) {
          curPlainEl.textContent = curBuf || "[Không có dữ liệu trả về]";
        }
      }
    } else {
      // Bình thường: commit markdown khi done
      if (canCommitMarkdownNow(true)) {
        commitMarkdown(true);
      } else {
        clearThinkingToPlain();
        if (curPlainEl && !curPlainEl.textContent) {
          curPlainEl.textContent = curBuf || "[Không có dữ liệu trả về]";
        }
      }
    }
  }
}

// ===== API =====
async function createJob(message, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000; // 1 giây giữa các lần retry

  try {
    // Lấy Clerk token nếu có (từ ClerkWrapper)
    let authHeader = {};
    if (typeof window !== 'undefined' && window.__CLERK_GET_TOKEN__) {
      try {
        const token = await window.__CLERK_GET_TOKEN__();
        if (token) {
          authHeader["Authorization"] = `Bearer ${token}`;
        } else {
          console.warn("⚠️ Clerk token is null/undefined");
        }
      } catch (e) {
        console.error("❌ Failed to get Clerk token:", e);
        // Không throw, để server xử lý
      }
    } else {
      // Nếu không có Clerk, có thể là dev mode không dùng Clerk
      if (import.meta.env.DEV) {
        console.warn("⚠️ Clerk token function not available. Make sure ClerkWrapper is mounted.");
      }
    }

    const resp = await fetch(buildApiUrl(UI_CONFIG.chatCreatePath), {
      method: "POST",
      headers: { ...buildApiHeaders(), ...authHeader },
      credentials: "include", // Quan trọng cho Clerk cookies
      body: JSON.stringify({ message, history }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      const errorMsg = txt || `HTTP ${resp.status}`;
      
      // Nếu là lỗi authentication, hiển thị thông báo rõ ràng
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Xác thực thất bại (${resp.status}). Vui lòng đăng nhập lại.`);
      }
      
      throw new Error(`create_failed ${resp.status}: ${errorMsg}`);
    }

    const data = await resp.json();
    if (!data || !data.sid) throw new Error("create_failed: missing sid");
    return data.sid;
  } catch (error) {
    // Kiểm tra nếu là lỗi mất kết nối
    const isConnectionError = 
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Network request failed") ||
      error.name === "TypeError";

    if (isConnectionError && retryCount < MAX_RETRIES) {
      const attempt = retryCount + 1;
      setStatus(`Đang thử lại kết nối... (${attempt}/${MAX_RETRIES})`);
      
      // Đợi trước khi retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      
      // Retry
      return createJob(message, retryCount + 1);
    }

    // Nếu không phải lỗi kết nối hoặc đã retry hết, throw error
    if (isConnectionError && retryCount >= MAX_RETRIES) {
      throw new Error("Mất kết nối. Vui lòng kiểm tra kết nối mạng và thử lại.");
    }

    throw error;
  }
}

function closeStream() {
  if (es) {
    try { es.close(); } catch {}
  }
  es = null;
  activeSid = null;
  refreshSendState();
}

async function streamJob(sid, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000; // 1 giây giữa các lần retry

  return new Promise(async (resolve, reject) => {
    // Build stream URL với token (async vì cần lấy token)
    let streamUrl;
    try {
      streamUrl = await buildStreamUrl(sid);
    } catch (e) {
      console.error("❌ Failed to build stream URL:", e);
      reject(new Error("Không thể tạo kết nối stream. Vui lòng thử lại."));
      return;
    }
    
    es = new EventSource(streamUrl);
    let gotToken = false;

    es.addEventListener("meta", () => setStatus("streaming"));

    es.addEventListener("token", (ev) => {
      const payload = safeJsonParse(ev?.data);
      const tok = (payload && typeof payload.t === "string") ? payload.t : "";
      if (!tok) return;

      gotToken = true;

      if (curBuf.length < MAX_TEXT_LEN_GUARD) curBuf += tok;

      const now = performance.now();
      const dt = now - lastTokenAt;
      lastTokenAt = now;

      // dense score
      if (dt < 18) uiDenseScore = Math.min(12, uiDenseScore + 1);
      else uiDenseScore = Math.max(0, uiDenseScore - 1);

      // UI cadence flush (không update DOM mỗi token)
      uiPending += tok;
      uiScheduleFlush();

      // Markdown: chỉ commit khi idle/done (giữ hệ ổn định)
      scheduleIdleCommitCheck();

      // ===== scroll logic =====
      // Không auto-scroll nếu user đang scroll hoặc đã lock
      if (userScrollLocked || isUserScrolling) return;

      if (scrollMode === "TOP") {
        // ✅ FIX "tụt": tuyệt đối không tự TOP->BOTTOM do nội dung tăng.
        // Chỉ chuyển nếu user đã "arm" bằng cách tự cuộn gần đáy.
        if (followBottomArmed) {
          scrollMode = "BOTTOM";
          scrollToBottomImmediate();
        }
        return;
      }

      // Scroll với vùng đệm thật
      scrollToBottomImmediate();
    });

    es.addEventListener("done", () => {
      closeStream();
      setStatus("ready");
      resolve({ gotToken });
    });

    es.addEventListener("error", (ev) => {
      let msg = "stream_error";
      try {
        const p = safeJsonParse(ev?.data);
        if (p && p.error) msg = p.error;
      } catch {}

      closeStream();
      
      // Kiểm tra nếu là lỗi kết nối và có thể retry
      const isConnectionError = 
        msg.includes("connection") ||
        msg.includes("network") ||
        msg === "stream_error";
      
      if (isConnectionError && retryCount < MAX_RETRIES) {
        const attempt = retryCount + 1;
        setStatus(`Đang thử lại kết nối... (${attempt}/${MAX_RETRIES})`);
        
        // Đợi trước khi retry
        setTimeout(() => {
          streamJob(sid, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY_MS);
        return;
      }

      // Đã retry hết hoặc không phải lỗi kết nối, báo lỗi
      if (isConnectionError && retryCount >= MAX_RETRIES) {
        setStatus("error");
        reject(new Error("Mất kết nối. Vui lòng kiểm tra kết nối mạng và thử lại."));
        return;
      }

      setStatus("error");
      reject(new Error(msg));
    });

    es.onerror = () => {
      closeStream();
      
      // Kiểm tra nếu có thể retry
      if (retryCount < MAX_RETRIES) {
        const attempt = retryCount + 1;
        setStatus(`Đang thử lại kết nối... (${attempt}/${MAX_RETRIES})`);
        
        // Đợi trước khi retry
        setTimeout(() => {
          streamJob(sid, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY_MS);
        return;
      }

      // Đã retry hết, báo lỗi
      setStatus("error");
      reject(new Error("Mất kết nối. Vui lòng kiểm tra kết nối mạng và thử lại."));
    };
  });
}

// ===== Toast notification (vanilla JS) =====
function showToast(message, duration = 3000) {
  // Xóa toast cũ nếu có
  const existingToast = document.getElementById("toast-notification");
  if (existingToast) {
    existingToast.remove();
  }

  // Tạo toast mới
  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    background: var(--panel, #fbf8f3);
    border: 1px solid var(--border, rgba(28,26,23,0.10));
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    box-shadow: var(--shadow-soft, 0 1px 2px rgba(28,26,23,0.05), 0 10px 26px rgba(28,26,23,0.08));
    font-size: 0.875rem;
    color: var(--text, #1c1a17);
    max-width: 400px;
    text-align: center;
    animation: toastSlideIn 0.3s ease;
  `;
  toast.textContent = message;

  // Thêm animation CSS nếu chưa có
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes toastSlideIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes toastSlideOut {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Tự động xóa sau duration
  setTimeout(() => {
    toast.style.animation = "toastSlideOut 0.3s ease";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration);
}

// ===== Main send =====
async function sendMessage() {
  const text = (ta.value || "").trim();
  if (!text) return;
  if (activeSid) return;

  // Kiểm tra readonly trước
  const isReadOnly = typeof window !== 'undefined' && window.__USER_READONLY__ === true;
  if (isReadOnly) {
    showToast("📖 Bạn đang ở chế độ xem. Không thể gửi tin nhắn.");
    return;
  }

  // reset locks for new turn
  userScrollLocked = false;
  followBottomArmed = false; // ✅ NEW: không cho tự bám đáy khi mới gửi
  userScrollIntent = false;
  userPointerDown = false;
  isUserScrolling = false; // Reset scroll state

  const turnEl = document.createElement("div");
  turnEl.className = "turn";
  messagesEl.appendChild(turnEl);
  makeUserTurn(text, turnEl);

  const { ai: aiEl, plain } = makeAiTurnThinking(turnEl);

  curAiEl = aiEl;
  curPlainEl = plain;
  curBuf = "";
  mdCommitted = false;
  mdRenderAttempts = 0; // Reset counter cho turn mới
  mdRenderDisabled = false; // Reset flag cho turn mới
  mdFallbackMode = false; // Reset fallback mode cho turn mới

  // Reset UI cadence state
  uiPending = "";
  uiFlushScheduled = false;
  uiLastFlushAt = 0;
  uiDenseScore = 0;

  streamStartedAt = performance.now();
  lastTokenAt = streamStartedAt;

  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }

  pushHistory("user", text);

  ta.value = "";
  autoGrow();
  refreshSendState();

  // TOP-mode for new turn
  scrollMode = "TOP";
  lastTurnEl = turnEl;

  // Insert settle (2-phase)
  justInsertedTurn = true;
  requestAnimationFrame(() => {
    anchorElementToTop(turnEl);
    ta.focus();

    requestAnimationFrame(() => {
      anchorElementToTop(turnEl);
      justInsertedTurn = false;
    });
  });

  setStatus("creating");
  activeSid = "creating";
  refreshSendState();

  try {
    const sid = await createJob(text);
    activeSid = sid;
    refreshSendState();

    const info = await streamJob(sid); // streamJob is now async

    if (!info.gotToken) {
      clearThinkingToPlain();
      curBuf = curBuf || "[Không có dữ liệu trả về]";
      if (curPlainEl) curPlainEl.textContent = curBuf;
    }

    finalizeCommitOnDone();
    pushHistory("assistant", curBuf || "");
  } catch (e) {
    clearThinkingToPlain();
    curBuf = `[Lỗi] ${e.message || e}`;
    if (curPlainEl) curPlainEl.textContent = curBuf;

    finalizeCommitOnDone();
    closeStream();
    setStatus("error");
  } finally {
    ta.focus();
    refreshSendState();
    if (!activeSid && statusEl && statusEl.textContent !== "error") setStatus("ready");
  }
}

// ===== Wire events =====
function init() {
  initTheme(); // 👈 đang có
  initClock(); // 👈 thêm dòng này
  
  // Khởi tạo ideals và apply constraints
  restoreIdealsAndApply();
  
  initTopbarResizer(); // 👈 thêm dòng này
  initChatResizer();
  
  // Re-apply constraints khi resize cửa sổ
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const idealTopbarRem = readNumberLS(SIZE_KEYS.topbar, 2.0);
      const idealChatVw = readNumberLS(SIZE_KEYS.chat, 28);
      applyTopbarFromIdeal(idealTopbarRem);
      applyChatFromIdeal(idealChatVw);
    }, 100);
  });
  
  autoGrow();
  refreshSendState();
  setStatus("ready");
  ta.focus();

  sendBtn.addEventListener("click", sendMessage);

  ta.addEventListener("input", () => {
    autoGrow();
    refreshSendState();
  });

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Respect user scroll + arm follow-bottom when user intentionally returns near bottom
scrollArea.addEventListener("scroll", () => {
  if (programmaticScroll || performance.now() < ignoreScrollUntil) return;

  // Nếu không phải user scroll intent, không xử lý
  if (!userScrollIntent && !isUserScrolling) return;

  const nearBottom = distanceToBottomPx() <= FOLLOW_BOTTOM_THRESHOLD_PX;
  if (nearBottom) {
    followBottomArmed = true;
    userScrollLocked = false;
    isUserScrolling = false; // Reset khi user về gần đáy
    if (scrollMode === "TOP") {
      scrollMode = "BOTTOM";
      scrollToBottomImmediate();
    }
    return;
  }

  // User scroll xa đáy: lock auto-scroll
  userScrollLocked = true;
  followBottomArmed = false;
});

scrollArea.addEventListener("wheel", markUserScrollIntent, { passive: true });
scrollArea.addEventListener("touchstart", markUserScrollIntent, { passive: true });
scrollArea.addEventListener("touchmove", markUserScrollIntent, { passive: true });
scrollArea.addEventListener("pointerdown", (e) => {
  if (e && e.isPrimary === false) return;
  userPointerDown = true;
  markUserScrollIntent();
});
scrollArea.addEventListener("pointerup", () => { userPointerDown = false; });
scrollArea.addEventListener("pointercancel", () => { userPointerDown = false; });
scrollArea.addEventListener("mouseleave", () => { userPointerDown = false; });

  window.addEventListener("resize", scheduleLayoutUpdate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
