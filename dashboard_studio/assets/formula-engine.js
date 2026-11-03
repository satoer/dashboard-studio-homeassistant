/**
 * Expression engine for Payload Formulas (binding transforms).
 * Supports numbers, quoted strings, hex color literals, and @theme-token literals.
 * `+` adds numbers or concatenates when either side is a string.
 * Safari 12-safe: no optional chaining, no nullish coalescing.
 */
const FormulaEngine = (function () {
    const MAX_LEN = 512;
    const ALLOWED_FUNCS = {
        round: true,
        min: true,
        max: true,
        abs: true,
        if: true,
        number: true,
        and: true,
        or: true,
        not: true,
        xor: true,
        nor: true,
        contains: true,
        containsanycase: true
    };
    const PARSE_CACHE_MAX = 256;
    const parseCache = Object.create(null);
    const parseCacheOrder = [];

    function toNumber(v) {
        if (v === true) return { v: 1 };
        if (v === false) return { v: 0 };
        if (typeof v === 'string') {
            const t = v.trim().toLowerCase();
            if (t === 'true') return { v: 1 };
            if (t === 'false') return { v: 0 };
        }
        const n = Number(v);
        if (!Number.isFinite(n)) return { failed: true };
        return { v: n };
    }

    function isHexDigit(ch) {
        return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
    }

    const COLOR_LITERAL_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    const TOKEN_LITERAL_RE = /^@[A-Za-z_][A-Za-z0-9_]*$/;

    // Coerce a raw payload (value or topic ref) into a typed result.
    // Returns { v, type } where type is 'number' | 'string' | 'color' | 'token'.
    function coerceValue(raw) {
        if (raw === null || raw === undefined) return { v: 0, type: 'number' };
        if (raw === true) return { v: 1, type: 'number' };
        if (raw === false) return { v: 0, type: 'number' };
        if (typeof raw === 'number') {
            if (!Number.isFinite(raw)) return { v: 0, type: 'number' };
            return { v: raw, type: 'number' };
        }
        if (typeof raw === 'string') {
            const t = raw.trim();
            const low = t.toLowerCase();
            if (low === 'true') return { v: 1, type: 'number' };
            if (low === 'false') return { v: 0, type: 'number' };
            if (t !== '') {
                const n = Number(t);
                if (Number.isFinite(n)) return { v: n, type: 'number' };
            }
            if (COLOR_LITERAL_RE.test(t)) return { v: t.toLowerCase(), type: 'color' };
            if (TOKEN_LITERAL_RE.test(t)) return { v: t, type: 'token' };
            return { v: t, type: 'string' };
        }
        return { v: String(raw), type: 'string' };
    }

    function formulaValueToString(ev) {
        if (!ev || ev.failed) return '';
        if (ev.type === 'number') {
            if (!Number.isFinite(ev.v)) return '';
            return String(ev.v);
        }
        return String(ev.v);
    }

    function evalContains(hayEv, needleEv, anyCase) {
        const needle = formulaValueToString(needleEv);
        if (needle === '') return { v: 0, type: 'number' };
        const hay = formulaValueToString(hayEv);
        const found = anyCase
            ? hay.toLowerCase().indexOf(needle.toLowerCase()) !== -1
            : hay.indexOf(needle) !== -1;
        return { v: found ? 1 : 0, type: 'number' };
    }

    function valuesEqual(l, r) {
        if (l.type === 'number' && r.type === 'number') return l.v === r.v;
        if (l.type === 'string' && r.type === 'string') {
            return String(l.v).trim().toLowerCase() === String(r.v).trim().toLowerCase();
        }
        if (l.type === 'color' && r.type === 'color') return l.v === r.v;
        if (l.type === 'token' && r.type === 'token') return l.v === r.v;
        return false;
    }

    function normalize(raw) {
        if (raw === undefined || raw === null) return '';
        let s = String(raw).trim();
        if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN);
        const topicPlaceholders = [];
        s = s.replace(/\{\{[^}]+\}\}/g, function (m) {
            topicPlaceholders.push(m);
            return '\x00T' + (topicPlaceholders.length - 1) + '\x00';
        });
        s = s.replace(/\bx\b/gi, 'value');
        s = s.replace(/\x00T(\d+)\x00/g, function (_whole, idx) {
            return topicPlaceholders[parseInt(idx, 10)];
        });
        return s;
    }

    function tokenize(str) {
        const tokens = [];
        let i = 0;
        while (i < str.length) {
            const c = str[i];
            if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
                i++;
                continue;
            }
            const two = str.slice(i, i + 2);
            if (two === '>=' || two === '<=' || two === '==' || two === '!=') {
                tokens.push({ t: 'op', v: two });
                i += 2;
                continue;
            }
            if ('+-*/><()=,'.indexOf(c) !== -1) {
                if (c === '(') tokens.push({ t: 'lp' });
                else if (c === ')') tokens.push({ t: 'rp' });
                else if (c === ',') tokens.push({ t: 'comma' });
                else tokens.push({ t: 'op', v: c });
                i++;
                continue;
            }
            if ((c >= '0' && c <= '9') || c === '.') {
                let j = i + 1;
                while (j < str.length && ((str[j] >= '0' && str[j] <= '9') || str[j] === '.')) j++;
                const numStr = str.slice(i, j);
                const num = parseFloat(numStr);
                if (!Number.isFinite(num)) return { error: 'Invalid number' };
                tokens.push({ t: 'num', v: num });
                i = j;
                continue;
            }
            if (str.slice(i, i + 2) === '{{') {
                let j = i + 2;
                while (j < str.length - 1 && str.slice(j, j + 2) !== '}}') {
                    j++;
                }
                if (j >= str.length - 1) return { error: 'Unclosed topic reference' };
                const path = str.slice(i + 2, j).trim();
                if (path === '') return { error: 'Empty topic reference' };
                tokens.push({ t: 'topic', v: path });
                i = j + 2;
                continue;
            }
            if (c === '"' || c === "'") {
                const quote = c;
                let j = i + 1;
                let buf = '';
                while (j < str.length && str[j] !== quote) {
                    buf += str[j];
                    j++;
                }
                if (j >= str.length) return { error: 'Unterminated string' };
                tokens.push({ t: 'str', v: buf });
                i = j + 1;
                continue;
            }
            if (c === '#') {
                let j = i + 1;
                while (j < str.length && isHexDigit(str[j])) j++;
                const hex = str.slice(i, j);
                if (!COLOR_LITERAL_RE.test(hex)) return { error: 'Invalid color literal' };
                tokens.push({ t: 'color', v: hex.toLowerCase() });
                i = j;
                continue;
            }
            if (c === '@') {
                let j = i + 1;
                while (j < str.length) {
                    const ch = str[j];
                    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_') j++;
                    else break;
                }
                if (j === i + 1) return { error: 'Invalid theme token' };
                tokens.push({ t: 'token', v: str.slice(i, j) });
                i = j;
                continue;
            }
            if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
                let j = i + 1;
                while (j < str.length) {
                    const ch = str[j];
                    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_') j++;
                    else break;
                }
                tokens.push({ t: 'id', v: str.slice(i, j) });
                i = j;
                continue;
            }
            return { error: 'Unexpected character' };
        }
        return { tokens: tokens };
    }

    function Parser(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    Parser.prototype.peek = function () {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    };

    Parser.prototype.advance = function () {
        return this.tokens[this.pos++];
    };

    Parser.prototype.expect = function (type, val) {
        const tok = this.peek();
        if (!tok || tok.t !== type || (val !== undefined && tok.v !== val)) {
            return { error: 'Syntax error' };
        }
        this.advance();
        return null;
    };

    Parser.prototype.parseExpr = function () {
        return this.parseCompare();
    };

    Parser.prototype.parseCompare = function () {
        let left = this.parseAdd();
        if (left.error) return left;
        while (true) {
            const tok = this.peek();
            if (!tok || tok.t !== 'op') break;
            const op = tok.v;
            if (op !== '>' && op !== '>=' && op !== '<' && op !== '<=' && op !== '==' && op !== '!=') break;
            this.advance();
            const right = this.parseAdd();
            if (right.error) return right;
            left = { t: 'bin', op: op, l: left, r: right };
        }
        return left;
    };

    Parser.prototype.parseAdd = function () {
        let left = this.parseMul();
        if (left.error) return left;
        while (true) {
            const tok = this.peek();
            if (!tok || tok.t !== 'op' || (tok.v !== '+' && tok.v !== '-')) break;
            const op = tok.v;
            this.advance();
            const right = this.parseMul();
            if (right.error) return right;
            left = { t: 'bin', op: op, l: left, r: right };
        }
        return left;
    };

    Parser.prototype.parseMul = function () {
        let left = this.parseUnary();
        if (left.error) return left;
        while (true) {
            const tok = this.peek();
            if (!tok || tok.t !== 'op' || (tok.v !== '*' && tok.v !== '/')) break;
            const op = tok.v;
            this.advance();
            const right = this.parseUnary();
            if (right.error) return right;
            left = { t: 'bin', op: op, l: left, r: right };
        }
        return left;
    };

    Parser.prototype.parseUnary = function () {
        const tok = this.peek();
        if (tok && tok.t === 'op' && tok.v === '-') {
            this.advance();
            const inner = this.parseUnary();
            if (inner.error) return inner;
            return { t: 'un', op: '-', e: inner };
        }
        return this.parsePrimary();
    };

    Parser.prototype.parsePrimary = function () {
        const tok = this.peek();
        if (!tok) return { error: 'Unexpected end' };

        if (tok.t === 'num') {
            this.advance();
            return { t: 'num', v: tok.v };
        }

        if (tok.t === 'str') {
            this.advance();
            return { t: 'str', v: tok.v };
        }

        if (tok.t === 'color') {
            this.advance();
            return { t: 'color', v: tok.v };
        }

        if (tok.t === 'token') {
            this.advance();
            return { t: 'token', v: tok.v };
        }

        if (tok.t === 'topic') {
            this.advance();
            return { t: 'topic', v: tok.v };
        }

        if (tok.t === 'id') {
            const name = tok.v;
            this.advance();
            if (name === 'value') {
                return { t: 'var', v: 'value' };
            }
            if (!ALLOWED_FUNCS[name]) {
                return { error: 'Unknown identifier: ' + name };
            }
            const lp = this.expect('lp');
            if (lp && lp.error) return lp;
            const args = [];
            if (this.peek() && this.peek().t !== 'rp') {
                const first = this.parseExpr();
                if (first.error) return first;
                args.push(first);
                while (this.peek() && this.peek().t === 'comma') {
                    this.advance();
                    const next = this.parseExpr();
                    if (next.error) return next;
                    args.push(next);
                }
            }
            const rp = this.expect('rp');
            if (rp && rp.error) return rp;
            if (name === 'if' && args.length !== 3) return { error: 'if() requires 3 arguments' };
            if (name === 'round' && (args.length < 1 || args.length > 2)) return { error: 'round() requires 1 or 2 arguments' };
            if ((name === 'min' || name === 'max') && args.length < 2) return { error: name + '() requires at least 2 arguments' };
            if ((name === 'abs' || name === 'number' || name === 'not') && args.length !== 1) {
                return { error: name + '() requires 1 argument' };
            }
            if ((name === 'and' || name === 'or' || name === 'xor' || name === 'nor') && args.length < 2) {
                return { error: name + '() requires at least 2 arguments' };
            }
            if ((name === 'contains' || name === 'containsanycase') && args.length !== 2) {
                return { error: name + '() requires 2 arguments' };
            }
            return { t: 'call', fn: name, args: args };
        }

        if (tok.t === 'lp') {
            this.advance();
            const inner = this.parseExpr();
            if (inner.error) return inner;
            const rp = this.expect('rp');
            if (rp && rp.error) return rp;
            return inner;
        }

        return { error: 'Unexpected token' };
    };

    function parseFormula(str) {
        if (str === '') return { error: 'Empty formula' };
        if (str.length > MAX_LEN) return { error: 'Formula too long' };
        if (parseCache[str]) {
            const hit = parseCacheOrder.indexOf(str);
            if (hit !== -1 && hit !== parseCacheOrder.length - 1) {
                parseCacheOrder.splice(hit, 1);
                parseCacheOrder.push(str);
            }
            return { ast: parseCache[str] };
        }

        const tokResult = tokenize(str);
        if (tokResult.error) return tokResult;
        const parser = new Parser(tokResult.tokens);
        const ast = parser.parseExpr();
        if (ast.error) return ast;
        if (parser.pos < tokResult.tokens.length) return { error: 'Unexpected trailing tokens' };

        parseCache[str] = ast;
        parseCacheOrder.push(str);
        while (parseCacheOrder.length > PARSE_CACHE_MAX) {
            const old = parseCacheOrder.shift();
            delete parseCache[old];
        }
        return { ast: ast };
    }

    function astUsesValue(node) {
        if (!node || node.error) return false;
        if (node.t === 'var') return true;
        if (node.t === 'un') return astUsesValue(node.e);
        if (node.t === 'bin') return astUsesValue(node.l) || astUsesValue(node.r);
        if (node.t === 'call' && node.args) {
            let i;
            for (i = 0; i < node.args.length; i++) {
                if (astUsesValue(node.args[i])) return true;
            }
        }
        return false;
    }

    const PATH_SHAPED_RE = /^[A-Za-z0-9_.$-]+(\/[A-Za-z0-9_.$-]+)*$/;

    function looksLikeFormula(inner) {
        if (inner === undefined || inner === null) return false;
        const t = String(inner).trim();
        if (t === '') return false;
        if (PATH_SHAPED_RE.test(t)) return false;
        return true;
    }

    function matchNestedDoubleBrace(s, start) {
        let i = start + 2;
        let depth = 1;
        let quote = null;
        while (i < s.length) {
            const c = s[i];
            if (quote) {
                if (c === quote) quote = null;
                i++;
                continue;
            }
            if (c === '"' || c === "'") {
                quote = c;
                i++;
                continue;
            }
            if (c === '{' && i + 1 < s.length && s[i + 1] === '{') {
                depth++;
                i += 2;
                continue;
            }
            if (c === '}' && i + 1 < s.length && s[i + 1] === '}') {
                depth--;
                i += 2;
                if (depth === 0) {
                    return { end: i, inner: s.slice(start + 2, i - 2) };
                }
                continue;
            }
            i++;
        }
        return null;
    }

    /**
     * Find `{{ ... }}` tokens with nested-brace matching. Quote-aware inside tokens.
     * Skips inline backticks and fenced ``` blocks so examples stay literal.
     * Unclosed `{{` is omitted (left as typed text).
     */
    function scanDoubleBraceTokens(src) {
        const s = src === undefined || src === null ? '' : String(src);
        const tokens = [];
        let i = 0;
        let inFence = false;
        let inInlineCode = false;
        while (i < s.length) {
            if (s.slice(i, i + 3) === '```') {
                inFence = !inFence;
                inInlineCode = false;
                i += 3;
                continue;
            }
            if (inFence) {
                i++;
                continue;
            }
            if (s[i] === '`') {
                inInlineCode = !inInlineCode;
                i++;
                continue;
            }
            if (inInlineCode) {
                i++;
                continue;
            }
            if (s[i] === '{' && i + 1 < s.length && s[i + 1] === '{') {
                const match = matchNestedDoubleBrace(s, i);
                if (!match) {
                    i += 2;
                    continue;
                }
                tokens.push({
                    start: i,
                    end: match.end,
                    inner: match.inner
                });
                i = match.end;
                continue;
            }
            i++;
        }
        return tokens;
    }

    function evalAst(node, scope) {
        if (!node || node.error) return { failed: true };

        if (node.t === 'num') return { v: node.v, type: 'number' };
        if (node.t === 'str') return { v: node.v, type: 'string' };
        if (node.t === 'color') return { v: node.v, type: 'color' };
        if (node.t === 'token') return { v: node.v, type: 'token' };
        if (node.t === 'var') {
            if (scope.disallowValue) return { failed: true };
            const cv = coerceValue(scope.value);
            if (cv.failed) return { failed: true };
            return cv;
        }
        if (node.t === 'topic') {
            if (typeof scope.resolveTopic !== 'function') return { failed: true };
            const tr = scope.resolveTopic(node.v);
            if (!tr || tr.failed) return { failed: true };
            if (tr.type) return { v: tr.v, type: tr.type };
            if (!Number.isFinite(tr.v)) return { failed: true };
            return { v: tr.v, type: 'number' };
        }
        if (node.t === 'un') {
            const inner = evalAst(node.e, scope);
            if (inner.failed) return { failed: true };
            if (inner.type !== 'number') return { failed: true };
            return { v: node.op === '-' ? -inner.v : inner.v, type: 'number' };
        }
        if (node.t === 'bin') {
            const l = evalAst(node.l, scope);
            const r = evalAst(node.r, scope);
            if (l.failed || r.failed) return { failed: true };
            const op = node.op;
            if (op === '+') {
                if (l.type === 'number' && r.type === 'number') {
                    const sum = l.v + r.v;
                    if (!Number.isFinite(sum)) return { failed: true };
                    return { v: sum, type: 'number' };
                }
                if (l.type === 'string' || r.type === 'string') {
                    return { v: String(l.v) + String(r.v), type: 'string' };
                }
                return { failed: true };
            }
            if (op === '-' || op === '*' || op === '/') {
                if (l.type !== 'number' || r.type !== 'number') return { failed: true };
                let result;
                if (op === '-') result = l.v - r.v;
                else if (op === '*') result = l.v * r.v;
                else result = l.v / r.v;
                if (!Number.isFinite(result)) return { failed: true };
                return { v: result, type: 'number' };
            }
            if (op === '>' || op === '>=' || op === '<' || op === '<=') {
                if (l.type !== 'number' || r.type !== 'number') return { failed: true };
                let result;
                if (op === '>') result = l.v > r.v ? 1 : 0;
                else if (op === '>=') result = l.v >= r.v ? 1 : 0;
                else if (op === '<') result = l.v < r.v ? 1 : 0;
                else result = l.v <= r.v ? 1 : 0;
                return { v: result, type: 'number' };
            }
            if (op === '==' || op === '!=') {
                const eq = valuesEqual(l, r);
                return { v: (op === '==' ? (eq ? 1 : 0) : (eq ? 0 : 1)), type: 'number' };
            }
            return { failed: true };
        }
        if (node.t === 'call') {
            const fn = node.fn;
            if (fn === 'if') {
                const cond = evalAst(node.args[0], scope);
                if (cond.failed) return { failed: true };
                if (cond.type !== 'number') return { failed: true };
                const branch = evalAst(cond.v ? node.args[1] : node.args[2], scope);
                return branch;
            }
            if (fn === 'contains' || fn === 'containsanycase') {
                const hayEv = evalAst(node.args[0], scope);
                const needleEv = evalAst(node.args[1], scope);
                if (hayEv.failed || needleEv.failed) return { failed: true };
                return evalContains(hayEv, needleEv, fn === 'containsanycase');
            }
            const evArgs = [];
            let i;
            for (i = 0; i < node.args.length; i++) {
                const ev = evalAst(node.args[i], scope);
                if (ev.failed) return { failed: true };
                if (ev.type !== 'number') return { failed: true };
                evArgs.push(ev.v);
            }
            let result;
            if (fn === 'round') {
                const dec = evArgs.length > 1 ? evArgs[1] : 0;
                const factor = Math.pow(10, dec);
                result = Math.round(evArgs[0] * factor) / factor;
            } else if (fn === 'min') {
                result = evArgs[0];
                for (i = 1; i < evArgs.length; i++) {
                    if (evArgs[i] < result) result = evArgs[i];
                }
            } else if (fn === 'max') {
                result = evArgs[0];
                for (i = 1; i < evArgs.length; i++) {
                    if (evArgs[i] > result) result = evArgs[i];
                }
            } else if (fn === 'abs') {
                result = Math.abs(evArgs[0]);
            } else if (fn === 'number') {
                result = Number(evArgs[0]);
            } else if (fn === 'and') {
                result = 1;
                for (i = 0; i < evArgs.length; i++) {
                    if (!evArgs[i]) {
                        result = 0;
                        break;
                    }
                }
            } else if (fn === 'or') {
                result = 0;
                for (i = 0; i < evArgs.length; i++) {
                    if (evArgs[i]) {
                        result = 1;
                        break;
                    }
                }
            } else if (fn === 'not') {
                result = evArgs[0] ? 0 : 1;
            } else if (fn === 'xor') {
                let nz = 0;
                for (i = 0; i < evArgs.length; i++) {
                    if (evArgs[i]) nz++;
                }
                result = (nz % 2 === 1) ? 1 : 0;
            } else if (fn === 'nor') {
                result = 1;
                for (i = 0; i < evArgs.length; i++) {
                    if (evArgs[i]) {
                        result = 0;
                        break;
                    }
                }
            } else {
                return { failed: true };
            }
            if (!Number.isFinite(result)) return { failed: true };
            return { v: result, type: 'number' };
        }
        return { failed: true };
    }

    function validate(rawString) {
        const norm = normalize(rawString);
        if (norm === '') return { ok: true, error: '' };
        const parsed = parseFormula(norm);
        if (parsed.error) return { ok: false, error: parsed.error };
        return { ok: true, error: '' };
    }

    function evaluate(normalizedString, numericInput, resolveTopicFn, opts) {
        const norm = normalize(normalizedString);
        if (norm === '') return { value: numericInput, failed: false };

        const parsed = parseFormula(norm);
        if (parsed.error) return { value: numericInput, failed: true };

        const disallowValue = !!(opts && opts.disallowValue === true);
        if (disallowValue && astUsesValue(parsed.ast)) {
            return { value: numericInput, failed: true };
        }

        const resolver = typeof resolveTopicFn === 'function' ? resolveTopicFn : function () {
            return { failed: true };
        };
        const scope = {
            value: numericInput,
            resolveTopic: resolver,
            disallowValue: disallowValue
        };
        const result = evalAst(parsed.ast, scope);
        if (result.failed) return { value: numericInput, failed: true };
        if (result.type === 'number' && !Number.isFinite(result.v)) {
            return { value: numericInput, failed: true };
        }
        return { value: result.v, type: result.type, failed: false };
    }

    function isDefaultFormula(raw) {
        const norm = normalize(raw);
        const t = norm.trim().toLowerCase();
        return t === '' || t === 'value';
    }

    function createValueChip() {
        const chip = document.createElement('span');
        chip.className = 'ds-value-tag';
        chip.contentEditable = 'false';
        chip.textContent = 'Value';
        chip.setAttribute('data-formula-value', '1');
        return chip;
    }

    function createTopicChip(path) {
        const chip = document.createElement('span');
        chip.className = 'ds-topic-tag';
        chip.contentEditable = 'false';
        chip.setAttribute('data-formula-topic', path);
        const icon = document.createElement('i');
        icon.className = 'ph-bold ph-link';
        chip.appendChild(icon);
        const label = document.createElement('span');
        label.className = 'ds-topic-tag-label';
        const display = path.length > 24 ? path.slice(0, 21) + '…' : path;
        label.textContent = display;
        label.title = path;
        chip.appendChild(label);
        return chip;
    }

    function topicTokenLength(path) {
        return 2 + String(path).length + 2;
    }

    function extractFormulaText(root) {
        let out = '';
        function walk(node) {
            if (!node) return;
            if (node.nodeType === 3) {
                out += stripFormulaZwsp(node.textContent);
            } else if (node.nodeType === 1 && node.getAttribute && node.getAttribute('data-formula-value') === '1') {
                out += 'value';
            } else if (node.nodeType === 1 && node.getAttribute && node.getAttribute('data-formula-topic') != null) {
                out += '{{' + node.getAttribute('data-formula-topic') + '}}';
            } else if (node.childNodes) {
                let i;
                for (i = 0; i < node.childNodes.length; i++) {
                    walk(node.childNodes[i]);
                }
            }
        }
        walk(root);
        return out;
    }

    function renderStringWithChips(container, str) {
        let i = 0;
        while (i < str.length) {
            if (str.slice(i, i + 2) === '{{') {
                let j = i + 2;
                while (j < str.length - 1 && str.slice(j, j + 2) !== '}}') {
                    j++;
                }
                if (j < str.length - 1) {
                    const path = str.slice(i + 2, j).trim();
                    if (path !== '') {
                        container.appendChild(createTopicChip(path));
                        i = j + 2;
                        continue;
                    }
                }
            }
            const valMatch = /^(value|x)\b/i.exec(str.slice(i));
            if (valMatch) {
                container.appendChild(createValueChip());
                i += valMatch[0].length;
                continue;
            }
            let next = str.length;
            const topicIdx = str.indexOf('{{', i);
            if (topicIdx !== -1 && topicIdx < next) next = topicIdx;
            const valRe = /\b(value|x)\b/i;
            valRe.lastIndex = i;
            const vm = valRe.exec(str);
            if (vm && vm.index < next) next = vm.index;
            if (next > i) {
                container.appendChild(document.createTextNode(str.slice(i, next)));
                i = next;
            } else {
                container.appendChild(document.createTextNode(str.charAt(i)));
                i++;
            }
        }
    }

    var CHIP_TOKEN_RE = /(\{\{[^}]+\}\}|\b(?:value|x)\b)/gi;
    var FORMULA_ZWSP = '\u200B';

    function isFormulaChip(node) {
        if (!node || node.nodeType !== 1 || !node.getAttribute) return false;
        return node.getAttribute('data-formula-value') === '1'
            || node.getAttribute('data-formula-topic') != null;
    }

    function getFormulaChipTokenLen(node) {
        if (!isFormulaChip(node)) return 0;
        if (node.getAttribute('data-formula-value') === '1') return 5;
        return topicTokenLength(node.getAttribute('data-formula-topic') || '');
    }

    function countLogicalTextOffset(raw, rawOffset) {
        let logical = 0;
        let i;
        for (i = 0; i < rawOffset && i < raw.length; i++) {
            if (raw.charAt(i) !== FORMULA_ZWSP) logical++;
        }
        return logical;
    }

    function rawOffsetForLogicalText(raw, logicalOffset) {
        let logical = 0;
        let i;
        for (i = 0; i < raw.length; i++) {
            if (logical >= logicalOffset) return i;
            if (raw.charAt(i) !== FORMULA_ZWSP) logical++;
        }
        return raw.length;
    }

    function stripFormulaZwsp(text) {
        if (!text) return '';
        return String(text).replace(/\u200B/g, '');
    }

    function ensureCaretAnchors(root) {
        if (!root) return;
        if (root.firstChild && isFormulaChip(root.firstChild)) {
            root.insertBefore(document.createTextNode(FORMULA_ZWSP), root.firstChild);
        }
        let child = root.firstChild;
        while (child) {
            const next = child.nextSibling;
            if (isFormulaChip(child)) {
                if (!next || isFormulaChip(next)) {
                    root.insertBefore(document.createTextNode(FORMULA_ZWSP), next);
                } else if (next.nodeType === 3 && stripFormulaZwsp(next.textContent) === '' && next.textContent.indexOf(FORMULA_ZWSP) === -1) {
                    next.textContent = FORMULA_ZWSP;
                }
            }
            child = next;
        }
        const last = root.lastChild;
        if (last && isFormulaChip(last)) {
            root.appendChild(document.createTextNode(FORMULA_ZWSP));
        }
    }

    function updateSavedFormulaCaret(root) {
        if (!root) return;
        root._savedCaretOffset = getFormulaOffsetAtCaret(root);
    }

    function getMaxFormulaCaretOffset(root) {
        const raw = normalize(extractFormulaText(root));
        if (isDefaultFormula(raw)) return 5;
        return raw.length;
    }

    function insertNodeAtFormulaOffset(root, offset, nodeToInsert) {
        const sel = window.getSelection();
        if (!sel) return;
        setFormulaOffsetAtCaret(root, offset);
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(nodeToInsert);
        range.setStartAfter(nodeToInsert);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        updateSavedFormulaCaret(root);
    }

    function applyChipsToTextNode(textNode) {
        const text = textNode.textContent;
        if (!text) return false;
        CHIP_TOKEN_RE.lastIndex = 0;
        if (!CHIP_TOKEN_RE.test(text)) return false;
        CHIP_TOKEN_RE.lastIndex = 0;

        const parent = textNode.parentNode;
        if (!parent) return false;
        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let m;
        while ((m = CHIP_TOKEN_RE.exec(text)) !== null) {
            if (m.index > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
            }
            const token = m[0];
            if (token.slice(0, 2) === '{{' && token.slice(-2) === '}}') {
                const path = token.slice(2, -2).trim();
                if (path !== '') frag.appendChild(createTopicChip(path));
            } else {
                frag.appendChild(createValueChip());
            }
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        parent.insertBefore(frag, textNode);
        parent.removeChild(textNode);
        return true;
    }

    function scanAndApplyChips(root) {
        const textNodes = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while ((n = walker.nextNode())) {
            if (n.parentNode && n.parentNode.getAttribute) {
                const pg = n.parentNode.getAttribute('data-formula-value');
                const pt = n.parentNode.getAttribute('data-formula-topic');
                if (pg === '1' || pt != null) continue;
            }
            textNodes.push(n);
        }
        let i;
        for (i = 0; i < textNodes.length; i++) {
            if (textNodes[i].parentNode) {
                applyChipsToTextNode(textNodes[i]);
            }
        }
    }

    function getFormulaOffsetAtCaret(root) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return 0;
        const range = sel.getRangeAt(0);
        let chars = 0;
        let found = false;

        function walk(node) {
            if (found) return;
            if (node === range.endContainer) {
                if (node.nodeType === 3) {
                    chars += countLogicalTextOffset(node.textContent, range.endOffset);
                } else if (isFormulaChip(node)) {
                    if (range.endOffset > 0) {
                        chars += getFormulaChipTokenLen(node);
                    }
                } else {
                    let i;
                    for (i = 0; i < range.endOffset; i++) {
                        walk(node.childNodes[i]);
                    }
                }
                found = true;
                return;
            }
            if (node.nodeType === 3) {
                chars += stripFormulaZwsp(node.textContent).length;
            } else if (node.nodeType === 1) {
                if (isFormulaChip(node)) {
                    chars += getFormulaChipTokenLen(node);
                } else {
                    let i;
                    for (i = 0; i < node.childNodes.length; i++) {
                        walk(node.childNodes[i]);
                    }
                }
            }
        }

        walk(root);
        return chars;
    }

    function setFormulaOffsetAtCaret(root, targetOffset) {
        const sel = window.getSelection();
        if (!sel) return;
        const range = document.createRange();
        let chars = 0;
        let placed = false;

        function walk(node) {
            if (placed) return;
            if (node.nodeType === 3) {
                const raw = node.textContent;
                const len = stripFormulaZwsp(raw).length;
                if (chars + len >= targetOffset) {
                    range.setStart(node, rawOffsetForLogicalText(raw, targetOffset - chars));
                    range.collapse(true);
                    placed = true;
                    return;
                }
                chars += len;
            } else if (node.nodeType === 1) {
                if (isFormulaChip(node)) {
                    const tLen = getFormulaChipTokenLen(node);
                    if (targetOffset <= chars) {
                        range.setStartBefore(node);
                        range.collapse(true);
                        placed = true;
                        return;
                    }
                    if (targetOffset <= chars + tLen) {
                        range.setStartAfter(node);
                        range.collapse(true);
                        placed = true;
                        return;
                    }
                    chars += tLen;
                } else {
                    let i;
                    for (i = 0; i < node.childNodes.length; i++) {
                        walk(node.childNodes[i]);
                        if (placed) return;
                    }
                }
            }
        }

        walk(root);
        if (!placed) {
            range.selectNodeContents(root);
            range.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    }

    /**
     * Contenteditable formula field with inline Value chips for value/x tokens.
     * @param {string} initialValue
     * @param {function(string):void} [onChange]
     * @returns {{ element: HTMLElement, getValue: function, setValue: function, insertValueAtCaret: function, insertTextAtCaret: function, setInvalid: function }}
     */
    function createFormulaInput(initialValue, onChange) {
        const el = document.createElement('div');
        el.className = 'control-input w-full text-xs ds-formula-input ds-formula-input-editable';
        el.contentEditable = 'true';
        el.setAttribute('role', 'textbox');
        el.setAttribute('spellcheck', 'false');
        el.setAttribute('data-placeholder', 'e.g. value * -1');

        function syncEmptyClass() {
            const raw = extractFormulaText(el).trim();
            if (raw === '' && !el.querySelector('[data-formula-topic]')) {
                el.classList.add('is-empty');
            } else {
                el.classList.remove('is-empty');
            }
        }

        function showDefaultValueChip() {
            el.innerHTML = '';
            el.appendChild(createValueChip());
            ensureCaretAnchors(el);
            syncEmptyClass();
        }

        function setFromString(str) {
            el.innerHTML = '';
            const norm = normalize(str);
            if (isDefaultFormula(norm)) {
                showDefaultValueChip();
                return;
            }
            renderStringWithChips(el, norm);
            ensureCaretAnchors(el);
            syncEmptyClass();
        }

        function getValue() {
            const raw = normalize(extractFormulaText(el));
            if (isDefaultFormula(raw)) return '';
            return raw;
        }

        function setInvalid(invalid) {
            if (invalid) el.classList.add('invalid');
            else el.classList.remove('invalid');
        }

        function setValue(str) {
            setFromString(str);
            const val = getValue();
            const v = validate(val);
            setInvalid(val.trim() !== '' && !v.ok);
        }

        function handleInput() {
            const caret = getFormulaOffsetAtCaret(el);
            scanAndApplyChips(el);
            let val = getValue();
            if (val.length > MAX_LEN) {
                setFromString(val.slice(0, MAX_LEN));
                val = getValue();
            }
            ensureCaretAnchors(el);
            syncEmptyClass();
            setFormulaOffsetAtCaret(el, Math.min(caret, getMaxFormulaCaretOffset(el)));
            updateSavedFormulaCaret(el);
            const v = validate(val);
            setInvalid(val.trim() !== '' && !v.ok);
            if (typeof onChange === 'function') onChange(getValue());
        }

        el.addEventListener('keyup', function () { updateSavedFormulaCaret(el); });
        el.addEventListener('mouseup', function () { updateSavedFormulaCaret(el); });
        el.addEventListener('blur', function () {
            updateSavedFormulaCaret(el);
            const raw = normalize(extractFormulaText(el));
            if (raw === '' && !el.querySelector('[data-formula-topic]')) {
                showDefaultValueChip();
            }
        });

        el.addEventListener('copy', function (e) {
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);
            if (!el.contains(range.commonAncestorContainer)) return;
            const text = extractFormulaText(range.cloneContents());
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', text);
                e.preventDefault();
            }
        });

        el.addEventListener('cut', function (e) {
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);
            if (!el.contains(range.commonAncestorContainer)) return;
            const text = extractFormulaText(range.cloneContents());
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', text);
                range.deleteContents();
                handleInput();
                e.preventDefault();
            }
        });

        el.addEventListener('mousedown', function (e) {
            let chip = e.target;
            while (chip && chip !== el) {
                if (isFormulaChip(chip)) break;
                chip = chip.parentNode;
            }
            if (!chip || chip === el) return;
            e.preventDefault();
            const rect = chip.getBoundingClientRect();
            const after = e.clientX >= rect.left + (rect.width / 2);
            const range = document.createRange();
            if (after) range.setStartAfter(chip);
            else range.setStartBefore(chip);
            range.collapse(true);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
            updateSavedFormulaCaret(el);
        });

        el.addEventListener('input', handleInput);

        el.addEventListener('paste', function (e) {
            e.preventDefault();
            let text = '';
            if (e.clipboardData) text = e.clipboardData.getData('text/plain');
            else if (window.clipboardData) text = window.clipboardData.getData('Text');
            if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                document.execCommand('insertText', false, text);
            } else {
                const sel = window.getSelection();
                if (sel && sel.rangeCount) {
                    sel.getRangeAt(0).insertNode(document.createTextNode(text));
                }
            }
            handleInput();
        });

        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                return;
            }
            if (e.key !== 'Backspace' && e.key !== 'Delete') return;
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);

            if (!sel.isCollapsed) {
                e.preventDefault();
                range.deleteContents();
                handleInput();
                return;
            }

            let chip = null;
            const container = range.startContainer;
            const offset = range.startOffset;

            if (e.key === 'Backspace') {
                if (container.nodeType === 3) {
                    if (offset === 0 || stripFormulaZwsp(container.textContent.slice(0, offset)) === '') {
                        chip = container.previousSibling;
                    }
                } else if (container === el && offset > 0) {
                    chip = container.childNodes[offset - 1];
                }
            } else {
                if (container.nodeType === 3) {
                    if (offset === container.textContent.length || stripFormulaZwsp(container.textContent.slice(offset)) === '') {
                        chip = container.nextSibling;
                    }
                } else if (container === el && offset < container.childNodes.length) {
                    chip = container.childNodes[offset];
                }
            }

            if (chip && chip.nodeType === 1 && chip.getAttribute) {
                const isValue = chip.getAttribute('data-formula-value') === '1';
                const isTopic = chip.getAttribute('data-formula-topic') != null;
                if (isValue || isTopic) {
                    e.preventDefault();
                    chip.parentNode.removeChild(chip);
                    handleInput();
                }
            }
        });

        setFromString(initialValue || '');
        const initVal = getValue();
        const initCheck = validate(initVal);
        setInvalid(initVal.trim() !== '' && !initCheck.ok);

        return {
            element: el,
            getValue: getValue,
            setValue: setValue,
            insertValueAtCaret: function () {
                const offset = typeof el._savedCaretOffset === 'number'
                    ? el._savedCaretOffset
                    : getFormulaOffsetAtCaret(el);
                el.focus();
                insertNodeAtFormulaOffset(el, offset, createValueChip());
                ensureCaretAnchors(el);
                handleInput();
            },
            insertTopicAtCaret: function (path) {
                if (!path) return;
                let offset;
                if (isDefaultFormula(getValue())) {
                    el.innerHTML = '';
                    ensureCaretAnchors(el);
                    offset = 0;
                } else {
                    offset = typeof el._savedCaretOffset === 'number'
                        ? el._savedCaretOffset
                        : getFormulaOffsetAtCaret(el);
                }
                el.focus();
                insertNodeAtFormulaOffset(el, offset, createTopicChip(path));
                ensureCaretAnchors(el);
                handleInput();
            },
            insertTextAtCaret: function (text) {
                if (!text || typeof text !== 'string') return;
                let offset;
                if (isDefaultFormula(getValue())) {
                    el.innerHTML = '';
                    ensureCaretAnchors(el);
                    offset = 0;
                } else {
                    offset = typeof el._savedCaretOffset === 'number'
                        ? el._savedCaretOffset
                        : getFormulaOffsetAtCaret(el);
                }
                el.focus();
                insertNodeAtFormulaOffset(el, offset, document.createTextNode(text));
                ensureCaretAnchors(el);
                handleInput();
            },
            saveCaret: function () {
                updateSavedFormulaCaret(el);
            },
            setInvalid: setInvalid
        };
    }

    const PRESETS = [
        {
            label: 'Invert Sign',
            hint: 'Multiplies by -1: negative payloads become positive and positive become negative.',
            formula: 'value * -1'
        },
        {
            label: 'Absolute',
            hint: 'Removes the sign: always returns the positive magnitude (e.g. -3 becomes 3).',
            formula: 'abs(value)'
        },
        {
            label: 'Clamp 0-100',
            hint: 'Keeps the result within 0 and 100; values below 0 become 0, above 100 become 100.',
            formula: 'min(max(value, 0), 100)'
        },
        {
            label: 'Whole Number',
            hint: 'Rounds to the nearest integer; decimals are removed (e.g. 21.7 becomes 22, 21.4 becomes 21).',
            formula: 'round(value)'
        },
        {
            label: 'Threshold 50',
            hint: 'Returns 100 when the payload is above 50; returns 0 when 50 or below.',
            formula: 'if(value > 50, 100, 0)'
        }
    ];

    const BOOLEAN_PRESETS = [
        {
            label: 'Threshold 50',
            hint: 'Outputs 1 when the payload is 50 or above; outputs 0 when below 50.',
            formula: 'if(value >= 50, 1, 0)'
        },
        {
            label: 'Round to 0 or 1',
            hint: 'Values below 0.5 become 0; 0.5 and above become 1.',
            formula: 'if(value >= 0.5, 1, 0)'
        },
        {
            label: 'Two topics AND',
            hint: 'On when both referenced topics are non-zero (insert topics with Insert Topic).',
            formula: 'if(and({{topic/a}}, {{topic/b}}), 1, 0)'
        },
        {
            label: 'Either topic OR',
            hint: 'On when either referenced topic is non-zero.',
            formula: 'if(or({{topic/a}}, {{topic/b}}), 1, 0)'
        },
        {
            label: 'Topic NOT',
            hint: 'On when the referenced topic is zero or false.',
            formula: 'if(not({{topic/state}}), 1, 0)'
        },
        {
            label: 'Text Contains ON',
            hint: 'On when the payload contains the exact letters ON. Hello the value is ON is on. Hello the value is on is off.',
            formula: 'if(contains(value, "ON"), 1, 0)'
        },
        {
            label: 'Text Contains Any Case',
            hint: 'On when the payload contains ON, On, or on. OFF does not contain those letters.',
            formula: 'if(containsanycase(value, "ON"), 1, 0)'
        }
    ];

    const TEXT_PRESETS = [
        {
            label: 'Threshold to Yes/No',
            hint: 'Returns "yes" when the payload is 50 or above; returns "no" otherwise.',
            formula: 'if(value >= 50, "yes", "no")'
        },
        {
            label: 'Match Word',
            hint: 'Returns "on" when the payload equals "on" (case-insensitive); returns "off" otherwise.',
            formula: 'if(value == "on", "on", "off")'
        },
        {
            label: 'Prefix and Suffix',
            hint: 'Joins quoted text around Value, for example an image path from a weather payload.',
            formula: '"/images/" + value + ".png"'
        },
        {
            label: 'Contains ON',
            hint: 'Returns Running when the payload contains the exact letters ON.',
            formula: 'if(contains(value, "ON"), "Running", "Idle")'
        },
        {
            label: 'Contains Any Case',
            hint: 'Returns Running when the payload contains ON, On, or on.',
            formula: 'if(containsanycase(value, "ON"), "Running", "Idle")'
        }
    ];

    const ICON_PRESETS = [
        {
            label: 'Threshold Two Icons',
            hint: 'Returns ph-thermometer-hot when the payload is 50 or above; returns ph-thermometer-cold otherwise.',
            formula: 'if(value >= 50, "ph-thermometer-hot", "ph-thermometer-cold")'
        },
        {
            label: 'Match Word',
            hint: 'Returns ph-flame when the payload equals "heating" (case-insensitive); returns ph-snowflake otherwise.',
            formula: 'if(value == "heating", "ph-flame", "ph-snowflake")'
        },
        {
            label: 'Contains ON',
            hint: 'Returns ph-lightbulb when the payload contains the exact letters ON.',
            formula: 'if(contains(value, "ON"), "ph-lightbulb", "ph-lightbulb-slash")'
        },
        {
            label: 'Contains Any Case',
            hint: 'Returns ph-lightbulb when the payload contains ON, On, or on.',
            formula: 'if(containsanycase(value, "ON"), "ph-lightbulb", "ph-lightbulb-slash")'
        }
    ];

    const COLOR_PRESETS = [
        {
            label: 'Threshold Warning/Danger',
            hint: 'Returns the @warning theme color when the payload is 50 or above; returns @danger otherwise.',
            formula: 'if(value >= 50, @warning, @danger)'
        },
        {
            label: 'Threshold Two Colors',
            hint: 'Returns #121345 when the payload is 50 or above; returns #000000 otherwise.',
            formula: 'if(value >= 50, #121345, #000000)'
        },
        {
            label: 'Contains ON',
            hint: 'Returns the @success theme color when the payload contains the exact letters ON.',
            formula: 'if(contains(value, "ON"), @success, @danger)'
        },
        {
            label: 'Contains Any Case',
            hint: 'Returns the @success theme color when the payload contains ON, On, or on.',
            formula: 'if(containsanycase(value, "ON"), @success, @danger)'
        }
    ];

    return {
        normalize: normalize,
        validate: validate,
        evaluate: evaluate,
        toNumber: toNumber,
        coerceValue: coerceValue,
        isDefaultFormula: isDefaultFormula,
        looksLikeFormula: looksLikeFormula,
        scanDoubleBraceTokens: scanDoubleBraceTokens,
        createFormulaInput: createFormulaInput,
        PRESETS: PRESETS,
        BOOLEAN_PRESETS: BOOLEAN_PRESETS,
        TEXT_PRESETS: TEXT_PRESETS,
        ICON_PRESETS: ICON_PRESETS,
        COLOR_PRESETS: COLOR_PRESETS,
        MAX_LEN: MAX_LEN
    };
})();
