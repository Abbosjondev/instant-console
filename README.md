# instant-console
=======
<div align="center">

<img src="https://glorious-scarlet-rze60rezmp.edgeone.app/Untitled%20design.png" alt="console.js banner" width="100%"/>

# 🖥️ instant-console

**A zero-dependency, drop-in in-page Developer Console that mimics Google Chrome DevTools.**

[![Version](https://img.shields.io/badge/version-v6.0-4d90fe?style=flat-square&logo=javascript)](https://github.com/Abbosjondev/instant-console/releases)
[![License](https://img.shields.io/badge/license-MIT-28c840?style=flat-square)](LICENSE)
[![Size](https://img.shields.io/badge/size-~18KB-febc2e?style=flat-square)](instant-console)
[![Zero Deps](https://img.shields.io/badge/dependencies-zero-f48771?style=flat-square)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-89dceb?style=flat-square)](CONTRIBUTING.md)

[**Live Demo**](https://Abbosjondev.github.io/instant-console/) · [**Report Bug**](https://github.com/Abbosjondev/instant-console/issues/new?template=bug_report.md) · [**Request Feature**](https://github.com/Abbosjondev/instant-console/issues/new?template=feature_request.md)

</div>

---

## 📖 What is instant-console?

`instant-console` injects a **fully-featured, interactive Developer Console** directly into any web page — no browser extensions, no build tools, no dependencies. Just drop in a single `<script>` tag.

It is designed to feel exactly like the **Chrome DevTools Console panel**: dark theme, collapsible object trees, syntax-highlighted REPL input, filter buttons, search, `console.table`, and much more.

**Perfect for:**
- 📱 Debugging on mobile browsers where DevTools aren't available
- 🔒 Debugging in locked-down environments (kiosks, WebViews, Electron)
- 🎓 Teaching JavaScript in the browser
- 🧪 Prototyping and live-coding demos
- 🐛 Client-side error reporting UI

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎨 **Chrome DevTools UI** | Dark theme, Mac-style window dots, blurred backdrop overlay |
| 🌳 **Infinite Deep Tree** | Expand objects/arrays/Maps/Sets/Prototypes indefinitely |
| 🔄 **Circular Ref Safe** | Detects `[Circular ↩]` at any depth — never freezes |
| ✏️ **Syntax-highlighted REPL** | Live highlight as you type (keywords, strings, numbers, comments) |
| 📜 **Multi-line Editor** | `Shift+Enter` for newlines, `Tab` for indentation |
| 🕘 **Command History** | `↑` / `↓` to cycle through previous commands (300 entries) |
| 🔎 **Filter & Search** | Filter by All / Errors / Warnings / Info + live text search |
| 🧹 **Smart Suppression** | Hides useless `← undefined` for `const`/`let`/`var`/`function` |
| 🛡️ **XSS Safe** | Strict HTML escaping — logging `<script>` never breaks the page |
| 📊 **console.table** | Renders arrays/objects as a beautiful sortable HTML table |
| 🎨 **%c Styling** | Full CSS styling support inside `console.log('%c...')` |
| ⌨️ **Keyboard Shortcuts** | `F12` toggle, `Ctrl+L` clear, `Esc` close |
| 🏷️ **FAB Badge** | Floating button shows unread message count when console is closed |
| 🌐 **Global Error Capture** | Catches `window.onerror` and `unhandledrejection` automatically |
| 📏 **Resizable & Draggable** | Drag the title bar to move; resize from the corner |

---

## 🚀 Quick Start

### CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/Abbosjondev/instant-console@v6/console.js"></script>
```

### Option 2 — Download

Download [`instant-console`](https://github.com/Abbosjondev/instant-console/releases/latest/download/instant-console) and place it alongside your HTML file.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `F12` | Toggle console open/close |
| `Esc` | Close console |
| `Enter` | Execute REPL input |
| `Shift + Enter` | Insert newline (multi-line) |
| `↑ / ↓` | Navigate command history |
| `Tab` | Insert 2-space indentation |
| `Ctrl + L` | Clear console output |

---

## Window Controls

| Control | Action |
|---|---|
| 🔴 Red dot | Close the console (FAB appears) |
| 🟡 Yellow dot | Minimize to title bar only |
| 🟢 Green dot | Toggle fullscreen / restore |
| Title bar drag | Move the window anywhere |
| Bottom-right corner | Resize the window |
| Click backdrop | Close the console |

---

## 📋 API Reference

All standard console methods are intercepted. The original methods continue to run in the background (output still appears in the browser's real DevTools).

### `console.log(...args)`
Logs values. Supports `%c` CSS styling.

```javascript
console.log("Hello, World!");
console.log({ user: "Alice", age: 30, scores: [98, 87, 100] });
console.log("%cStyled text!", "color: hotpink; font-size: 16px; font-weight: bold;");
console.log("Multiple", "values", 42, true, null, [1, 2, 3]);
```

### `console.warn(...args)`
Logs with yellow warning style and icon.

```javascript
console.warn("Deprecated API — use newMethod() instead");
```

### `console.error(...args)`
Logs with red error style and icon. Error objects show their `.toString()`.

```javascript
console.error("Something failed");
console.error(new Error("Stack trace here"));
```

### `console.info(...args)`
Logs with blue info icon.

```javascript
console.info("Build completed in 1.2s");
```

### `console.table(data)`
Renders arrays of objects or plain objects as an HTML table.

```javascript
console.table([
  { name: "Alice", score: 98, grade: "A+" },
  { name: "Bob",   score: 74, grade: "C"  },
]);

console.table({ a: 1, b: 2, c: 3 });
```

### `console.dir(obj)`
Renders the object as an expandable tree (same as `console.log` for objects).

```javascript
console.dir(document.body);
```

### `console.clear()`
Clears all log entries.

```javascript
console.clear();
```

---

## Interactive Tree View

Objects, Arrays, Maps, Sets, and Prototypes render as **clickable, collapsible trees** — just like native DevTools.

```javascript
// All of these render as expandable trees:
console.log({ deeply: { nested: { object: { value: 42 } } } });
console.log([1, [2, [3, [4, [5]]]]]);
console.log(new Map([["key", { complex: true }]]));
console.log(new Set([{ id: 1 }, { id: 2 }]));

// Circular references are handled safely:
const a = {};
a.self = a;
console.log(a); // Shows [Circular ↩] instead of crashing
```

**Clicking `▶`** expands any node. Clicking again collapses it.  
**`[[Prototype]]`** is always listed as the last child of any object, just like DevTools.

---

## ✏️ REPL (Interactive Code Execution)

The input bar at the bottom is a full mini code editor:

```javascript
// Single line — press Enter to run:
Math.random() * 100

// Multi-line — use Shift+Enter:
const fibonacci = n =>
  n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
fibonacci(10)

// Variable declarations suppress ← undefined:
const x = 42       // no output — clean
let name = "Alice"  // no output — clean
x + 10              // prints: ← 52
```

---

## 🔧 Browser Support

| Browser | Support |
|---|---|
| Chrome 80+ | ✅ Full |
| Firefox 75+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 80+ | ✅ Full |
| Opera 67+ | ✅ Full |
| iOS Safari 14+ | ✅ Full |
| Android Chrome | ✅ Full |
| IE 11 | ❌ Not supported |

> `backdrop-filter` (blur effect) degrades gracefully in browsers that don't support it — the console still works, just without the blur.


## 🏗️ Architecture

`instant-console` is a single IIFE (Immediately Invoked Function Expression) with **zero global scope pollution** (only sets `window.__dcV6` as a guard).

```
┌─────────────────────────────────────────────────┐
│                  instant-console                │
│                                                  │
│  ┌──────────────┐   ┌──────────────────────────┐ │
│  │  CSS Engine  │   │   Console Overrides       │ │
│  │  (injected   │   │   log / warn / error /    │ │
│  │   <style>)   │   │   info / table / clear    │ │
│  └──────────────┘   └──────────────────────────┘ │
│                                                  │
│  ┌──────────────┐   ┌──────────────────────────┐ │
│  │ Value        │   │  Tree Builder             │ │
│  │ Renderer     │   │  (lazy, circular-safe,    │ │
│  │ (type-aware, │   │   infinite depth)         │ │
│  │  HTML-safe)  │   │                           │ │
│  └──────────────┘   └──────────────────────────┘ │
│                                                  │
│  ┌──────────────┐   ┌──────────────────────────┐ │
│  │  REPL        │   │  Filter / Search          │ │
│  │  (highlight  │   │  (live, per-row)          │ │
│  │   + history) │   │                           │ │
│  └──────────────┘   └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
git clone https://github.com/Abbosjondev/instant-console.git
cd instant-console

open demo.html   # macOS
xdg-open demo.html  # Linux
start demo.html  # Windows
```

No build step required. Edit `instant-console` directly and refresh the demo.

---

## 📝 License

MIT © 2026 [Abbosjondev](https://github.com/Abbosjondev)

See [LICENSE](LICENSE) for full text.

---

## ⭐ Star History

If this project helped you, please consider starring it ⭐

---

<div align="center">
  Made with ❤️ — inspired by Chrome DevTools
</div>
>>>>>>> 68e4b88 (first commit)
