# UI Design System v2 - Neutral Ivory Book (Final Tokens)

## 🎨 Design Philosophy

**Neutral Ivory Book** - Premium writing experience với:
- Paper luôn nổi hơn panel: shadow paper > shadow panel
- Panel không bao giờ "sạch" hơn paper
- Grid không cạnh tranh text: opacity chỉ ~12–14%

---

# UI Design System - Tổng hợp toàn bộ giao diện

## 📐 Bố cục tổng thể (Layout)

### Cấu trúc 3 phần chính:

```
┌─────────────────────────────────────────┐
│           TOPBAR (28px)                 │
├──────┬──────────────────────┬───────────┤
│      │                      │           │
│ LEFT │     MIDDLE PANE      │   CHAT    │
│ PANE │   (WritingPane)     │   PANEL   │
│200px │   (flex: 1 1 auto)   │  (380px)  │
│      │                      │           │
└──────┴──────────────────────┴───────────┘
```

**1. Topbar** (`.topbar`)
- **Height**: `28px` (var `--topbar-h`)
- **Layout**: Grid 3 cột `1fr 0fr 1fr`
- **Background**: Gradient `linear-gradient(180deg, var(--topbar-a), var(--topbar-b))`
- **Border**: `1px solid var(--topbar-border)` (bottom)
- **Padding**: `0 10px` (var `--topbar-pad-x`)
- **Box shadow**: `0 1px 2px rgba(0,0,0,0.08)`

**2. Left Pane** (`.leftPane`)
- **Width**: `200px` (cố định)
- **Background**: `var(--bg-soft)`
- **Border**: `1px solid var(--border)` (right)
- **Content**: `<SidebarMenu />`

**3. Middle Pane** (`.middlePane`)
- **Flex**: `1 1 auto` (fill khoảng trống)
- **Background**: `var(--desk)` (Middle pane backdrop - desk)
- **Content**: `<WritingPane />` (giấy kẻ ngang)

**4. Chat Panel** (`.chat`)
- **Width**: `380px` (var `--chat-w`, min: 280px, max: 560px)
- **Background**: `var(--panel)`
- **Box shadow**: `var(--shadow-panel)` (Paper wins: shadow paper > shadow panel)
- **Resizable**: Có resizer bên trái

---

## 🎨 Màu sắc (Color System) - v2 Neutral Ivory Book

### Light Mode (Neutral Ivory)
```css
/* ===== Core Surfaces ===== */
--desk: #EEEAE2;                 /* Middle pane backdrop (desk) */
--desk-deep: #E4DED5;            /* vignette/edges */
--bg: var(--desk);               /* keep compatibility */
--bg-soft: #F1EDE6;              /* left pane base */
--panel: #F3EFE7;                /* chat panel base */
--panel-2: #EEE8DE;              /* inner surfaces */

/* ===== Paper (Hero Writing Surface) ===== */
--paper: #FFFCF6;                /* premium neutral ivory */
--paper-tint: #F7F2E9;           /* subtle wash */
--paper-edge: rgba(28,26,23,0.10);
--paper-inner: rgba(255,255,255,0.78);
--paper-text: rgba(27,25,22,0.92);

/* ===== Typography ===== */
--text: #1B1916;
--muted: rgba(27,25,22,0.58);
--muted-2: rgba(27,25,22,0.42);

/* ===== Borders / Dividers ===== */
--border: rgba(27,25,22,0.12);
--border-soft: rgba(27,25,22,0.08);
--divider: rgba(27,25,22,0.10);

/* ===== Accent ===== */
--accent: #B59A6A;               /* champagne */
--accent-2: #8EAA9A;             /* sage */
--accent-ring: rgba(181,154,106,0.26);

/* ===== Interactions ===== */
--hover: rgba(27,25,22,0.04);
--active: rgba(27,25,22,0.07);
--focus: rgba(181,154,106,0.22);

/* ===== WritingPane Lines ===== */
--grid: rgba(27,25,22,0.11);
--grid-strong: rgba(27,25,22,0.15);
--margin: rgba(120, 62, 58, 0.16);

/* ===== Shadows (Paper wins) ===== */
--shadow-paper: 0 16px 52px rgba(0,0,0,0.16), 0 5px 14px rgba(0,0,0,0.10);
--shadow-panel: -8px 0 18px rgba(0,0,0,0.10), -2px 0 6px rgba(0,0,0,0.06);
--shadow-soft: 0 8px 26px rgba(0,0,0,0.10);

/* Topbar */
--topbar-a: #f5f1ea
--topbar-b: #f9f7f3
--topbar-fg: #1c1a17
--topbar-border: rgba(28,26,23,0.10)
--topbar-glass: rgba(255,255,255,0.40)

/* Clock */
--clock-bg: #f5f1ea
--clock-border: rgba(28,26,23,0.12)
--clock-fg: #1c1a17
--clock-icon: rgba(28,26,23,0.75)

/* Model Selector */
--model-bg: #f5f1ea
--model-bg-hover: #f9f7f3
--model-fg-main: #1c1a17
--model-fg-muted: rgba(28,26,23,0.55)
--model-border-subtle: rgba(28,26,23,0.12)
--model-hover: rgba(255,255,255,0.08)
--model-active: rgba(255,255,255,0.12)
--model-tick: #B79F7A              /* Champagne/beige-gold */
--model-accent: #9FB7A6           /* Sage khói */

/* Code Block */
--code-bg: #ffffff
--code-border: #e5e5e5
--code-header-bg: #f6f6f6
--code-header-fg: #333
--code-text: #1e1e1e
--code-comment: #6a9955
--code-keyword: #0000ff
--code-string: #a31515
```

### Dark Mode (Breathable Dark Ivory)
```css
/* ===== Core Surfaces ===== */
--desk: #0B0A09;                 /* deep desk */
--desk-deep: #070605;
--bg: var(--desk);
--bg-soft: #0F0E0C;              /* left pane base */
--panel: #12110F;                /* chat panel base */
--panel-2: #151310;

/* ===== Paper (Hero Writing Surface) ===== */
--paper: #1E1B17;                /* breathable dark ivory */
--paper-tint: #221E1A;
--paper-edge: rgba(255,255,255,0.10);
--paper-inner: rgba(255,255,255,0.07);
--paper-text: rgba(236,230,221,0.90);

/* ===== Typography ===== */
--text: #ECE6DD;
--muted: rgba(236,230,221,0.68);
--muted-2: rgba(236,230,221,0.52);

/* ===== Borders / Dividers ===== */
--border: rgba(255,255,255,0.12);
--border-soft: rgba(255,255,255,0.08);
--divider: rgba(255,255,255,0.10);

/* ===== Accent ===== */
--accent: #9FB7A6;               /* sage */
--accent-2: #D6BE8A;             /* warm gold light */
--accent-ring: rgba(159,183,166,0.22);

/* ===== Interactions ===== */
--hover: rgba(255,255,255,0.06);
--active: rgba(255,255,255,0.10);
--focus: rgba(159,183,166,0.22);

/* ===== WritingPane Lines ===== */
--grid: rgba(236,230,221,0.14);
--grid-strong: rgba(236,230,221,0.18);
--margin: rgba(160, 88, 78, 0.22);

/* ===== Shadows (Paper wins) ===== */
--shadow-paper: 0 20px 64px rgba(0,0,0,0.62), 0 7px 18px rgba(0,0,0,0.38);
--shadow-panel: -10px 0 22px rgba(0,0,0,0.42), -2px 0 8px rgba(0,0,0,0.26);
--shadow-soft: 0 10px 30px rgba(0,0,0,0.46);

/* Topbar */
--topbar-a: #0e0d0c
--topbar-b: #161311
--topbar-fg: #ece6dd
--topbar-border: rgba(255,255,255,0.14)
--topbar-glass: rgba(255,255,255,0.08)

/* Clock */
--clock-bg: #141210                /* Đen ấm */
--clock-border: rgba(255,255,255,0.12)
--clock-fg: #ECE6DD
--clock-icon: rgba(236,230,221,0.75)

/* Model Selector */
--model-bg: #0a0a0a                /* Đen sâu */
--model-bg-hover: #0d0d0d
--model-fg-main: #ECE6DD
--model-fg-muted: rgba(236,230,221,0.65)
--model-border-subtle: rgba(255,255,255,0.12)
--model-hover: rgba(255,255,255,0.08)
--model-active: rgba(255,255,255,0.12)
--model-tick: #ECE6DD
--model-accent: #9FB7A6

/* Code Block */
--code-bg: #141210
--code-border: rgba(255,255,255,0.10)
--code-header-bg: #121110
--code-header-fg: #ECE6DD
--code-text: #ECE6DD
--code-comment: rgba(236,230,221,0.55)
--code-keyword: #9FB7A6
--code-string: #D4B77C
```

---

## 🎯 Interaction Accents (v2 Final)

### 1. Send Button (Primary Action)

**Triết lý**: Không dùng màu "accent chói". Send là hành động chính nhưng không được phá nhịp đọc. Hình khối rõ, màu ấm, tương phản vừa đủ.

**Light Mode**:
```css
--send-bg: #1B1916;                    /* warm charcoal */
--send-fg: #FFFCF6;                    /* paper white */
--send-border: rgba(0,0,0,0.18);
--send-hover-bg: #2A2723;              /* nhấc sáng nhẹ */
--send-active-bg: #141210;             /* nhấn xuống */
--send-disabled-bg: rgba(27,25,22,0.32);
--send-disabled-fg: rgba(255,252,246,0.55);
--send-shadow: 0 6px 16px rgba(0,0,0,0.28);
```

**Dark Mode**:
```css
--send-bg: #ECE6DD;                    /* off-white ấm */
--send-fg: #141210;                    /* ink tối */
--send-hover-bg: #F3EDE4;              /* sáng hơn chút */
--send-active-bg: #E0D8CB;
--send-disabled-bg: rgba(236,230,221,0.34);
--send-disabled-fg: rgba(20,18,16,0.55);
--send-shadow: 0 6px 18px rgba(0,0,0,0.58);
```

**Rule**: Send không glow, không gradient → giữ "editor seriousness".

### 2. Copy Button (Hover / Active / Copied)

**Triết lý**: Copy là phụ trợ → chỉ hiện khi cần. Feedback rõ nhưng không màu mè.

**Light Mode**:
```css
--copy-hover-bg: rgba(27,25,22,0.06);
--copy-active-bg: rgba(27,25,22,0.10);
--copy-fg: rgba(27,25,22,0.75);
--copy-fg-active: rgba(27,25,22,0.92);
--copy-success: #8EAA9A;               /* sage – calm success */
--copy-success-bg: rgba(142,170,154,0.18);
```

**Dark Mode**:
```css
--copy-hover-bg: rgba(255,255,255,0.08);
--copy-active-bg: rgba(255,255,255,0.12);
--copy-fg: rgba(236,230,221,0.75);
--copy-fg-active: rgba(236,230,221,0.92);
--copy-success: #9FB7A6;
--copy-success-bg: rgba(159,183,166,0.22);
```

**Rule**: Không dùng xanh lá tươi. "✓ copied" nên fade out, không bật sáng.

### 3. Dropdown Underline (Model Selector / Menu)

**Triết lý**: Không highlight nền item. Underline = trạng thái (art book / editorial style).

**Light Mode**:
```css
--dropdown-underline: rgba(181,154,106,0.55);   /* champagne */
--dropdown-underline-hover: rgba(181,154,106,0.78);
--dropdown-underline-active: #B59A6A;
--dropdown-item-fg: rgba(27,25,22,0.88);
--dropdown-item-muted: rgba(27,25,22,0.52);
```

**Dark Mode**:
```css
--dropdown-underline: rgba(214,190,138,0.55);   /* warm gold */
--dropdown-underline-hover: rgba(214,190,138,0.78);
--dropdown-underline-active: #D6BE8A;
--dropdown-item-fg: rgba(236,230,221,0.88);
--dropdown-item-muted: rgba(236,230,221,0.56);
```

**Rule**: Không background highlight item. Chỉ underline + đổi sắc chữ → rất "gallery".

### 4. Selection Highlight (Text Selection)

**Triết lý**: Tuyệt đối không xanh OS. Selection phải "ngấm vào giấy", không phủ màu neon.

**Writing Pane — Light Mode**:
```css
--selection-bg: rgba(181,154,106,0.28);   /* champagne wash */
--selection-fg: #1B1916;
```

**Writing Pane — Dark Mode**:
```css
--selection-bg: rgba(214,190,138,0.22);   /* gold wash */
--selection-fg: #ECE6DD;
```

**Chat / UI Selection** (nhẹ hơn paper):
```css
--selection-ui-bg-light: rgba(181,154,106,0.18);
--selection-ui-bg-dark: rgba(159,183,166,0.18);
```

**Rule**: Selection trong paper đậm hơn selection UI. Không border selection. Không glow.

### 5. Focus Ring (Keyboard / Accessibility)

**Light**:
```css
--focus-ring: 0 0 0 3px rgba(181,154,106,0.26);
```

**Dark**:
```css
--focus-ring: 0 0 0 3px rgba(159,183,166,0.26);
```

**Rule**: Focus ring chỉ xuất hiện khi `:focus-visible`. Không luôn hiện.

### 6. Hover Subtlety Scale

| Mức | Opacity |
|-----|---------|
| Very subtle | 0.04 |
| Subtle | 0.06 |
| Clear | 0.10 |
| Active | 0.12 |

→ Paper UI nên dùng Very subtle / Subtle.
→ Tool UI dùng Subtle / Clear.
→ Không dùng Active cho paper background.

---

## 🔘 Buttons & Interactive Elements

### 1. **Topbar Buttons**

#### **Clock Widget** (`.clockWidget`)
- **Shape**: Pill (border-radius: 999px)
- **Height**: `20px` (var `--topbar-pill-h`)
- **Padding**: `0 10px`
- **Border**: `1px solid var(--clock-border)`
- **Background**: `var(--clock-bg)`
- **Icon**: SVG clock (14x14px)
  - Circle: `r="8.5"`, `strokeWidth="1.8"`
  - Hour hand: `M12 12 L12 6.2`
  - Minute hand: `M12 12 L16.2 12` (opacity: 0.65)
  - Animation: `clockSpin` 6s linear infinite
- **Text**: `12px`, `font-weight: 800`, `tabular-nums`

#### **Theme Toggle** (`.themeToggle`)
- **Shape**: Pill (border-radius: 999px)
- **Size**: `width: clamp(64px, 20px * 3.0, 84px)`, `height: 20px`
- **Layout**: Grid 2 cột (sun | moon)
- **Border**: `1px solid var(--topbar-border)`
- **Background**: `var(--topbar-glass)`
- **Thumb**: 
  - Size: `12px` (20px - 8px)
  - Position: Trượt giữa 2 nửa
  - Light: `rgba(255,255,255,0.65)`
  - Dark: `rgba(236,230,221,0.22)`
- **Icons**: 
  - Sun: `16x16px`, Lucide-style
  - Moon: `16x16px`, Lucide-style
  - Opacity: Active = 0.95, Inactive = 0.50
- **Hover**: `background: rgba(255,255,255,0.16)`

### 2. **Chat Panel Buttons**

#### **Model Selector** (`.modelSelector`)
- **Shape**: Pill bo tròn nhẹ (border-radius: 8px)
- **Height**: `20px`
- **Padding**: `0 28px 0 12px` (chừa chỗ cho caret)
- **Border**: `1px solid var(--model-border-subtle)`
- **Background**: `var(--model-bg)`
- **Color**: `var(--model-fg-main)`
- **Font**: `12px`, `font-weight: 700`, `letter-spacing: 0.01em`
- **Box shadow**: `0 3px 12px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.20)`
- **Hover**: 
  - Background: `var(--model-hover)`
  - Shadow: `0 4px 16px rgba(0,0,0,0.40), 0 3px 8px rgba(0,0,0,0.25)`
- **Active**: Background: `var(--model-active)`
- **Focus**: `box-shadow: 0 0 0 3px var(--model-accent-ring)`
- **Caret**: `▾` (11px, opacity: 0.75, right: 10px)

#### **Model Dropdown List** (`.modelDropdownList`)
- **Shape**: Bo tròn (border-radius: 8px)
- **Position**: Mở lên trên (bottom: 100%)
- **Background**: `var(--model-bg)`
- **Border**: `1px solid var(--model-border-subtle)`
- **Box shadow**: `0 -4px 16px rgba(0,0,0,0.30), 0 -2px 8px rgba(0,0,0,0.20)`
- **Padding**: `4px 0`
- **Max height**: `200px`, `overflow-y: auto`
- **Items**:
  - Padding: `6px 12px`
  - Selected: Tick `✓` màu `var(--model-tick)`, gạch chân `rgba(212, 183, 124, 0.55)`
  - Hover: Chuyển màu chữ + gạch chân (không highlight)

#### **Send Button** (`.chatSend`)
- **Shape**: Circle (border-radius: 50%)
- **Size**: `30px` (var `--send-size`)
- **Background**: 
  - Light: `#1c1a17` (charcoal ấm)
  - Dark: `#e6dccf` (beige sáng)
- **Icon**: SVG arrow (20x20px)
  - Path: `M4 12L20 4L13 20L11 13L4 12Z`
  - `strokeWidth="2"`, `strokeLinejoin="round"`
- **Disabled**: 
  - Light: `rgba(28,26,23,0.35)`
  - Dark: `rgba(230,220,207,0.35)`

#### **Copy Button** (`.copyBtn`)
- **Shape**: Square bo tròn (border-radius: 6px)
- **Size**: `22x22px`
- **Background**: Transparent
- **Icon**: 
  - Default: `⧉` (copy icon)
  - Copied: `✓` (checkmark)
- **Visibility**: `opacity: 0` → `opacity: 1` on hover
- **Hover**: 
  - Light: `rgba(28,26,23,0.06)`
  - Dark: `rgba(226,232,240,0.08)`
- **Tooltip**: `::after` pseudo-element, hiện khi hover

#### **Code Copy Button** (`.codeCopyBtn`)
- **Shape**: Bo tròn nhẹ (border-radius: 8px)
- **Size**: `min-width: 60px`, `height: 28px` (cố định)
- **Padding**: `6px 10px`
- **Background**: `var(--code-copy-bg)` (transparent)
- **Color**: `var(--code-copy-fg)`
- **Font**: `12px`, `font-weight: 700`
- **Hover**: `rgba(127,127,127,0.12)`
- **Active**: `transform: scale(0.98)`

### 3. **Sidebar Buttons**

#### **Sign Out Button** (`.sidebarSignOutBtn`)
- **Shape**: Bo tròn nhẹ (border-radius: 6px)
- **Width**: `100%`
- **Padding**: `8px 12px`
- **Background**: Transparent
- **Border**: `1px solid var(--border)`
- **Color**: `var(--text)`
- **Font**: `12px`, `font-weight: 500`
- **Hover**: 
  - Background: `var(--hover)`
  - Border: `var(--border-soft)`

### 4. **Writing Pane**

#### **Writing Pane Container**
- **Background**: 
  - Light: `#F6F1E8` (warm paper)
  - Dark: `#181614` (dark paper)
- **Grid Lines**: 
  - Light: `rgba(28,26,23,0.16)`
  - Dark: `rgba(230,223,214,0.18)`
- **Margin Line**: 
  - Light: `rgba(180, 70, 70, 0.18)`
  - Dark: `rgba(180, 70, 70, 0.18)`
- **Text Color**:
  - Light: `rgba(20,18,16,0.92)`
  - Dark: `rgba(236,230,222,0.92)`

---

## 📐 Icons & Shapes

### Icon Styles

#### **Lucide-style Icons**
- **Size**: `16x16px` (standard), `14x14px` (small), `20x20px` (large)
- **Stroke**: `1.8px` (standard), `2px` (bold)
- **Style**: 
  - `stroke="currentColor"`
  - `fill="none"`
  - `strokeLinecap="round"`
  - `strokeLinejoin="round"`

#### **Icon List**

1. **Clock Icon** (`.clockSvg`)
   - ViewBox: `0 0 24 24`
   - Circle: `r="8.5"`, `strokeWidth="1.8"`
   - Hour hand: `M12 12 L12 6.2`
   - Minute hand: `M12 12 L16.2 12` (opacity: 0.65)
   - Animation: `clockSpin` 6s linear infinite

2. **Sun Icon** (`.themeIcon.sun`)
   - ViewBox: `0 0 24 24`
   - Circle: `cx="12" cy="12" r="4.2"`
   - Rays: 8 rays (top, right, bottom, left, 4 diagonal)

3. **Moon Icon** (`.themeIcon.moon`)
   - ViewBox: `0 0 24 24`
   - Path: `M21 13.1A7.6 7.6 0 0 1 10.9 3.0 a7.2 7.2 0 1 0 10.1 10.1Z`

4. **Send Icon** (`.sendIcon`)
   - ViewBox: `0 0 24 24`
   - Path: `M4 12L20 4L13 20L11 13L4 12Z`
   - Size: `20x20px`

5. **Copy Icon**
   - Text: `⧉` (Unicode)
   - Size: Inherit font size

6. **Checkmark Icon**
   - Text: `✓` (Unicode)
   - Size: Inherit font size

7. **Caret/Dropdown Arrow**
   - Text: `▾` (down), `▴` (up)
   - Size: `11px`
   - Opacity: `0.75`

---

## 🎯 Typography

### Font Families

**System UI** (default):
```css
font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
```

**Serif** (Writing Pane):
```css
font-family: 'ui-serif, Georgia, "Times New Roman", Times, serif';
```

**Monospace** (Code):
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", "Inter", "Roboto", system-ui, sans-serif;
```

### Font Sizes

- **Topbar**: `12px` (clock, theme toggle)
- **Chat Input**: `16px`
- **Chat Messages**: `15px`
- **Code Block**: `12px` (header), `14px` (code)
- **Sidebar**: `14px` (name), `12px` (sub-info, button)
- **Writing Pane**: `16px` (font-size), `24px` (line-height)

### Font Weights

- **Bold**: `700` (model selector, code header, clock)
- **Semi-bold**: `600` (sidebar name)
- **Medium**: `500` (buttons, links)
- **Regular**: `400` (default)

---

## 📏 Spacing & Sizing

### Padding

- **Topbar**: `0 10px`
- **Sidebar**: `16px`
- **Chat Panel**: `18px` (scroll area), `14px` (bar)
- **Code Block**: `12px 14px` (code), `10px 12px` (header)
- **Writing Pane**: `24px` (PAD_X_PX), `8%` (LEFT_GUTTER_PCT)

### Border Radius

- **Pill**: `999px` (clock, theme toggle)
- **Rounded**: `8px` (model selector, code block, dropdown)
- **Slight**: `6px` (copy button, sign out button)
- **Circle**: `50%` (send button, avatar)

### Heights

- **Topbar**: `28px`
- **Topbar Pills**: `20px`
- **Chat Send**: `30px`
- **Copy Button**: `22px`
- **Code Copy**: `28px`
- **Sidebar Avatar**: `40px`
- **Line Height**: `24px` (Writing Pane)

---

## 🎨 Visual Effects

### Box Shadows

**Soft Shadow** (Light):
```css
box-shadow: 0 1px 2px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.45);
```

**Soft Shadow** (Dark):
```css
box-shadow: 0 1px 2px rgba(0,0,0,0.50), 0 10px 28px rgba(0,0,0,0.60);
```

**Model Selector**:
```css
box-shadow: 0 3px 12px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.20);
```

**Hover**:
```css
box-shadow: 0 4px 16px rgba(0,0,0,0.40), 0 3px 8px rgba(0,0,0,0.25);
```

**Theme Toggle Thumb**:
- Light: `0 6px 16px rgba(0,0,0,0.16)`
- Dark: `0 10px 22px rgba(0,0,0,0.42)`

### Transitions

- **Standard**: `0.2s ease` (background, border, color)
- **Theme Toggle**: `180ms ease` (thumb, icon opacity)
- **Hover**: `0.15s ease` (tooltip, opacity)

### Backdrop Filter

- **Modal Overlay**: `blur(4px)`

---

## 🔧 Resizers

### Topbar Resizer (`.topbarResizer`)
- **Position**: Absolute, bottom: -3px
- **Size**: `height: 6px`, full width
- **Cursor**: `ns-resize`
- **Visual**: 1px line (opacity: 0 → 0.9 on hover, 1.0 when resizing)

### Chat Resizer (`.chatResizer`)
- **Position**: Absolute, left: -8px
- **Size**: `width: 16px`, full height
- **Cursor**: `ew-resize`
- **Visual**: 1px line at left: 7px (opacity: 0 → 0.9 on hover, 1.0 when resizing)

---

## 📱 Responsive & Layout

### Flexbox Layout

**App Container** (`.app`):
```css
display: flex;
gap: 0;
height: calc(100vh - 28px);
```

**Topbar** (`.topbar`):
```css
display: grid;
grid-template-columns: 1fr 0fr 1fr;
align-items: center;
```

**Chat Composer** (`.chatComposer`):
```css
display: grid;
grid-template-columns: 1fr 30px;
gap: 12px;
```

### Containment

- **Topbar**: `contain: layout style`
- **App**: `contain: layout`
- **Chat**: `contain: layout style`
- **Chat Composer**: `contain: layout style`

---

## 🎭 Component-Specific Styles

### Writing Pane

**Constants**:
- `LINE_HEIGHT_PX = 24`
- `TOP_OFFSET_PX = 24`
- `PAD_X_PX = 24`
- `LEFT_GUTTER_PCT = 0.08` (8%)
- `FONT_SIZE_PX = 16`
- `FONT_FAMILY = 'ui-serif, Georgia, "Times New Roman", Times, serif'`

**Colors (v2)**:
- **Background**: `var(--paper)` (Premium neutral ivory / breathable dark ivory)
- **Text**: `var(--paper-text)` (rgba(27,25,22,0.92) light / rgba(236,230,221,0.90) dark)
- **Grid Lines**: `var(--grid)` (rgba(27,25,22,0.11) light / rgba(236,230,221,0.14) dark)
- **Margin Line**: `var(--margin)` (rgba(120, 62, 58, 0.16) light / rgba(160, 88, 78, 0.22) dark)

**Baseline Alignment**:
- Dynamic baseline offset via `useBaselineOffset` hook
- Lines drawn at: `topOffsetPx + i * lineHeightPx + baselineFromTopPx`
- Text starts at: `paddingTop: TOP_OFFSET_PX`

**Design Rules**:
- Paper luôn nổi hơn panel: shadow paper > shadow panel
- Grid không cạnh tranh text: opacity chỉ ~12–14%

### Chat Panel

**Message Bubbles**:
- User: `border-radius: 18px`, `padding: 10px 14px`
- AI: Transparent background, `font-size: 15px`, `line-height: 1.65`

**Scroll Area**:
- Padding: `calc(var(--msg-top-inset) + env(safe-area-inset-top)) 18px 18px 18px`
- Scrollbar: Thin, custom styled

### Code Blocks

**Wrapper**:
- Border-radius: `8px`
- Border: `1px solid var(--code-border)`
- Background: `var(--code-bg)`

**Header**:
- Border-radius: `8px 8px 0 0`
- Min-height: `48px`
- Padding: `10px 12px`

**Code**:
- Border-radius: `0 0 8px 8px`
- Padding: `12px 14px`
- No scroll (overflow: visible)

---

## 🎨 Design Principles

### 1. **Premium Dark Theme**
- Đen sâu, không xám: `#141210`, `#0a0a0a`
- Off-white ấm: `#ECE6DD`
- Sage khói accent: `#9FB7A6`

### 2. **Warm Light Theme**
- Warm paper: `#F6F1E8`, `#f5f1ea`
- Warm charcoal: `#1c1a17`
- Beige-gold accent: `#B79F7A`, `#c9b79c`

### 3. **Consistent Pill Shape**
- Topbar elements: `border-radius: 999px` (pill)
- Buttons: `border-radius: 8px` (rounded)
- Small buttons: `border-radius: 6px` (slight)

### 4. **Subtle Borders**
- Light: `rgba(28,26,23,0.12)`
- Dark: `rgba(255,255,255,0.12)`

### 5. **Soft Shadows**
- Nổi trên nền, không gắt
- Multiple layers: `0 3px 12px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.20)`

### 6. **Smooth Transitions**
- Standard: `0.2s ease`
- Fast: `180ms ease`
- Hover states: Opacity, background, transform

---

## 📋 Component Checklist

### ✅ Topbar
- [x] Clock widget (pill, SVG icon, time text)
- [x] Theme toggle (pill, sun/moon icons, sliding thumb)
- [x] Resizer (bottom, ns-resize)

### ✅ Left Pane (Sidebar)
- [x] User profile (avatar, name, sub-info)
- [x] Sign out button
- [x] Separator line
- [x] List section (future: recent chats)

### ✅ Middle Pane
- [x] Writing Pane (ruled paper, grid lines, margin line)
- [x] Lexical editor (contentEditable)
- [x] Scroll support
- [x] Baseline alignment

### ✅ Chat Panel
- [x] Model selector (pill, dropdown)
- [x] Chat composer (rounded, textarea + send button)
- [x] Send button (circle, arrow icon)
- [x] Copy button (square, hover tooltip)
- [x] Code block (header + code, copy button)
- [x] Message bubbles (user: rounded, AI: transparent)
- [x] Resizer (left, ew-resize)
- [x] Scroll area (custom scrollbar)

### ✅ Modals
- [x] Pending Approval (overlay, card, dismiss button)
- [x] Auth Modal (overlay, card)

---

## 🔍 Quick Reference

### Button Sizes
- **Pill (Topbar)**: `20px` height
- **Send**: `30px` circle
- **Copy**: `22x22px` square
- **Code Copy**: `28px` height, `60px` min-width
- **Sign Out**: `100%` width, `8px 12px` padding

### Icon Sizes
- **Standard**: `16x16px`
- **Small**: `14x14px` (clock)
- **Large**: `20x20px` (send)

### Border Radius
- **Pill**: `999px`
- **Rounded**: `8px`
- **Slight**: `6px`
- **Circle**: `50%`

### Z-Index Layers
- **Modal Overlay**: `10000`
- **Modal Content**: `10001`
- **Dropdown**: `1000`
- **Code Header**: `10-11`
- **Resizers**: `5`

---

*Tài liệu này tổng hợp toàn bộ UI design system của ứng dụng, bao gồm bố cục, màu sắc, buttons, icons, và các component chính.*
