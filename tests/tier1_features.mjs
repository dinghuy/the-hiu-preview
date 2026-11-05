/**
 * Tier 1: Feature Coverage (5+ tests per feature for F1 - F12)
 * Total: 60 tests
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDOMEnvironment } from './dom_env.mjs';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function runTier1({ html, css, appJs, parsedCSS }) {
  const tests = [];

  function assert(id, feature, name, condition, expected, actual) {
    tests.push({
      id,
      tier: 'Tier 1: Feature Coverage',
      feature,
      name,
      pass: Boolean(condition),
      expected: String(expected),
      actual: String(actual)
    });
  }

  // =========================================================================
  // F1: Ground Tone Linen #F9F8F5
  // =========================================================================
  const groundToken = parsedCSS.getRootToken('--ground');
  assert(
    'T1_F1_01', 'F1: Ground Tone', 'Root defines --ground as #F9F8F5',
    groundToken && groundToken.toUpperCase() === '#F9F8F5',
    '#F9F8F5', groundToken
  );

  const bodyBg = parsedCSS.getDeclaration('body', 'background-color') || parsedCSS.getDeclaration('body', 'background');
  assert(
    'T1_F1_02', 'F1: Ground Tone', 'Body uses var(--ground) or #F9F8F5',
    bodyBg && (bodyBg.includes('var(--ground)') || bodyBg.toUpperCase() === '#F9F8F5'),
    'var(--ground) or #F9F8F5', bodyBg
  );

  const heroBg = parsedCSS.getDeclaration('.hero-section', 'background') || parsedCSS.getDeclaration('.hero-section', 'background-color');
  assert(
    'T1_F1_03', 'F1: Ground Tone', 'Hero section uses var(--ground) or #F9F8F5 (no discordant tint)',
    heroBg && (heroBg.includes('var(--ground)') || heroBg.toUpperCase() === '#F9F8F5'),
    'var(--ground) or #F9F8F5', heroBg
  );

  const roomsBg = parsedCSS.getDeclaration('.rooms-section', 'background') || parsedCSS.getDeclaration('.rooms-section', 'background-color');
  assert(
    'T1_F1_04', 'F1: Ground Tone', 'Rooms section uses var(--ground) or #F9F8F5 (no discordant tint)',
    roomsBg && (roomsBg.includes('var(--ground)') || roomsBg.toUpperCase() === '#F9F8F5'),
    'var(--ground) or #F9F8F5', roomsBg
  );

  const enquiryBg = parsedCSS.getDeclaration('.enquiry-section', 'background') || parsedCSS.getDeclaration('.enquiry-section', 'background-color');
  const footerBg = parsedCSS.getDeclaration('.site-footer', 'background') || parsedCSS.getDeclaration('.site-footer', 'background-color');
  const enquiryAndFooterGround = (enquiryBg && (enquiryBg.includes('var(--ground)') || enquiryBg.toUpperCase() === '#F9F8F5')) &&
                                 (footerBg && (footerBg.includes('var(--ground)') || footerBg.toUpperCase() === '#F9F8F5'));
  assert(
    'T1_F1_05', 'F1: Ground Tone', 'Enquiry section and Footer use var(--ground) or #F9F8F5',
    enquiryAndFooterGround,
    'enquiry: var(--ground), footer: var(--ground)',
    `enquiry: ${enquiryBg}, footer: ${footerBg}`
  );

  // =========================================================================
  // F2: Typography & Ink
  // =========================================================================
  const inkToken = parsedCSS.getRootToken('--ink');
  assert(
    'T1_F2_01', 'F2: Typography & Ink', 'Root defines --ink as #1C1B19',
    inkToken && inkToken.toUpperCase() === '#1C1B19',
    '#1C1B19', inkToken
  );

  const bodyColor = parsedCSS.getDeclaration('body', 'color');
  assert(
    'T1_F2_02', 'F2: Typography & Ink', 'Body uses var(--ink) or #1C1B19',
    bodyColor && (bodyColor.includes('var(--ink)') || bodyColor.toUpperCase() === '#1C1B19'),
    'var(--ink) or #1C1B19', bodyColor
  );

  const fontDisplay = parsedCSS.getRootToken('--font-display');
  const fontBody = parsedCSS.getRootToken('--font-body');
  assert(
    'T1_F2_03', 'F2: Typography & Ink', 'Typography tokens define Newsreader and Plus Jakarta Sans',
    fontDisplay && fontDisplay.includes('Newsreader') && fontBody && fontBody.includes('Plus Jakarta Sans'),
    'Newsreader for display, Plus Jakarta Sans for body',
    `display: ${fontDisplay}, body: ${fontBody}`
  );

  // Check explicit font-weight: 400 (or 500) on headings to prevent faux-bold synthesis
  const headingWeight = parsedCSS.getDeclaration('h1, h2, h3, h4', 'font-weight') ||
                        parsedCSS.getDeclaration('.step-title', 'font-weight');
  assert(
    'T1_F2_04', 'F2: Typography & Ink', 'Headings define explicit font-weight: 400 or 500',
    headingWeight && (headingWeight.includes('400') || headingWeight.includes('500')),
    '400 or 500', headingWeight
  );

  const hasPreconnectGoogle = html.includes('rel="preconnect" href="https://fonts.googleapis.com"') ||
                              html.includes('rel="preconnect" href="https://fonts.gstatic.com"');
  assert(
    'T1_F2_05', 'F2: Typography & Ink', 'Font preconnect links present in index.html head',
    hasPreconnectGoogle,
    'preconnect links for fonts.googleapis.com and fonts.gstatic.com',
    hasPreconnectGoogle ? 'Present' : 'Missing'
  );

  // =========================================================================
  // F3: Layout Container & Symmetry
  // =========================================================================
  const containerMax = parsedCSS.getRootToken('--container-max') || parsedCSS.getDeclaration('.container', 'max-width');
  assert(
    'T1_F3_01', 'F3: Layout Container & Symmetry', 'Container max-width is 1200px',
    containerMax && containerMax.includes('1200px'),
    '1200px', containerMax
  );

  const padLeft = parsedCSS.getDeclaration('.container', 'padding-left');
  const padRight = parsedCSS.getDeclaration('.container', 'padding-right');
  assert(
    'T1_F3_02', 'F3: Layout Container & Symmetry', 'Container desktop padding is symmetrically 32px',
    padLeft === '32px' && padRight === '32px',
    '32px / 32px', `${padLeft} / ${padRight}`
  );

  const mobPadLeft = parsedCSS.getDeclaration('.container', 'padding-left', 'max-width: 768px');
  const mobPadRight = parsedCSS.getDeclaration('.container', 'padding-right', 'max-width: 768px');
  assert(
    'T1_F3_03', 'F3: Layout Container & Symmetry', 'Container mobile padding is symmetrically 20px',
    mobPadLeft === '20px' && mobPadRight === '20px',
    '20px / 20px', `${mobPadLeft} / ${mobPadRight}`
  );

  const marginAuto = parsedCSS.getDeclaration('.container', 'margin-left') === 'auto' &&
                     parsedCSS.getDeclaration('.container', 'margin-right') === 'auto';
  assert(
    'T1_F3_04', 'F3: Layout Container & Symmetry', 'Container centers with auto lateral margins',
    marginAuto,
    'margin-left: auto; margin-right: auto',
    `${parsedCSS.getDeclaration('.container', 'margin-left')} / ${parsedCSS.getDeclaration('.container', 'margin-right')}`
  );

  // Tablet grid symmetry (769px-992px): should not produce orphan cards (e.g. 1fr or 3-cols or spans)
  const tabletRoomsGrid = parsedCSS.getDeclaration('.rooms-grid', 'grid-template-columns', 'max-width: 992px');
  const tabletLastChildSpan = parsedCSS.getDeclaration('.rooms-grid > :last-child', 'grid-column', 'max-width: 992px') ||
                              parsedCSS.getDeclaration('.room-card:last-child', 'grid-column', 'max-width: 992px');
  const isTabletSymmetric = !tabletRoomsGrid || tabletRoomsGrid === '1fr' || !tabletRoomsGrid.includes('1fr 1fr') || Boolean(tabletLastChildSpan);
  assert(
    'T1_F3_05', 'F3: Layout Container & Symmetry', 'Tablet grid avoids orphan 3rd card on 2-col layout',
    isTabletSymmetric,
    '1fr or symmetric 3-column / span layout',
    tabletLastChildSpan ? `Span: ${tabletLastChildSpan}` : (tabletRoomsGrid || 'Default 3-col')
  );

  // =========================================================================
  // F4: Editorial & Anti-Slop Copy
  // =========================================================================
  const lowerHtml = html.toLowerCase();
  assert(
    'T1_F4_01', 'F4: Anti-Slop Copy', 'Zero Vietnamese AI marketing clichés',
    !lowerHtml.includes('thiên đường nghỉ dưỡng') && !lowerHtml.includes('đẳng cấp vượt trội'),
    'No "thiên đường nghỉ dưỡng" or "đẳng cấp vượt trội"',
    lowerHtml.includes('thiên đường nghỉ dưỡng') ? 'Found "thiên đường nghỉ dưỡng"' : 'Clean'
  );

  const hasStockOpener = lowerHtml.includes('whether reuniting') || lowerHtml.includes('whether you need') || lowerHtml.includes("whether you're");
  assert(
    'T1_F4_02', 'F4: Anti-Slop Copy', 'No stock openers ("Whether you\'re / need")',
    !hasStockOpener,
    'No "Whether..." stock openers',
    hasStockOpener ? 'Found stock opener' : 'Clean'
  );

  const hasSanctuaryOrHaven = lowerHtml.includes('sanctuary') || lowerHtml.includes('garden haven');
  assert(
    'T1_F4_03', 'F4: Anti-Slop Copy', 'No real estate tropes ("sanctuary", "haven")',
    !hasSanctuaryOrHaven,
    'No "sanctuary" or "haven"',
    hasSanctuaryOrHaven ? 'Found sanctuary/haven' : 'Clean'
  );

  const hasBuzzwords = lowerHtml.includes('seamless') || lowerHtml.includes('digital leaders');
  assert(
    'T1_F4_04', 'F4: Anti-Slop Copy', 'No corporate/tech buzzwords ("seamless", "digital leaders")',
    !hasBuzzwords,
    'No "seamless" or "digital leaders"',
    hasBuzzwords ? 'Found buzzwords' : 'Clean'
  );

  const hasParallelCadence = lowerHtml.includes('designed for connection, crafted for calm');
  assert(
    'T1_F4_05', 'F4: Anti-Slop Copy', 'No formulaic parallel cadence ("Designed for X, crafted for Y")',
    !hasParallelCadence,
    'No formulaic parallel cadence',
    hasParallelCadence ? 'Found cadence formula' : 'Clean'
  );

  // =========================================================================
  // F5: Micro-Interactions Precision
  // =========================================================================
  const spaceCardLift = parsedCSS.getDeclaration('.space-card:hover', 'transform');
  const roomCardLift = parsedCSS.getDeclaration('.room-card:hover', 'transform');
  assert(
    'T1_F5_01', 'F5: Micro-Interactions', 'Card hover lift is exactly 2px (translateY(-2px))',
    spaceCardLift && spaceCardLift.includes('translateY(-2px)') && roomCardLift && roomCardLift.includes('translateY(-2px)'),
    'translateY(-2px)',
    `space: ${spaceCardLift}, room: ${roomCardLift}`
  );

  const spaceZoom = parsedCSS.getDeclaration('.space-card:hover .space-card-media img', 'transform');
  const roomZoom = parsedCSS.getDeclaration('.room-card:hover .room-media img', 'transform');
  assert(
    'T1_F5_02', 'F5: Micro-Interactions', 'Image hover zoom is exactly 1.025 (scale(1.025))',
    spaceZoom && spaceZoom.includes('scale(1.025)') && roomZoom && roomZoom.includes('scale(1.025)'),
    'scale(1.025)',
    `space: ${spaceZoom}, room: ${roomZoom}`
  );

  const btnActiveScale = parsedCSS.getDeclaration('.btn:active', 'transform');
  assert(
    'T1_F5_03', 'F5: Micro-Interactions', 'Active button scale is exactly 0.98',
    btnActiveScale && btnActiveScale.includes('scale(0.98)'),
    'scale(0.98)', btnActiveScale
  );

  const baseImgTransition = parsedCSS.getDeclaration('.hero-layer-base img', 'transition');
  assert(
    'T1_F5_04', 'F5: Micro-Interactions', 'Hero parallax layer has no conflicting CSS transform transition',
    !baseImgTransition || !baseImgTransition.includes('transform'),
    'No transform transition on .hero-layer-base img',
    baseImgTransition || 'None'
  );

  const modalCloseFeedback = parsedCSS.getDeclaration('.modal-close:hover', 'color') ||
                             parsedCSS.getDeclaration('.modal-close:active', 'transform');
  assert(
    'T1_F5_05', 'F5: Micro-Interactions', 'Modal close button provides hover/active tactile feedback',
    Boolean(modalCloseFeedback),
    'Tactile feedback (:hover or :active)',
    modalCloseFeedback ? 'Defined' : 'Missing'
  );

  // =========================================================================
  // F6: 5-Act Narrative Flow & Anchors
  // =========================================================================
  const env = createDOMEnvironment(html);
  const heroSection = env.document.querySelector('.hero-section');
  assert(
    'T1_F6_01', 'F6: 5-Act Narrative Flow', 'Act 1: Arrive section has anchor id="arrive" and price strip',
    heroSection && (heroSection.id === 'arrive' || env.document.getElementById('arrive')) && env.document.querySelector('.hero-price-strip'),
    'Hero with id="arrive" and .hero-price-strip',
    heroSection ? `id: ${heroSection.id}` : 'Hero missing'
  );

  const spaceSection = env.document.getElementById('space');
  const spaceCards = spaceSection?.querySelectorAll('.space-card') || [];
  assert(
    'T1_F6_02', 'F6: 5-Act Narrative Flow', 'Act 2: Discover section (#space) features 2 stay contexts',
    spaceSection && spaceCards.length === 2,
    '2 space-card articles',
    `Found ${spaceCards.length} cards`
  );

  const roomsSection = env.document.getElementById('rooms');
  const roomCards = roomsSection?.querySelectorAll('.room-card') || [];
  const floorplan = roomsSection?.querySelector('.floorplan-svg-wrap svg');
  assert(
    'T1_F6_03', 'F6: 5-Act Narrative Flow', 'Act 3: Picture Stay (#rooms) features 3 rooms and floorplan SVG',
    roomsSection && roomCards.length === 3 && Boolean(floorplan),
    '3 room cards and SVG floorplan',
    `Rooms: ${roomCards.length}, Floorplan: ${Boolean(floorplan)}`
  );

  const pricingSection = env.document.getElementById('pricing');
  const processSection = env.document.getElementById('process');
  assert(
    'T1_F6_04', 'F6: 5-Act Narrative Flow', 'Act 4: Plan with Confidence (#pricing) and Trust Process (#process)',
    pricingSection && processSection && env.document.getElementById('calc-checkin'),
    'Pricing section with estimator and Process section',
    `Pricing: ${Boolean(pricingSection)}, Process: ${Boolean(processSection)}`
  );

  const enquirySection = env.document.getElementById('enquiry');
  const otaModal = env.document.getElementById('ota-modal');
  assert(
    'T1_F6_05', 'F6: 5-Act Narrative Flow', 'Act 5: Close (#enquiry) features WhatsApp form and OTA Modal',
    enquirySection && otaModal && env.document.getElementById('send-whatsapp-draft-btn'),
    'Enquiry section with draft button and OTA Modal',
    `Enquiry: ${Boolean(enquirySection)}, Modal: ${Boolean(otaModal)}`
  );

  // Video Player & Ambient Cinema Stage Assertions (F6)
  const videoEl = env.document.querySelector('.villa-video-player');
  const videoSrc = videoEl?.querySelector('source')?.getAttribute('src') || videoEl?.getAttribute('src');
  const videoPoster = videoEl?.getAttribute('poster');

  assert(
    'T1_F6_06', 'F6: Act 2 Video Teaser', 'Video element exists with playsinline and preload="metadata"',
    videoEl && videoEl.hasAttribute('playsinline') && videoEl.getAttribute('preload') === 'metadata',
    'playsinline present and preload="metadata"',
    `playsinline: ${videoEl?.hasAttribute('playsinline')}, preload: ${videoEl?.getAttribute('preload')}`
  );

  const posterExists = videoPoster ? fs.existsSync(path.join(projectRoot, videoPoster)) : false;
  assert(
    'T1_F6_07', 'F6: Act 2 Video Teaser', 'Video poster image exists on disk in assets directory',
    posterExists,
    'assets/pool.jpg exists',
    posterExists ? 'Verified' : `Missing: ${videoPoster}`
  );

  const mp4Exists = videoSrc ? fs.existsSync(path.join(projectRoot, videoSrc)) : false;
  const mp4Size = mp4Exists ? fs.statSync(path.join(projectRoot, videoSrc)).size : 0;
  assert(
    'T1_F6_08', 'F6: Act 2 Video Teaser', 'Video source file exists on disk and is non-empty (>100KB)',
    mp4Exists && mp4Size > 100000,
    '> 100KB MP4 file exists',
    mp4Exists ? `${Math.round(mp4Size / 1024)} KB` : 'Missing'
  );

  const isAutoplay = videoEl?.hasAttribute('autoplay');
  const isMuted = videoEl?.hasAttribute('muted');
  const autoplayCompliant = (!isAutoplay || isMuted) && isMuted;
  assert(
    'T1_F6_09', 'F6: Act 2 Video Teaser', 'Video complies with browser autoplay policy (autoplay requires muted, muted present)',
    autoplayCompliant,
    'Muted present and autoplay compliant',
    `autoplay: ${isAutoplay}, muted: ${isMuted}`
  );

  const frameRatio = parsedCSS.getDeclaration('.video-media-frame', 'aspect-ratio');
  assert(
    'T1_F6_10', 'F6: Act 2 Video Teaser', 'Video media frame enforces 16/9 aspect-ratio to prevent layout shift',
    frameRatio && (frameRatio.includes('16 / 9') || frameRatio.includes('16/9')),
    '16 / 9',
    frameRatio
  );

  // =========================================================================
  // F7: Motion Accessibility & Reduced Motion
  // =========================================================================
  const rmScrollBehavior = parsedCSS.getDeclaration('html', 'scroll-behavior', 'prefers-reduced-motion');
  assert(
    'T1_F7_01', 'F7: Motion Accessibility', 'Reduced motion disables smooth scrolling (scroll-behavior: auto)',
    rmScrollBehavior && rmScrollBehavior.includes('auto'),
    'auto', rmScrollBehavior
  );

  const rmTransition = parsedCSS.getDeclaration('*, *::before, *::after', 'transition', 'prefers-reduced-motion') ||
                       parsedCSS.getDeclaration('*', 'transition', 'prefers-reduced-motion');
  assert(
    'T1_F7_02', 'F7: Motion Accessibility', 'Reduced motion disables transitions (transition: none !important)',
    rmTransition && rmTransition.includes('none'),
    'none !important', rmTransition
  );

  const rmAnimation = parsedCSS.getDeclaration('*, *::before, *::after', 'animation', 'prefers-reduced-motion') ||
                      parsedCSS.getDeclaration('*', 'animation', 'prefers-reduced-motion');
  assert(
    'T1_F7_03', 'F7: Motion Accessibility', 'Reduced motion disables animations (animation: none !important)',
    rmAnimation && rmAnimation.includes('none'),
    'none !important', rmAnimation
  );

  const rmTransform = parsedCSS.getDeclaration('*, *::before, *::after', 'transform', 'prefers-reduced-motion') ||
                      parsedCSS.getDeclaration('*', 'transform', 'prefers-reduced-motion') ||
                      parsedCSS.getDeclaration('.space-card:hover', 'transform', 'prefers-reduced-motion');
  assert(
    'T1_F7_04', 'F7: Motion Accessibility', 'Reduced motion neutralizes transforms (transform: none !important)',
    rmTransform && rmTransform.includes('none'),
    'none !important', rmTransform
  );

  const jsChecksReducedMotion = appJs.includes("matchMedia('(prefers-reduced-motion: reduce)')") ||
                                appJs.includes('prefers-reduced-motion');
  assert(
    'T1_F7_05', 'F7: Motion Accessibility', 'JS parallax ticker checks prefers-reduced-motion',
    jsChecksReducedMotion,
    'prefers-reduced-motion check present in app.js',
    jsChecksReducedMotion ? 'Present' : 'Missing'
  );

  // =========================================================================
  // F8: Multi-Device Responsiveness
  // =========================================================================
  assert(
    'T1_F8_01', 'F8: Responsiveness', 'Viewport meta tag configured for responsive scaling',
    html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'),
    'width=device-width, initial-scale=1',
    html.includes('name="viewport"') ? 'Present' : 'Missing'
  );

  const bodyOverflowX = parsedCSS.getDeclaration('body', 'overflow-x');
  assert(
    'T1_F8_02', 'F8: Responsiveness', 'Body specifies overflow-x: hidden to prevent horizontal scroll',
    bodyOverflowX === 'hidden',
    'hidden', bodyOverflowX
  );

  const modalContentMaxHeight = parsedCSS.getDeclaration('.modal-content', 'max-height') ||
                                parsedCSS.getDeclaration('.modal-backdrop', 'overflow-y');
  const modalContentOverflowY = parsedCSS.getDeclaration('.modal-content', 'overflow-y') ||
                                parsedCSS.getDeclaration('.modal-backdrop', 'overflow-y');
  assert(
    'T1_F8_03', 'F8: Responsiveness', 'Modal has vertical scrollability (max-height and overflow-y)',
    Boolean(modalContentMaxHeight && modalContentOverflowY),
    'max-height: 90vh and overflow-y: auto',
    `maxHeight: ${modalContentMaxHeight}, overflowY: ${modalContentOverflowY}`
  );

  const btnTouchHeight = parsedCSS.getDeclaration('.btn', 'min-height') ||
                         parsedCSS.getDeclaration('.btn-sm', 'min-height') ||
                         parsedCSS.getDeclaration('#close-ota-modal-btn', 'min-height') ||
                         parsedCSS.getDeclaration('.modal-close', 'min-height');
  assert(
    'T1_F8_04', 'F8: Responsiveness', 'Mobile buttons/controls define min-height / touch padding >= 44px',
    Boolean(btnTouchHeight && parseInt(btnTouchHeight, 10) >= 44) || parsedCSS.getDeclaration('.modal-close', 'width') === '44px',
    '>= 44px touch targets',
    btnTouchHeight || 'Default'
  );

  const navMenuHide = parsedCSS.getDeclaration('.nav-menu', 'display', 'max-width: 768px');
  assert(
    'T1_F8_05', 'F8: Responsiveness', 'Nav menu hides on mobile (<=768px) to prevent header collision',
    navMenuHide === 'none',
    'none', navMenuHide
  );

  // =========================================================================
  // F9: Stay Estimator Validation & Night Count
  // =========================================================================
  const testEnv = createDOMEnvironment(html);
  testEnv.runApp(appJs);

  const checkinInput = testEnv.document.getElementById('calc-checkin');
  const checkoutInput = testEnv.document.getElementById('calc-checkout');
  const durationEl = testEnv.document.getElementById('calc-duration');
  const totalEl = testEnv.document.getElementById('calc-total');

  // Valid 2 nights
  checkinInput.value = '2026-11-10';
  checkoutInput.value = '2026-11-12';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F9_01', 'F9: Stay Estimator', 'Valid dates calculate exact night count (2 nights)',
    durationEl.textContent.includes('2 nights'),
    '2 nights', durationEl.textContent
  );

  // Same-day check-in & check-out
  checkinInput.value = '2026-11-10';
  checkoutInput.value = '2026-11-10';
  checkoutInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F9_02', 'F9: Stay Estimator', 'Same-day dates show "Please choose valid dates" and total "—"',
    durationEl.textContent.includes('Please choose valid dates') && totalEl.textContent === '—',
    'Please choose valid dates / —',
    `${durationEl.textContent} / ${totalEl.textContent}`
  );

  // Check-out before check-in
  checkinInput.value = '2026-11-15';
  checkoutInput.value = '2026-11-10';
  checkoutInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F9_03', 'F9: Stay Estimator', 'Check-out before check-in shows validation error',
    durationEl.textContent.includes('Please choose valid dates') && totalEl.textContent === '—',
    'Please choose valid dates / —',
    `${durationEl.textContent} / ${totalEl.textContent}`
  );

  // Empty check-in
  checkinInput.value = '';
  checkoutInput.value = '2026-11-12';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F9_04', 'F9: Stay Estimator', 'Empty check-in date shows validation error',
    durationEl.textContent.includes('Please choose valid dates') && totalEl.textContent === '—',
    'Please choose valid dates / —',
    `${durationEl.textContent} / ${totalEl.textContent}`
  );

  // Empty check-out
  checkinInput.value = '2026-11-10';
  checkoutInput.value = '';
  checkoutInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F9_05', 'F9: Stay Estimator', 'Empty check-out date shows validation error',
    durationEl.textContent.includes('Please choose valid dates') && totalEl.textContent === '—',
    'Please choose valid dates / —',
    `${durationEl.textContent} / ${totalEl.textContent}`
  );

  // =========================================================================
  // F10: Blended Rates & Calculations
  // =========================================================================
  // 2 Weekdays: Sun Nov 15 to Tue Nov 17 -> $350 * 2 = $700
  checkinInput.value = '2026-11-15';
  checkoutInput.value = '2026-11-17';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F10_01', 'F10: Rate Calculations', '2 weekday nights (Sun-Tue) calculates $700',
    totalEl.textContent.includes('$700'),
    '$700', totalEl.textContent
  );

  // 2 Weekends: Fri Nov 13 to Sun Nov 15 -> $420 * 2 = $840
  checkinInput.value = '2026-11-13';
  checkoutInput.value = '2026-11-15';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F10_02', 'F10: Rate Calculations', '2 weekend nights (Fri-Sun) calculates $840',
    totalEl.textContent.includes('$840'),
    '$840', totalEl.textContent
  );

  // 3 Blended: Thu Nov 12 to Sun Nov 15 -> 1 weekday ($350) + 2 weekends ($840) = $1,190
  checkinInput.value = '2026-11-12';
  checkoutInput.value = '2026-11-15';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T1_F10_03', 'F10: Rate Calculations', '3 blended nights (Thu-Sun) calculates $1,190',
    totalEl.textContent.includes('$1,190'),
    '$1,190', totalEl.textContent
  );

  // Per-guest split: 2 weekends ($840) for 8 guests -> 840 / (2 * 8) = 52.5 -> $53/night
  const guestsSelect = testEnv.document.getElementById('calc-guests');
  const perPersonEl = testEnv.document.getElementById('calc-per-person');
  checkinInput.value = '2026-11-13';
  checkoutInput.value = '2026-11-15';
  guestsSelect.value = '8';
  guestsSelect.dispatchEvent({ type: 'change' });
  assert(
    'T1_F10_04', 'F10: Rate Calculations', 'Guest split for $840 / 2 nights / 8 guests calculates $53 / night',
    perPersonEl.textContent.includes('$53'),
    '$53 / night', perPersonEl.textContent
  );

  // Timezone-safe test: Executed in America/New_York (UTC-5)
  let nyTotalText = '';
  try {
    const cmd = `TZ=America/New_York node -e '
      import fs from "node:fs";
      import { createDOMEnvironment } from "./tests/dom_env.mjs";
      const html = fs.readFileSync("./index.html", "utf8");
      const appJs = fs.readFileSync("./app.js", "utf8");
      const env = createDOMEnvironment(html);
      env.runApp(appJs);
      const cIn = env.document.getElementById("calc-checkin");
      const cOut = env.document.getElementById("calc-checkout");
      const tot = env.document.getElementById("calc-total");
      cIn.value = "2026-11-13";
      cOut.value = "2026-11-15";
      cIn.dispatchEvent({ type: "change" });
      console.log(tot.textContent);
    '`;
    nyTotalText = execSync(cmd, { cwd: '/Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview', encoding: 'utf8' }).trim();
  } catch (err) {
    nyTotalText = err.message;
  }
  assert(
    'T1_F10_05', 'F10: Rate Calculations', 'Timezone-safe weekend calculation in UTC-5 produces $840 (not $770)',
    nyTotalText.includes('$840'),
    '$840', nyTotalText
  );

  // =========================================================================
  // F11: WhatsApp Inquiry & Fallback Link
  // =========================================================================
  assert(
    'T1_F11_01', 'F11: WhatsApp Inquiry', 'WhatsApp phone number is strictly digits (84900000000)',
    appJs.includes("WHATSAPP_PHONE = '84900000000'") || appJs.includes('84900000000'),
    '84900000000', '84900000000'
  );

  const sendBtn = testEnv.document.getElementById('send-whatsapp-draft-btn');
  const formCheckin = testEnv.document.getElementById('form-checkin');
  const formCheckout = testEnv.document.getElementById('form-checkout');
  const formGuests = testEnv.document.getElementById('form-guests');
  const formPurpose = testEnv.document.getElementById('form-purpose');
  const formNotes = testEnv.document.getElementById('form-notes');

  formCheckin.value = '2026-11-20';
  formCheckout.value = '2026-11-22';
  formGuests.value = '6 Guests';
  formPurpose.value = 'Family Reunion';
  formNotes.value = 'Special dietary requirements';

  sendBtn.dispatchEvent({ type: 'click' });
  const lastOpened = testEnv.openedUrls[testEnv.openedUrls.length - 1]?.url || '';

  assert(
    'T1_F11_02', 'F11: WhatsApp Inquiry', 'Draft button opens https://wa.me/84900000000?text=...',
    lastOpened.startsWith('https://wa.me/84900000000?text='),
    'Starts with https://wa.me/84900000000?text=', lastOpened
  );

  const decodedMsg = decodeURIComponent(lastOpened.split('?text=')[1] || '');
  assert(
    'T1_F11_03', 'F11: WhatsApp Inquiry', 'Draft message contains dates, group size, purpose, and notes',
    decodedMsg.includes('2026-11-20') && decodedMsg.includes('6 Guests') &&
    decodedMsg.includes('Family Reunion') && decodedMsg.includes('Special dietary requirements'),
    'Contains all form fields', decodedMsg
  );

  assert(
    'T1_F11_04', 'F11: WhatsApp Inquiry', 'Draft URL text is URL-encoded with encodeURIComponent',
    !lastOpened.includes(' ') && !lastOpened.includes('\n'),
    'No unencoded spaces or newlines', lastOpened
  );

  const fallbackLink = testEnv.document.querySelector('.enquiry-direct-options a');
  assert(
    'T1_F11_05', 'F11: WhatsApp Inquiry', 'Fallback link opens blank chat (https://wa.me/84900000000 with NO query string)',
    fallbackLink && fallbackLink.href === 'https://wa.me/84900000000',
    'https://wa.me/84900000000', fallbackLink?.href
  );

  // =========================================================================
  // F12: OTA Modal & Compliance
  // =========================================================================
  const openOtaBtn = testEnv.document.getElementById('open-ota-modal-btn');
  const formOtaBtn = testEnv.document.getElementById('form-ota-btn');
  const closeOtaBtn = testEnv.document.getElementById('close-ota-modal-btn');
  const modal = testEnv.document.getElementById('ota-modal');

  // Trigger open
  openOtaBtn.dispatchEvent({ type: 'click' });
  assert(
    'T1_F12_01', 'F12: OTA Modal & Compliance', 'Clicking trigger adds .is-open class to modal',
    modal.classList.contains('is-open'),
    'modal has is-open', modal.className
  );

  // Close via button
  closeOtaBtn.dispatchEvent({ type: 'click' });
  assert(
    'T1_F12_02', 'F12: OTA Modal & Compliance', 'Clicking close button removes .is-open class',
    !modal.classList.contains('is-open'),
    'modal lacks is-open', modal.className
  );

  // Backdrop click
  formOtaBtn.dispatchEvent({ type: 'click' });
  modal.dispatchEvent({ type: 'click', target: modal });
  assert(
    'T1_F12_03', 'F12: OTA Modal & Compliance', 'Clicking backdrop closes modal',
    !modal.classList.contains('is-open'),
    'modal lacks is-open', modal.className
  );

  // Escape key
  openOtaBtn.dispatchEvent({ type: 'click' });
  testEnv.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert(
    'T1_F12_04', 'F12: OTA Modal & Compliance', 'Pressing Escape key closes modal',
    !modal.classList.contains('is-open'),
    'modal lacks is-open', modal.className
  );

  const bannerText = testEnv.document.querySelector('.preview-banner')?.textContent || '';
  assert(
    'T1_F12_05', 'F12: OTA Modal & Compliance', 'Disclaimer banner contains verbatim string "Internal Mockup / Preview Only"',
    bannerText.includes('Internal Mockup / Preview Only') || html.includes('Internal Mockup / Preview Only'),
    'Contains "Internal Mockup / Preview Only"', bannerText
  );

  return tests;
}
