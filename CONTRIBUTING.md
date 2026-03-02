# Contributing to console.js

First off — thank you for taking the time to contribute! 🎉  
Every bug report, feature idea, and pull request makes this project better.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting a Pull Request](#submitting-a-pull-request)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Architecture Notes](#architecture-notes)
- [Commit Message Format](#commit-message-format)

---

## Code of Conduct

This project follows a simple rule: **be kind, be constructive**.  
Disrespectful or exclusionary behavior will not be tolerated.

---

## How Can I Contribute?

### Reporting Bugs

Before opening an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Test in the demo** (`demo.html`) to confirm the bug is in `console.js` and not your own code
3. **Use the bug report template** — it asks for the minimum info needed to reproduce

When reporting, include:
- Browser name + version
- OS name + version
- The exact JavaScript you ran in the REPL or via `console.log()`
- What you expected vs. what actually happened
- A screenshot if the bug is visual

### Suggesting Features

Open an issue using the **Feature Request** template.  
Explain:
- What problem the feature solves
- How it should behave (with examples)
- Whether you'd be willing to implement it yourself

### Submitting a Pull Request

1. **Fork** the repository and clone your fork locally
2. Create a new branch from `main`:
   ```bash
   git checkout -b fix/object-preview-overlap
   # or
   git checkout -b feat/copy-to-clipboard
   ```
3. Make your changes in `console.js` (and `demo.html` if adding a feature)
4. Test manually by opening `demo.html` in a browser — no build step needed
5. Run through the manual test checklist below
6. Commit using the [commit message format](#commit-message-format)
7. Push and open a PR against the `main` branch
8. Fill out the PR template completely

---

## Development Setup

No build tools required. The entire library is a single vanilla JS file.

```bash
# Clone your fork
git clone https://github.com/Abbosjondev/instant-console.git
cd instant-console

# Open the demo (no server needed)
open demo.html          # macOS
xdg-open demo.html      # Linux
start demo.html         # Windows

# Or serve locally if you prefer:
npx serve .             # requires Node.js
python3 -m http.server  # requires Python 3
```

---

## Manual Test Checklist

Before submitting a PR, verify all of these still work:

### UI / Layout
- [ ] Console opens centered on the page with backdrop blur
- [ ] Fade-in and fade-out animations play correctly
- [ ] Title bar drag moves the panel
- [ ] Bottom-right resize handle works
- [ ] 🔴 Red dot closes, FAB appears
- [ ] 🟡 Yellow dot minimizes to title bar only
- [ ] 🟢 Green dot goes fullscreen; click again to restore
- [ ] Clicking the backdrop closes the console
- [ ] `F12` toggles open/close
- [ ] `Esc` closes
- [ ] `Ctrl+L` clears log

### Console Methods
- [ ] `console.log("string")` — renders string in orange
- [ ] `console.log(42)` — renders number in green
- [ ] `console.log(true)` — renders in blue
- [ ] `console.log(null)` / `undefined` — renders dimmed italic
- [ ] `console.log({a:1, b:"two"})` — renders collapsed tree with clean preview
- [ ] `console.log([1,[2,[3]]])` — nested array tree
- [ ] `console.warn(...)` — yellow bar + icon
- [ ] `console.error(...)` — red bar + icon
- [ ] `console.info(...)` — blue icon
- [ ] `console.table([{a:1},{a:2}])` — renders HTML table
- [ ] `console.clear()` — removes all entries
- [ ] `console.log('%cStyled', 'color:red')` — applies CSS

### XSS Safety
- [ ] `console.log('<script>alert(1)</script>')` — displays as escaped text, no popup
- [ ] `console.log('<div style="color:red">inject</div>')` — no red text rendered

### Tree View
- [ ] Click `▶` expands object one level
- [ ] Click again collapses
- [ ] Expanding deep nested objects works indefinitely
- [ ] `[[Prototype]]` row appears at bottom of each expanded object
- [ ] Circular reference shows `[Circular ↩]` instead of freezing
- [ ] Scroll position does NOT jump when expanding a tree node

### REPL
- [ ] Typing highlights keywords, strings, numbers, comments live
- [ ] `Enter` executes code
- [ ] `Shift+Enter` adds newline (multi-line)
- [ ] `↑` / `↓` cycles history
- [ ] `Tab` inserts 2 spaces
- [ ] `const x = 1` — no `← undefined` output
- [ ] `let arr = []` — no `← undefined` output
- [ ] `function f(){}` — no `← undefined` output
- [ ] `1 + 2` — prints `← 3`
- [ ] `Math.random()` — prints `← 0.xxxxx`

### Filter & Search
- [ ] "Errors" filter hides log/warn/info rows
- [ ] "Warnings" filter shows only warn rows
- [ ] Search box filters rows in real time

---

## Code Style Guide

`console.js` is written in **ES5-compatible syntax** (no arrow functions, no `const`/`let` at the top level of the IIFE) so it runs in as many environments as possible. However, the codebase is clean and readable — not minified.

**Rules:**

1. **No external dependencies** — ever. Not even lodash.
2. **No ES6+ at the IIFE top level** — use `var`, `function`, classic `for` loops
3. **Escape all user strings** through `esc()` before any `innerHTML` assignment
4. **Never use `innerHTML +=`** on a container that holds event listeners
5. **All CSS lives inside the `CSS` string** — no external stylesheets
6. **All IDs are prefixed `__dc-`** to avoid conflicts with host page
7. **CSS class names use `dc-` prefix**
8. **Guard against double-injection** — check `window.__dcV6`
9. **Comments** — add a short comment for every logical section
10. **No minification in the source file** — minification is a build-step concern

---

## Architecture Notes

See the [Architecture section in README.md](README.md#-architecture) for the big picture.

**Key files and their roles:**

| Symbol | Purpose |
|---|---|
| `esc(s)` | HTML-escapes any user string — call this on EVERYTHING before `innerHTML` |
| `typeOf(v)` | Returns a precise type string (`'array'`, `'map'`, `'error_obj'`, etc.) |
| `textPreview(v)` | Generates a PLAIN-TEXT collapsed preview like `{a: 1, b: "hi", …}` |
| `renderVal(v, anc)` | Generates HTML for a value; calls `renderTree` for objects |
| `renderTree(obj, t, anc)` | Generates the collapsed `▶ Object {…}` toggle HTML; stores obj in `store` |
| `buildChildren(obj, anc)` | Called lazily on first expand; returns a `DocumentFragment` |
| `handleToggle(el)` | Saves scroll, toggles open/close, calls `buildChildren` if needed |
| `formatArgs(args)` | Processes `%c` formatting for `console.log` |
| `highlight(code)` | Tokenises REPL input and wraps tokens in `<span>` elements |
| `appendEntry(html, level, icon)` | Creates and appends a `.dc-row` to `#__dc-log` |
| `runCode(code)` | Evaluates code with `(0, eval)` (global scope), handles history + output |

---

## Commit Message Format

Use the **Conventional Commits** format:

```
type(scope): short description

[optional body]

[optional footer]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code change with no functional effect |
| `style` | CSS / visual-only changes |
| `docs` | Documentation only |
| `test` | Test additions |
| `chore` | Build, config, tooling |

**Examples:**

```
fix(preview): eliminate object text overlap using textPreview()
feat(repl): add Tab indentation support
perf(tree): switch from WeakSet to Array for ancestor tracking
docs(readme): add browser support table
style(ui): increase backdrop blur from 4px to 6px
```

---

## Questions?

Open a [Discussion](https://github.com/Abbosjondev/instant-console/discussions) — happy to help!