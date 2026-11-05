/**
 * Lightweight, high-fidelity DOM & Browser Environment for Headless Node.js Testing
 * Provides DOM tree representation, event dispatching, querySelector, classList, styles,
 * and VM sandbox execution for app.js.
 */

import vm from 'node:vm';

export const MockEvent = typeof Event !== 'undefined'
  ? Event
  : class Event {
      constructor(type, options) {
        this.type = type;
        this.bubbles = !!(options && options.bubbles);
      }
    };

export { MockEvent as Event };

export class MockElement {
  constructor(tagName = 'div', attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.style = {};
    this._textContent = '';
    this._value = '';
    this.min = '';
    this.max = '';
    this.offsetHeight = 100;
    this.offsetWidth = 100;
    this.scrollHeight = 100;

    for (const [k, v] of Object.entries(attributes)) {
      this.setAttribute(k, v);
    }

    const classSet = new Set();
    if (attributes.class) {
      attributes.class.split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
    }

    this.classList = {
      add: (...tokens) => tokens.forEach(t => classSet.add(t)),
      remove: (...tokens) => tokens.forEach(t => classSet.delete(t)),
      contains: (token) => classSet.has(token),
      toggle: (token, force) => {
        if (force === true) { classSet.add(token); return true; }
        if (force === false) { classSet.delete(token); return false; }
        if (classSet.has(token)) { classSet.delete(token); return false; }
        classSet.add(token);
        return true;
      },
      toString: () => Array.from(classSet).join(' ')
    };
  }

  get id() {
    return this.getAttribute('id') || '';
  }
  set id(val) {
    this.setAttribute('id', val);
  }

  get className() {
    return this.classList.toString();
  }
  set className(val) {
    this.classList = {
      add: (...tokens) => tokens.forEach(t => classSet.add(t)),
      remove: (...tokens) => tokens.forEach(t => classSet.delete(t)),
      contains: (token) => classSet.has(token),
      toggle: (token) => {},
      toString: () => val
    };
    this.setAttribute('class', val);
  }

  get value() {
    return this._value;
  }
  set value(val) {
    this._value = String(val);
  }

  get textContent() {
    let text = this._textContent || '';
    for (const child of this.children) {
      const childText = child.textContent;
      if (childText) {
        text = text ? `${text} ${childText}` : childText;
      }
    }
    return text;
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get href() {
    return this.getAttribute('href') || '';
  }
  set href(val) {
    this.setAttribute('href', val);
  }

  get target() {
    return this.getAttribute('target') || '';
  }

  get rel() {
    return this.getAttribute('rel') || '';
  }

  get type() {
    return this.getAttribute('type') || '';
  }

  getAttribute(name) {
    return this.attributes.get(name.toLowerCase()) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name.toLowerCase(), String(value));
    if (name.toLowerCase() === 'value') {
      this._value = String(value);
    }
  }

  hasAttribute(name) {
    return this.attributes.has(name.toLowerCase());
  }

  removeAttribute(name) {
    this.attributes.delete(name.toLowerCase());
  }

  addEventListener(type, listener, options = {}) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push({ listener, options });
  }

  removeEventListener(type, listener) {
    if (!this.listeners.has(type)) return;
    const filtered = this.listeners.get(type).filter(l => l.listener !== listener);
    this.listeners.set(type, filtered);
  }

  dispatchEvent(event) {
    if (!event) return false;
    try {
      if (!event.target) event.target = this;
    } catch (_) {
      try {
        Object.defineProperty(event, 'target', { value: this, configurable: true });
      } catch (_) {}
    }
    try {
      event.currentTarget = this;
    } catch (_) {
      try {
        Object.defineProperty(event, 'currentTarget', { value: this, configurable: true });
      } catch (_) {}
    }
    if (typeof event.preventDefault !== 'function') {
      event.preventDefault = () => { event.defaultPrevented = true; };
    }
    if (typeof event.stopPropagation !== 'function') {
      event.stopPropagation = () => { event._stopPropagation = true; };
    }
    if (typeof event.stopImmediatePropagation !== 'function') {
      event.stopImmediatePropagation = () => { event._stopImmediatePropagation = true; };
    }
    const list = this.listeners.get(event.type) || [];
    for (const { listener } of list) {
      listener.call(this, event);
      if (event._stopImmediatePropagation) break;
    }
    if (!event._stopPropagation && this.parentElement) {
      this.parentElement.dispatchEvent(event);
    }
    return !event.defaultPrevented;
  }

  focus() {
    if (this._ownerDocument) {
      this._ownerDocument.activeElement = this;
    }
  }

  blur() {
    if (this._ownerDocument && this._ownerDocument.activeElement === this) {
      this._ownerDocument.activeElement = null;
    }
  }

  appendChild(child) {
    child.parentElement = this;
    child._ownerDocument = this._ownerDocument;
    this.children.push(child);
  }

  matchesSelector(selector) {
    selector = selector.trim();
    if (!selector) return false;

    // Handle :not([disabled])
    if (selector.includes(':not([disabled])')) {
      if (this.hasAttribute('disabled')) return false;
      selector = selector.replace(':not([disabled])', '');
    }

    // Split compound / pseudo-selector
    const cleanSelector = selector.split(':')[0]; // ignore :hover, :active for DOM match

    // ID selector
    if (cleanSelector.startsWith('#')) {
      return this.id === cleanSelector.slice(1);
    }

    // Class selector
    if (cleanSelector.startsWith('.')) {
      const cls = cleanSelector.slice(1);
      return this.classList.contains(cls);
    }

    // Tag selector
    if (/^[A-Za-z0-9_-]+$/.test(cleanSelector)) {
      return this.tagName === cleanSelector.toUpperCase();
    }

    // Attribute selector [attr] or [attr="val"]
    const attrMatch = cleanSelector.match(/^\[([a-zA-Z0-9_-]+)(?:=["\x27]?([^"\x27\]]+)["\x27]?)?\]$/);
    if (attrMatch) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2];
      if (!this.hasAttribute(attrName)) return false;
      if (attrVal !== undefined) return this.getAttribute(attrName) === attrVal;
      return true;
    }

    return false;
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(selector) {
    selector = selector.trim();
    if (selector.includes(',')) {
      const subSelectors = selector.split(',').map(s => s.trim()).filter(Boolean);
      const combined = [];
      for (const sub of subSelectors) {
        for (const el of this.querySelectorAll(sub)) {
          if (!combined.includes(el)) combined.push(el);
        }
      }
      return combined;
    }
    const results = [];
    const parts = selector.split(/\s+/);

    const testSubtree = (node, partIndex) => {
      const targetPart = parts[partIndex];
      const isMatch = node.matchesSelector(targetPart);

      if (isMatch) {
        if (partIndex === parts.length - 1) {
          results.push(node);
        } else {
          for (const child of node.children) {
            testSubtree(child, partIndex + 1);
          }
        }
      }

      for (const child of node.children) {
        testSubtree(child, partIndex === 0 && !isMatch ? 0 : partIndex);
      }
    };

    for (const child of this.children) {
      testSubtree(child, 0);
    }

    return results;
  }
}

/**
 * Basic HTML Parser to construct a DOM tree from HTML string
 */
export function parseHTML(htmlString) {
  const root = new MockElement('root');
  const stack = [root];

  // Regex to extract tags
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9:-]+)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(htmlString)) !== null) {
    const [fullMatch, isClosing, tagName, attrString, textContent] = match;

    if (fullMatch.startsWith('<!--')) {
      continue; // Skip comments
    }

    if (textContent) {
      const trimmed = textContent.trim();
      if (trimmed && stack.length > 0) {
        const current = stack[stack.length - 1];
        current._textContent += (current._textContent ? ' ' : '') + trimmed;
      }
      continue;
    }

    const lowerTag = tagName.toLowerCase();
    const selfClosingTags = new Set(['meta', 'link', 'img', 'br', 'hr', 'input']);

    if (isClosing) {
      // Find matching tag in stack
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].tagName === tagName.toUpperCase()) {
          stack.splice(i);
          break;
        }
      }
    } else {
      // Opening tag
      const attributes = {};
      if (attrString) {
        const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrString)) !== null) {
          const key = attrMatch[1];
          const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          attributes[key] = val;
        }
      }

      const element = new MockElement(lowerTag, attributes);
      const parent = stack[stack.length - 1];
      parent.appendChild(element);

      if (!selfClosingTags.has(lowerTag) && !attrString.endsWith('/')) {
        stack.push(element);
      }
    }
  }

  return root;
}

/**
 * Creates an isolated mock DOM environment with window, document, and runtime event support
 */
export function createDOMEnvironment(htmlContent, options = {}) {
  const root = parseHTML(htmlContent);

  const docListeners = new Map();
  const winListeners = new Map();
  const openedUrls = [];

  const elementsById = new Map();
  const indexElements = (node) => {
    if (node.id) elementsById.set(node.id, node);
    for (const child of node.children) {
      indexElements(child);
    }
  };
  indexElements(root);

  const body = root.querySelector('body') || new MockElement('body');
  const html = root.querySelector('html') || new MockElement('html');

  let activeElement = null;

  const mockDocument = {
    documentElement: html,
    body: body,
    get activeElement() {
      return activeElement;
    },
    set activeElement(el) {
      activeElement = el;
    },
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (sel) => root.querySelector(sel),
    querySelectorAll: (sel) => root.querySelectorAll(sel),
    addEventListener: (type, fn) => {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!docListeners.has(type)) return;
      docListeners.set(type, docListeners.get(type).filter(f => f !== fn));
    },
    dispatchEvent: (ev) => {
      const list = docListeners.get(ev.type) || [];
      for (const fn of list) fn(ev);
    }
  };

  root._ownerDocument = mockDocument;
  const setOwner = (node) => {
    node._ownerDocument = mockDocument;
    for (const child of node.children) setOwner(child);
  };
  setOwner(root);

  let reducedMotionMatches = Boolean(options.prefersReducedMotion);
  const mediaQueryListeners = [];

  const mockWindow = {
    scrollY: 0,
    innerHeight: options.innerHeight || 844,
    innerWidth: options.innerWidth || 1200,
    openedUrls,
    addEventListener: (type, fn) => {
      if (!winListeners.has(type)) winListeners.set(type, []);
      winListeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!winListeners.has(type)) return;
      winListeners.set(type, winListeners.get(type).filter(f => f !== fn));
    },
    dispatchEvent: (ev) => {
      const list = winListeners.get(ev.type) || [];
      for (const fn of list) fn(ev);
    },
    matchMedia: (query) => ({
      get matches() {
        if (query.includes('prefers-reduced-motion: reduce')) {
          return reducedMotionMatches;
        }
        return false;
      },
      addEventListener: (ev, fn) => {
        if (ev === 'change') mediaQueryListeners.push(fn);
      },
      removeEventListener: (ev, fn) => {
        const idx = mediaQueryListeners.indexOf(fn);
        if (idx !== -1) mediaQueryListeners.splice(idx, 1);
      }
    }),
    setReducedMotion: (val) => {
      reducedMotionMatches = Boolean(val);
      const ev = { matches: reducedMotionMatches, media: '(prefers-reduced-motion: reduce)' };
      for (const fn of mediaQueryListeners) fn(ev);
    },
    requestAnimationFrame: (cb) => cb(),
    open: (url, target, features) => {
      openedUrls.push({ url, target, features });
      return {};
    },
    Event: typeof Event !== 'undefined' ? Event : MockEvent
  };

  function runApp(appCode, contextOverrides = {}) {
    const sandbox = {
      document: mockDocument,
      window: mockWindow,
      Event: typeof Event !== 'undefined' ? Event : MockEvent,
      matchMedia: mockWindow.matchMedia,
      requestAnimationFrame: mockWindow.requestAnimationFrame,
      Date: contextOverrides.Date || Date,
      parseInt,
      parseFloat,
      Math,
      encodeURIComponent,
      decodeURIComponent,
      console,
      setTimeout,
      clearTimeout,
      ...contextOverrides
    };

    vm.createContext(sandbox);
    vm.runInContext(appCode, sandbox);
    return sandbox;
  }

  return {
    root,
    document: mockDocument,
    window: mockWindow,
    Event: typeof Event !== 'undefined' ? Event : MockEvent,
    openedUrls,
    runApp
  };
}
