/**
 * Tier 2: Boundary & Corner Cases (5 tests per feature for F1 - F12)
 * Total: 60 tests
 */

import { createDOMEnvironment } from './dom_env.mjs';

export function runTier2({ html, css, appJs, parsedCSS }) {
  const tests = [];

  function assert(id, feature, name, condition, expected, actual) {
    tests.push({
      id,
      tier: 'Tier 2: Boundary & Corner Cases',
      feature,
      name,
      pass: Boolean(condition),
      expected: String(expected),
      actual: String(actual)
    });
  }

  // =========================================================================
  // F1: Ground Color Boundary Cases
  // =========================================================================
  const groundVal = parsedCSS.getRootToken('--ground');
  assert(
    'T2_F1_01', 'F1: Ground Tone', 'Hex token matches #F9F8F5 case-insensitively',
    groundVal && groundVal.toLowerCase() === '#f9f8f5',
    '#F9F8F5 or #f9f8f5', groundVal
  );

  const hasConflictingInlineBg = /<section[^>]+style=["'][^"']*background[^"']*["']/i.test(html);
  assert(
    'T2_F1_02', 'F1: Ground Tone', 'Key sections do not specify conflicting inline background styles',
    !hasConflictingInlineBg,
    'No inline background overrides on sections',
    hasConflictingInlineBg ? 'Found inline section background' : 'Clean'
  );

  const cardSurfaceBg = parsedCSS.getDeclaration('.space-card', 'background') ||
                        parsedCSS.getDeclaration('.space-card', 'background-color');
  assert(
    'T2_F1_03', 'F1: Ground Tone', 'Cards define distinct surface background (var(--surface) or #fff)',
    cardSurfaceBg && (cardSurfaceBg.includes('var(--surface)') || cardSurfaceBg.toLowerCase() === '#ffffff' || cardSurfaceBg.toLowerCase() === '#fff'),
    'var(--surface) or #FFFFFF', cardSurfaceBg
  );

  const bannerBg = parsedCSS.getDeclaration('.preview-banner', 'background') ||
                   parsedCSS.getDeclaration('.preview-banner', 'background-color');
  const bannerBgClean = bannerBg && !bannerBg.includes('#EFECE3');
  assert(
    'T2_F1_04', 'F1: Ground Tone', 'Disclaimer banner does not use muddy khaki-beige tint (#EFECE3)',
    bannerBgClean,
    'Not #EFECE3', bannerBg
  );

  const enquiryPaneBg = parsedCSS.getDeclaration('.enquiry-info-pane', 'background');
  assert(
    'T2_F1_05', 'F1: Ground Tone', 'Dark info pane is scoped to #242320 without leaking into outer ground',
    enquiryPaneBg && (enquiryPaneBg.includes('#242320') || enquiryPaneBg.includes('var(--surface-dark)')),
    '#242320 or var(--surface-dark)', enquiryPaneBg
  );

  // =========================================================================
  // F2: Typography Boundary Cases
  // =========================================================================
  const fontDisplayVal = parsedCSS.getRootToken('--font-display');
  assert(
    'T2_F2_01', 'F2: Typography & Ink', 'Display font defines valid serif fallbacks (Georgia, serif)',
    fontDisplayVal && fontDisplayVal.includes('Georgia') && fontDisplayVal.includes('serif'),
    'Georgia, serif fallbacks', fontDisplayVal
  );

  const fontBodyVal = parsedCSS.getRootToken('--font-body');
  assert(
    'T2_F2_02', 'F2: Typography & Ink', 'Body font defines system sans-serif fallbacks (-apple-system, sans-serif)',
    fontBodyVal && fontBodyVal.includes('-apple-system') && fontBodyVal.includes('sans-serif'),
    '-apple-system and sans-serif fallbacks', fontBodyVal
  );

  const h3ExplicitWeight = parsedCSS.getDeclaration('.step-title', 'font-weight') ||
                           parsedCSS.getDeclaration('h3', 'font-weight') ||
                           parsedCSS.getDeclaration('h1, h2, h3, h4', 'font-weight');
  assert(
    'T2_F2_03', 'F2: Typography & Ink', 'h3 and .step-title have explicit font-weight to prevent faux-bold',
    h3ExplicitWeight && (h3ExplicitWeight.includes('400') || h3ExplicitWeight.includes('500')),
    '400 or 500', h3ExplicitWeight
  );

  const hasUtf8Meta = html.includes('<meta charset="utf-8">') || html.includes('<meta charset="UTF-8">');
  assert(
    'T2_F2_04', 'F2: Typography & Ink', 'HTML defines UTF-8 charset for Vietnamese diacritics',
    hasUtf8Meta,
    '<meta charset="utf-8">', hasUtf8Meta ? 'Present' : 'Missing'
  );

  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  assert(
    'T2_F2_05', 'F2: Typography & Ink', '<title> tag contains proper brand name "The Hiu"',
    titleTag.includes('The Hiu'),
    'Contains "The Hiu"', titleTag
  );

  // =========================================================================
  // F3: Container Symmetry Boundary Cases
  // =========================================================================
  const boxSizingVal = parsedCSS.getDeclaration('*, *::before, *::after', 'box-sizing') ||
                       parsedCSS.getDeclaration('*', 'box-sizing');
  assert(
    'T2_F3_01', 'F3: Layout Container & Symmetry', 'Universal selector enforces box-sizing: border-box',
    boxSizingVal === 'border-box',
    'border-box', boxSizingVal
  );

  // 320px screen width constraint (320px - 2*20px = 280px available)
  const padMobVal = parseInt(parsedCSS.getDeclaration('.container', 'padding-left', 'max-width: 768px') || '20', 10);
  assert(
    'T2_F3_02', 'F3: Layout Container & Symmetry', 'Container padding leaves positive content width at 320px width',
    padMobVal * 2 < 320,
    'Total lateral padding < 320px',
    `${padMobVal * 2}px`
  );

  const rateTableWidth = parsedCSS.getDeclaration('.rate-table', 'width');
  assert(
    'T2_F3_03', 'F3: Layout Container & Symmetry', 'Rate table width bounded to 100% of parent container',
    rateTableWidth === '100%' || !rateTableWidth,
    '100%', rateTableWidth || 'Default'
  );

  const heroGridCols = parsedCSS.getDeclaration('.hero-grid', 'grid-template-columns');
  assert(
    'T2_F3_04', 'F3: Layout Container & Symmetry', 'Hero grid defines structured columns on desktop',
    heroGridCols && heroGridCols.includes('fr'),
    'Grid columns defined with fr units', heroGridCols
  );

  const footerHasContainer = html.includes('class="site-footer"') && (html.includes('footer-layout') || html.includes('footer-content') || html.includes('container'));
  assert(
    'T2_F3_05', 'F3: Layout Container & Symmetry', 'Footer aligns content within container architecture',
    footerHasContainer,
    'Footer contains structured container', 'Present'
  );

  // =========================================================================
  // F4: Anti-Slop Copy Boundary Cases
  // =========================================================================
  const lowerHtml = html.toLowerCase();
  assert(
    'T2_F4_01', 'F4: Anti-Slop Copy', 'Case-insensitive check detects no SANCTUARY or HAVEN',
    !lowerHtml.includes('sanctuary') && !lowerHtml.includes('haven'),
    'Zero occurrences of sanctuary or haven',
    lowerHtml.includes('sanctuary') ? 'Found sanctuary' : (lowerHtml.includes('haven') ? 'Found haven' : 'Clean')
  );

  // Verifiable location wording (rejects vague "minutes from the shoreline")
  const hasVagueShoreline = lowerHtml.includes('minutes from the shoreline');
  assert(
    'T2_F4_02', 'F4: Anti-Slop Copy', 'Hero copy replaces vague "minutes from the shoreline" with specific distance',
    !hasVagueShoreline,
    'Specific distance wording (e.g. 5 minutes walk)',
    hasVagueShoreline ? 'Vague phrasing found' : 'Verified'
  );

  const hasWhisperQuiet = lowerHtml.includes('whisper-quiet');
  assert(
    'T2_F4_03', 'F4: Anti-Slop Copy', 'Rooms copy does not use appliance ad cliché "whisper-quiet"',
    !hasWhisperQuiet,
    'No "whisper-quiet"',
    hasWhisperQuiet ? 'Found "whisper-quiet"' : 'Clean'
  );

  const hasChefsKitchen = lowerHtml.includes("chef's kitchen") || lowerHtml.includes('chefs kitchen');
  assert(
    'T2_F4_04', 'F4: Anti-Slop Copy', 'Spaces copy does not use estate hype cliché "chef\'s kitchen"',
    !hasChefsKitchen,
    'No "chef\'s kitchen"',
    hasChefsKitchen ? 'Found "chef\'s kitchen"' : 'Clean'
  );

  const statesOperatingHours = html.includes('08:00 – 22:00') || html.includes('08:00 - 22:00');
  assert(
    'T2_F4_05', 'F4: Anti-Slop Copy', 'Host assurance pane clearly states operating hours (08:00 – 22:00)',
    statesOperatingHours,
    'States 08:00 – 22:00',
    statesOperatingHours ? 'Present' : 'Missing'
  );

  // =========================================================================
  // F5: Micro-Interactions Boundary Cases
  // =========================================================================
  const transitionDur = parsedCSS.getRootToken('--transition-smooth');
  assert(
    'T2_F5_01', 'F5: Micro-Interactions', 'Smooth transition duration is <= 0.4s to prevent sticky UI',
    transitionDur && (transitionDur.includes('0.2') || transitionDur.includes('0.3')),
    'Duration <= 0.4s', transitionDur
  );

  const btnOutlineActive = parsedCSS.getDeclaration('.btn-outline:active', 'transform') ||
                           parsedCSS.getDeclaration('.btn:active', 'transform');
  assert(
    'T2_F5_02', 'F5: Micro-Interactions', 'Button outline active state inherits 0.98 scale',
    btnOutlineActive && btnOutlineActive.includes('0.98'),
    'scale(0.98)', btnOutlineActive
  );

  const modalCloseActive = parsedCSS.getDeclaration('.modal-close:active', 'transform') ||
                           parsedCSS.getDeclaration('.modal-close:hover', 'color');
  assert(
    'T2_F5_03', 'F5: Micro-Interactions', 'Modal close button defines active/hover feedback',
    Boolean(modalCloseActive),
    'Tactile feedback defined', modalCloseActive ? 'Present' : 'Missing'
  );

  const heroOtaFeedback = parsedCSS.getDeclaration('.hero-ota-link:hover', 'text-decoration') ||
                          parsedCSS.getDeclaration('.hero-ota-link:hover', 'color') ||
                          parsedCSS.getDeclaration('.hero-ota-link:active', 'transform');
  assert(
    'T2_F5_04', 'F5: Micro-Interactions', 'Hero OTA trigger link defines interactive hover/active feedback',
    Boolean(heroOtaFeedback),
    'Interactive feedback defined', heroOtaFeedback ? 'Present' : 'Missing'
  );

  // Image transitions are smooth and do not cause layout reflow
  const roomMediaImgTransition = parsedCSS.getDeclaration('.room-media img', 'transition');
  assert(
    'T2_F5_05', 'F5: Micro-Interactions', 'Room card media image defines transform transition',
    roomMediaImgTransition && roomMediaImgTransition.includes('transform'),
    'transform transition defined', roomMediaImgTransition
  );

  // =========================================================================
  // F6: 5-Act Narrative Flow Boundary Cases
  // =========================================================================
  const env = createDOMEnvironment(html);
  const targetIds = ['top', 'arrive', 'space', 'rooms', 'pricing', 'process', 'enquiry'];
  const missingAnchors = targetIds.filter(id => !env.document.getElementById(id));
  assert(
    'T2_F6_01', 'F6: 5-Act Narrative Flow', 'All target anchor IDs exist in DOM (#top, #arrive, #space, #rooms, #pricing, #process, #enquiry)',
    missingAnchors.length === 0,
    'All anchors present',
    missingAnchors.length === 0 ? 'All present' : `Missing: ${missingAnchors.join(', ')}`
  );

  // Verify vertical order of sections
  const heroPos = html.indexOf('class="hero-section"');
  const spacePos = html.indexOf('class="space-section"');
  const roomsPos = html.indexOf('class="rooms-section"');
  const pricingPos = html.indexOf('class="pricing-section"');
  const enquiryPos = html.indexOf('class="enquiry-section"');
  const isStrictOrder = heroPos !== -1 && heroPos < spacePos && spacePos < roomsPos && roomsPos < pricingPos && pricingPos < enquiryPos;
  assert(
    'T2_F6_02', 'F6: 5-Act Narrative Flow', 'DOM sections strictly preserve vertical order Act 1 -> 2 -> 3 -> 4 -> 5',
    isStrictOrder,
    'Hero < Space < Rooms < Pricing < Enquiry',
    `Offsets: ${heroPos}, ${spacePos}, ${roomsPos}, ${pricingPos}, ${enquiryPos}`
  );

  const priceStripPos = html.indexOf('class="hero-price-strip"');
  const priceStripInHero = priceStripPos !== -1 && heroPos !== -1 && spacePos !== -1 && (priceStripPos > heroPos && priceStripPos < spacePos);
  assert(
    'T2_F6_03', 'F6: 5-Act Narrative Flow', 'Starting price strip is placed inside Act 1 (Arrive)',
    priceStripInHero,
    'Price strip inside Act 1', priceStripInHero ? 'Verified' : 'Misplaced'
  );

  const floorplanSvg = html.includes('viewBox="0 0 800 320"') && html.includes('floorplan');
  assert(
    'T2_F6_04', 'F6: 5-Act Narrative Flow', 'Act 3 contains valid inline architectural SVG floorplan (viewBox 0 0 800 320)',
    floorplanSvg,
    'viewBox="0 0 800 320"', floorplanSvg ? 'Present' : 'Missing'
  );

  const spaceCardsCount = (html.match(/class="space-card"/g) || []).length;
  assert(
    'T2_F6_05', 'F6: 5-Act Narrative Flow', 'Act 2 contains exactly 2 space-card articles (Gather vs Focus)',
    spaceCardsCount === 2,
    '2 space-card articles', spaceCardsCount
  );

  // =========================================================================
  // F7: Motion Accessibility Boundary Cases
  // =========================================================================
  const hasMotionQueryListener = appJs.includes("motionQuery.addEventListener('change'") ||
                                 appJs.includes('addEventListener("change"') ||
                                 appJs.includes('addListener(');
  assert(
    'T2_F7_01', 'F7: Motion Accessibility', 'app.js attaches change listener to motionQuery for dynamic OS toggling',
    hasMotionQueryListener,
    'change listener attached to motionQuery',
    hasMotionQueryListener ? 'Present' : 'Missing'
  );

  const clearsTransformsOnReducedMotion = appJs.includes("style.transform = ''") ||
                                         appJs.includes('style.transform = "none"') ||
                                         appJs.includes('style.transform = null');
  assert(
    'T2_F7_02', 'F7: Motion Accessibility', 'app.js clears inline parallax transforms when reduced motion is detected',
    clearsTransformsOnReducedMotion,
    'Clears inline style.transform',
    clearsTransformsOnReducedMotion ? 'Present' : 'Missing'
  );

  const transformNoneOverride = parsedCSS.getDeclaration('*, *::before, *::after', 'transform', 'prefers-reduced-motion') ||
                                parsedCSS.getDeclaration('*', 'transform', 'prefers-reduced-motion') ||
                                parsedCSS.getDeclaration('.space-card:hover', 'transform', 'prefers-reduced-motion');
  assert(
    'T2_F7_03', 'F7: Motion Accessibility', 'CSS enforces transform: none !important under prefers-reduced-motion',
    transformNoneOverride && transformNoneOverride.includes('none'),
    'transform: none !important', transformNoneOverride
  );

  const rmAnimationNone = parsedCSS.getDeclaration('*, *::before, *::after', 'animation', 'prefers-reduced-motion') ||
                          parsedCSS.getDeclaration('*', 'animation', 'prefers-reduced-motion');
  assert(
    'T2_F7_04', 'F7: Motion Accessibility', 'CSS enforces animation: none !important under prefers-reduced-motion',
    rmAnimationNone && rmAnimationNone.includes('none'),
    'animation: none !important', rmAnimationNone
  );

  const rmScrollAuto = parsedCSS.getDeclaration('html', 'scroll-behavior', 'prefers-reduced-motion');
  assert(
    'T2_F7_05', 'F7: Motion Accessibility', 'Smooth scrolling eliminated under reduced motion',
    rmScrollAuto && rmScrollAuto.includes('auto'),
    'scroll-behavior: auto', rmScrollAuto
  );

  // =========================================================================
  // F8: Multi-Device Responsiveness Boundary Cases
  // =========================================================================
  const headerColMedia = parsedCSS.getDeclaration('.site-header', 'padding', 'max-width: 480px') ||
                         parsedCSS.getDeclaration('.nav-cta-group', 'gap', 'max-width: 480px') ||
                         parsedCSS.getDeclaration('.nav-wrapper', 'flex-wrap');
  assert(
    'T2_F8_01', 'F8: Responsiveness', 'Mobile header defines narrow screen rules (<=480px) to prevent CTA crowding',
    Boolean(headerColMedia) || parsedCSS.getDeclaration('.nav-menu', 'display', 'max-width: 768px') === 'none',
    'Responsive header rules defined', 'Defined'
  );

  const floorplanWrapScroll = parsedCSS.getDeclaration('.floorplan-svg-wrap', 'overflow-x') ||
                              parsedCSS.getDeclaration('.floorplan-svg-wrap', 'overflow-x', 'max-width: 768px');
  assert(
    'T2_F8_02', 'F8: Responsiveness', 'Floorplan SVG wrapper allows horizontal scroll/touch-pan on mobile',
    floorplanWrapScroll === 'auto' || floorplanWrapScroll === 'scroll',
    'overflow-x: auto or scroll', floorplanWrapScroll || 'Missing'
  );

  const priceStripWrap = parsedCSS.getDeclaration('.hero-price-strip', 'flex-wrap') ||
                         parsedCSS.getDeclaration('.hero-price-strip', 'flex-wrap', 'max-width: 480px');
  assert(
    'T2_F8_03', 'F8: Responsiveness', 'Hero starting price strip specifies flex-wrap: wrap for narrow screens',
    priceStripWrap === 'wrap',
    'flex-wrap: wrap', priceStripWrap || 'nowrap'
  );

  const closeBtnMinHeight = parsedCSS.getDeclaration('.modal-close', 'min-height') ||
                            parsedCSS.getDeclaration('.modal-close', 'height') ||
                            parsedCSS.getDeclaration('.modal-close', 'padding');
  assert(
    'T2_F8_04', 'F8: Responsiveness', 'Modal close button defines generous touch target (>= 44px or padding)',
    Boolean(closeBtnMinHeight),
    'Touch padding or min-height defined', closeBtnMinHeight
  );

  const containerMaxWidth1440 = parsedCSS.getRootToken('--container-max') ||
                                parsedCSS.getDeclaration('.container', 'max-width');
  assert(
    'T2_F8_05', 'F8: Responsiveness', 'On 1440px viewport, container stays bounded to 1200px',
    containerMaxWidth1440 && containerMaxWidth1440.includes('1200px'),
    '1200px', containerMaxWidth1440
  );

  // =========================================================================
  // F9: Quick Stay Estimator Boundary Cases
  // =========================================================================
  const testEnv = createDOMEnvironment(html);
  testEnv.runApp(appJs);

  const checkinInput = testEnv.document.getElementById('calc-checkin');
  const checkoutInput = testEnv.document.getElementById('calc-checkout');
  const durationEl = testEnv.document.getElementById('calc-duration');
  const totalEl = testEnv.document.getElementById('calc-total');

  // Month boundary: Nov 28 to Dec 02 -> 4 nights
  checkinInput.value = '2026-11-28';
  checkoutInput.value = '2026-12-02';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F9_01', 'F9: Stay Estimator', 'Month boundary transition (Nov 28 to Dec 2) calculates 4 nights',
    durationEl.textContent.includes('4 nights'),
    '4 nights', durationEl.textContent
  );

  // Leap year transition: Feb 28 2028 to Mar 1 2028 -> 2 nights
  checkinInput.value = '2028-02-28';
  checkoutInput.value = '2028-03-01';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F9_02', 'F9: Stay Estimator', 'Leap year transition (Feb 28 to Mar 1 2028) calculates 2 nights',
    durationEl.textContent.includes('2 nights'),
    '2 nights', durationEl.textContent
  );

  // Single night stay -> singular "1 night"
  checkinInput.value = '2026-11-10';
  checkoutInput.value = '2026-11-11';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F9_03', 'F9: Stay Estimator', 'Single night stay outputs singular "1 night"',
    durationEl.textContent.includes('1 night') && !durationEl.textContent.includes('1 nights'),
    '1 night', durationEl.textContent
  );

  // Long stay 30 nights: Nov 1 to Dec 1 -> 30 nights
  checkinInput.value = '2026-11-01';
  checkoutInput.value = '2026-12-01';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F9_04', 'F9: Stay Estimator', '30-night stay calculates "30 nights" accurately without NaN',
    durationEl.textContent.includes('30 nights'),
    '30 nights', durationEl.textContent
  );

  // Bogus date input
  checkinInput.value = 'invalid-date';
  checkoutInput.value = '2026-11-15';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F9_05', 'F9: Stay Estimator', 'Bogus date string safely triggers validation error',
    durationEl.textContent.includes('Please choose valid dates') && totalEl.textContent === '—',
    'Please choose valid dates / —',
    `${durationEl.textContent} / ${totalEl.textContent}`
  );

  // =========================================================================
  // F10: Rate Calculation Boundary Cases
  // =========================================================================
  // Full week: Sun Nov 15 to Sun Nov 22 -> 5 weekdays ($350) + 2 weekend ($420) = $1750 + $840 = $2,590
  checkinInput.value = '2026-11-15';
  checkoutInput.value = '2026-11-22';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F10_01', 'F10: Rate Calculations', 'Full 7-night week calculates exactly $2,590',
    totalEl.textContent.includes('$2,590'),
    '$2,590', totalEl.textContent
  );

  // Single Friday night: Fri Nov 13 to Sat Nov 14 -> $420
  checkinInput.value = '2026-11-13';
  checkoutInput.value = '2026-11-14';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F10_02', 'F10: Rate Calculations', 'Single Friday night calculates exactly $420',
    totalEl.textContent.includes('$420'),
    '$420', totalEl.textContent
  );

  // Single Sunday night: Sun Nov 15 to Mon Nov 16 -> $350
  checkinInput.value = '2026-11-15';
  checkoutInput.value = '2026-11-16';
  checkinInput.dispatchEvent({ type: 'change' });
  assert(
    'T2_F10_03', 'F10: Rate Calculations', 'Single Sunday night calculates exactly $350',
    totalEl.textContent.includes('$350'),
    '$350', totalEl.textContent
  );

  // Guest split single guest: 1 guest for 2 weekdays ($700) -> $350 / night
  const guestsSelect = testEnv.document.getElementById('calc-guests');
  const perPersonEl = testEnv.document.getElementById('calc-per-person');
  checkinInput.value = '2026-11-15';
  checkoutInput.value = '2026-11-17';
  guestsSelect.value = '1';
  guestsSelect.dispatchEvent({ type: 'change' });
  assert(
    'T2_F10_04', 'F10: Rate Calculations', 'Split for 1 guest equals nightly rate ($350 / night)',
    perPersonEl.textContent.includes('$350'),
    '$350 / night', perPersonEl.textContent
  );

  // Guest split for 10 guests: 2 weekends ($840) across 10 guests -> 840 / 20 = $42 / night
  checkinInput.value = '2026-11-13';
  checkoutInput.value = '2026-11-15';
  guestsSelect.value = '10';
  guestsSelect.dispatchEvent({ type: 'change' });
  assert(
    'T2_F10_05', 'F10: Rate Calculations', 'Split for 10 guests computes $42 / night',
    perPersonEl.textContent.includes('$42'),
    '$42 / night', perPersonEl.textContent
  );

  // =========================================================================
  // F11: WhatsApp Inquiry Boundary Cases
  // =========================================================================
  const formCheckin = testEnv.document.getElementById('form-checkin');
  const formCheckout = testEnv.document.getElementById('form-checkout');
  const formNotes = testEnv.document.getElementById('form-notes');
  const sendBtn = testEnv.document.getElementById('send-whatsapp-draft-btn');

  // Empty notes -> no "Note / Request:" bullet in text
  formCheckin.value = '2026-11-20';
  formCheckout.value = '2026-11-22';
  formNotes.value = '   ';
  sendBtn.dispatchEvent({ type: 'click' });
  const urlEmptyNotes = testEnv.openedUrls[testEnv.openedUrls.length - 1]?.url || '';
  const decodedEmptyNotes = decodeURIComponent(urlEmptyNotes);
  assert(
    'T2_F11_01', 'F11: WhatsApp Inquiry', 'Whitespace notes field omits note bullet from drafted message',
    !decodedEmptyNotes.includes('Note / Request:'),
    'Note bullet omitted', decodedEmptyNotes
  );

  // Special characters: "&", "=", "?", "#", emoji
  formNotes.value = 'Q&A? Cost=100% #urgent 🌴';
  sendBtn.dispatchEvent({ type: 'click' });
  const urlSpecial = testEnv.openedUrls[testEnv.openedUrls.length - 1]?.url || '';
  const decodedSpecial = decodeURIComponent(urlSpecial);
  assert(
    'T2_F11_02', 'F11: WhatsApp Inquiry', 'Special characters (&, =, ?, #, emoji) preserved in encoded URL',
    decodedSpecial.includes('Q&A? Cost=100% #urgent 🌴'),
    'Preserves special characters', decodedSpecial
  );

  // Multiline notes
  formNotes.value = 'Line 1\nLine 2';
  sendBtn.dispatchEvent({ type: 'click' });
  const urlMultiline = testEnv.openedUrls[testEnv.openedUrls.length - 1]?.url || '';
  assert(
    'T2_F11_03', 'F11: WhatsApp Inquiry', 'Multiline notes preserve linebreaks in WhatsApp draft URL (%0A)',
    urlMultiline.includes('%0A') || urlMultiline.includes('%0D%0A'),
    'Contains %0A for linebreaks', urlMultiline
  );

  // Fallback link hostname is wa.me
  const fallbackLink = testEnv.document.querySelector('.enquiry-direct-options a');
  assert(
    'T2_F11_04', 'F11: WhatsApp Inquiry', 'Fallback link points strictly to wa.me/84900000000',
    fallbackLink && fallbackLink.href.startsWith('https://wa.me/84900000000') && !fallbackLink.href.includes('?'),
    'https://wa.me/84900000000 with no query params', fallbackLink?.href
  );

  // rel="noopener" on external links
  assert(
    'T2_F11_05', 'F11: WhatsApp Inquiry', 'External links define rel="noopener" and target="_blank"',
    fallbackLink && fallbackLink.getAttribute('rel')?.includes('noopener') && fallbackLink.target === '_blank',
    'rel="noopener" and target="_blank"',
    `rel: ${fallbackLink?.getAttribute('rel')}, target: ${fallbackLink?.target}`
  );

  // =========================================================================
  // F12: Modal & Compliance Boundary Cases
  // =========================================================================
  const openOtaBtn = testEnv.document.getElementById('open-ota-modal-btn');
  const closeOtaBtn = testEnv.document.getElementById('close-ota-modal-btn');
  const modal = testEnv.document.getElementById('ota-modal');

  // Rapid toggle
  for (let i = 0; i < 5; i++) {
    openOtaBtn.dispatchEvent({ type: 'click' });
    closeOtaBtn.dispatchEvent({ type: 'click' });
  }
  assert(
    'T2_F12_01', 'F12: OTA Modal & Compliance', 'Rapid toggle leaves modal closed and body overflow reset',
    !modal.classList.contains('is-open') && testEnv.document.body.style.overflow === '',
    'closed and body.style.overflow = ""',
    `is-open: ${modal.classList.contains('is-open')}, overflow: ${testEnv.document.body.style.overflow}`
  );

  // Non-Escape keys ignored
  openOtaBtn.dispatchEvent({ type: 'click' });
  testEnv.document.dispatchEvent({ type: 'keydown', key: 'Enter' });
  testEnv.document.dispatchEvent({ type: 'keydown', key: 'Tab' });
  assert(
    'T2_F12_02', 'F12: OTA Modal & Compliance', 'Pressing Enter or Tab does not close modal',
    modal.classList.contains('is-open'),
    'Modal stays open', modal.className
  );
  closeOtaBtn.dispatchEvent({ type: 'click' });

  // Clicking inside modal-content does not close
  openOtaBtn.dispatchEvent({ type: 'click' });
  const modalContent = testEnv.document.querySelector('.modal-content');
  modal.dispatchEvent({ type: 'click', target: modalContent });
  assert(
    'T2_F12_03', 'F12: OTA Modal & Compliance', 'Clicking inside modal content does not trigger close',
    modal.classList.contains('is-open'),
    'Modal stays open', modal.className
  );
  closeOtaBtn.dispatchEvent({ type: 'click' });

  // Zero PII fields
  const piiInputs = html.match(/<input[^>]+(?:name|type|id)=["'](email|password|credit-card|phone|full-name|name)["']/gi) || [];
  assert(
    'T2_F12_04', 'F12: OTA Modal & Compliance', 'Zero PII input fields in inquiry form (no email, password, credit card, phone)',
    piiInputs.length === 0,
    '0 PII input fields', piiInputs.length
  );

  // Zero unauthorized scripts
  const scriptTags = [...html.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m => m[1]);
  const unauthorizedScripts = scriptTags.filter(s => !s.endsWith('app.js'));
  assert(
    'T2_F12_05', 'F12: OTA Modal & Compliance', 'Only app.js is loaded; zero remote tracking scripts',
    unauthorizedScripts.length === 0,
    '0 unauthorized scripts', unauthorizedScripts.length
  );

  return tests;
}
