/**
 * MOBILE UX & CHAPTER NAVIGATION VERIFICATION HARNESS
 * Target: /Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview
 *
 * Verifies:
 *  1. Act 3 Bedroom Suites Carousel (<992px horizontal scroll-snap, buttons, dots, counter, desktop grid)
 *  2. Mobile Sticky Bottom Action Bar (<768px, price/capacity anchor, WhatsApp CTA, IntersectionObserver)
 *  3. Desktop Floating Left Navigation Rail (>=1024px, 5 chapters, bronze active, click-to-scroll, scrollspy)
 *  4. Mobile Section Breadcrumb Pill (<1024px, scrollspy updates, 360px clearance preservation)
 *  5. Universal Invariants (Zero document overflow, font-weight 400, reduced motion)
 *
 * Engine: Google Chrome Headless CDP (Port 9225)
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const TARGET_DIR = '/Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview';
const HTML_PATH = path.join(TARGET_DIR, 'index.html');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9225;
const TEMP_USER_DIR = path.join(os.tmpdir(), `chrome-mobile-nav-${Date.now()}`);

class CDPClient {
  constructor(port) {
    this.port = port;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    let target = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const list = await res.json();
        target = list.find(t => t.type === 'page');
        if (target) break;
      } catch (_) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (!target) {
      throw new Error('Failed to find Chrome page target on port ' + this.port);
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

async function runMobileUXNavVerification() {
  console.log('==============================================================================');
  console.log(' MOBILE UX & NAVIGATION SYSTEMS VERIFICATION HARNESS');
  console.log(' Target:', TARGET_DIR);
  console.log(' Engine: Google Chrome Headless CDP on port', CDP_PORT);
  console.log('==============================================================================\n');

  const results = [];
  function record(area, description, pass, expected, actual) {
    results.push({ area, description, pass: Boolean(pass), expected: String(expected), actual: String(actual) });
    const mark = pass ? '✔ PASS' : '✖ FAIL';
    console.log(`[${mark}] [${area}] ${description}`);
    if (!pass) {
      console.log(`       Expected: ${expected}`);
      console.log(`       Actual:   ${actual}`);
    }
  }

  // --- SUITE 1: STATIC DOM CONTRACT & ASSET AUDIT ---
  console.log('--- SUITE 1: STATIC DOM CONTRACT & AUDIT ---');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  record('Static DOM', '#rooms-carousel wrapper exists in HTML', html.includes('id="rooms-carousel"'), 'true', html.includes('id="rooms-carousel"'));
  record('Static DOM', '#rooms-grid exists in HTML', html.includes('id="rooms-grid"'), 'true', html.includes('id="rooms-grid"'));
  record('Static DOM', '#rooms-carousel-controls exists', html.includes('id="rooms-carousel-controls"'), 'true', html.includes('id="rooms-carousel-controls"'));
  record('Static DOM', '#rooms-prev-btn and #rooms-next-btn exist', html.includes('id="rooms-prev-btn"') && html.includes('id="rooms-next-btn"'), 'true', 'true');
  record('Static DOM', '#rooms-dots and #rooms-counter exist', html.includes('id="rooms-dots"') && html.includes('id="rooms-counter"'), 'true', 'true');
  record('Static DOM', '#side-nav-rail chapter navigation exists', html.includes('id="side-nav-rail"'), 'true', html.includes('id="side-nav-rail"'));
  record('Static DOM', '#side-nav-rail defines 5 chapter links', (html.match(/class="side-nav-item/g) || []).length === 5, '5', (html.match(/class="side-nav-item/g) || []).length);
  record('Static DOM', '#mobile-action-bar exists', html.includes('id="mobile-action-bar"'), 'true', html.includes('id="mobile-action-bar"'));
  record('Static DOM', '#bar-whatsapp-btn exists with valid WhatsApp URL', html.includes('id="bar-whatsapp-btn"') && html.includes('https://wa.me/84900000000'), 'true', 'true');
  record('Static DOM', '#mobile-act-indicator exists with #mobile-act-text', html.includes('id="mobile-act-indicator"') && html.includes('id="mobile-act-text"'), 'true', 'true');

  // Spawn Chrome on port 9225
  fs.mkdirSync(TEMP_USER_DIR, { recursive: true });
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  const client = new CDPClient(CDP_PORT);
  try {
    await client.connect();
    console.log(`\nConnected to Chrome DevTools Protocol on port ${CDP_PORT}\n`);

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    await client.send('Runtime.enable');

    const fileUrl = `file://${HTML_PATH}`;
    await client.send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 800));

    // --- SUITE 2: BEDROOM SUITES CAROUSEL (<992px & DESKTOP) ---
    console.log('--- SUITE 2: BEDROOM SUITES CAROUSEL INTERACTION (<992px) ---');
    // Set viewport to mobile standard 390px x 844px
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 150));

    // Scroll to #rooms
    await client.eval(`
      (() => {
        const roomsEl = document.getElementById('rooms');
        if (roomsEl) roomsEl.scrollIntoView({ behavior: 'instant' });
      })()
    `);
    await new Promise(r => setTimeout(r, 200));

    const carouselInitial = await client.eval(`
      (() => {
        const grid = document.getElementById('rooms-grid');
        const controls = document.getElementById('rooms-carousel-controls');
        const prevBtn = document.getElementById('rooms-prev-btn');
        const nextBtn = document.getElementById('rooms-next-btn');
        const counter = document.getElementById('rooms-counter');
        const dots = Array.from(document.querySelectorAll('#rooms-dots .carousel-dot'));
        const gridComp = window.getComputedStyle(grid);
        const controlsComp = window.getComputedStyle(controls);

        return {
          gridOverflowX: gridComp.overflowX,
          controlsDisplay: controlsComp.display,
          counterText: counter ? counter.textContent.trim() : '',
          prevDisabled: prevBtn ? prevBtn.disabled : false,
          nextDisabled: nextBtn ? nextBtn.disabled : false,
          activeDotIndex: dots.findIndex(d => d.classList.contains('is-active')),
          activeDotSelected: dots[0] ? dots[0].getAttribute('aria-selected') : 'false'
        };
      })()
    `);

    record('Carousel Mobile', 'Rooms grid has overflow-x auto or scroll at 390px', ['auto', 'scroll'].includes(carouselInitial.gridOverflowX), 'auto|scroll', carouselInitial.gridOverflowX);
    record('Carousel Mobile', 'Carousel navigation controls are displayed (flex) at 390px', carouselInitial.controlsDisplay === 'flex', 'flex', carouselInitial.controlsDisplay);
    record('Carousel Mobile', 'Initial slide counter is "01 / 03"', carouselInitial.counterText === '01 / 03', '01 / 03', carouselInitial.counterText);
    record('Carousel Mobile', 'Initial Prev button is disabled (at slide 0)', carouselInitial.prevDisabled === true, 'true', carouselInitial.prevDisabled);
    record('Carousel Mobile', 'Initial Next button is enabled', carouselInitial.nextDisabled === false, 'false', carouselInitial.nextDisabled);
    record('Carousel Mobile', 'Initial active dot is index 0 with aria-selected="true"', carouselInitial.activeDotIndex === 0 && carouselInitial.activeDotSelected === 'true', '0 and true', `${carouselInitial.activeDotIndex} and ${carouselInitial.activeDotSelected}`);

    // Click Next button
    const step1Next = await client.eval(`
      (() => {
        const nextBtn = document.getElementById('rooms-next-btn');
        if (nextBtn) nextBtn.click();
        const prevBtn = document.getElementById('rooms-prev-btn');
        const counter = document.getElementById('rooms-counter');
        const dots = Array.from(document.querySelectorAll('#rooms-dots .carousel-dot'));
        return {
          counterText: counter ? counter.textContent.trim() : '',
          prevDisabled: prevBtn ? prevBtn.disabled : true,
          nextDisabled: nextBtn ? nextBtn.disabled : false,
          activeDotIndex: dots.findIndex(d => d.classList.contains('is-active'))
        };
      })()
    `);
    record('Carousel Mobile', 'Clicking Next advances slide counter to "02 / 03"', step1Next.counterText === '02 / 03', '02 / 03', step1Next.counterText);
    record('Carousel Mobile', 'Prev button enables at slide 1', step1Next.prevDisabled === false, 'false', step1Next.prevDisabled);
    record('Carousel Mobile', 'Active dot updates to index 1', step1Next.activeDotIndex === 1, '1', step1Next.activeDotIndex);

    // Click Next again to reach boundary (slide 2 / index 2)
    const step2Next = await client.eval(`
      (() => {
        const nextBtn = document.getElementById('rooms-next-btn');
        if (nextBtn) nextBtn.click();
        const prevBtn = document.getElementById('rooms-prev-btn');
        const counter = document.getElementById('rooms-counter');
        const dots = Array.from(document.querySelectorAll('#rooms-dots .carousel-dot'));
        return {
          counterText: counter ? counter.textContent.trim() : '',
          prevDisabled: prevBtn ? prevBtn.disabled : true,
          nextDisabled: nextBtn ? nextBtn.disabled : false,
          activeDotIndex: dots.findIndex(d => d.classList.contains('is-active'))
        };
      })()
    `);
    record('Carousel Mobile', 'Clicking Next reaches final slide "03 / 03"', step2Next.counterText === '03 / 03', '03 / 03', step2Next.counterText);
    record('Carousel Mobile', 'Next button disables at final slide 2', step2Next.nextDisabled === true, 'true', step2Next.nextDisabled);
    record('Carousel Mobile', 'Active dot updates to index 2', step2Next.activeDotIndex === 2, '2', step2Next.activeDotIndex);

    // Click Prev button
    const step3Prev = await client.eval(`
      (() => {
        const prevBtn = document.getElementById('rooms-prev-btn');
        if (prevBtn) prevBtn.click();
        const nextBtn = document.getElementById('rooms-next-btn');
        const counter = document.getElementById('rooms-counter');
        const dots = Array.from(document.querySelectorAll('#rooms-dots .carousel-dot'));
        return {
          counterText: counter ? counter.textContent.trim() : '',
          nextDisabled: nextBtn ? nextBtn.disabled : true,
          activeDotIndex: dots.findIndex(d => d.classList.contains('is-active'))
        };
      })()
    `);
    record('Carousel Mobile', 'Clicking Prev returns slide counter to "02 / 03"', step3Prev.counterText === '02 / 03', '02 / 03', step3Prev.counterText);
    record('Carousel Mobile', 'Next button re-enables', step3Prev.nextDisabled === false, 'false', step3Prev.nextDisabled);

    // Click Dot 0
    const step4Dot = await client.eval(`
      (() => {
        const dot0 = document.querySelector('#rooms-dots .carousel-dot[data-slide="0"]');
        if (dot0) dot0.click();
        const counter = document.getElementById('rooms-counter');
        const prevBtn = document.getElementById('rooms-prev-btn');
        const dots = Array.from(document.querySelectorAll('#rooms-dots .carousel-dot'));
        return {
          counterText: counter ? counter.textContent.trim() : '',
          prevDisabled: prevBtn ? prevBtn.disabled : false,
          activeDotIndex: dots.findIndex(d => d.classList.contains('is-active'))
        };
      })()
    `);
    record('Carousel Mobile', 'Clicking Dot 0 jumps directly back to "01 / 03"', step4Dot.counterText === '01 / 03', '01 / 03', step4Dot.counterText);
    record('Carousel Mobile', 'Prev button disables on return to slide 0', step4Dot.prevDisabled === true, 'true', step4Dot.prevDisabled);

    await new Promise(r => setTimeout(r, 350));

    // Touch swipe / scroll event synchronization simulation
    await client.eval(`
      (() => {
        const grid = document.getElementById('rooms-grid');
        const cards = Array.from(grid.querySelectorAll('.room-card'));
        if (cards[2]) {
          grid.scrollTo({ left: cards[2].offsetLeft - grid.offsetLeft, behavior: 'instant' });
          grid.dispatchEvent(new Event('scroll'));
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 200));

    const scrollSync = await client.eval(`
      (() => {
        const counter = document.getElementById('rooms-counter');
        const dots = Array.from(document.querySelectorAll('#rooms-dots .carousel-dot'));
        return {
          counterText: counter ? counter.textContent.trim() : '',
          activeDotIndex: dots.findIndex(d => d.classList.contains('is-active'))
        };
      })()
    `);
    record('Carousel Mobile', 'Native horizontal scroll accurately synchronizes counter to "03 / 03"', scrollSync.counterText === '03 / 03', '03 / 03', scrollSync.counterText);
    record('Carousel Mobile', 'Native horizontal scroll accurately synchronizes active dot to 2', scrollSync.activeDotIndex === 2, '2', scrollSync.activeDotIndex);

    // Desktop Carousel Invariant at 1024px
    console.log('\n--- SUITE 2B: DESKTOP CAROUSEL 3-COLUMN GRID INVARIANT (>=992px) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 150));

    const desktopCarousel = await client.eval(`
      (() => {
        const grid = document.getElementById('rooms-grid');
        const controls = document.getElementById('rooms-carousel-controls');
        const cards = Array.from(grid.querySelectorAll('.room-card'));
        const gridComp = window.getComputedStyle(grid);
        const controlsComp = window.getComputedStyle(controls);

        // Check cards horizontal alignment
        const rect0 = cards[0].getBoundingClientRect();
        const rect1 = cards[1].getBoundingClientRect();
        const rect2 = cards[2].getBoundingClientRect();
        const isSideBySide = (rect0.right <= rect1.left + 2) && (rect1.right <= rect2.left + 2);

        return {
          gridDisplay: gridComp.display,
          gridColumns: gridComp.gridTemplateColumns,
          controlsDisplay: controlsComp.display,
          isSideBySide
        };
      })()
    `);
    record('Carousel Desktop', 'Rooms grid computed display is "grid" at 1024px', desktopCarousel.gridDisplay === 'grid', 'grid', desktopCarousel.gridDisplay);
    record('Carousel Desktop', 'Carousel navigation controls are completely hidden (display: none) on desktop', desktopCarousel.controlsDisplay === 'none', 'none', desktopCarousel.controlsDisplay);
    record('Carousel Desktop', 'All 3 suite cards render side-by-side in 3 symmetric columns', desktopCarousel.isSideBySide === true, 'true', desktopCarousel.isSideBySide);

    // --- SUITE 3: MOBILE STICKY BOTTOM ACTION BAR (<768px) ---
    console.log('\n--- SUITE 3: MOBILE STICKY BOTTOM ACTION BAR (<768px) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 150));

    // Scroll to very top
    await client.eval('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 300));

    const barAtHero = await client.eval(`
      (() => {
        const bar = document.getElementById('mobile-action-bar');
        const comp = window.getComputedStyle(bar);
        return {
          hasIsVisible: bar.classList.contains('is-visible'),
          opacity: comp.opacity,
          pointerEvents: comp.pointerEvents
        };
      })()
    `);
    record('Bottom Bar Mobile', 'Bottom action bar is hidden (not visible) while inside Hero fold', barAtHero.hasIsVisible === false && (barAtHero.opacity === '0' || barAtHero.pointerEvents === 'none'), 'true', `isVisible: ${barAtHero.hasIsVisible}, opacity: ${barAtHero.opacity}`);

    // Scroll down past Hero fold to #space
    await client.eval(`
      (() => {
        const spaceEl = document.getElementById('space');
        if (spaceEl) spaceEl.scrollIntoView({ behavior: 'instant' });
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const barPastHero = await client.eval(`
      (() => {
        const bar = document.getElementById('mobile-action-bar');
        const comp = window.getComputedStyle(bar);
        const priceMain = bar.querySelector('.bar-price-main');
        const capacity = bar.querySelector('.bar-capacity');
        const btn = document.getElementById('bar-whatsapp-btn');

        return {
          hasIsVisible: bar.classList.contains('is-visible'),
          opacity: comp.opacity,
          pointerEvents: comp.pointerEvents,
          zIndex: comp.zIndex,
          priceText: priceMain ? priceMain.textContent.trim() : '',
          capacityText: capacity ? capacity.textContent.trim() : '',
          btnHref: btn ? btn.getAttribute('href') : ''
        };
      })()
    `);
    record('Bottom Bar Mobile', 'Bottom action bar slides into view (gains .is-visible) past Hero fold', barPastHero.hasIsVisible === true && barPastHero.opacity === '1', 'true', `isVisible: ${barPastHero.hasIsVisible}, opacity: ${barPastHero.opacity}`);
    record('Bottom Bar Mobile', 'Action bar z-index is 85 (sits below header 90 and modal 1000)', barPastHero.zIndex === '85', '85', barPastHero.zIndex);
    record('Bottom Bar Mobile', 'Action bar price contains "From $350"', barPastHero.priceText.includes('$350'), 'contains $350', barPastHero.priceText);
    record('Bottom Bar Mobile', 'Action bar capacity contains "Whole Villa"', barPastHero.capacityText.includes('Whole Villa'), 'contains Whole Villa', barPastHero.capacityText);
    record('Bottom Bar Mobile', 'Action bar WhatsApp CTA points to wa.me with pre-filled inquiry text', barPastHero.btnHref.includes('wa.me/84900000000') && barPastHero.btnHref.includes('text='), 'valid wa.me link', barPastHero.btnHref);

    // Scroll back to top to verify reactive hiding
    await client.eval('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 400));

    const barBackAtTop = await client.eval(`
      (() => {
        const bar = document.getElementById('mobile-action-bar');
        const comp = window.getComputedStyle(bar);
        return {
          hasIsVisible: bar.classList.contains('is-visible'),
          opacity: comp.opacity
        };
      })()
    `);
    record('Bottom Bar Mobile', 'Bottom action bar re-hides when returning to page top', barBackAtTop.hasIsVisible === false && barBackAtTop.opacity === '0', 'true', `isVisible: ${barBackAtTop.hasIsVisible}, opacity: ${barBackAtTop.opacity}`);

    // Desktop Bottom Bar Invariant at 1024px
    console.log('\n--- SUITE 3B: DESKTOP BOTTOM BAR INVARIANT (>=768px) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 150));

    const desktopBottomBar = await client.eval(`
      (() => {
        const bar = document.getElementById('mobile-action-bar');
        return window.getComputedStyle(bar).display;
      })()
    `);
    record('Bottom Bar Desktop', 'Bottom action bar is strictly hidden (display: none) on desktop (>=768px)', desktopBottomBar === 'none', 'none', desktopBottomBar);

    // --- SUITE 4: DESKTOP LEFT NAV RAIL & MOBILE BREADCRUMB PILL ---
    console.log('\n--- SUITE 4: DESKTOP LEFT NAV RAIL (>=1024px) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 150));
    await client.eval('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 300));

    const navRailDesktop = await client.eval(`
      (() => {
        const rail = document.getElementById('side-nav-rail');
        const items = Array.from(rail.querySelectorAll('.side-nav-item'));
        const activeItem = rail.querySelector('.side-nav-item.is-active');
        const comp = window.getComputedStyle(rail);

        return {
          display: comp.display,
          position: comp.position,
          zIndex: comp.zIndex,
          itemsCount: items.length,
          activeSection: activeItem ? activeItem.getAttribute('data-section') : '',
          activeAriaCurrent: activeItem ? activeItem.getAttribute('aria-current') : ''
        };
      })()
    `);
    record('Nav Rail Desktop', 'Left navigation rail computed display is "block" at 1440px', navRailDesktop.display === 'block', 'block', navRailDesktop.display);
    record('Nav Rail Desktop', 'Left navigation rail position is fixed with z-index 80', navRailDesktop.position === 'fixed' && navRailDesktop.zIndex === '80', 'fixed and 80', `${navRailDesktop.position} and ${navRailDesktop.zIndex}`);
    record('Nav Rail Desktop', 'Rail contains all 5 chapters (arrive, space, rooms, pricing, enquiry)', navRailDesktop.itemsCount === 5, '5', navRailDesktop.itemsCount);
    record('Nav Rail Desktop', 'Initial active chapter is "arrive" with aria-current="true"', navRailDesktop.activeSection === 'arrive' && navRailDesktop.activeAriaCurrent === 'true', 'arrive and true', `${navRailDesktop.activeSection} and ${navRailDesktop.activeAriaCurrent}`);

    // Click rail item 3 (Suites / #rooms)
    await client.eval(`
      (() => {
        const roomsItem = document.querySelector('.side-nav-item[data-section="rooms"]');
        if (roomsItem) roomsItem.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const railClickTest = await client.eval(`
      (() => {
        const activeItem = document.querySelector('.side-nav-item.is-active');
        const activeComp = activeItem ? window.getComputedStyle(activeItem) : null;
        return {
          activeSection: activeItem ? activeItem.getAttribute('data-section') : '',
          color: activeComp ? activeComp.color : ''
        };
      })()
    `);
    // rgb(194, 155, 98) corresponds to #C29B62 (Warm Bronze)
    record('Nav Rail Desktop', 'Clicking "Suites" sets active chapter to "rooms"', railClickTest.activeSection === 'rooms', 'rooms', railClickTest.activeSection);
    record('Nav Rail Desktop', 'Active chapter link color highlights in warm bronze (#C29B62 / rgb(194, 155, 98))', railClickTest.color.includes('194, 155, 98'), 'rgb(194, 155, 98)', railClickTest.color);

    // Tablet/Mobile Invariant for Nav Rail (<1024px)
    console.log('\n--- SUITE 4B: NAV RAIL TABLET/MOBILE INVARIANT (<1024px) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 150));

    const tabletRailDisplay = await client.eval(`
      (() => {
        const rail = document.getElementById('side-nav-rail');
        return window.getComputedStyle(rail).display;
      })()
    `);
    record('Nav Rail Tablet', 'Left navigation rail is strictly hidden (display: none) on <1024px', tabletRailDisplay === 'none', 'none', tabletRailDisplay);

    // Mobile Section Breadcrumb Pill
    console.log('\n--- SUITE 4C: MOBILE SECTION BREADCRUMB PILL (<1024px) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 150));

    // Scroll to top
    await client.eval('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 250));

    const pillAtTop = await client.eval(`
      (() => {
        const pill = document.getElementById('mobile-act-indicator');
        const text = document.getElementById('mobile-act-text');
        const comp = window.getComputedStyle(pill);
        return {
          display: comp.display,
          text: text ? text.textContent.trim() : ''
        };
      })()
    `);
    record('Breadcrumb Mobile', 'Mobile breadcrumb pill is visible (flex) at 390px', ['flex', 'inline-flex'].includes(pillAtTop.display), 'flex', pillAtTop.display);
    record('Breadcrumb Mobile', 'Initial breadcrumb pill text reflects "01 / Arrive"', pillAtTop.text === '01 / Arrive', '01 / Arrive', pillAtTop.text);

    // Scroll to #rooms
    await client.eval(`
      (() => {
        const roomsEl = document.getElementById('rooms');
        if (roomsEl) roomsEl.scrollIntoView({ behavior: 'instant' });
      })()
    `);
    await new Promise(r => setTimeout(r, 350));

    const pillAtRooms = await client.eval(`
      (() => {
        const text = document.getElementById('mobile-act-text');
        return text ? text.textContent.trim() : '';
      })()
    `);
    record('Breadcrumb Mobile', 'Breadcrumb dynamically updates to "03 / Suites" when reading Act 3', pillAtRooms === '03 / Suites', '03 / Suites', pillAtRooms);

    // Desktop Invariant for Breadcrumb Pill (>=1024px)
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 150));

    const desktopPillDisplay = await client.eval(`
      (() => {
        const pill = document.getElementById('mobile-act-indicator');
        return window.getComputedStyle(pill).display;
      })()
    `);
    record('Breadcrumb Desktop', 'Mobile breadcrumb pill is strictly hidden (display: none) on desktop (>=1024px)', desktopPillDisplay === 'none', 'none', desktopPillDisplay);

    // Narrow Mobile Invariant at 360px (protecting clearance)
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 640,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 150));

    const pill360Display = await client.eval(`
      (() => {
        const pill = document.getElementById('mobile-act-indicator');
        return window.getComputedStyle(pill).display;
      })()
    `);
    record('Breadcrumb 360px', 'Mobile breadcrumb pill is hidden at 360px to preserve >=100px header clearance', pill360Display === 'none', 'none', pill360Display);

    // --- SUITE 5: UNIVERSAL INVARIANTS & REDUCED MOTION ---
    console.log('\n--- SUITE 5: DOCUMENT OVERFLOW & REDUCED MOTION INVARIANTS ---');
    const testViewports = [320, 360, 375, 390, 480, 768, 1024, 1440];
    let allOverflowZero = true;
    for (const w of testViewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 800,
        deviceScaleFactor: 1,
        mobile: w < 992
      });
      await new Promise(r => setTimeout(r, 50));
      const hasOverflow = await client.eval('document.documentElement.scrollWidth > document.documentElement.clientWidth');
      if (hasOverflow) {
        allOverflowZero = false;
        record('Document Overflow', `Zero document overflow at ${w}px viewport`, false, 'zero overflow', `overflow detected (scrollWidth > ${w})`);
      }
    }
    if (allOverflowZero) {
      record('Document Overflow', 'Zero document overflow across all 8 tested viewports (320px to 1440px)', true, 'zero overflow', 'scrollWidth === clientWidth on all viewports');
    }

    // Heading font weights
    const allHeadings400 = await client.eval(`
      (() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .step-title'));
        return headings.every(h => window.getComputedStyle(h).fontWeight === '400');
      })()
    `);
    record('Typography Invariant', 'All DOM headings evaluate strictly to font-weight: 400', allHeadings400 === true, 'true', allHeadings400);

    // Reduced motion emulation
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await new Promise(r => setTimeout(r, 150));

    const reducedMotionChecks = await client.eval(`
      (() => {
        const arrow = document.querySelector('.carousel-arrow');
        const navItem = document.querySelector('.side-nav-item');
        return {
          arrowTransform: arrow ? window.getComputedStyle(arrow).transform : 'none',
          navItemTransform: navItem ? window.getComputedStyle(navItem).transform : 'none'
        };
      })()
    `);
    record('Reduced Motion', 'Interactive controls evaluate to transform: none under prefers-reduced-motion: reduce', reducedMotionChecks.arrowTransform === 'none' && reducedMotionChecks.navItemTransform === 'none', 'none', `arrow: ${reducedMotionChecks.arrowTransform}, navItem: ${reducedMotionChecks.navItemTransform}`);

  } finally {
    client.close();
    chromeProc.kill('SIGKILL');
    try {
      fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  // Final summary
  const passedCount = results.filter(r => r.pass).length;
  const failedCount = results.filter(r => !r.pass).length;

  console.log('\n==============================================================================');
  console.log(' MOBILE UX & NAVIGATION SYSTEMS VERIFICATION SUMMARY');
  console.log(' Total Checks: ', results.length);
  console.log(' Passed:       ', passedCount);
  console.log(' Failed:       ', failedCount);
  console.log('==============================================================================');

  if (failedCount > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failedCount} checks failed.`);
    process.exit(1);
  } else {
    console.log('\n✔ ALL CHECKS PASSED WITH 100% INTEGRITY AND ZERO REGRESSIONS!');
    process.exit(0);
  }
}

runMobileUXNavVerification().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
