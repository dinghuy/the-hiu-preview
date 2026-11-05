/**
 * EMPIRICAL ADVERSARIAL CHALLENGE & STRESS HARNESS
 * Target: /Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview
 *
 * Executed by: challenger_1 (teamwork_challenger)
 * Verified against: Headless Google Chrome v156 (Blink Engine via CDP) + Static CSS AST
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseCSS } from './css_parser.mjs';

const TARGET_DIR = '/Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview';
const HTML_PATH = path.join(TARGET_DIR, 'index.html');
const CSS_PATH = path.join(TARGET_DIR, 'styles.css');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9222;

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
const { rules, rootTokens, mediaRules } = parseCSS(cssContent);

class CDPClient {
  constructor(port) {
    this.port = port;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    // Poll for Chrome JSON endpoint
    let target = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const list = await res.json();
        target = list.find(t => t.type === 'page');
        if (target) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (!target) {
      throw new Error('Failed to find Chrome page target');
    }

    this.ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) cb.reject(new Error(msg.error.message));
        else cb.resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runAdversarialChallenge() {
  console.log('==============================================================================');
  console.log(' EMPIRICAL ADVERSARIAL CHALLENGE & STRESS HARNESS — THE HIU PREVIEW');
  console.log(' Target Directory:', TARGET_DIR);
  console.log(' Engine: Google Chrome (Headless CDP) + CSS AST Engine');
  console.log('==============================================================================\n');

  const challenges = [];

  function recordChallenge(category, title, passed, expected, actual, notes = '') {
    challenges.push({
      category,
      title,
      passed: Boolean(passed),
      expected: String(expected),
      actual: String(actual),
      notes
    });
  }

  // ---------------------------------------------------------------------------
  // AREA 1: CSS TOKEN STRICTNESS & INVARIANTS (Static & Semantic)
  // ---------------------------------------------------------------------------
  console.log('--- AREA 1: CSS TOKEN STRICTNESS & INVARIANTS ---');

  // 1.1 Invariant Ground Token
  const groundToken = rootTokens.get('--ground');
  recordChallenge(
    'CSS Tokens',
    'Root ground token strictly defined as #F9F8F5',
    groundToken && groundToken.toUpperCase() === '#F9F8F5',
    '#F9F8F5',
    groundToken
  );

  // 1.2 Inspect every background property in CSS AST for rogue tints
  const BANNED_ROGUE_TINTS = [
    '#EAE6DC', '#F4F2EC', '#F6F4EF', '#FAF9F6', '#F7F5EE', '#EFECE3',
    'rgb(234, 230, 220)', 'rgb(244, 242, 236)', 'rgb(246, 244, 239)',
    'rgb(250, 249, 246)', 'rgb(247, 245, 238)', 'rgb(239, 236, 227)'
  ];

  const rogueMatches = [];
  for (const [selector, decls] of rules.entries()) {
    for (const [prop, val] of decls.entries()) {
      if (prop.includes('background')) {
        for (const banned of BANNED_ROGUE_TINTS) {
          if (val.toLowerCase().includes(banned.toLowerCase())) {
            rogueMatches.push({ selector, prop, val });
          }
        }
      }
    }
  }

  recordChallenge(
    'CSS Tokens',
    'Zero rogue background tints in styles.css rules',
    rogueMatches.length === 0,
    '0 rogue tints',
    `${rogueMatches.length} rogue tints found (${JSON.stringify(rogueMatches)})`
  );

  // 1.3 Heading weights in CSS rule: h1, h2, h3, h4 must be explicitly font-weight: 400
  const h1Weight = rules.get('h1')?.get('font-weight');
  const h2Weight = rules.get('h2')?.get('font-weight');
  const h3Weight = rules.get('h3')?.get('font-weight');
  const h4Weight = rules.get('h4')?.get('font-weight');
  const allUniversalHeadings400 = h1Weight === '400' && h2Weight === '400' && h3Weight === '400' && h4Weight === '400';
  recordChallenge(
    'Typography',
    'Universal heading selectors (h1, h2, h3, h4) define explicit font-weight: 400',
    allUniversalHeadings400,
    'All 400',
    `h1: ${h1Weight}, h2: ${h2Weight}, h3: ${h3Weight}, h4: ${h4Weight}`
  );

  // Check specific heading classes in styles.css
  const specificHeadingClasses = [
    { sel: '.hero-headline', prop: 'font-weight', exp: '400' },
    { sel: '.section-title', prop: 'font-weight', exp: '400' },
    { sel: '.section-title em', prop: 'font-weight', exp: '400' },
    { sel: '.space-card-title', prop: 'font-weight', exp: '400' },
    { sel: '.room-name', prop: 'font-weight', exp: '400' },
    { sel: '.pricing-card-title', prop: 'font-weight', exp: '400' },
    { sel: '.step-title', prop: 'font-weight', exp: '400' },
    { sel: '.enquiry-info-pane h3', prop: 'font-weight', exp: '400' }
  ];

  for (const h of specificHeadingClasses) {
    const decls = rules.get(h.sel);
    const weight = decls ? decls.get(h.prop) : null;
    recordChallenge(
      'Typography',
      `Selector ${h.sel} defines explicit font-weight: ${h.exp}`,
      weight === h.exp,
      h.exp,
      weight
    );
  }

  // 1.4 Micro-interaction transform precision in CSS
  const spaceHover = rules.get('.space-card:hover');
  const spaceHoverTransform = spaceHover ? spaceHover.get('transform') : null;
  recordChallenge(
    'Micro-Interactions',
    '.space-card:hover transform is exactly translateY(-2px)',
    spaceHoverTransform === 'translateY(-2px)',
    'translateY(-2px)',
    spaceHoverTransform
  );

  const roomHover = rules.get('.room-card:hover');
  const roomHoverTransform = roomHover ? roomHover.get('transform') : null;
  recordChallenge(
    'Micro-Interactions',
    '.room-card:hover transform is exactly translateY(-2px)',
    roomHoverTransform === 'translateY(-2px)',
    'translateY(-2px)',
    roomHoverTransform
  );

  const roomImgHover = rules.get('.room-card:hover .room-media img');
  const roomImgTransform = roomImgHover ? roomImgHover.get('transform') : null;
  recordChallenge(
    'Micro-Interactions',
    '.room-card:hover .room-media img transform is exactly scale(1.025)',
    roomImgTransform === 'scale(1.025)',
    'scale(1.025)',
    roomImgTransform
  );

  const spaceImgHover = rules.get('.space-card:hover .space-card-media img');
  const spaceImgTransform = spaceImgHover ? spaceImgHover.get('transform') : null;
  recordChallenge(
    'Micro-Interactions',
    '.space-card:hover .space-card-media img transform is exactly scale(1.025)',
    spaceImgTransform === 'scale(1.025)',
    'scale(1.025)',
    spaceImgTransform
  );

  const btnActive = rules.get('.btn:active');
  const btnActiveTransform = btnActive ? btnActive.get('transform') : null;
  recordChallenge(
    'Micro-Interactions',
    '.btn:active transform is exactly scale(0.98)',
    btnActiveTransform === 'scale(0.98)',
    'scale(0.98)',
    btnActiveTransform
  );

  // ---------------------------------------------------------------------------
  // AREA 2: BROWSER EXECUTION WITH REAL CHROME
  // ---------------------------------------------------------------------------
  console.log('\n--- AREA 2 & 3: REAL CHROME CDP HEADLESS STRESS TESTING ---');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  const client = new CDPClient(CDP_PORT);
  try {
    await client.connect();
    console.log('Connected to Chrome DevTools Protocol successfully.');

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    await client.send('Runtime.enable');

    // Navigate to page
    const fileUrl = `file://${HTML_PATH}`;
    await client.send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 600));

    // 2.1 Computed background colors of all sections in real Chrome
    const sectionColors = await client.eval(`
      (() => {
        const sections = [
          { name: 'body', el: document.body },
          { name: '.hero-section', el: document.querySelector('.hero-section') },
          { name: '.space-section', el: document.querySelector('.space-section') },
          { name: '.rooms-section', el: document.querySelector('.rooms-section') },
          { name: '.pricing-section', el: document.querySelector('.pricing-section') },
          { name: '.trust-section', el: document.querySelector('.trust-section') },
          { name: '.enquiry-section', el: document.querySelector('.enquiry-section') },
          { name: '.site-footer', el: document.querySelector('.site-footer') }
        ];
        return sections.map(s => {
          if (!s.el) return { name: s.name, color: 'NOT_FOUND' };
          const comp = window.getComputedStyle(s.el);
          return { name: s.name, color: comp.backgroundColor };
        });
      })()
    `);

    for (const sec of sectionColors) {
      // In CSS, rgb(249, 248, 245) is #F9F8F5
      // Sections without explicit background will have rgba(0, 0, 0, 0) transparent, showing body ground
      const isLinenOrTransparent = sec.color === 'rgb(249, 248, 245)' || sec.color === 'rgba(0, 0, 0, 0)';
      recordChallenge(
        'Computed Backgrounds',
        `Section ${sec.name} resolves to linen ground (#F9F8F5)`,
        isLinenOrTransparent,
        'rgb(249, 248, 245) or transparent',
        sec.color
      );
    }

    // 2.2 Heading font-weights in Chrome DOM
    const headingComputedWeights = await client.eval(`
      (() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .step-title'));
        return headings.map(h => {
          const comp = window.getComputedStyle(h);
          return {
            tag: h.tagName,
            cls: h.className,
            text: h.textContent.trim().slice(0, 30),
            weight: comp.fontWeight
          };
        });
      })()
    `);

    let allHeadings400 = true;
    const failingHeadings = [];
    for (const h of headingComputedWeights) {
      if (h.weight !== '400') {
        allHeadings400 = false;
        failingHeadings.push(h);
      }
    }

    recordChallenge(
      'Computed Typography',
      `All ${headingComputedWeights.length} DOM headings evaluate to computed font-weight: 400`,
      allHeadings400,
      'All 400',
      allHeadings400 ? 'All 400' : `${failingHeadings.length} non-400 headings: ${JSON.stringify(failingHeadings)}`
    );

    // 2.3 Reduced-Motion Neutralization in Chrome
    console.log('Testing Reduced-Motion Media Emulation...');
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await new Promise(r => setTimeout(r, 200));

    const reducedMotionChecks = await client.eval(`
      (() => {
        const docScroll = window.getComputedStyle(document.documentElement).scrollBehavior;
        const heroBase = document.querySelector('.hero-layer-base img');
        const heroFrame = document.querySelector('.hero-layer-frame');
        const spaceCard = document.querySelector('.space-card');
        const roomCard = document.querySelector('.room-card');
        const btn = document.querySelector('.btn-primary');
        const modalClose = document.querySelector('.modal-close');

        // Scroll page to test parallax ticker
        window.scrollTo(0, 300);

        return {
          scrollBehavior: docScroll,
          heroBaseTransform: heroBase ? window.getComputedStyle(heroBase).transform : 'none',
          heroFrameTransform: heroFrame ? window.getComputedStyle(heroFrame).transform : 'none',
          heroBaseInlineStyle: heroBase ? heroBase.style.transform : '',
          heroFrameInlineStyle: heroFrame ? heroFrame.style.transform : '',
          spaceCardTransform: spaceCard ? window.getComputedStyle(spaceCard).transform : 'none',
          roomCardTransform: roomCard ? window.getComputedStyle(roomCard).transform : 'none',
          btnTransform: btn ? window.getComputedStyle(btn).transform : 'none',
          modalCloseTransform: modalClose ? window.getComputedStyle(modalClose).transform : 'none'
        };
      })()
    `);

    // Reset scroll
    await client.eval('window.scrollTo(0, 0)');

    recordChallenge(
      'Reduced Motion',
      'HTML scroll-behavior evaluates to auto under prefers-reduced-motion: reduce',
      reducedMotionChecks.scrollBehavior === 'auto',
      'auto',
      reducedMotionChecks.scrollBehavior
    );

    recordChallenge(
      'Reduced Motion',
      'Hero layer base transform evaluates to none under reduced-motion',
      reducedMotionChecks.heroBaseTransform === 'none',
      'none',
      reducedMotionChecks.heroBaseTransform
    );

    recordChallenge(
      'Reduced Motion',
      'Hero layer frame transform evaluates to none under reduced-motion',
      reducedMotionChecks.heroFrameTransform === 'none',
      'none',
      reducedMotionChecks.heroFrameTransform
    );

    recordChallenge(
      'Reduced Motion',
      'Hero layer base has empty inline transform on scroll when reduced-motion active',
      reducedMotionChecks.heroBaseInlineStyle === '',
      'empty string',
      `"${reducedMotionChecks.heroBaseInlineStyle}"`
    );

    recordChallenge(
      'Reduced Motion',
      'Cards and interactive elements evaluate to transform: none under reduced-motion',
      reducedMotionChecks.spaceCardTransform === 'none' &&
      reducedMotionChecks.roomCardTransform === 'none' &&
      reducedMotionChecks.btnTransform === 'none' &&
      reducedMotionChecks.modalCloseTransform === 'none',
      'All none',
      `spaceCard: ${reducedMotionChecks.spaceCardTransform}, roomCard: ${reducedMotionChecks.roomCardTransform}, btn: ${reducedMotionChecks.btnTransform}`
    );

    // Disable reduced-motion emulation for viewport tests
    await client.send('Emulation.setEmulatedMedia', { features: [] });

    // -------------------------------------------------------------------------
    // AREA 3: MULTI-VIEWPORT BOUNDARY & OVERFLOW STRESS TEST (12 Viewports)
    // -------------------------------------------------------------------------
    console.log('\n--- AREA 3: VIEWPORT BOUNDARY & OVERFLOW STRESS TEST ---');
    const viewports = [
      { name: 'iPhone SE Legacy', width: 320, height: 568 },
      { name: 'Galaxy S / Compact Android', width: 360, height: 640 },
      { name: 'iPhone SE Modern / mini', width: 375, height: 667 },
      { name: 'iPhone 12/13/14/15 Standard', width: 390, height: 844 },
      { name: 'Large Mobile / Small Phablet', width: 480, height: 800 },
      { name: 'iPad Mini / Tablet Portrait Boundary', width: 768, height: 1024 },
      { name: 'Android Tablet Portrait', width: 800, height: 1280 },
      { name: 'iPad Air/Pro 11" Portrait', width: 834, height: 1112 },
      { name: 'iPad Landscape / Small Laptop', width: 1024, height: 768 },
      { name: 'Container Max Boundary', width: 1200, height: 800 },
      { name: 'Desktop Standard 1080p Scale', width: 1440, height: 900 },
      { name: 'QHD / 4K Ultrawide Boundary', width: 2560, height: 1440 }
    ];

    for (const vp of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width <= 768
      });
      await new Promise(r => setTimeout(r, 80));

      const overflowResult = await client.eval(`
        (() => {
          const doc = document.documentElement;
          const scrollW = doc.scrollWidth;
          const clientW = doc.clientWidth;
          const hasDocOverflow = scrollW > clientW;

          // Check for clipped interactive elements inside cards
          const cards = [
            ...Array.from(document.querySelectorAll('.space-card')),
            ...Array.from(document.querySelectorAll('.room-card')),
            ...Array.from(document.querySelectorAll('.pricing-breakdown-card')),
            ...Array.from(document.querySelectorAll('.calc-card')),
            ...Array.from(document.querySelectorAll('.step-card')),
            document.querySelector('.enquiry-card')
          ].filter(Boolean);

          const clippedControls = [];
          for (const card of cards) {
            const cardRect = card.getBoundingClientRect();
            const controls = card.querySelectorAll('button, a, input, select, textarea');
            for (const ctrl of controls) {
              const cRect = ctrl.getBoundingClientRect();
              if (cRect.right > cardRect.right + 1) {
                clippedControls.push({
                  card: card.className.split(' ')[0],
                  element: ctrl.tagName + (ctrl.id ? '#' + ctrl.id : '.' + ctrl.className.split(' ')[0]),
                  cardRight: Math.round(cardRect.right),
                  elemRight: Math.round(cRect.right),
                  clippedPx: Math.round(cRect.right - cardRect.right)
                });
              }
            }
          }

          return {
            scrollW,
            clientW,
            hasDocOverflow,
            clippedCount: clippedControls.length,
            clippedControls
          };
        })()
      `);

      // 3.1 Document Element Overflow invariant
      recordChallenge(
        'Document Scroll Overflow',
        `Viewport ${vp.width}px (${vp.name}): documentElement scrollWidth === clientWidth (zero document overflow)`,
        !overflowResult.hasDocOverflow,
        `scrollWidth === ${vp.width}`,
        `scrollWidth: ${overflowResult.scrollW}, clientWidth: ${overflowResult.clientW}`
      );

      // 3.2 Card Interior Containment invariant
      recordChallenge(
        'Card Layout Containment',
        `Viewport ${vp.width}px (${vp.name}): all card interactive controls fully contained (zero clipping)`,
        overflowResult.clippedCount === 0,
        '0 clipped controls',
        overflowResult.clippedCount === 0 ? '0 clipped controls' : `${overflowResult.clippedCount} clipped controls: ${JSON.stringify(overflowResult.clippedControls)}`
      );
    }

    // 3.2 Mobile Header Clearance at 360px
    console.log('\nTesting Mobile Header Clearance at 360px...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 640,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 80));

    const headerClearance = await client.eval(`
      (() => {
        const brand = document.querySelector('.brand-mark');
        const navCta = document.querySelector('.nav-cta-group');
        const btnOutline = document.querySelector('.nav-cta-group .btn-outline');

        const brandRect = brand.getBoundingClientRect();
        const ctaRect = navCta.getBoundingClientRect();
        const clearancePx = ctaRect.left - brandRect.right;
        const btnOutlineDisplay = btnOutline ? window.getComputedStyle(btnOutline).display : 'none';

        return {
          brandRight: brandRect.right,
          ctaLeft: ctaRect.left,
          clearancePx: Math.round(clearancePx),
          btnOutlineDisplay
        };
      })()
    `);

    recordChallenge(
      'Mobile Header',
      'Mobile header at 360px hides secondary outline CTA to avoid crowding',
      headerClearance.btnOutlineDisplay === 'none',
      'none',
      headerClearance.btnOutlineDisplay
    );

    recordChallenge(
      'Mobile Header',
      'Mobile header at 360px has generous clearance (>= 100px) between brand mark and CTA',
      headerClearance.clearancePx >= 100,
      '>= 100px clearance',
      `${headerClearance.clearancePx}px clearance`
    );

    // 3.3 SVG Floorplan Pan Capability at 390px
    console.log('\nTesting SVG Floorplan Pan Capability at 390px...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 80));

    const floorplanPan = await client.eval(`
      (() => {
        const wrap = document.querySelector('.floorplan-svg-wrap');
        const svg = wrap ? wrap.querySelector('svg') : null;
        if (!wrap || !svg) return { error: 'Not found' };

        const wrapComp = window.getComputedStyle(wrap);
        const initialScrollLeft = wrap.scrollLeft;

        // Simulate touch pan scroll
        wrap.scrollLeft = 50;
        const pannedScrollLeft = wrap.scrollLeft;
        wrap.scrollLeft = 0; // reset

        return {
          overflowX: wrapComp.overflowX,
          wrapClientWidth: wrap.clientWidth,
          wrapScrollWidth: wrap.scrollWidth,
          svgMinWidth: window.getComputedStyle(svg).minWidth,
          canPan: pannedScrollLeft > 0 || wrap.scrollWidth > wrap.clientWidth
        };
      })()
    `);

    recordChallenge(
      'Floorplan SVG Pan',
      'Floorplan SVG wrapper at 390px specifies overflow-x: auto',
      floorplanPan.overflowX === 'auto',
      'auto',
      floorplanPan.overflowX
    );

    recordChallenge(
      'Floorplan SVG Pan',
      'Floorplan SVG wrapper at 390px allows horizontal panning (scrollWidth > clientWidth)',
      floorplanPan.canPan,
      'true (can pan horizontally)',
      `canPan: ${floorplanPan.canPan}, scrollWidth: ${floorplanPan.wrapScrollWidth}px, clientWidth: ${floorplanPan.wrapClientWidth}px, svgMinWidth: ${floorplanPan.svgMinWidth}`
    );

  } catch (err) {
    console.error('Test execution error:', err);
    recordChallenge('Execution Error', 'Test suite completes without unexpected exception', false, 'Clean completion', err.message);
  } finally {
    client.close();
    chromeProc.kill();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(' ADVERSARIAL CHALLENGE RESULTS MATRIX');
  console.log('==============================================================================');

  let passedCount = 0;
  let failedCount = 0;

  for (const c of challenges) {
    const statusMark = c.passed ? '✔ PASS' : '✖ FAIL';
    console.log(`[${statusMark}] [${c.category}] ${c.title}`);
    if (!c.passed) {
      console.log(`       Expected: ${c.expected}`);
      console.log(`       Actual:   ${c.actual}`);
      if (c.notes) console.log(`       Notes:    ${c.notes}`);
    }
    if (c.passed) passedCount++;
    else failedCount++;
  }

  console.log('------------------------------------------------------------------------------');
  console.log(`TOTAL CHALLENGES: ${challenges.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('==============================================================================');

  const verdict = failedCount === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
  console.log(`OVERALL VERDICT: ${verdict}`);

  return {
    total: challenges.length,
    passed: passedCount,
    failed: failedCount,
    verdict,
    challenges
  };
}

runAdversarialChallenge().then(res => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
