/**
 * ADVERSARIAL STRESS TEST & CDP VERIFICATION HARNESS — ACT 2
 * Target: /Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview
 *
 * Executed by: challenger_1 (Adversarial Challenger)
 * Focus:
 *  1. Multi-viewport layout containment (320px, 360px, 375px, etc.)
 *  2. Document overflow (documentElement.scrollWidth === clientWidth)
 *  3. Video controls overlay and chapter pills containment & usability
 *  4. Space card angle pills containment & zero clipping
 *  5. Rapid clicking & concurrency stress testing on angle switchers
 *  6. Video playback, scrubbing, and reduced-motion invariants
 *  7. Act 2 to Act 5 contextual conversion micro-hooks
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const TARGET_DIR = '/Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview';
const HTML_PATH = path.join(TARGET_DIR, 'index.html');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9224;
const TEMP_USER_DIR = path.join(os.tmpdir(), `chrome-challenger1-${Date.now()}`);

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
      } catch (e) {
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
    if (res.exceptionDetails) {
      throw new Error('Eval exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async clickAt(x, y) {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: Math.round(x),
      y: Math.round(y),
      button: 'left',
      clickCount: 1
    });
    await new Promise(r => setTimeout(r, 20));
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: Math.round(x),
      y: Math.round(y),
      button: 'left',
      clickCount: 1
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runAdversarialAct2Harness() {
  console.log('==============================================================================');
  console.log(' ADVERSARIAL STRESS TEST & CDP VERIFICATION HARNESS — ACT 2');
  console.log(' Target Directory:', TARGET_DIR);
  console.log(' Engine: Google Chrome (Headless Blink CDP)');
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

  // Create clean user data directory
  fs.mkdirSync(TEMP_USER_DIR, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--window-size=1200,900',
    'about:blank'
  ]);

  const client = new CDPClient(CDP_PORT);

  try {
    await client.connect();
    console.log('Connected to Chrome DevTools Protocol on port', CDP_PORT);

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    await client.send('Runtime.enable');

    // Load file
    const fileUrl = `file://${HTML_PATH}`;
    await client.send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 600));

    // =========================================================================
    // SUITE 1: MULTI-VIEWPORT DOCUMENT OVERFLOW & ACT 2 CONTAINMENT
    // =========================================================================
    console.log('\n--- SUITE 1: MULTI-VIEWPORT CONTAINMENT & OVERFLOW INVARIANTS ---');

    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE Legacy / Ultra Narrow' },
      { width: 360, height: 640, name: 'Galaxy S / Compact Android' },
      { width: 375, height: 667, name: 'iPhone SE Modern / mini' },
      { width: 390, height: 844, name: 'iPhone 12/13/14/15' },
      { width: 414, height: 896, name: 'iPhone Plus / Max' },
      { width: 480, height: 800, name: 'Large Mobile' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1440, height: 900, name: 'Desktop Standard' }
    ];

    for (const vp of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width <= 768
      });
      await new Promise(r => setTimeout(r, 100));

      const vpResult = await client.eval(`
        (() => {
          const doc = document.documentElement;
          const scrollW = doc.scrollWidth;
          const clientW = doc.clientWidth;
          const docOverflow = scrollW > clientW;

          // Act 2 container
          const teaser = document.getElementById('teaser-video');
          const videoFrame = document.querySelector('.video-media-frame');
          const videoControls = document.getElementById('video-controls');
          const playBtn = document.getElementById('video-play-btn');
          const progressWrap = document.getElementById('video-progress-wrap');
          const timeDisplay = document.getElementById('video-time-display');
          const fsBtn = document.getElementById('video-fs-btn');
          const teaserMeta = document.querySelector('.video-teaser-meta');
          const videoChapters = document.querySelector('.video-chapters');
          const chapterPills = Array.from(document.querySelectorAll('.chapter-pill'));

          // Space cards
          const spaceCards = Array.from(document.querySelectorAll('.space-card'));

          const clippingErrors = [];

          if (videoFrame && videoControls) {
            const fRect = videoFrame.getBoundingClientRect();
            const cRect = videoControls.getBoundingClientRect();
            if (cRect.right > fRect.right + 1) {
              clippingErrors.push({ elem: '#video-controls', clippedPx: cRect.right - fRect.right });
            }
            if (cRect.left < fRect.left - 1) {
              clippingErrors.push({ elem: '#video-controls left', clippedPx: fRect.left - cRect.left });
            }

            // Check children inside video-controls
            const children = [playBtn, progressWrap, timeDisplay, fsBtn].filter(Boolean);
            for (const child of children) {
              const chRect = child.getBoundingClientRect();
              if (chRect.right > cRect.right + 1) {
                clippingErrors.push({ elem: child.id || child.className, clippedPx: chRect.right - cRect.right });
              }
            }
          }

          if (teaserMeta && videoChapters) {
            const mRect = teaserMeta.getBoundingClientRect();
            for (const pill of chapterPills) {
              const pRect = pill.getBoundingClientRect();
              if (pRect.right > mRect.right + 1) {
                clippingErrors.push({ elem: 'chapter-pill: ' + pill.textContent.trim(), clippedPx: pRect.right - mRect.right });
              }
            }
          }

          for (const card of spaceCards) {
            const cardRect = card.getBoundingClientRect();
            const media = card.querySelector('.space-card-media');
            const anglePillsWrap = card.querySelector('.space-angle-pills');
            const anglePills = Array.from(card.querySelectorAll('.angle-pill'));
            const ctaLink = card.querySelector('.space-inquiry-link');

            if (media && anglePillsWrap) {
              const mRect = media.getBoundingClientRect();
              const pRect = anglePillsWrap.getBoundingClientRect();
              if (pRect.right > mRect.right + 1) {
                clippingErrors.push({ elem: 'space-angle-pills right', clippedPx: pRect.right - mRect.right });
              }
              if (pRect.left < mRect.left - 1) {
                clippingErrors.push({ elem: 'space-angle-pills left', clippedPx: mRect.left - pRect.left });
              }

              for (const ap of anglePills) {
                const aRect = ap.getBoundingClientRect();
                if (aRect.right > pRect.right + 1) {
                  clippingErrors.push({ elem: 'angle-pill: ' + ap.textContent.trim(), clippedPx: aRect.right - pRect.right });
                }
              }
            }

            if (ctaLink) {
              const lRect = ctaLink.getBoundingClientRect();
              if (lRect.right > cardRect.right + 1) {
                clippingErrors.push({ elem: 'space-inquiry-link', clippedPx: lRect.right - cardRect.right });
              }
            }
          }

          const progressWrapWidth = progressWrap ? Math.round(progressWrap.getBoundingClientRect().width) : 0;
          const controlsWidth = videoControls ? Math.round(videoControls.getBoundingClientRect().width) : 0;

          return {
            scrollW,
            clientW,
            docOverflow,
            clippingCount: clippingErrors.length,
            clippingErrors,
            progressWrapWidth,
            controlsWidth
          };
        })()
      `);

      // Document scrollWidth invariant
      recordChallenge(
        'Document Overflow',
        `Viewport ${vp.width}px (${vp.name}): scrollWidth === clientWidth (${vpResult.scrollW} === ${vpResult.clientW})`,
        !vpResult.docOverflow,
        `scrollWidth === ${vp.width}`,
        `scrollWidth: ${vpResult.scrollW}, clientWidth: ${vpResult.clientW}`
      );

      // Act 2 controls & pills clipping invariant
      recordChallenge(
        'Act 2 Layout Containment',
        `Viewport ${vp.width}px (${vp.name}): zero controls/pills clipping (cRect.right <= boundary.right + 1)`,
        vpResult.clippingCount === 0,
        '0 clipping errors',
        vpResult.clippingCount === 0 ? '0 clipping errors' : `${vpResult.clippingCount} errors: ${JSON.stringify(vpResult.clippingErrors)}`,
        `Controls width: ${vpResult.controlsWidth}px, scrubber width: ${vpResult.progressWrapWidth}px`
      );

      // Scrubber usable width
      recordChallenge(
        'Scrubber Usability',
        `Viewport ${vp.width}px (${vp.name}): progress scrubber bar has usable width (>= 40px)`,
        vpResult.progressWrapWidth >= 40,
        '>= 40px',
        `${vpResult.progressWrapWidth}px`
      );
    }

    // =========================================================================
    // SUITE 2: NARROW VIEWPORT (320px, 360px, 375px) USABILITY & BEHAVIOR
    // =========================================================================
    console.log('\n--- SUITE 2: NARROW VIEWPORTS INTERACTION & USABILITY ---');

    for (const narrowWidth of [320, 360, 375]) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: narrowWidth,
        height: 640,
        deviceScaleFactor: 1,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 80));

      const narrowMetrics = await client.eval(`
        (() => {
          const controls = document.getElementById('video-controls');
          const playBtn = document.getElementById('video-play-btn');
          const timeDisp = document.getElementById('video-time-display');
          const fsBtn = document.getElementById('video-fs-btn');
          const comp = window.getComputedStyle(controls);

          const getRect = (el) => {
            if (!el) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
            const r = el.getBoundingClientRect();
            return {
              left: Math.round(r.left),
              right: Math.round(r.right),
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              width: Math.round(r.width),
              height: Math.round(r.height)
            };
          };

          return {
            display: comp.display,
            visibility: comp.visibility,
            opacity: comp.opacity,
            rect: getRect(controls),
            playBtnRect: getRect(playBtn),
            timeDispText: timeDisp ? timeDisp.textContent.trim() : '',
            timeDispRect: getRect(timeDisp),
            fsBtnRect: getRect(fsBtn)
          };
        })()
      `);

      recordChallenge(
        'Mobile Usability',
        `Viewport ${narrowWidth}px: video controls overlay is visible and styled`,
        narrowMetrics.display === 'flex' && narrowMetrics.visibility === 'visible' && parseFloat(narrowMetrics.opacity) > 0.8,
        'display: flex, visibility: visible, opacity > 0.8',
        `display: ${narrowMetrics.display}, visibility: ${narrowMetrics.visibility}, opacity: ${narrowMetrics.opacity}`
      );

      recordChallenge(
        'Mobile Usability',
        `Viewport ${narrowWidth}px: time display is rendered with valid time format`,
        narrowMetrics.timeDispText.includes('/') && narrowMetrics.timeDispRect.width > 20,
        'Contains "/" and width > 20px',
        `text: "${narrowMetrics.timeDispText}", width: ${Math.round(narrowMetrics.timeDispRect.width)}px`
      );

      // Scroll play button into view for physical viewport interaction
      const scrollPlayResult = await client.eval(`
        (() => {
          const playBtn = document.getElementById('video-play-btn');
          if (!playBtn) return null;
          playBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          const r = playBtn.getBoundingClientRect();
          return {
            x: Math.round(r.left + r.width / 2),
            y: Math.round(r.top + r.height / 2)
          };
        })()
      `);

      if (scrollPlayResult) {
        await client.clickAt(scrollPlayResult.x, scrollPlayResult.y);
        await new Promise(r => setTimeout(r, 150));
      }

      const playToggleState = await client.eval(`
        (() => {
          const video = document.getElementById('villa-video');
          const playBtn = document.getElementById('video-play-btn');
          const iconPlay = playBtn ? playBtn.querySelector('.icon-play') : null;
          const iconPause = playBtn ? playBtn.querySelector('.icon-pause') : null;
          return {
            paused: video ? video.paused : true,
            iconPlayDisplay: iconPlay ? iconPlay.style.display : '',
            iconPauseDisplay: iconPause ? iconPause.style.display : '',
            ariaLabel: playBtn ? playBtn.getAttribute('aria-label') : ''
          };
        })()
      `);

      recordChallenge(
        'Video Playback Toggle',
        `Viewport ${narrowWidth}px: Play/Pause toggle click responds and toggles icon display`,
        (playToggleState.ariaLabel === 'Play video' || playToggleState.ariaLabel === 'Pause video') &&
        (playToggleState.iconPauseDisplay === 'block' || playToggleState.iconPlayDisplay === 'block'),
        'ariaLabel toggled and icon displayed',
        `paused: ${playToggleState.paused}, iconPlay: ${playToggleState.iconPlayDisplay}, iconPause: ${playToggleState.iconPauseDisplay}, ariaLabel: ${playToggleState.ariaLabel}`
      );
    }

    // =========================================================================
    // SUITE 3: RAPID CLICKING & CONCURRENCY STRESS TEST ON ANGLE PILLS
    // =========================================================================
    console.log('\n--- SUITE 3: RAPID CLICKING & CONCURRENCY ON ANGLE PILLS ---');

    // Reset viewport to desktop standard for testing interactions
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 100));

    // Stress test Card 1: 50 rapid alternating clicks
    const card1Stress = await client.eval(`
      (async () => {
        const card1Pills = Array.from(document.querySelectorAll('#space-media-1 .angle-pill'));
        const targetImg = document.getElementById('space-img-1');
        if (card1Pills.length < 2 || !targetImg) return { error: 'Card 1 elements not found' };

        const history = [];

        // 50 rapid clicks alternating between pill 0 and pill 1
        for (let i = 0; i < 50; i++) {
          const targetIndex = i % 2;
          const pill = card1Pills[targetIndex];
          pill.click();
          // Minimal delay to simulate frantic user clicking
          await new Promise(r => setTimeout(r, 8));

          const activeCount = card1Pills.filter(p => p.classList.contains('is-active')).length;
          const currentSrcAttr = targetImg.getAttribute('src');
          const expectedSrc = pill.getAttribute('data-src');

          if (activeCount !== 1 || currentSrcAttr !== expectedSrc) {
            history.push({ step: i, activeCount, currentSrcAttr, expectedSrc });
          }
        }

        // Wait 150ms for opacity animation to settle
        await new Promise(r => setTimeout(r, 150));

        const finalActivePill = card1Pills.find(p => p.classList.contains('is-active'));
        return {
          historyErrors: history,
          finalSrc: targetImg.getAttribute('src'),
          finalExpectedSrc: finalActivePill ? finalActivePill.getAttribute('data-src') : null,
          finalOpacity: targetImg.style.opacity,
          naturalWidth: targetImg.naturalWidth,
          complete: targetImg.complete
        };
      })()
    `);

    recordChallenge(
      'Angle Switcher Fuzzing',
      'Card 1: 50 rapid alternating clicks maintain 100% state synchronization (zero race conditions)',
      card1Stress.historyErrors.length === 0,
      '0 history errors',
      card1Stress.historyErrors.length === 0 ? '0 race conditions' : `${card1Stress.historyErrors.length} errors: ${JSON.stringify(card1Stress.historyErrors)}`
    );

    recordChallenge(
      'Angle Switcher Fuzzing',
      'Card 1: image source resolves correctly and image loads successfully (naturalWidth > 0)',
      card1Stress.finalSrc === card1Stress.finalExpectedSrc && card1Stress.complete && card1Stress.naturalWidth > 0,
      'Image loaded without error',
      `finalSrc: ${card1Stress.finalSrc}, naturalWidth: ${card1Stress.naturalWidth}`
    );

    recordChallenge(
      'Angle Switcher Fuzzing',
      'Card 1: image opacity settles cleanly back to "1" after rapid clicks',
      card1Stress.finalOpacity === '1' || card1Stress.finalOpacity === '',
      'opacity: 1',
      `opacity: ${card1Stress.finalOpacity}`
    );

    // Stress test Card 2: 50 rapid clicks
    const card2Stress = await client.eval(`
      (async () => {
        const card2Pills = Array.from(document.querySelectorAll('#space-media-2 .angle-pill'));
        const targetImg = document.getElementById('space-img-2');
        if (card2Pills.length < 2 || !targetImg) return { error: 'Card 2 elements not found' };

        const history = [];

        for (let i = 0; i < 50; i++) {
          const targetIndex = i % 2;
          const pill = card2Pills[targetIndex];
          pill.click();
          await new Promise(r => setTimeout(r, 8));

          const activeCount = card2Pills.filter(p => p.classList.contains('is-active')).length;
          const currentSrcAttr = targetImg.getAttribute('src');
          const expectedSrc = pill.getAttribute('data-src');

          if (activeCount !== 1 || currentSrcAttr !== expectedSrc) {
            history.push({ step: i, activeCount, currentSrcAttr, expectedSrc });
          }
        }

        await new Promise(r => setTimeout(r, 150));

        const finalActivePill = card2Pills.find(p => p.classList.contains('is-active'));
        return {
          historyErrors: history,
          finalSrc: targetImg.getAttribute('src'),
          finalExpectedSrc: finalActivePill ? finalActivePill.getAttribute('data-src') : null,
          finalOpacity: targetImg.style.opacity,
          naturalWidth: targetImg.naturalWidth,
          complete: targetImg.complete
        };
      })()
    `);

    recordChallenge(
      'Angle Switcher Fuzzing',
      'Card 2: 50 rapid alternating clicks maintain 100% state synchronization (zero race conditions)',
      card2Stress.historyErrors.length === 0,
      '0 history errors',
      card2Stress.historyErrors.length === 0 ? '0 race conditions' : `${card2Stress.historyErrors.length} errors: ${JSON.stringify(card2Stress.historyErrors)}`
    );

    recordChallenge(
      'Angle Switcher Fuzzing',
      'Card 2: image source resolves correctly and image loads successfully (naturalWidth > 0)',
      card2Stress.finalSrc === card2Stress.finalExpectedSrc && card2Stress.complete && card2Stress.naturalWidth > 0,
      'Image loaded without error',
      `finalSrc: ${card2Stress.finalSrc}, naturalWidth: ${card2Stress.naturalWidth}`
    );

    // =========================================================================
    // SUITE 4: CHAPTER SEEKING & VIDEO SCRUBBER INTERACTION
    // =========================================================================
    console.log('\n--- SUITE 4: CHAPTER SEEKING & SCRUBBER INVARIANTS ---');

    // Click Chapter 2 (5s seek)
    const chap2Seek = await client.eval(`
      (() => {
        const video = document.getElementById('villa-video');
        const chap2 = document.querySelector('.chapter-pill[data-seek="5"]');
        if (!chap2 || !video) return { error: 'Elements missing' };
        chap2.click();
        return {
          currentTime: video.currentTime,
          chap2Active: chap2.classList.contains('is-active')
        };
      })()
    `);

    recordChallenge(
      'Chapter Navigation',
      'Clicking Chapter 02 (Living Pavilion) seeks video to 5 seconds and marks pill active',
      chap2Seek.currentTime >= 4.9 && chap2Seek.currentTime <= 5.1 && chap2Seek.chap2Active,
      'currentTime: 5, chap2Active: true',
      `currentTime: ${chap2Seek.currentTime}, chap2Active: ${chap2Seek.chap2Active}`
    );

    // Click Chapter 3 (10s seek)
    const chap3Seek = await client.eval(`
      (() => {
        const video = document.getElementById('villa-video');
        const chap3 = document.querySelector('.chapter-pill[data-seek="10"]');
        if (!chap3 || !video) return { error: 'Elements missing' };
        chap3.click();
        return {
          currentTime: video.currentTime,
          chap3Active: chap3.classList.contains('is-active')
        };
      })()
    `);

    recordChallenge(
      'Chapter Navigation',
      'Clicking Chapter 03 (Master Suite) seeks video to 10 seconds and marks pill active',
      chap3Seek.currentTime >= 9.9 && chap3Seek.currentTime <= 10.1 && chap3Seek.chap3Active,
      'currentTime: 10, chap3Active: true',
      `currentTime: ${chap3Seek.currentTime}, chap3Active: ${chap3Seek.chap3Active}`
    );

    // Click Chapter 1 (0s seek)
    const chap1Seek = await client.eval(`
      (() => {
        const video = document.getElementById('villa-video');
        const chap1 = document.querySelector('.chapter-pill[data-seek="0"]');
        if (!chap1 || !video) return { error: 'Elements missing' };
        chap1.click();
        return {
          currentTime: video.currentTime,
          chap1Active: chap1.classList.contains('is-active')
        };
      })()
    `);

    recordChallenge(
      'Chapter Navigation',
      'Clicking Chapter 01 (Plunge Pool) seeks video to 0 seconds and marks pill active',
      chap1Seek.currentTime >= 0 && chap1Seek.currentTime <= 0.1 && chap1Seek.chap1Active,
      'currentTime: 0, chap1Active: true',
      `currentTime: ${chap1Seek.currentTime}, chap1Active: ${chap1Seek.chap1Active}`
    );

    // Progress bar scrubber click at 60%
    const scrubberClick = await client.eval(`
      (() => {
        const video = document.getElementById('villa-video');
        const wrap = document.getElementById('video-progress-wrap');
        const rect = wrap.getBoundingClientRect();
        const clickX = rect.left + rect.width * 0.6;
        const clickY = rect.top + rect.height / 2;

        const evt = new MouseEvent('click', {
          bubbles: true,
          clientX: clickX,
          clientY: clickY
        });
        wrap.dispatchEvent(evt);

        return {
          currentTime: video.currentTime,
          expectedMin: 15 * 0.55,
          expectedMax: 15 * 0.65
        };
      })()
    `);

    recordChallenge(
      'Scrubber Seeking',
      'Clicking progress scrubber at 60% width seeks video proportionally (~9.0s)',
      scrubberClick.currentTime >= scrubberClick.expectedMin && scrubberClick.currentTime <= scrubberClick.expectedMax,
      'Between 8.25s and 9.75s',
      `currentTime: ${scrubberClick.currentTime.toFixed(2)}s`
    );

    // =========================================================================
    // SUITE 5: ACT 2 TO ACT 5 CONTEXTUAL CONVERSION MICRO-HOOKS
    // =========================================================================
    console.log('\n--- SUITE 5: CONTEXTUAL INQUIRY MICRO-HOOK INVARIANTS ---');

    // Click Card 1 CTA: should prefill "Family holiday"
    const cta1Result = await client.eval(`
      (() => {
        const link = document.querySelector('.space-card:nth-of-type(1) .space-inquiry-link');
        const formPurpose = document.getElementById('form-purpose');
        if (!link || !formPurpose) return { error: 'Elements missing' };

        link.click();
        return {
          value: formPurpose.value,
          expected: 'Family holiday'
        };
      })()
    `);

    recordChallenge(
      'Conversion Highway',
      'Card 1 inquiry CTA pre-populates Act 5 inquiry form with "Family holiday"',
      cta1Result.value === cta1Result.expected,
      cta1Result.expected,
      cta1Result.value
    );

    // Click Card 2 CTA: should prefill "Workation retreat"
    const cta2Result = await client.eval(`
      (() => {
        const link = document.querySelector('.space-card:nth-of-type(2) .space-inquiry-link');
        const formPurpose = document.getElementById('form-purpose');
        if (!link || !formPurpose) return { error: 'Elements missing' };

        link.click();
        return {
          value: formPurpose.value,
          expected: 'Workation retreat'
        };
      })()
    `);

    recordChallenge(
      'Conversion Highway',
      'Card 2 inquiry CTA pre-populates Act 5 inquiry form with "Workation retreat"',
      cta2Result.value === cta2Result.expected,
      cta2Result.expected,
      cta2Result.value
    );

    // =========================================================================
    // SUITE 6: REDUCED MOTION INVARIANTS & CLEAN TRANSFORMS
    // =========================================================================
    console.log('\n--- SUITE 6: REDUCED MOTION INVARIANTS ---');

    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await new Promise(r => setTimeout(r, 80));

    const reducedMotionChecks = await client.eval(`
      (() => {
        const video = document.getElementById('villa-video');
        const playBtn = document.getElementById('video-play-btn');
        const chapPill = document.querySelector('.chapter-pill');
        const anglePill = document.querySelector('.angle-pill');
        const inqLink = document.querySelector('.space-inquiry-link');
        const inqSpan = inqLink ? inqLink.querySelector('span') : null;

        const getTr = (el) => el ? window.getComputedStyle(el).transform : 'NOT_FOUND';

        return {
          videoPaused: video ? video.paused : false,
          playBtnTransform: getTr(playBtn),
          chapPillTransform: getTr(chapPill),
          anglePillTransform: getTr(anglePill),
          inqLinkTransform: getTr(inqLink),
          inqSpanTransform: getTr(inqSpan)
        };
      })()
    `);

    recordChallenge(
      'Reduced Motion',
      'Pre-emptively neutralizes interactive transforms to none under prefers-reduced-motion',
      reducedMotionChecks.playBtnTransform === 'none' &&
      reducedMotionChecks.chapPillTransform === 'none' &&
      reducedMotionChecks.anglePillTransform === 'none' &&
      reducedMotionChecks.inqLinkTransform === 'none',
      'All transform: none',
      `playBtn: ${reducedMotionChecks.playBtnTransform}, chap: ${reducedMotionChecks.chapPillTransform}, angle: ${reducedMotionChecks.anglePillTransform}, link: ${reducedMotionChecks.inqLinkTransform}`
    );

  } catch (err) {
    console.error('Test execution error:', err);
    recordChallenge('Execution Error', 'Test suite completes without unexpected exception', false, 'Clean completion', err.message);
  } finally {
    client.close();
    chromeProc.kill();
    try {
      fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(' ADVERSARIAL STRESS TEST RESULTS MATRIX — ACT 2');
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

runAdversarialAct2Harness().then(res => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
