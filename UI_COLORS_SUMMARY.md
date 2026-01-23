# Tổng hợp màu UI theo nhóm

## 1. TOPBAR

### Light Mode
```css
/* Nền topbar */
--topbar-a: #fbf6ee;          /* Giấy sáng (gradient top) */
--topbar-b: #f0e6d6;          /* Giấy đậm nhẹ (gradient bottom) */
background: linear-gradient(180deg, var(--topbar-a), var(--topbar-b));

/* Chữ */
--topbar-fg: #1c1a17;         /* Charcoal ấm */

/* Viền */
--topbar-border: rgba(28,26,23,0.12);

/* Glass effect */
--topbar-glass: rgba(255,255,255,0.65);
```

### Dark Mode
```css
/* Nền topbar */
--topbar-a: #0e0d0c;          /* Đen ấm (gradient top) */
--topbar-b: #161311;          /* Đen đậm hơn (gradient bottom) */
background: linear-gradient(180deg, var(--topbar-a), var(--topbar-b));

/* Chữ */
--topbar-fg: #ece6dd;         /* Ivory */

/* Viền */
--topbar-border: rgba(255,255,255,0.14);

/* Glass effect */
--topbar-glass: rgba(255,255,255,0.08);
```

---

## 2. PANEL (Chat Panel)

### Light Mode
```css
/* Nền panel */
--panel: #fbf8f3;             /* Panel chat: sáng nhưng không trắng gắt */
--panel-soft: #fdfaf6;
--panel-stone: #f3eee6;

/* Nền tổng thể */
--bg: #f5f1ea;                /* Nền chính: giấy ấm */
--bg-soft: #f7f3ed;           /* Pane trái */
--pane: #f1ece4;

/* Chữ */
--text: #1c1a17;              /* Charcoal ấm */
--muted: #6c625a;             /* Xám ấm */
--placeholder: #8a8077;

/* Viền */
--border: rgba(28,26,23,0.10);
--border-soft: rgba(28,26,23,0.16);

/* Shadow */
--shadow-soft:
  0 1px 2px rgba(28,26,23,0.05),
  0 10px 26px rgba(28,26,23,0.08);
```

### Dark Mode
```css
/* Nền panel */
--panel: #141210;             /* Chat panel - đen ấm */
--panel-soft: #171412;
--panel-stone: #1c1916;

/* Nền tổng thể */
--bg: #0f0e0d;                /* Nền tổng thể: than ấm */
--bg-soft: #141210;           /* Pane trái: ấm, không xanh */
--pane: #171412;

/* Chữ */
--text: #ece6dd;               /* Trắng ngà */
--muted: #b9b0a6;              /* Xám ấm */
--placeholder: #8f877f;

/* Viền */
--border: rgba(236,230,221,0.10);
--border-soft: rgba(236,230,221,0.16);

/* Shadow */
--shadow-soft:
  0 1px 2px rgba(0,0,0,0.35),
  0 10px 28px rgba(0,0,0,0.45);
```

---

## 3. MENU (Sidebar Menu)

### Light Mode
```css
/* Nền menu */
background: var(--bg-soft);   /* #f7f3ed - Pane trái */
border-right: 1px solid var(--border);

/* Chữ */
--text: #1c1a17;              /* Charcoal ấm */
--muted: #6c625a;             /* Xám ấm */

/* Avatar */
.sidebarAvatarPlaceholder {
  background: transparent;
  color: #fff;                 /* Chữ trắng (trên nền avatar) */
}

.sidebarUserAvatar {
  background: rgba(255,255,255,0.1);
}

/* Button đăng xuất */
.sidebarSignOutBtn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.sidebarSignOutBtn:hover {
  background: var(--hover, rgba(255,255,255,0.08));
  border-color: var(--border-soft);
}

/* Separator */
.sidebarSeparator {
  background: var(--border);
}
```

### Dark Mode
```css
/* Nền menu */
background: var(--bg-soft);   /* #141210 - Pane trái đen ấm */
border-right: 1px solid var(--border);

/* Chữ */
--text: #ece6dd;               /* Trắng ngà */
--muted: #b9b0a6;              /* Xám ấm */

/* Avatar */
.sidebarAvatarPlaceholder {
  background: transparent;
  color: #fff;                 /* Chữ trắng (trên nền avatar) */
}

.sidebarUserAvatar {
  background: rgba(255,255,255,0.1);
}

/* Button đăng xuất */
.sidebarSignOutBtn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.sidebarSignOutBtn:hover {
  background: var(--hover, rgba(255,255,255,0.08));
  border-color: var(--border-soft);
}

/* Separator */
.sidebarSeparator {
  background: var(--border);
}
```

---

## 4. VÙNG GIỮA (WritingPane)

### Light Mode
```css
/* Nền giấy */
paperBg: #F6F1E8;             /* Cream paper - dùng trong sách in đọc lâu */

/* Mực (chữ) */
ink: #2A2724;                  /* Đen nâu ấm, không gắt */

/* Dòng kẻ ngang */
gridColor: rgba(28, 26, 23, 0.045);

/* Đường lề trái */
marginLineColor: rgba(150, 90, 70, 0.22);  /* Đỏ chì khô - guide nhẹ */

/* Vignette */
vignette: radial-gradient(ellipse at center, transparent 0%, rgba(28,26,23,0.04) 100%);

/* Noise pattern */
noisePattern: 
  radial-gradient(circle at 20% 30%, rgba(28,26,23,0.012) 0.3px, transparent 0.3px),
  radial-gradient(circle at 60% 70%, rgba(28,26,23,0.008) 0.3px, transparent 0.3px),
  radial-gradient(circle at 80% 40%, rgba(28,26,23,0.010) 0.3px, transparent 0.3px);

/* Control panel (giãn cách) */
controlBg: rgba(246, 241, 232, 0.92);
controlBorder: rgba(0,0,0,0.10);
controlText: rgba(28, 26, 23, 0.70);
inputBg: rgba(255,255,255,0.80);
inputBorder: rgba(0,0,0,0.15);
```

### Dark Mode
```css
/* Nền giấy */
paperBg: #181614;             /* Dark paper ấm, không phải nền đen UI */

/* Mực (chữ) */
ink: #E6DFD6;                  /* Ngà sáng, không phát sáng */

/* Dòng kẻ ngang */
gridColor: rgba(230, 223, 214, 0.045);

/* Đường lề trái */
marginLineColor: rgba(200, 140, 120, 0.16);  /* Đỏ chì cho dark mode */

/* Vignette */
vignette: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.05) 100%);

/* Noise pattern */
noisePattern:
  radial-gradient(circle at 20% 30%, rgba(230,223,214,0.015) 0.3px, transparent 0.3px),
  radial-gradient(circle at 60% 70%, rgba(230,223,214,0.010) 0.3px, transparent 0.3px),
  radial-gradient(circle at 80% 40%, rgba(230,223,214,0.012) 0.3px, transparent 0.3px);

/* Control panel (giãn cách) */
controlBg: rgba(24, 22, 20, 0.92);
controlBorder: rgba(255,255,255,0.10);
controlText: rgba(236, 230, 221, 0.80);
inputBg: rgba(10,10,10,0.80);
inputBorder: rgba(255,255,255,0.15);
```

---

## 5. ICON & BUTTON TÍNH NĂNG

### Clock (Đồng hồ)

#### Light Mode
```css
--clock-fg: #1c1a17;          /* Chữ giờ */
--clock-icon: #d4b77c;        /* Champagne gold */
--clock-border: rgba(212,183,124,0.45);
--clock-glass: rgba(212,183,124,0.18);
```

#### Dark Mode
```css
--clock-bg: #141210;          /* Đen ấm, cùng họ với panel/chat */
--clock-border: rgba(255,255,255,0.12);
--clock-fg: #ECE6DD;          /* Chữ giờ */
--clock-icon: rgba(236,230,221,0.75);  /* Icon/kim đồng hồ */
--clock-accent: #9FB7A6;       /* Accent rất nhẹ (nếu cần) */
```

---

### Model Selector (Dropdown chọn model)

#### Light Mode
```css
/* Nền */
--model-bg: #f0e6d6;           /* Nền giấy ấm */
--model-bg-hover: #e8dcc8;    /* Hover đậm hơn một chút */

/* Chữ */
--model-fg-main: #1C1A17;     /* Warm charcoal - đủ tương phản nhưng không đen gắt */
--model-fg-muted: rgba(28, 26, 23, 0.55);  /* Chữ phụ - nhẹ, không gây nhiễu */

/* Tick và gạch chân */
--model-tick: #B79F7A;        /* Champagne/beige-gold nhạt - ấm, sang, nổi vừa đủ */
--model-underline: rgba(183, 159, 122, 0.60);  /* Cùng hue với tick nhưng mờ hơn */

/* Viền */
--model-border-subtle: rgba(28, 26, 23, 0.10);  /* Viền nhẹ nếu cần */

/* Accent */
--model-accent: rgba(212,183,124,0.22);
--model-accent-border: rgba(212,183,124,0.35);
--model-accent-ring: rgba(212,183,124,0.20);
--model-accent-hover: rgba(212,183,124,0.12);
```

#### Dark Mode
```css
/* Nền */
--model-bg: #0a0a0a;          /* Đen sâu premium */
--model-bg-hover: #0d0d0d;    /* Hover sáng hơn một chút */

/* Chữ */
--model-fg-main: #ECE6DD;     /* Text chính: off-white ấm */
--model-fg-muted: rgba(236,230,221,0.65);  /* Text phụ */

/* Tick */
--model-tick: #ECE6DD;        /* Tick màu trắng ấm */

/* Viền & Hover */
--model-border-subtle: rgba(255,255,255,0.12);  /* Viền */
--model-hover: rgba(255,255,255,0.08);           /* Hover */
--model-active: rgba(255,255,255,0.12);          /* Active */

/* Accent */
--model-accent: #9FB7A6;      /* Accent: sage khói */
--model-accent-border: rgba(159,183,166,0.32);
--model-accent-ring: rgba(159,183,166,0.24);
--model-accent-hover: rgba(159,183,166,0.10);
```

---

### Send Button (Nút gửi)

#### Light Mode
```css
.chatSend {
  background: #1c1a17;         /* Charcoal ấm */
  color: var(--panel);         /* #fbf8f3 - chữ/icon sáng */
}

.chatSend:disabled {
  background: rgba(28,26,23,0.35);
  color: rgba(251,248,243,0.85);
}
```

#### Dark Mode
```css
.chatSend {
  background: #e6dccf;         /* Beige sáng */
  color: #141210;              /* Chữ/icon tối */
}

.chatSend:disabled {
  background: rgba(230,220,207,0.35);
  color: rgba(20,18,16,0.55);
}
```

---

### Chat Composer (Input box)

#### Light Mode
```css
.chatComposer {
  background: var(--panel);    /* #fbf8f3 */
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}

.chatComposer:focus-within {
  border-color: var(--border-soft);
  box-shadow:
    0 0 0 3px rgba(111,143,175,0.14),
    var(--shadow-soft);
}

.chatComposerInput {
  color: var(--text);          /* #1c1a17 */
  caret-color: rgba(28,26,23,0.65);
}

.chatComposerInput::placeholder {
  color: var(--placeholder, rgba(138,128,119,0.75));
}
```

#### Dark Mode
```css
.chatComposer {
  background: #181512;         /* Sáng hơn panel 1 chút */
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}

.chatComposer:focus-within {
  border-color: var(--border-soft);
  box-shadow:
    0 0 0 3px rgba(111,143,175,0.14),
    var(--shadow-soft);
}

.chatComposerInput {
  color: #f1ebe3;              /* Trắng ngà, KHÔNG trắng gắt */
  caret-color: #e6dccf;        /* Con trỏ rõ nhưng dịu */
}

.chatComposerInput::placeholder {
  color: rgba(241,235,227,0.45);
}
```

---

### Copy Button (Nút copy)

#### Light Mode
```css
.copyBtn {
  background: transparent;
  color: #333;
}

.copyBtn:hover {
  background: rgba(28,26,23,0.06);
}

/* Tooltip */
.copyBtn::after {
  background: var(--panel);
  border: 1px solid rgba(28,26,23,0.10);
  color: rgba(28,26,23,0.92);
  box-shadow: 0 6px 14px rgba(15,17,21,0.12);
}
```

#### Dark Mode
```css
.copyBtn {
  background: transparent;
  color: #cbd5e1;
}

.copyBtn:hover {
  background: rgba(226,232,240,0.08);
}

/* Tooltip */
.copyBtn::after {
  background: var(--panel);
  border: 1px solid rgba(28,26,23,0.10);
  color: rgba(28,26,23,0.92);
  box-shadow: 0 6px 14px rgba(15,17,21,0.12);
}
```

---

### Theme Toggle (Nút chuyển sáng/tối)

#### Light Mode
```css
/* Toggle container */
background: var(--topbar-glass);  /* rgba(255,255,255,0.65) */
border: 1px solid var(--topbar-border);
color: var(--topbar-fg);

/* Icon */
.themeIcon.sun { /* Active trong light mode */ }
.themeIcon.moon { /* Inactive trong light mode */ }
```

#### Dark Mode
```css
/* Toggle container */
background: var(--topbar-glass);  /* rgba(255,255,255,0.08) */
border: 1px solid var(--topbar-border);
color: var(--topbar-fg);

/* Icon */
.themeIcon.sun { /* Inactive trong dark mode */ }
.themeIcon.moon { /* Active trong dark mode */ }
```

---

### User Bubble (Bong bóng tin nhắn user)

#### Light Mode
```css
--userBubble: #efe1cf;        /* Warm latte (rõ hơn nền/panel) */
--userBubbleBorder: rgba(28,26,23,0.14);
--userText: #1c1a17;
```

#### Dark Mode
```css
--userBubble: #241f1a;        /* Warm cocoa (nổi trên panel tối) */
--userBubbleBorder: rgba(236,230,221,0.14);
--userText: #f1ebe3;
```

---

### AI Text (Văn bản AI)

#### Light Mode
```css
--aiText: rgba(28,26,23,0.92);  /* Document-like, không bubble */
```

#### Dark Mode
```css
--aiText: rgba(236,230,221,0.92);  /* Document-like, không bubble */
```

---

### Accent Color (Màu nhấn chung)

#### Light Mode
```css
--accent: #b79f7a;            /* Beige-gold nhẹ */
```

#### Dark Mode
```css
--accent: #c9b79c;            /* Beige-gold rất nhẹ */
```

---

### Scrollbar

#### Light Mode
```css
--sb-track: rgba(28,26,23,0.06);
--sb-thumb: rgba(28,26,23,0.22);
--sb-thumb-hover: rgba(28,26,23,0.32);
```

#### Dark Mode
```css
--sb-track: rgba(236,230,221,0.06);
--sb-thumb: rgba(236,230,221,0.22);
--sb-thumb-hover: rgba(236,230,221,0.32);
```

---

## Ghi chú

- Tất cả màu sắc đều dùng tông ấm (warm tones), không dùng màu xanh lạnh
- Không dùng opacity quá cao cho nền chính (tránh "UI-like" feel)
- Màu solid được ưu tiên hơn rgba với opacity cho text chính
- Shadow mềm, không nặng, tạo cảm giác tự nhiên
- Border rất nhẹ, chỉ để tách khối, không nổi bật
