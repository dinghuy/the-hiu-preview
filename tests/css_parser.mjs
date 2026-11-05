/**
 * CSS Parser and Token Inspector for Headless Style Auditing
 * Parses CSS custom properties, selectors, media queries, and property declarations.
 * Properly handles quotes, URLs, and nested blocks.
 */

export function parseCSS(cssString) {
  // 1. Remove comments
  const strippedCSS = cssString.replace(/\/\*[\s\S]*?\*\//g, '');

  const rootTokens = new Map();
  const rules = new Map();
  const mediaRules = new Map();

  function parseDeclarations(block) {
    const decls = new Map();
    // Split by semicolons, but respect quotes/urls
    const pairs = [];
    let cur = '';
    let inQuotes = null;
    let inParen = 0;

    for (let i = 0; i < block.length; i++) {
      const ch = block[i];
      if (inQuotes) {
        cur += ch;
        if (ch === inQuotes && block[i - 1] !== '\\') inQuotes = null;
      } else if (ch === '"' || ch === "'") {
        inQuotes = ch;
        cur += ch;
      } else if (ch === '(') {
        inParen++;
        cur += ch;
      } else if (ch === ')') {
        if (inParen > 0) inParen--;
        cur += ch;
      } else if (ch === ';' && inParen === 0) {
        pairs.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) pairs.push(cur.trim());

    for (const pair of pairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = pair.slice(0, colonIdx).trim().toLowerCase();
      const val = pair.slice(colonIdx + 1).trim();
      if (prop && val) {
        decls.set(prop, val);
      }
    }
    return decls;
  }

  let pos = 0;
  const len = strippedCSS.length;

  while (pos < len) {
    while (pos < len && /\s/.test(strippedCSS[pos])) pos++;
    if (pos >= len) break;

    if (strippedCSS.startsWith('@media', pos)) {
      const openBrace = strippedCSS.indexOf('{', pos);
      if (openBrace === -1) break;

      const mediaQuery = strippedCSS.slice(pos + 6, openBrace).trim();
      let depth = 1;
      let closeBrace = openBrace + 1;

      while (closeBrace < len && depth > 0) {
        if (strippedCSS[closeBrace] === '{') depth++;
        else if (strippedCSS[closeBrace] === '}') depth--;
        closeBrace++;
      }

      const mediaBody = strippedCSS.slice(openBrace + 1, closeBrace - 1);
      const subRules = new Map();

      // Parse inner rules inside media query
      let mPos = 0;
      const mLen = mediaBody.length;
      while (mPos < mLen) {
        while (mPos < mLen && /\s/.test(mediaBody[mPos])) mPos++;
        if (mPos >= mLen) break;

        const mOpen = mediaBody.indexOf('{', mPos);
        if (mOpen === -1) break;
        const mClose = mediaBody.indexOf('}', mOpen);
        if (mClose === -1) break;

        const selectors = mediaBody.slice(mPos, mOpen).split(',').map(s => s.trim()).filter(Boolean);
        const decls = parseDeclarations(mediaBody.slice(mOpen + 1, mClose));

        for (const sel of selectors) {
          if (!subRules.has(sel)) subRules.set(sel, new Map());
          for (const [p, v] of decls.entries()) {
            subRules.get(sel).set(p, v);
          }
        }

        mPos = mClose + 1;
      }

      mediaRules.set(mediaQuery, subRules);
      pos = closeBrace;
    } else if (strippedCSS.startsWith('@', pos)) {
      // Find end of @-rule (semicolon outside quotes/parens)
      let endIdx = pos;
      let inQuotes = null;
      let inParen = 0;
      while (endIdx < len) {
        const ch = strippedCSS[endIdx];
        if (inQuotes) {
          if (ch === inQuotes && strippedCSS[endIdx - 1] !== '\\') inQuotes = null;
        } else if (ch === '"' || ch === "'") {
          inQuotes = ch;
        } else if (ch === '(') {
          inParen++;
        } else if (ch === ')') {
          if (inParen > 0) inParen--;
        } else if (ch === ';' && inParen === 0) {
          break;
        }
        endIdx++;
      }
      pos = endIdx + 1;
    } else {
      // Standard rule
      const openBrace = strippedCSS.indexOf('{', pos);
      if (openBrace === -1) break;
      const closeBrace = strippedCSS.indexOf('}', openBrace);
      if (closeBrace === -1) break;

      const selectors = strippedCSS.slice(pos, openBrace).split(',').map(s => s.trim()).filter(Boolean);
      const decls = parseDeclarations(strippedCSS.slice(openBrace + 1, closeBrace));

      for (const sel of selectors) {
        if (sel === ':root') {
          for (const [p, v] of decls.entries()) {
            if (p.startsWith('--')) {
              rootTokens.set(p, v);
            }
          }
        }

        if (!rules.has(sel)) rules.set(sel, new Map());
        for (const [p, v] of decls.entries()) {
          rules.get(sel).set(p, v);
        }
      }

      pos = closeBrace + 1;
    }
  }

  return {
    rootTokens,
    rules,
    mediaRules,

    getRootToken(name) {
      return rootTokens.get(name.startsWith('--') ? name : `--${name}`) ?? null;
    },

    getDeclaration(selector, property, mediaQueryCondition = null) {
      const prop = property.toLowerCase();
      if (mediaQueryCondition) {
        for (const [mq, subRules] of mediaRules.entries()) {
          if (mq.includes(mediaQueryCondition)) {
            const decls = subRules.get(selector);
            if (decls && decls.has(prop)) return decls.get(prop);
          }
        }
        return null;
      }

      const decls = rules.get(selector);
      return decls?.get(prop) ?? null;
    },

    hasDeclaration(selector, property, matcher, mediaQueryCondition = null) {
      const val = this.getDeclaration(selector, property, mediaQueryCondition);
      if (val === null) return false;
      if (typeof matcher === 'string') {
        return val.toLowerCase().includes(matcher.toLowerCase());
      }
      if (matcher instanceof RegExp) {
        return matcher.test(val);
      }
      if (typeof matcher === 'function') {
        return matcher(val);
      }
      return Boolean(val);
    }
  };
}
