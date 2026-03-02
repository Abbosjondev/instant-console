(function () {
    'use strict';

    /* ──────────────────────────────────────────────────────────────────────
     * GUARD
     * ───────────────────────────────────────────────────────────────────── */
    if (window.__dcV6) return;
    window.__dcV6 = true;

    /* ──────────────────────────────────────────────────────────────────────
     * PRESERVE ORIGINALS
     * ───────────────────────────────────────────────────────────────────── */
    var _o = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console),
        clear: console.clear.bind(console),
        table: console.table.bind(console),
        dir: (console.dir || console.log).bind(console),
        group: console.group.bind(console),
        groupEnd: console.groupEnd.bind(console),
    };

    /* ──────────────────────────────────────────────────────────────────────
     * STATE
     * ───────────────────────────────────────────────────────────────────── */
    var uid = 0;
    var cmdHist = [];
    var histIdx = -1;
    var filter = 'all';
    var search = '';
    var badge = 0;
    var minimized = false;

    // uid string → { obj, ancestors[] }  for lazy tree child building
    var store = {};

    /* ──────────────────────────────────────────────────────────────────────
     * CSS
     * ───────────────────────────────────────────────────────────────────── */
    var CSS = [
        /* ── tokens ── */
        ':root{',
        '  --bg:#1e1e1e;--bg2:#252526;--bg3:#2d2d30;--bg4:#1a1a1b;',
        '  --bd:#3c3c3c;--bd2:#505050;',
        '  --tx:#cdd6f4;--tx2:#9da5b4;--dim:#636d83;',
        '  --ac:#4d90fe;--ac2:#3a7bd5;',
        '  --str:#ce9178;--num:#b5cea8;--bool:#569cd6;',
        '  --null:#569cd6;--key:#9cdcfe;--kw:#c586c0;',
        '  --fn:#dcdcaa;--rx:#d16969;--cmt:#6a9955;',
        '  --wrn-bg:rgba(255,188,64,.06);--wrn-bd:#ffb900;--wrn-tx:#ffb900;',
        '  --err-bg:rgba(232,17,35,.07);--err-bd:#e81123;--err-tx:#f48771;',
        '  --inf-tx:#89dceb;',
        '  --sb:#3a3a3a;--sb2:#606060;',
        '  --r:12px;--r2:8px;',
        '  --shadow:0 32px 96px rgba(0,0,0,.9),0 8px 32px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06);',
        '  --font:"Menlo","Monaco","Cascadia Code","Consolas",monospace;',
        '  --ui:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        '}',

        /* ── backdrop overlay ── */
        '#__dc-backdrop{',
        '  position:fixed;inset:0;',
        '  background:rgba(0,0,0,.55);',
        '  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);',
        '  z-index:2147483640;',
        '  display:flex;align-items:center;justify-content:center;',
        '  transition:opacity .25s ease;',
        '  opacity:0;pointer-events:none;',
        '}',
        '#__dc-backdrop.dc-open{opacity:1;pointer-events:auto;}',

        /* ── root panel (child of backdrop) ── */
        '#__dc-root{',
        '  width:min(960px,calc(100vw - 48px));',
        '  height:min(580px,calc(100vh - 80px));',
        '  background:var(--bg);',
        '  border:1px solid rgba(255,255,255,.08);',
        '  border-radius:var(--r);',
        '  box-shadow:var(--shadow);',
        '  display:flex;flex-direction:column;',
        '  overflow:hidden;',
        '  font-family:var(--font);font-size:13px;color:var(--tx);',
        '  user-select:none;',
        '  resize:both;min-width:480px;min-height:280px;',
        '  transform:scale(.96) translateY(12px);',
        '  transition:transform .25s cubic-bezier(.2,.8,.32,1),opacity .25s ease;',
        '  opacity:0;',
        '}',
        '#__dc-backdrop.dc-open #__dc-root{transform:scale(1) translateY(0);opacity:1;}',

        /* ── title bar ── */
        '#__dc-tb{',
        '  display:flex;align-items:center;gap:8px;',
        '  padding:0 16px;height:40px;',
        '  background:var(--bg2);',
        '  border-bottom:1px solid var(--bd);',
        '  cursor:move;flex-shrink:0;',
        '  border-radius:var(--r) var(--r) 0 0;',
        '}',
        '.dc-dot{',
        '  width:12px;height:12px;border-radius:50%;',
        '  cursor:pointer;flex-shrink:0;',
        '  transition:filter .15s,transform .1s;',
        '  position:relative;',
        '}',
        '.dc-dot:hover{filter:brightness(1.25);transform:scale(1.1);}',
        '.dc-dot.r{background:#ff5f57;box-shadow:0 0 0 .5px rgba(0,0,0,.25);}',
        '.dc-dot.y{background:#febc2e;box-shadow:0 0 0 .5px rgba(0,0,0,.25);}',
        '.dc-dot.g{background:#28c840;box-shadow:0 0 0 .5px rgba(0,0,0,.25);}',
        '#__dc-title{',
        '  flex:1;text-align:center;',
        '  font-family:var(--ui);font-size:12px;',
        '  color:var(--dim);letter-spacing:.2px;',
        '  pointer-events:none;',
        '}',
        '#__dc-title b{color:var(--tx);font-weight:600;}',

        /* ── toolbar ── */
        '#__dc-bar{',
        '  display:flex;align-items:center;gap:6px;',
        '  padding:6px 12px;',
        '  background:var(--bg2);',
        '  border-bottom:1px solid var(--bd);',
        '  flex-shrink:0;',
        '}',
        '.dc-tbtn{',
        '  display:flex;align-items:center;justify-content:center;',
        '  width:28px;height:28px;border-radius:6px;',
        '  border:none;background:transparent;color:var(--dim);',
        '  cursor:pointer;transition:background .15s,color .15s;outline:none;',
        '}',
        '.dc-tbtn:hover{background:var(--bg3);color:var(--tx);}',
        '.dc-sep{width:1px;height:18px;background:var(--bd);margin:0 3px;flex-shrink:0;}',
        '.dc-sw{position:relative;flex:1;display:flex;align-items:center;min-width:0;}',
        '.dc-sw svg{position:absolute;left:9px;color:var(--dim);pointer-events:none;}',
        '#__dc-search{',
        '  flex:1;background:var(--bg3);',
        '  border:1px solid var(--bd);border-radius:6px;',
        '  color:var(--tx);padding:5px 10px 5px 32px;',
        '  font-family:var(--font);font-size:12px;',
        '  outline:none;transition:border-color .15s;width:100%;box-sizing:border-box;',
        '}',
        '#__dc-search:focus{border-color:var(--ac);}',
        '.dc-fbtn{',
        '  padding:4px 10px;border-radius:5px;',
        '  border:1px solid transparent;background:transparent;',
        '  font-family:var(--ui);font-size:11px;font-weight:500;',
        '  cursor:pointer;transition:all .15s;outline:none;white-space:nowrap;',
        '}',
        '.dc-fall{color:var(--tx);}',
        '.dc-ferr{color:var(--err-tx);}',
        '.dc-fwrn{color:var(--wrn-tx);}',
        '.dc-finf{color:var(--inf-tx);}',
        '.dc-fon{border-color:currentColor;background:rgba(255,255,255,.06);}',

        /* ── log area ── */
        '#__dc-log{flex:1;overflow-y:auto;overflow-x:hidden;padding:2px 0;}',
        '#__dc-log::-webkit-scrollbar{width:6px;}',
        '#__dc-log::-webkit-scrollbar-track{background:transparent;}',
        '#__dc-log::-webkit-scrollbar-thumb{background:var(--sb);border-radius:3px;}',
        '#__dc-log::-webkit-scrollbar-thumb:hover{background:var(--sb2);}',

        /* ── log row ── */
        '.dc-row{',
        '  display:flex;align-items:flex-start;',
        '  padding:3px 12px 3px 10px;',
        '  min-height:24px;',
        '  border-left:2px solid transparent;',
        '  border-bottom:1px solid transparent;',
        '  transition:background .08s;',
        '  box-sizing:border-box;',
        '  line-height:1.6;',
        '  gap:6px;',        /* ← gap between icon and body, no overlap */
        '}',
        '.dc-row:hover{background:rgba(255,255,255,.025);}',
        '.dc-row.dc-warn{background:var(--wrn-bg);border-left-color:var(--wrn-bd);}',
        '.dc-row.dc-error{background:var(--err-bg);border-left-color:var(--err-bd);}',
        '.dc-row.dc-hide{display:none!important;}',

        /* ── icon cell (fixed width, never shrinks) ── */
        '.dc-ico{',
        '  width:16px;flex-shrink:0;',
        '  display:flex;align-items:center;justify-content:center;',
        '  padding-top:3px;',
        '}',

        /* ── body cell (takes remaining space, clips properly) ── */
        '.dc-body{',
        '  flex:1;',
        '  min-width:0;',               /* CRITICAL — allows flex child to shrink below content size */
        '  overflow:hidden;',
        '  word-break:break-word;',
        '  overflow-wrap:break-word;',
        '}',
        '.dc-body *{user-select:text;}',

        /* ── value tokens ── */
        '.v-str{color:var(--str);}',
        '.v-num{color:var(--num);}',
        '.v-bool{color:var(--bool);}',
        '.v-null{color:var(--null);font-style:italic;}',
        '.v-udef{color:var(--dim);font-style:italic;}',
        '.v-fn{color:var(--fn);font-style:italic;}',
        '.v-sym{color:var(--rx);}',
        '.v-key{color:var(--key);}',
        '.v-dim{color:var(--dim);}',
        '.v-err{color:var(--err-tx);}',
        '.v-circ{color:var(--rx);font-style:italic;}',
        '.v-pun{color:var(--dim);}',
        '.v-wrntx{color:var(--wrn-tx);}',
        '.v-errtx{color:var(--err-tx);}',
        '.v-inf{color:var(--inf-tx);}',

        /* ── tree ── */
        '.dc-tree{display:block;line-height:1.6;}',  /* block so it doesn't cause inline overflow */

        /* The clickable toggle header line */
        '.dc-toggle{',
        '  display:inline-flex;',       /* inline-flex — items in a single line */
        '  align-items:baseline;',
        '  gap:0;',
        '  cursor:pointer;user-select:none;',
        '  border-radius:4px;',
        '  padding:0 3px;margin:0 -3px;',
        '  transition:background .1s;',
        '  max-width:100%;',
        '  overflow:hidden;',
        '}',
        '.dc-toggle:hover{background:rgba(255,255,255,.07);}',

        /* arrow */
        '.dc-arr{',
        '  display:inline-block;',
        '  font-size:10px;color:var(--dim);',
        '  transition:transform .13s;',
        '  width:12px;text-align:center;flex-shrink:0;',
        '  line-height:1.6;margin-right:2px;',
        '}',
        '.dc-arr.open{transform:rotate(90deg);}',

        /* preview text — constrained, never overflows */
        '.dc-prev{',
        '  display:inline;',
        '  white-space:nowrap;',
        '  overflow:hidden;',
        '  text-overflow:ellipsis;',
        '  vertical-align:baseline;',
        '  max-width:calc(100% - 20px);',  /* leave room for arrow */
        '}',

        /* children container */
        '.dc-kids{',
        '  display:none;',
        '  padding-left:16px;',
        '  border-left:1px solid var(--bd2);',
        '  margin-left:6px;',
        '  margin-top:1px;margin-bottom:2px;',
        '}',
        '.dc-kids.open{display:block;}',

        /* a single property row inside children */
        '.dc-krow{',
        '  display:flex;',
        '  align-items:baseline;',
        '  gap:0;',
        '  padding:1px 0;',
        '  line-height:1.55;',
        '  min-width:0;',
        '}',
        '.dc-krow .dc-kname{',
        '  flex-shrink:0;',
        '  color:var(--key);',
        '  white-space:nowrap;',
        '  margin-right:4px;',
        '}',
        '.dc-krow .dc-kname.dc-proto{color:var(--dim);}',
        '.dc-krow .dc-kval{',
        '  flex:1;min-width:0;',
        '  overflow:hidden;',
        '  word-break:break-word;',
        '  overflow-wrap:break-word;',
        '}',
        '.dc-more{color:var(--dim);font-size:11px;font-style:italic;display:block;padding:2px 0;}',

        /* ── table ── */
        '.dc-tw{overflow-x:auto;margin:4px 0;max-width:100%;}',
        '.dc-tbl{border-collapse:collapse;font-size:12px;width:max-content;}',
        '.dc-tbl th{',
        '  background:var(--bg3);color:var(--dim);',
        '  padding:4px 14px;text-align:left;',
        '  border:1px solid var(--bd);font-weight:500;',
        '  position:sticky;top:0;white-space:nowrap;',
        '  font-family:var(--ui);',
        '}',
        '.dc-tbl td{',
        '  padding:3px 14px;border:1px solid var(--bd);',
        '  color:var(--tx);font-family:var(--font);font-size:12px;',
        '  white-space:nowrap;',
        '}',
        '.dc-tbl tr:hover td{background:rgba(255,255,255,.03);}',

        /* ── REPL ── */
        '#__dc-repl{',
        '  border-top:1px solid var(--bd);',
        '  background:var(--bg2);flex-shrink:0;',
        '}',
        '#__dc-repl-in{',
        '  display:flex;align-items:flex-start;',
        '  padding:8px 12px;gap:8px;',
        '}',
        '#__dc-prompt{',
        '  color:var(--ac);font-size:15px;',
        '  line-height:1.55;flex-shrink:0;',
        '  user-select:none;padding-top:1px;',
        '}',
        '#__dc-editor{',
        '  position:relative;flex:1;',
        '  min-height:22px;max-height:220px;',
        '  min-width:0;',
        '}',
        '#__dc-hl,#__dc-ta{',
        '  font-family:var(--font);font-size:13px;line-height:1.6;',
        '  padding:0;margin:0;border:none;outline:none;',
        '  white-space:pre-wrap;word-break:break-word;tab-size:2;',
        '  box-sizing:border-box;width:100%;',
        '}',
        '#__dc-hl{',
        '  position:absolute;top:0;left:0;right:0;',
        '  pointer-events:none;color:var(--tx);',
        '  overflow:hidden;min-height:22px;',
        '}',
        '#__dc-ta{',
        '  position:relative;background:transparent;',
        '  color:transparent;caret-color:var(--tx);',
        '  resize:none;overflow:hidden;z-index:1;',
        '  min-height:22px;',
        '}',
        '#__dc-ta::selection{background:rgba(77,144,254,.28);}',
        '#__dc-ta::-webkit-scrollbar{width:4px;}',
        '#__dc-ta::-webkit-scrollbar-thumb{background:var(--sb);border-radius:2px;}',

        /* ── syntax tokens (REPL) ── */
        '.hl-kw{color:var(--kw);}',
        '.hl-str{color:var(--str);}',
        '.hl-num{color:var(--num);}',
        '.hl-cmt{color:var(--cmt);font-style:italic;}',

        /* ── REPL indicators ── */
        '.dc-inm{color:var(--ac);margin-right:4px;flex-shrink:0;}',
        '.dc-outm{color:var(--dim);margin-right:4px;flex-shrink:0;}',

        /* ── empty state ── */
        '#__dc-empty{',
        '  display:flex;flex-direction:column;align-items:center;justify-content:center;',
        '  height:100%;color:var(--dim);gap:12px;',
        '  pointer-events:none;user-select:none;',
        '}',
        '#__dc-empty p{font-family:var(--ui);font-size:13px;margin:0;}',
        '#__dc-empty svg{opacity:.25;}',

        /* ── FAB ── */
        '#__dc-fab{',
        '  position:fixed;bottom:28px;right:28px;width:52px;height:52px;',
        '  border-radius:50%;',
        '  background:linear-gradient(135deg,var(--ac),var(--ac2));',
        '  border:none;cursor:pointer;',
        '  display:flex;align-items:center;justify-content:center;',
        '  box-shadow:0 4px 20px rgba(77,144,254,.5),0 2px 8px rgba(0,0,0,.4);',
        '  z-index:2147483641;outline:none;',
        '  transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s,opacity .2s;',
        '  opacity:0;pointer-events:none;',
        '}',
        '#__dc-fab.dc-vis{opacity:1;pointer-events:auto;}',
        '#__dc-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(77,144,254,.65);}',
        '#__dc-fab:active{transform:scale(.94);}',
        '#__dc-fab svg{pointer-events:none;}',
        '#__dc-fab-badge{',
        '  position:absolute;top:-4px;right:-4px;',
        '  min-width:18px;height:18px;border-radius:9px;',
        '  background:#e81123;color:#fff;',
        '  font:bold 10px/18px var(--ui);text-align:center;padding:0 4px;',
        '  display:none;',
        '}',
        '#__dc-fab-badge.on{display:block;}',

        /* ── minimize state ── */
        '#__dc-root.dc-min #__dc-bar,',
        '#__dc-root.dc-min #__dc-log,',
        '#__dc-root.dc-min #__dc-repl{display:none;}',
        '#__dc-root.dc-min{height:auto!important;min-height:0!important;resize:none;}',
    ].join('\n');

    /* ──────────────────────────────────────────────────────────────────────
     * HTML ESCAPE — applied to ALL user strings
     * ───────────────────────────────────────────────────────────────────── */
    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ──────────────────────────────────────────────────────────────────────
     * TYPE DETECTION
     * ───────────────────────────────────────────────────────────────────── */
    function typeOf(v) {
        if (v === null) return 'null';
        if (v === undefined) return 'undefined';
        if (Array.isArray(v)) return 'array';
        if (v instanceof RegExp) return 'regexp';
        if (v instanceof Error) return 'error_obj';
        if (v instanceof Date) return 'date';
        if (v instanceof Map) return 'map';
        if (v instanceof Set) return 'set';
        if (v instanceof Promise) return 'promise';
        return typeof v;
    }

    /* ──────────────────────────────────────────────────────────────────────
     * PLAIN-TEXT PREVIEW (no HTML, safe to put inside any span)
     *
     * Returns a SHORT plain string like  { a: 1, b: "hi", … }
     * Used for the collapsed tree header. NO nested HTML — avoids overlap.
     * ───────────────────────────────────────────────────────────────────── */
    var PREV_STR_MAX = 18;   // max chars per string value in preview
    var PREV_KEY_MAX = 5;    // max keys shown

    function textPreview(v, depth) {
        depth = depth || 0;
        var t = typeOf(v);
        if (t === 'string') return '"' + (v.length > PREV_STR_MAX ? v.slice(0, PREV_STR_MAX) + '…' : v) + '"';
        if (t === 'number' || t === 'bigint') return String(v);
        if (t === 'boolean') return String(v);
        if (t === 'null') return 'null';
        if (t === 'undefined') return 'undefined';
        if (t === 'symbol') return v.toString();
        if (t === 'regexp') return String(v);
        if (t === 'date') return v.toISOString();
        if (t === 'function') return 'ƒ ' + (v.name || '()');
        if (t === 'promise') return 'Promise';
        if (t === 'error_obj') return v.toString();
        if (depth > 0) return t === 'array' ? '[…]' : '{…}';

        // Only expand one level in preview
        if (t === 'array') {
            if (!v.length) return '[]';
            var items = [];
            for (var i = 0; i < Math.min(v.length, 4); i++) {
                items.push(textPreview(v[i], 1));
            }
            if (v.length > 4) items.push('…');
            return '[' + items.join(', ') + ']';
        }
        if (t === 'map') return 'Map(' + v.size + ')';
        if (t === 'set') return 'Set(' + v.size + ')';

        // Plain object
        var keys = Object.keys(v);
        if (!keys.length) return '{}';
        var parts = [];
        for (var k = 0; k < Math.min(keys.length, PREV_KEY_MAX); k++) {
            var key = keys[k];
            var val;
            try { val = v[key]; } catch (_) { val = undefined; }
            parts.push(key + ': ' + textPreview(val, 1));
        }
        if (keys.length > PREV_KEY_MAX) parts.push('…');
        return '{' + parts.join(', ') + '}';
    }

    /* ──────────────────────────────────────────────────────────────────────
     * FULL HTML VALUE RENDERER
     * `anc` = ancestors array (plain Array, not WeakSet, so children can inherit)
     * ───────────────────────────────────────────────────────────────────── */
    function renderVal(v, anc) {
        if (!anc) anc = [];
        var t = typeOf(v);

        switch (t) {
            case 'string': return '<span class="v-str">"' + esc(v) + '"</span>';
            case 'number': return '<span class="v-num">' + esc(String(v)) + '</span>';
            case 'bigint': return '<span class="v-num">' + esc(String(v)) + 'n</span>';
            case 'boolean': return '<span class="v-bool">' + v + '</span>';
            case 'undefined': return '<span class="v-udef">undefined</span>';
            case 'null': return '<span class="v-null">null</span>';
            case 'symbol': return '<span class="v-sym">' + esc(v.toString()) + '</span>';
            case 'regexp': return '<span class="v-sym">' + esc(String(v)) + '</span>';
            case 'date': return '<span class="v-str">' + esc(v.toISOString()) + '</span>';
            case 'promise': return '<span class="v-fn">Promise {&lt;pending&gt;}</span>';
            case 'error_obj': return '<span class="v-err">' + esc(v.toString()) + '</span>';
            case 'function': {
                var nm = v.name ? esc(v.name) : '(anonymous)';
                return '<span class="v-fn">ƒ ' + nm + '()</span>';
            }
            case 'array':
            case 'map':
            case 'set':
            case 'object':
                if (anc.indexOf(v) !== -1) {
                    return '<span class="v-circ">[Circular ↩]</span>';
                }
                return renderTree(v, t, anc);
            default:
                return '<span>' + esc(String(v)) + '</span>';
        }
    }

    /* ──────────────────────────────────────────────────────────────────────
     * TREE — collapsed header (lazy children built on first expand)
     *
     * KEY DESIGN: the preview is PLAIN TEXT wrapped in a single <span class="dc-prev">
     * This completely eliminates the overlap bug because there's no nested HTML
     * causing unpredictable inline rendering.
     * ───────────────────────────────────────────────────────────────────── */
    function renderTree(obj, t, anc) {
        var id = 'dc' + (++uid);

        /* — label — */
        var labelCls, labelTxt;
        if (t === 'array') {
            labelCls = 'v-bool'; labelTxt = 'Array(' + obj.length + ')';
        } else if (t === 'map') {
            labelCls = 'v-bool'; labelTxt = 'Map(' + obj.size + ')';
        } else if (t === 'set') {
            labelCls = 'v-bool'; labelTxt = 'Set(' + obj.size + ')';
        } else {
            labelCls = 'v-bool'; labelTxt = 'Object';
        }

        /* — plain-text preview (the fix for the overlap bug) — */
        var prevText = '';
        try {
            prevText = textPreview(obj, 0);
        } catch (_) { }

        /* — store for lazy build — */
        store[id] = { obj: obj, anc: anc.slice() };

        return (
            '<span class="dc-tree">' +
            '<span class="dc-toggle" data-uid="' + id + '">' +
            '<span class="dc-arr" id="' + id + '-a">&#9654;</span>' +
            '<span class="' + labelCls + '">' + esc(labelTxt) + '</span>' +
            ' <span class="dc-prev v-dim">' + esc(prevText) + '</span>' +
            '</span>' +
            '<span class="dc-kids" id="' + id + '-k"></span>' +
            '</span>'
        );
    }

    /* ──────────────────────────────────────────────────────────────────────
     * BUILD CHILD ROWS (called once on first expand)
     * ───────────────────────────────────────────────────────────────────── */
    var MAX_PROPS = 120;

    function buildChildren(obj, anc) {
        var t = typeOf(obj);
        var isArr = t === 'array';
        var isMap = t === 'map';
        var isSet = t === 'set';
        var frag = document.createDocumentFragment();
        var childAnc = anc.concat([obj]);

        function krow(keyHtml, keyIsProt, val) {
            var row = document.createElement('span');
            row.className = 'dc-krow';

            var kspan = document.createElement('span');
            kspan.className = 'dc-kname' + (keyIsProt ? ' dc-proto' : '');
            kspan.innerHTML = keyHtml;

            var vspan = document.createElement('span');
            vspan.className = 'dc-kval';

            var vt = typeOf(val);
            var isComplex = (vt === 'object' || vt === 'array' || vt === 'map' || vt === 'set') && val !== null;
            if (isComplex && childAnc.indexOf(val) !== -1) {
                vspan.innerHTML = '<span class="v-circ">[Circular ↩]</span>';
            } else {
                vspan.innerHTML = renderVal(val, childAnc);
            }

            row.appendChild(kspan);
            row.appendChild(vspan);
            return row;
        }

        if (isArr) {
            var aLen = obj.length;
            for (var i = 0; i < aLen && i < MAX_PROPS; i++) {
                var av; try { av = obj[i]; } catch (e) { av = e; }
                frag.appendChild(krow('<span class="v-num">' + i + '</span><span class="v-pun">:&nbsp;</span>', false, av));
            }
            if (aLen > MAX_PROPS) {
                var m = document.createElement('span');
                m.className = 'dc-more';
                m.textContent = '… ' + (aLen - MAX_PROPS) + ' more items';
                frag.appendChild(m);
            }
        } else if (isSet) {
            var setA = Array.from(obj);
            for (var si = 0; si < setA.length && si < MAX_PROPS; si++) {
                frag.appendChild(krow('<span class="v-num">' + si + '</span><span class="v-pun">:&nbsp;</span>', false, setA[si]));
            }
            if (setA.length > MAX_PROPS) {
                var ms = document.createElement('span');
                ms.className = 'dc-more';
                ms.textContent = '… ' + (setA.length - MAX_PROPS) + ' more';
                frag.appendChild(ms);
            }
        } else if (isMap) {
            var mapE = Array.from(obj.entries());
            for (var mi = 0; mi < mapE.length && mi < MAX_PROPS; mi++) {
                var mk = mapE[mi][0], mv = mapE[mi][1];
                var row = document.createElement('span');
                row.className = 'dc-krow';
                var ksp = document.createElement('span');
                ksp.className = 'dc-kname';
                ksp.innerHTML = renderVal(mk, childAnc) + '<span class="v-pun">&nbsp;=&gt;&nbsp;</span>';
                var vsp = document.createElement('span');
                vsp.className = 'dc-kval';
                vsp.innerHTML = renderVal(mv, childAnc);
                row.appendChild(ksp);
                row.appendChild(vsp);
                frag.appendChild(row);
            }
            if (mapE.length > MAX_PROPS) {
                var mm = document.createElement('span');
                mm.className = 'dc-more';
                mm.textContent = '… ' + (mapE.length - MAX_PROPS) + ' more';
                frag.appendChild(mm);
            }
        } else {
            /* plain object */
            var keys = Object.getOwnPropertyNames(obj);
            var shown = 0;
            for (var ki = 0; ki < keys.length; ki++) {
                if (shown >= MAX_PROPS) break;
                var k = keys[ki];
                var kval; try { kval = obj[k]; } catch (e) { kval = e; }
                var kHtml = '<span class="v-key">' + esc(k) + '</span><span class="v-pun">:&nbsp;</span>';
                frag.appendChild(krow(kHtml, false, kval));
                shown++;
            }
            if (keys.length > MAX_PROPS) {
                var mo = document.createElement('span');
                mo.className = 'dc-more';
                mo.textContent = '… ' + (keys.length - MAX_PROPS) + ' more properties';
                frag.appendChild(mo);
            }
            /* [[Prototype]] */
            var proto; try { proto = Object.getPrototypeOf(obj); } catch (_) { proto = null; }
            if (proto !== null) {
                var pRow = document.createElement('span');
                pRow.className = 'dc-krow';
                var pksp = document.createElement('span');
                pksp.className = 'dc-kname dc-proto';
                pksp.innerHTML = '[[Prototype]]<span class="v-pun">:&nbsp;</span>';
                var pvsp = document.createElement('span');
                pvsp.className = 'dc-kval';
                if (childAnc.indexOf(proto) !== -1) {
                    pvsp.innerHTML = '<span class="v-circ">[Circular ↩]</span>';
                } else {
                    var pt = typeOf(proto);
                    pvsp.innerHTML = renderVal(proto, childAnc);
                }
                pRow.appendChild(pksp);
                pRow.appendChild(pvsp);
                frag.appendChild(pRow);
            }
        }

        return frag;
    }

    /* ──────────────────────────────────────────────────────────────────────
     * TREE TOGGLE  (called via event delegation)
     * ───────────────────────────────────────────────────────────────────── */
    function handleToggle(toggle) {
        var id = toggle.dataset.uid;
        var arrEl = document.getElementById(id + '-a');
        var kids = document.getElementById(id + '-k');
        if (!arrEl || !kids) return;

        /* save scroll BEFORE any DOM change */
        var scrollTop = logEl.scrollTop;

        var isOpen = kids.classList.contains('open');

        if (!isOpen && !kids.dataset.built) {
            var entry = store[id];
            if (entry) kids.appendChild(buildChildren(entry.obj, entry.anc));
            kids.dataset.built = '1';
        }

        kids.classList.toggle('open', !isOpen);
        arrEl.classList.toggle('open', !isOpen);

        /* restore scroll after layout paint */
        requestAnimationFrame(function () { logEl.scrollTop = scrollTop; });
    }

    /* ──────────────────────────────────────────────────────────────────────
     * %c FORMAT SUPPORT
     * ───────────────────────────────────────────────────────────────────── */
    function formatArgs(args) {
        if (args.length === 1 && typeof args[0] !== 'string') return renderVal(args[0]);
        var first = args[0];
        if (typeof first !== 'string' || first.indexOf('%c') === -1) {
            return args.map(function (a) { return renderVal(a); }).join('<span class="v-dim"> </span>');
        }
        var parts = first.split('%c');
        var si = 1, html = '', open = false;
        for (var i = 0; i < parts.length; i++) {
            if (i > 0) {
                if (open) html += '</span>';
                var css = typeof args[si] === 'string' ? args[si++] : '';
                if (css) { html += '<span style="' + esc(css) + '">'; open = true; }
                else open = false;
            }
            html += esc(parts[i]);
        }
        if (open) html += '</span>';
        for (var j = si; j < args.length; j++) html += ' ' + renderVal(args[j]);
        return html;
    }

    /* ──────────────────────────────────────────────────────────────────────
     * TABLE RENDERER
     * ───────────────────────────────────────────────────────────────────── */
    function renderTable(data) {
        if (!data || typeof data !== 'object') return renderVal(data);
        var isArr = Array.isArray(data);
        var entries = isArr
            ? data.map(function (v, i) { return [i, v]; })
            : Object.keys(data).map(function (k) { return [k, data[k]]; });
        if (!entries.length) return '<em class="v-dim">Empty</em>';

        var colSet = Object.create(null);
        entries.forEach(function (pair) {
            var v = pair[1];
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                Object.keys(v).forEach(function (k) { colSet[k] = true; });
            } else {
                colSet.Value = true;
            }
        });
        var cols = ['(index)'].concat(Object.keys(colSet));

        var h = '<div class="dc-tw"><table class="dc-tbl"><thead><tr>';
        cols.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
        h += '</tr></thead><tbody>';
        entries.forEach(function (pair) {
            var idx = pair[0], row = pair[1];
            h += '<tr>';
            cols.forEach(function (c) {
                if (c === '(index)') { h += '<td class="v-num">' + esc(String(idx)) + '</td>'; return; }
                var cell;
                if (row && typeof row === 'object' && !Array.isArray(row) && Object.prototype.hasOwnProperty.call(row, c)) {
                    cell = textPreview(row[c], 0);
                } else if (c === 'Value') {
                    cell = textPreview(row, 0);
                } else {
                    cell = '';
                }
                h += '<td>' + esc(cell) + '</td>';
            });
            h += '</tr>';
        });
        h += '</tbody></table></div>';
        return h;
    }

    /* ──────────────────────────────────────────────────────────────────────
     * SYNTAX HIGHLIGHTER (REPL input only)
     * ───────────────────────────────────────────────────────────────────── */
    var KW_RE = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|class|extends|super|this|import|export|default|from|async|await|try|catch|finally|throw|yield|void|static|get|set|null|undefined|true|false|NaN|Infinity)\b/g;

    function highlight(code) {
        var toks = [];
        function protect(s, cls) { toks.push({ c: cls, v: s }); return '\x00' + (toks.length - 1) + '\x00'; }

        var w = code
            .replace(/\/\*[\s\S]*?\*\//g, function (m) { return protect(m, 'cmt'); })
            .replace(/\/\/[^\n]*/g, function (m) { return protect(m, 'cmt'); })
            .replace(/`(?:[^`\\]|\\.)*`/g, function (m) { return protect(m, 'str'); })
            .replace(/"(?:[^"\\]|\\.)*"/g, function (m) { return protect(m, 'str'); })
            .replace(/'(?:[^'\\]|\\.)*'/g, function (m) { return protect(m, 'str'); });

        var h = esc(w)
            .replace(/\b\d+\.?\d*(?:e[+-]?\d+)?n?\b/gi, function (m) { return '<span class="hl-num">' + m + '</span>'; })
            .replace(KW_RE, function (m) { return '<span class="hl-kw">' + m + '</span>'; });

        return h.replace(/\x00(\d+)\x00/g, function (_, i) {
            var tok = toks[+i];
            return '<span class="hl-' + tok.c + '">' + esc(tok.v) + '</span>';
        });
    }

    /* ──────────────────────────────────────────────────────────────────────
     * ICONS
     * ───────────────────────────────────────────────────────────────────── */
    var ICO = {
        fab: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
        warn: '<svg width="13" height="13" viewBox="0 0 24 24"><path fill="#ffb900" d="M12 2L1 21h22L12 2zm1 13h-2v-4h2v4zm0 4h-2v-2h2v2z"/></svg>',
        error: '<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f48771"/><path d="M8 8l8 8M16 8l-8 8" stroke="#1e1e1e" stroke-width="2" stroke-linecap="round"/></svg>',
        info: '<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#89dceb"/><path d="M12 7v1M12 11v6" stroke="#1e1e1e" stroke-width="2.2" stroke-linecap="round"/></svg>',
        clear: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
        srch: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        empty: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    };

    /* ──────────────────────────────────────────────────────────────────────
     * BUILD DOM
     * ───────────────────────────────────────────────────────────────────── */
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    /* backdrop (overlay) */
    var backdrop = document.createElement('div');
    backdrop.id = '__dc-backdrop';

    /* root panel */
    var root = document.createElement('div');
    root.id = '__dc-root';
    root.innerHTML = [
        /* title bar */
        '<div id="__dc-tb">',
        '<span class="dc-dot r" data-dot="close"    title="Close"></span>',
        '<span class="dc-dot y" data-dot="min"      title="Minimize"></span>',
        '<span class="dc-dot g" data-dot="snap"     title="Fullscreen"></span>',
        '<span id="__dc-title">Dev&nbsp;<b>Console</b>&nbsp;<span style="font-size:10px;color:var(--dim)">V6</span></span>',
        '</div>',
        /* toolbar */
        '<div id="__dc-bar">',
        '<button class="dc-tbtn" id="__dc-btn-clear" title="Clear  Ctrl+L">' + ICO.clear + '</button>',
        '<div class="dc-sep"></div>',
        '<div class="dc-sw">' + ICO.srch + '<input id="__dc-search" placeholder="Filter output\u2026" autocomplete="off" spellcheck="false"/></div>',
        '<div class="dc-sep"></div>',
        '<button class="dc-fbtn dc-fall dc-fon" data-filter="all">All</button>',
        '<button class="dc-fbtn dc-ferr"        data-filter="error">Errors</button>',
        '<button class="dc-fbtn dc-fwrn"        data-filter="warn">Warnings</button>',
        '<button class="dc-fbtn dc-finf"        data-filter="info">Info</button>',
        '</div>',
        /* log */
        '<div id="__dc-log">',
        '<div id="__dc-empty">' + ICO.empty + '<p>Console ready — type below</p></div>',
        '</div>',
        /* REPL */
        '<div id="__dc-repl">',
        '<div id="__dc-repl-in">',
        '<span id="__dc-prompt">&#8250;</span>',
        '<div id="__dc-editor">',
        '<pre  id="__dc-hl"  aria-hidden="true"></pre>',
        '<textarea id="__dc-ta" rows="1" spellcheck="false"',
        ' autocomplete="off" autocorrect="off" autocapitalize="off"',
        ' placeholder="Enter JavaScript\u2026"></textarea>',
        '</div>',
        '</div>',
        '</div>',
    ].join('');

    backdrop.appendChild(root);
    document.body.appendChild(backdrop);

    /* FAB */
    var fab = document.createElement('button');
    fab.id = '__dc-fab';
    fab.title = 'Open Console (F12)';
    fab.innerHTML = ICO.fab + '<span id="__dc-fab-badge"></span>';
    document.body.appendChild(fab);

    /* element refs */
    var logEl = root.querySelector('#__dc-log');
    var emptyEl = root.querySelector('#__dc-empty');
    var ta = root.querySelector('#__dc-ta');
    var hlEl = root.querySelector('#__dc-hl');
    var searchEl = root.querySelector('#__dc-search');
    var fabBadge = document.getElementById('__dc-fab-badge');

    /* ──────────────────────────────────────────────────────────────────────
     * CONSOLE OPEN / CLOSE  (animated)
     * ───────────────────────────────────────────────────────────────────── */
    function openConsole() {
        backdrop.classList.add('dc-open');
        fab.classList.remove('dc-vis');
        badge = 0;
        fabBadge.textContent = '';
        fabBadge.classList.remove('on');
        setTimeout(function () { ta.focus(); }, 260);
    }

    function closeConsole() {
        backdrop.classList.remove('dc-open');
        fab.classList.add('dc-vis');
    }

    fab.addEventListener('click', openConsole);

    /* start open */
    openConsole();

    /* ──────────────────────────────────────────────────────────────────────
     * APPEND ENTRY
     * ───────────────────────────────────────────────────────────────────── */
    function appendEntry(htmlContent, level, iconHtml) {
        emptyEl.style.display = 'none';

        var row = document.createElement('div');
        row.className = 'dc-row dc-' + level;
        row.dataset.level = level;

        var ico = document.createElement('span');
        ico.className = 'dc-ico';
        ico.innerHTML = iconHtml || '';

        var body = document.createElement('span');
        body.className = 'dc-body';
        body.innerHTML = htmlContent;   // must be pre-escaped

        row.appendChild(ico);
        row.appendChild(body);

        applyRowFilter(row);

        var atBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 10;
        logEl.appendChild(row);
        if (atBottom) logEl.scrollTop = logEl.scrollHeight;

        /* badge when backdrop is hidden */
        if (!backdrop.classList.contains('dc-open')) {
            badge++;
            fabBadge.textContent = badge > 99 ? '99+' : badge;
            fabBadge.classList.add('on');
        }
    }

    /* ──────────────────────────────────────────────────────────────────────
     * CONSOLE OVERRIDES
     * ───────────────────────────────────────────────────────────────────── */
    console.log = function () {
        _o.log.apply(console, arguments);
        appendEntry(formatArgs(Array.prototype.slice.call(arguments)), 'log', '');
    };
    console.info = function () {
        _o.info.apply(console, arguments);
        var html = Array.prototype.slice.call(arguments).map(function (a) { return renderVal(a); }).join(' ');
        appendEntry(html, 'info', ICO.info);
    };
    console.warn = function () {
        _o.warn.apply(console, arguments);
        var html = Array.prototype.slice.call(arguments).map(function (a) {
            return '<span class="v-wrntx">' + (typeof a === 'string' ? esc(a) : renderVal(a)) + '</span>';
        }).join(' ');
        appendEntry(html, 'warn', ICO.warn);
    };
    console.error = function () {
        _o.error.apply(console, arguments);
        var html = Array.prototype.slice.call(arguments).map(function (a) {
            return '<span class="v-errtx">' + (typeof a === 'string' ? esc(a) : renderVal(a)) + '</span>';
        }).join(' ');
        appendEntry(html, 'error', ICO.error);
    };
    console.clear = function () {
        _o.clear();
        var kids = Array.prototype.slice.call(logEl.children);
        kids.forEach(function (c) { if (c !== emptyEl) c.parentNode.removeChild(c); });
        emptyEl.style.display = '';
    };
    console.table = function (data) {
        _o.table(data);
        appendEntry(renderTable(data), 'log', '');
    };
    console.dir = function (obj) {
        _o.dir(obj);
        appendEntry(renderVal(obj), 'log', '');
    };
    console.group = function () { _o.group.apply(console, arguments); };
    console.groupEnd = function () { _o.groupEnd(); };

    /* ──────────────────────────────────────────────────────────────────────
     * REPL
     * ───────────────────────────────────────────────────────────────────── */

    /* Detect void statements (suppress ← undefined) */
    var VOID_RE = /^\s*(?:(?:const|let|var)\s|(?:function|class)\s+\w|(?:import|export)\s|(?:for|while|do|if|switch)\s*[\s(]|(?:try|finally)\s*\{|\{)/;

    function isVoid(code) { return VOID_RE.test(code); }

    function syncHL() {
        hlEl.innerHTML = highlight(ta.value) + '\u00a0';
    }

    function syncSize() {
        ta.style.height = '0';
        ta.style.height = ta.scrollHeight + 'px';
        hlEl.style.minHeight = ta.scrollHeight + 'px';
    }

    ta.addEventListener('input', function () { syncHL(); syncSize(); });

    ta.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            var s = this.selectionStart, en = this.selectionEnd;
            this.value = this.value.slice(0, s) + '  ' + this.value.slice(en);
            this.selectionStart = this.selectionEnd = s + 2;
            syncHL(); return;
        }
        if (e.key === 'Enter' && e.shiftKey) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            var code = this.value.trim();
            if (!code) return;
            runCode(code);
            this.value = ''; syncHL(); syncSize();
            histIdx = -1; return;
        }
        if (e.key === 'ArrowUp') {
            if (!cmdHist.length) return;
            e.preventDefault();
            if (histIdx < cmdHist.length - 1) histIdx++;
            this.value = cmdHist[histIdx] || '';
            syncHL(); syncSize();
            var l = this.value.length; this.setSelectionRange(l, l); return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx > 0) histIdx--;
            else { histIdx = -1; this.value = ''; syncHL(); syncSize(); return; }
            this.value = cmdHist[histIdx] || '';
            syncHL(); syncSize();
            var l2 = this.value.length; this.setSelectionRange(l2, l2); return;
        }
    });

    function runCode(code) {
        if (cmdHist[0] !== code) cmdHist.unshift(code);
        if (cmdHist.length > 300) cmdHist.length = 300;

        /* echo input */
        appendEntry(
            '<span class="dc-inm">&#8250;</span>' + highlight(code),
            'log', ''
        );

        var result, threw = false;
        try {
            result = (0, eval)(code); // indirect eval → global scope
        } catch (err) {
            threw = true;
            appendEntry('<span class="v-err">' + esc(err.toString()) + '</span>', 'error', ICO.error);
        }

        if (!threw && !(result === undefined && isVoid(code))) {
            appendEntry(
                '<span class="dc-outm">&#8592;</span>' + renderVal(result),
                'result', ''
            );
        }
    }

    /* ──────────────────────────────────────────────────────────────────────
     * FILTER & SEARCH
     * ───────────────────────────────────────────────────────────────────── */
    function applyRowFilter(row) {
        var lv = row.dataset.level || 'log';
        var txt = row.textContent.toLowerCase();
        var lvOk = filter === 'all'
            || filter === lv
            || (filter === 'info' && (lv === 'info' || lv === 'log' || lv === 'result'))
            || (filter === 'error' && lv === 'error')
            || (filter === 'warn' && lv === 'warn');
        var srOk = !search || txt.indexOf(search) !== -1;
        row.classList.toggle('dc-hide', !lvOk || !srOk);
    }

    function refilterAll() {
        var rows = logEl.querySelectorAll('.dc-row');
        for (var i = 0; i < rows.length; i++) applyRowFilter(rows[i]);
    }

    searchEl.addEventListener('input', function () {
        search = this.value.toLowerCase(); refilterAll();
    });

    root.querySelectorAll('.dc-fbtn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            root.querySelectorAll('.dc-fbtn').forEach(function (b) { b.classList.remove('dc-fon'); });
            this.classList.add('dc-fon');
            filter = this.dataset.filter;
            refilterAll();
        });
    });

    /* ──────────────────────────────────────────────────────────────────────
     * TREE TOGGLE — event delegation on #__dc-log
     * ───────────────────────────────────────────────────────────────────── */
    logEl.addEventListener('click', function (e) {
        var tgl = e.target.closest('.dc-toggle');
        if (tgl && logEl.contains(tgl)) {
            e.stopPropagation();
            handleToggle(tgl);
        }
    });

    /* ──────────────────────────────────────────────────────────────────────
     * TOOLBAR & WINDOW CONTROLS
     * ───────────────────────────────────────────────────────────────────── */
    root.querySelector('#__dc-btn-clear').addEventListener('click', function () { console.clear(); });

    root.querySelector('[data-dot="close"]').addEventListener('click', closeConsole);

    root.querySelector('[data-dot="min"]').addEventListener('click', function () {
        minimized = !minimized;
        root.classList.toggle('dc-min', minimized);
    });

    root.querySelector('[data-dot="snap"]').addEventListener('click', function () {
        if (backdrop.dataset.snapped === '1') {
            backdrop.dataset.snapped = '0';
            root.style.cssText = '';
        } else {
            backdrop.dataset.snapped = '1';
            Object.assign(root.style, {
                width: '100vw', height: '100vh',
                maxWidth: '100vw', maxHeight: '100vh',
                borderRadius: '0',
            });
        }
    });

    /* ──────────────────────────────────────────────────────────────────────
     * DRAG — titlebar to move root inside backdrop
     * ───────────────────────────────────────────────────────────────────── */
    (function () {
        var tb = root.querySelector('#__dc-tb');
        var dragging = false, ox = 0, oy = 0;

        tb.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('dc-dot')) return;
            if (backdrop.dataset.snapped === '1') return;
            dragging = true;
            /* switch to absolute positioning inside backdrop */
            var rr = root.getBoundingClientRect();
            root.style.position = 'absolute';
            root.style.margin = '0';
            root.style.left = rr.left + 'px';
            root.style.top = rr.top + 'px';
            ox = e.clientX - rr.left;
            oy = e.clientY - rr.top;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var nx = Math.max(0, Math.min(e.clientX - ox, window.innerWidth - root.offsetWidth));
            var ny = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - root.offsetHeight));
            root.style.left = nx + 'px';
            root.style.top = ny + 'px';
        });

        document.addEventListener('mouseup', function () {
            dragging = false;
            document.body.style.userSelect = '';
        });
    }());

    /* ──────────────────────────────────────────────────────────────────────
     * KEYBOARD SHORTCUTS
     * ───────────────────────────────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F12') {
            e.preventDefault();
            backdrop.classList.contains('dc-open') ? closeConsole() : openConsole();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            if (!backdrop.classList.contains('dc-open')) return;
            e.preventDefault();
            console.clear();
        }
        if (e.key === 'Escape' && backdrop.classList.contains('dc-open')) {
            closeConsole();
        }
    });

    /* click backdrop (outside root) to close */
    backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeConsole();
    });

    /* ──────────────────────────────────────────────────────────────────────
     * GLOBAL ERROR CAPTURE
     * ───────────────────────────────────────────────────────────────────── */
    window.addEventListener('error', function (e) {
        var loc = e.filename
            ? esc(e.filename.split('/').pop()) + ':' + e.lineno + ':' + e.colno
            : '?';
        appendEntry(
            '<span class="v-err">Uncaught ' + esc(e.message) + '</span>' +
            ' <span class="v-dim">(' + loc + ')</span>',
            'error', ICO.error
        );
    });

    window.addEventListener('unhandledrejection', function (e) {
        var msg = e.reason instanceof Error ? esc(e.reason.toString()) : esc(String(e.reason));
        appendEntry(
            '<span class="v-err">UnhandledRejection: ' + msg + '</span>',
            'error', ICO.error
        );
    });

    /* ──────────────────────────────────────────────────────────────────────
     * WELCOME
      setTimeout(function () {
      console.log(
        'Run: %cEnter%c   Newline: %cShift+Enter%c   History: %c↑ ↓%c   Toggle: %cF12%c   Close overlay: %cEsc',
        'color:#28c840;font-weight:600','',
        'color:#28c840;font-weight:600','',
        'color:#febc2e;font-weight:600','',
        'color:#febc2e;font-weight:600','',
        'color:#febc2e;font-weight:600',''
      );
    }, 90);
  
    * ───────────────────────────────────────────────────────────────────── */
}());