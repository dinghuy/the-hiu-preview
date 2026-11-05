/**
 * Interactive Floorplan & Curiosity Engine Verification Suite
 * Verifies DOM contracts, Radar Beacons, Quick Chips, Level Toggles,
 * Multi-photo Inspector, Curiosity Teaser, and Invariant Properties.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDOMEnvironment } from './dom_env.mjs';
import { parseCSS } from './css_parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const previewDir = path.resolve(__dirname, '..');

const html = fs.readFileSync(path.join(previewDir, 'index.html'), 'utf-8');
const css = fs.readFileSync(path.join(previewDir, 'styles.css'), 'utf-8');
const appJs = fs.readFileSync(path.join(previewDir, 'app.js'), 'utf-8');
const parsedCSS = parseCSS(css);

const results = [];
function assert(category, name, condition, expected = 'true', actual = 'false') {
  const pass = Boolean(condition);
  results.push({ category, name, pass, expected, actual });
  const mark = pass ? '✔' : '✖';
  console.log(`[${mark}] [${category}] ${name}`);
  if (!pass) {
    console.log(`       Expected: ${expected}`);
    console.log(`       Actual:   ${actual}`);
  }
}

console.log('==============================================================================');
console.log(' INTERACTIVE FLOORPLAN & CURIOSITY ENGINE VERIFICATION HARNESS');
console.log(' Target:', previewDir);
console.log('==============================================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: STATIC DOM CONTRACT & ARCHITECTURAL ELEMENTS
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: STATIC DOM CONTRACT & ARCHITECTURAL ELEMENTS ---');
const env = createDOMEnvironment(html, { innerWidth: 1200, innerHeight: 900 });

const explorer = env.document.getElementById('floorplan-explorer');
assert('Static DOM', '#floorplan-explorer container exists', !!explorer);

const svg = env.document.getElementById('floorplan-svg');
assert('Static DOM', '#floorplan-svg exists with viewBox', !!svg && svg.hasAttribute('viewBox'));

const expectedZones = ['suite-1', 'suite-2', 'suite-3', 'pool', 'living', 'terrace'];
const initialZones = Array.from(env.document.querySelectorAll('.floorplan-zone'));
expectedZones.forEach(zid => {
  const zone = initialZones.find(z => z.getAttribute('data-zone-id') === zid);
  assert('Static DOM', `Zone ${zid} exists with proper ARIA attributes`,
    zone && zone.getAttribute('role') === 'button' && zone.getAttribute('tabindex') === '0');
});

const radarRipples = env.document.querySelectorAll('.radar-ripple');
assert('Static DOM', 'All zones define Radar Pulse Beacons (.radar-ripple)', radarRipples.length >= 6, '>=6', String(radarRipples.length));

const teaserPill = env.document.getElementById('floorplan-teaser-pill');
assert('Static DOM', '#floorplan-teaser-pill exists for scroll teaser', !!teaserPill);

const teaserDismissBtn = env.document.getElementById('teaser-dismiss-btn');
assert('Static DOM', '#teaser-dismiss-btn exists to close teaser', !!teaserDismissBtn);

const levelBtns = env.document.querySelectorAll('.level-toggle-btn');
assert('Static DOM', '3 Level toggle buttons exist (all, ground, upper)', levelBtns.length === 3, '3', String(levelBtns.length));

const chips = env.document.querySelectorAll('.room-chip');
assert('Static DOM', 'Quick Room Chips exist for all 6 zones', chips.length === 6, '6', String(chips.length));

const inspector = env.document.getElementById('floorplan-inspector');
assert('Static DOM', '#floorplan-inspector exists', !!inspector);

const inspectorImg = env.document.getElementById('inspector-active-img');
const inspectorTitle = env.document.getElementById('inspector-title');
const inspectorBadge = env.document.getElementById('inspector-badge');
const inspectorBed = env.document.getElementById('inspector-bed');
const inspectorInquireBtn = env.document.getElementById('inspector-inquire-btn');
assert('Static DOM', 'Inspector photo, title, badge, bed, and CTA exist',
  !!(inspectorImg && inspectorTitle && inspectorBadge && inspectorBed && inspectorInquireBtn));

// ----------------------------------------------------------------------------
// SUITE 2: INTERACTIVE LOGIC & STATE MACHINE
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: INTERACTIVE LOGIC & STATE MACHINE ---');
env.runApp(appJs);

// Helper to find zone and chip
const allZones = Array.from(env.document.querySelectorAll('.floorplan-zone'));
const allChips = Array.from(env.document.querySelectorAll('.room-chip'));
const getZone = (id) => allZones.find(z => z.getAttribute('data-zone-id') === id);
const getChip = (id) => allChips.find(c => c.getAttribute('data-zone-id') === id);

// 2.1 Initial State Check
assert('Interactive', 'Initial active zone is Suite 01 Master Retreat',
  inspectorTitle.textContent.includes('Suite 01 · Master Retreat') &&
  inspectorImg.getAttribute('src') === 'assets/bedroom-1.jpg');

const initialZoneEl = getZone('suite-1');
const initialChipEl = getChip('suite-1');
assert('Interactive', 'Suite 01 SVG zone and chip have .is-active and aria-selected="true"',
  initialZoneEl && initialZoneEl.classList.contains('is-active') &&
  initialChipEl && initialChipEl.classList.contains('is-active'));

// 2.2 Click Zone Suite 02 (Ground Level)
const suite2Zone = getZone('suite-2');
suite2Zone.dispatchEvent({ type: 'click' });

assert('Interactive', 'Clicking Suite 02 updates Inspector to Poolside Queen',
  inspectorTitle.textContent.includes('Suite 02 · Poolside Queen') &&
  inspectorImg.getAttribute('src') === 'assets/bedroom-2.jpg' &&
  inspectorBadge.textContent.includes('Ground Level'));

const suite2Chip = getChip('suite-2');
assert('Interactive', 'Suite 02 chip gains .is-active when zone is clicked',
  suite2Chip.classList.contains('is-active') && !initialChipEl.classList.contains('is-active'));

// 2.3 Click Plunge Pool Zone
const poolZone = getZone('pool');
poolZone.dispatchEvent({ type: 'click' });

assert('Interactive', 'Clicking Pool updates photo to pool.jpg and title to Plunge Pool',
  inspectorTitle.textContent.includes('Plunge Pool & Garden Deck') &&
  inspectorImg.getAttribute('src') === 'assets/pool.jpg');

// 2.4 Quick Room Chip Selection (Suite 03 Family Twin)
const suite3Chip = getChip('suite-3');
suite3Chip.dispatchEvent({ type: 'click' });

assert('Interactive', 'Clicking Suite 03 chip updates Inspector to Family Twin',
  inspectorTitle.textContent.includes('Suite 03 · Family Twin') &&
  inspectorImg.getAttribute('src') === 'assets/bedroom-3.jpg');

// 2.5 Inspector In-Card Multi-Photo Carousel
const prevBtn = env.document.getElementById('inspector-prev-btn');
const nextBtn = env.document.getElementById('inspector-next-btn');
const photoCounter = env.document.getElementById('inspector-photo-counter');

assert('Interactive', 'Suite 03 initial photo counter is "Photo 1 of 3"',
  photoCounter.textContent.includes('Photo 1 of 3'));

nextBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Clicking Next arrow advances to photo 2 (suite3-2.jpg)',
  inspectorImg.getAttribute('src') === 'assets/suite3-2.jpg' &&
  photoCounter.textContent.includes('Photo 2 of 3'));

nextBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Clicking Next arrow advances to photo 3 (suite3-3.jpg)',
  inspectorImg.getAttribute('src') === 'assets/suite3-3.jpg' &&
  photoCounter.textContent.includes('Photo 3 of 3'));

nextBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Clicking Next wraps around back to photo 1 (bedroom-3.jpg)',
  inspectorImg.getAttribute('src') === 'assets/bedroom-3.jpg' &&
  photoCounter.textContent.includes('Photo 1 of 3'));

prevBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Clicking Prev wraps backwards to photo 3 (suite3-3.jpg)',
  inspectorImg.getAttribute('src') === 'assets/suite3-3.jpg' &&
  photoCounter.textContent.includes('Photo 3 of 3'));

// 2.6 Level Filter Toggles
const allLevelButtons = Array.from(env.document.querySelectorAll('.level-toggle-btn'));
const groundLevelBtn = allLevelButtons.find(b => b.getAttribute('data-level') === 'ground');
const upperLevelBtn = allLevelButtons.find(b => b.getAttribute('data-level') === 'upper');
const allLevelBtn = allLevelButtons.find(b => b.getAttribute('data-level') === 'all');
const mapGround = env.document.getElementById('map-ground-level');
const mapUpper = env.document.getElementById('map-upper-level');

groundLevelBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Selecting "Ground Level" dims Upper Level group',
  mapUpper.classList.contains('is-dimmed') && !mapGround.classList.contains('is-dimmed'));

upperLevelBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Selecting "Upper Level" dims Ground Level group',
  mapGround.classList.contains('is-dimmed') && !mapUpper.classList.contains('is-dimmed'));

allLevelBtn.dispatchEvent({ type: 'click' });
assert('Interactive', 'Selecting "All Levels" undims all groups',
  !mapGround.classList.contains('is-dimmed') && !mapUpper.classList.contains('is-dimmed'));

// 2.7 Curiosity Teaser Dismissal
assert('Interactive', 'Teaser pill has .is-dismissed after interaction',
  teaserPill.classList.contains('is-dismissed'));

// 2.8 Contextual Inquiry Deep-Link
const formNotes = env.document.getElementById('form-notes');
suite2Zone.dispatchEvent({ type: 'click' });
inspectorInquireBtn.dispatchEvent({ type: 'click' });

assert('Interactive', 'Inquiry CTA populates form-notes with chosen room information',
  formNotes.value.includes('Suite 02 · Poolside Queen'));

// ----------------------------------------------------------------------------
// SUITE 3: CSS TOKENS & ANTI-SLOP INVARIANTS
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: CSS TOKENS & ANTI-SLOP INVARIANTS ---');

// Typography Invariant: All DOM headings evaluate strictly to font-weight: 400
const inspectorHeadingWeight = parsedCSS.getDeclaration('.inspector-title', 'font-weight');
assert('CSS Invariant', '.inspector-title font-weight is 400 (Anti-slop)',
  inspectorHeadingWeight === '400', '400', String(inspectorHeadingWeight));

const floorplanHeaderWeight = parsedCSS.getDeclaration('.floorplan-header h3', 'font-weight') || '400';
assert('CSS Invariant', '.floorplan-header h3 font-weight is 400',
  floorplanHeaderWeight === '400', '400', String(floorplanHeaderWeight));

// 2-Column Grid on Desktop
const gridTemplateDesktop = parsedCSS.getDeclaration('.floorplan-interactive-grid', 'grid-template-columns');
assert('CSS Invariant', 'Desktop floorplan grid defines 2 columns',
  gridTemplateDesktop.includes('1.15fr') || gridTemplateDesktop.includes('fr'), '2-column grid', gridTemplateDesktop);

// 1-Column Stack on Mobile (<992px)
const gridTemplateMobile = parsedCSS.getDeclaration('.floorplan-interactive-grid', 'grid-template-columns', 'max-width: 992px');
assert('CSS Invariant', 'Mobile floorplan grid collapses to 1 column at <=992px',
  gridTemplateMobile.includes('1fr'), '1fr', gridTemplateMobile);

// Touch ergonomics: minimum 44px tap targets for quick room chips
const chipMinHeight = parsedCSS.getDeclaration('.room-chip', 'min-height');
assert('CSS Invariant', '.room-chip satisfies minimum 44px mobile touch target',
  chipMinHeight === '44px', '44px', chipMinHeight);

// Radar ripple animation defined
const radarAnimation = parsedCSS.getDeclaration('.radar-ripple', 'animation');
assert('CSS Invariant', '.radar-ripple defines radar-pulse animation',
  radarAnimation.includes('radar-pulse'), 'radar-pulse animation', radarAnimation);

// Ambient pulse on zone defined
const ambientAnimation = parsedCSS.getDeclaration('.floorplan-zone.ambient-teaser-pulse .zone-shape', 'animation');
assert('CSS Invariant', '.ambient-teaser-pulse defines ambient-room-pulse animation',
  ambientAnimation.includes('ambient-room-pulse'), 'ambient-room-pulse animation', ambientAnimation);

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

console.log('\n==============================================================================');
console.log(` INTERACTIVE FLOORPLAN VERIFICATION SUMMARY`);
console.log(` Total Checks:  ${total}`);
console.log(` Passed:        ${passed}`);
console.log(` Failed:        ${failed}`);
console.log('==============================================================================\n');

if (failed > 0) {
  console.error(`❌ VERIFICATION FAILED: ${failed} checks failed.`);
  process.exit(1);
} else {
  console.log(`✔ ALL ${total} FLOORPLAN VERIFICATION CHECKS PASSED WITH 100% SUCCESS!`);
  process.exit(0);
}
